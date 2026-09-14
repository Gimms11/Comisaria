import { create } from 'zustand';
import { LiveAlertEvent } from '../types';
import { api } from '../services/api';
import { audioAlert } from '../lib/utils';

interface WebSocketState {
  status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED';
  soundEnabled: boolean;
  alerts: LiveAlertEvent[];
  unreadEmergencyCount: number;
  latestAlert: LiveAlertEvent | null;
  isFlashingRed: boolean;
  activeNotification: LiveAlertEvent | null;
  toggleSound: () => void;
  connect: () => Promise<void>;
  disconnect: () => void;
  markAllAsRead: () => void;
  dismissAlert: (id: string) => void;
  dismissNotification: () => void;
  triggerAlertFlash: (alert: LiveAlertEvent) => void;
  simulateIncomingAlert: (type?: 'crime' | 'community', isEmergency?: boolean) => void;
}

let socket: WebSocket | null = null;
let pingInterval: any = null;
let reconnectTimer: any = null;
let flashTimer: any = null;
let toastTimer: any = null;
let isConnecting = false;
let connectAbortController: AbortController | null = null;
const recentAlerts = new Map<string, number>();

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
  status: 'DISCONNECTED',
  soundEnabled: true,
  alerts: [],
  unreadEmergencyCount: 0,
  latestAlert: null,
  isFlashingRed: false,
  activeNotification: null,

  toggleSound: () => {
    set((state) => ({ soundEnabled: !state.soundEnabled }));
  },

  connect: async () => {
    // Evitar llamadas concurrentes (ej. StrictMode o múltiples triggers)
    if (isConnecting) {
      return;
    }
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    isConnecting = true;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    // Abortar intento previo en curso si existiera
    connectAbortController?.abort();
    const abortController = new AbortController();
    connectAbortController = abortController;

    set({ status: 'CONNECTING' });

    try {
      // 1. Obtener ticket de un solo uso de autenticación
      const { ticket } = await api.getWsTicket(abortController.signal);
      if (abortController.signal.aborted) {
        return;
      }

      // 2. Cerrar socket huérfano previo antes de crear uno nuevo
      if (socket) {
        socket.onopen = null;
        socket.onclose = null;
        socket.onerror = null;
        socket.onmessage = null;
        socket.close();
        socket = null;
      }

      const wsUrl = api.getWebSocketUrl(ticket);
      const ws = new WebSocket(wsUrl);
      socket = ws;

      ws.onopen = () => {
        if (socket !== ws) {
          ws.close();
          return;
        }
        set({ status: 'CONNECTED' });
        console.log('[WebSocket Hub] Conectado exitosamente al Centro de Comando');

        // Heartbeat cada 25 segundos
        if (pingInterval) clearInterval(pingInterval);
        pingInterval = setInterval(() => {
          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send('ping');
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        try {
          if (event.data === 'pong') return;
          const parsed = JSON.parse(event.data);

          // Ignorar eventos de control o bienvenida
          if (
            !parsed ||
            parsed.event === 'CONNECTED' ||
            parsed.type === 'PONG' ||
            parsed.type === 'WELCOME'
          ) {
            return;
          }

          const eventType = (parsed.event || parsed.event_type || 'NEW_CRIME_REPORT') as LiveAlertEvent['event_type'];
          const payload = parsed.data || {};
          const publicCode = payload.public_code || parsed.public_code || 'SIN_CODIGO';

          // Deduplicación en ventana de 6 segundos para evitar alertas dobles
          const alertKey = `${eventType}:${publicCode}`;
          const now = Date.now();
          const lastSeen = recentAlerts.get(alertKey);

          // Limpiar entradas con más de 30 segundos
          for (const [k, ts] of recentAlerts.entries()) {
            if (now - ts > 30000) {
              recentAlerts.delete(k);
            }
          }

          if (lastSeen && now - lastSeen < 6000) {
            console.warn('[WebSocket Hub] Alerta duplicada suprimida:', alertKey);
            return;
          }
          recentAlerts.set(alertKey, now);

          const alertEvent: LiveAlertEvent = {
            id: `${now}-${Math.random().toString(36).substring(2, 7)}`,
            event_type: eventType,
            public_code: publicCode,
            priority: (payload.priority || parsed.priority || 'media').toLowerCase(),
            category_name: payload.category_name || parsed.category_name || 'Incidente Policial',
            extra_data: payload.extra_data || parsed.extra_data || {},
            timestamp: payload.timestamp || parsed.timestamp || new Date().toISOString(),
            read: false,
          };

          // Si es un cambio de estado en el progreso de una denuncia/reporte:
          // Actualizar estado reactivamente SIN lanzar pantallazo rojo ni sirena
          if (eventType === 'STATUS_CHANGED') {
            const newStatus =
              payload.new_status ||
              alertEvent.extra_data?.new_status ||
              payload.status;
            const isResolved =
              newStatus === 'resuelto' ||
              newStatus === 'archivado' ||
              newStatus === 'rechazado';

            set((state) => {
              const updatedAlerts = state.alerts.map((a) => {
                if (a.public_code === publicCode) {
                  return {
                    ...a,
                    extra_data: {
                      ...a.extra_data,
                      status: newStatus,
                      new_status: newStatus,
                    },
                  };
                }
                return a;
              });

              return {
                alerts: updatedAlerts,
                latestAlert: alertEvent,
                unreadEmergencyCount:
                  isResolved && state.unreadEmergencyCount > 0
                    ? state.unreadEmergencyCount - 1
                    : state.unreadEmergencyCount,
              };
            });

            // Si había notificación emergente de este reporte y se resolvió, descartarla
            if (get().activeNotification?.public_code === publicCode && isResolved) {
              get().dismissNotification();
            }

            return;
          }

          // Solo para NUEVAS denuncias/reportes (NEW_CRIME_REPORT / NEW_COMMUNITY_REPORT):
          // Reproducir sonido si está habilitado
          if (get().soundEnabled) {
            if (alertEvent.priority === 'urgente' || alertEvent.priority === 'alta') {
              audioAlert.playEmergencySiren();
            } else {
              audioAlert.playPing();
            }
          }

          set((state) => {
            const isUrgent = alertEvent.priority === 'urgente' || alertEvent.priority === 'alta';
            // Filtrar duplicados existentes del mismo código y evento
            const filteredAlerts = state.alerts.filter(
              (a) => !(a.public_code === publicCode && a.event_type === eventType)
            );
            return {
              alerts: [alertEvent, ...filteredAlerts.slice(0, 49)],
              latestAlert: alertEvent,
              unreadEmergencyCount: isUrgent
                ? state.unreadEmergencyCount + 1
                : state.unreadEmergencyCount,
            };
          });

          // Disparar flash de pantalla rojo oscuro y notificación emergente solo al crearse la denuncia
          get().triggerAlertFlash(alertEvent);
        } catch (err) {
          console.error('[WebSocket Hub] Error procesando payload:', err);
        }
      };

      ws.onclose = () => {
        if (socket !== ws) return;
        set({ status: 'DISCONNECTED' });
        if (pingInterval) clearInterval(pingInterval);

        // Reintento automático de reconexión tras 5 segundos
        if (reconnectTimer) clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => {
          if (localStorage.getItem('access_token')) {
            get().connect();
          }
        }, 5000);
      };

      ws.onerror = (err) => {
        if (socket !== ws) return;
        console.warn('[WebSocket Hub] Error de conexión:', err);
        ws.close();
      };
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.warn('[WebSocket Hub] Fallo al generar ticket:', err);
      set({ status: 'DISCONNECTED' });
    } finally {
      isConnecting = false;
    }
  },

  disconnect: () => {
    isConnecting = false;
    connectAbortController?.abort();
    connectAbortController = null;
    if (pingInterval) clearInterval(pingInterval);
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (socket) {
      socket.onopen = null;
      socket.onclose = null;
      socket.onerror = null;
      socket.onmessage = null;
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
      socket = null;
    }
    set({ status: 'DISCONNECTED' });
  },

  markAllAsRead: () => {
    set((state) => ({
      unreadEmergencyCount: 0,
      alerts: state.alerts.map((a) => ({ ...a, read: true })),
    }));
  },

  dismissAlert: (id: string) => {
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== id),
    }));
  },

  dismissNotification: () => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ activeNotification: null });
  },

  triggerAlertFlash: (alertEvent: LiveAlertEvent) => {
    // Salvaguarda: nunca disparar flash para cambios de estado, solo para nuevas denuncias
    if (alertEvent.event_type === 'STATUS_CHANGED') {
      return;
    }

    if (flashTimer) clearTimeout(flashTimer);
    if (toastTimer) clearTimeout(toastTimer);

    // Audio de alerta táctica si está habilitado
    if (get().soundEnabled) {
      if (alertEvent.priority === 'urgente' || alertEvent.priority === 'alta') {
        audioAlert.playEmergencySiren();
      } else {
        audioAlert.playPing();
      }
    }

    set({
      isFlashingRed: true,
      activeNotification: alertEvent,
    });

    flashTimer = setTimeout(() => {
      set({ isFlashingRed: false });
    }, 1200);

    toastTimer = setTimeout(() => {
      set({ activeNotification: null });
    }, 7000);
  },

  simulateIncomingAlert: async (type = 'crime', isEmergency = true) => {
    let publicCode = `LT-2026-00${Math.floor(1000 + Math.random() * 9000)}`;
    let reportId: string | undefined = undefined;
    let categoryName =
      type === 'crime'
        ? 'Robo a mano armada en vía pública'
        : 'Corte de alumbrado y poste inclinado';

    // Vincular a un reporte real existente de la BD para que "Intervenir" cargue el detalle real
    try {
      if (type === 'crime') {
        const res = await api.listCrimeReports({ limit: 10 });
        if (res.items && res.items.length > 0) {
          const randomIndex = Math.floor(Math.random() * res.items.length);
          const chosen = res.items[randomIndex];
          publicCode = chosen.public_code;
          reportId = chosen.id;
          categoryName = chosen.category_name;
        }
      } else {
        const res = await api.listCommunityReports({ limit: 10 });
        if (res.items && res.items.length > 0) {
          const randomIndex = Math.floor(Math.random() * res.items.length);
          const chosen = res.items[randomIndex];
          publicCode = chosen.public_code;
          reportId = chosen.id;
          categoryName = chosen.category_name;
        }
      }
    } catch {
      // Modo offline o fallback
    }

    const alertEvent: LiveAlertEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      event_type: type === 'crime' ? 'NEW_CRIME_REPORT' : 'NEW_COMMUNITY_REPORT',
      public_code: publicCode,
      priority: isEmergency ? 'urgente' : 'alta',
      category_name: categoryName,
      extra_data: {
        report_id: reportId || publicCode,
      },
      timestamp: new Date().toISOString(),
      read: false,
    };

    set((state) => ({
      alerts: [alertEvent, ...state.alerts.slice(0, 49)],
      latestAlert: alertEvent,
      unreadEmergencyCount: isEmergency
        ? state.unreadEmergencyCount + 1
        : state.unreadEmergencyCount,
    }));

    get().triggerAlertFlash(alertEvent);
  },
}));
