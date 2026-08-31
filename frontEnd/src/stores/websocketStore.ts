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
  toggleSound: () => void;
  connect: () => Promise<void>;
  disconnect: () => void;
  markAllAsRead: () => void;
  dismissAlert: (id: string) => void;
}

let socket: WebSocket | null = null;
let pingInterval: any = null;
let reconnectTimer: any = null;

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
  status: 'DISCONNECTED',
  soundEnabled: true,
  alerts: [],
  unreadEmergencyCount: 0,
  latestAlert: null,

  toggleSound: () => {
    set((state) => ({ soundEnabled: !state.soundEnabled }));
  },

  connect: async () => {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    set({ status: 'CONNECTING' });

    try {
      // 1. Obtener ticket de un solo uso desde MS-01
      const { ticket } = await api.getWsTicket();
      const wsUrl = api.getWebSocketUrl(ticket);

      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
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

      socket.onmessage = (event) => {
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

          const alertEvent: LiveAlertEvent = {
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            event_type: eventType,
            public_code: payload.public_code || parsed.public_code || 'SIN_CODIGO',
            priority: (payload.priority || parsed.priority || 'media').toLowerCase(),
            category_name: payload.category_name || parsed.category_name || 'Incidente Policial',
            extra_data: payload.extra_data || parsed.extra_data || {},
            timestamp: payload.timestamp || parsed.timestamp || new Date().toISOString(),
            read: false,
          };

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
            return {
              alerts: [alertEvent, ...state.alerts.slice(0, 49)],
              latestAlert: alertEvent,
              unreadEmergencyCount: isUrgent
                ? state.unreadEmergencyCount + 1
                : state.unreadEmergencyCount,
            };
          });
        } catch (err) {
          console.error('[WebSocket Hub] Error procesando payload:', err);
        }
      };

      socket.onclose = () => {
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

      socket.onerror = (err) => {
        console.warn('[WebSocket Hub] Error de conexión:', err);
        socket?.close();
      };
    } catch (err) {
      console.warn('[WebSocket Hub] Fallo al generar ticket:', err);
      set({ status: 'DISCONNECTED' });
    }
  },

  disconnect: () => {
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
}));
