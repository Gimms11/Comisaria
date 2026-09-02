import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ReportPriority, ReportStatus } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function resolveMediaUrl(url?: string | null): string {
  if (!url) return '';
  // En el navegador web del administrador (Windows), 10.0.2.2 no es enrutable.
  // Se reemplaza por localhost:9000 y se omiten query params de firma para acceso anónimo a MinIO.
  if (url.includes('10.0.2.2:9000')) {
    return url.split('?')[0].replace('10.0.2.2:9000', 'localhost:9000');
  }
  return url;
}

export function formatTimeAgo(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function getPriorityStyles(priority: ReportPriority) {
  switch (priority) {
    case 'urgente':
      return {
        bg: 'bg-red-500/20',
        text: 'text-red-400',
        border: 'border-red-500/40',
        badge: 'bg-red-600 text-white',
        pulse: true,
      };
    case 'alta':
      return {
        bg: 'bg-amber-500/20',
        text: 'text-amber-400',
        border: 'border-amber-500/40',
        badge: 'bg-amber-600 text-white',
        pulse: false,
      };
    case 'media':
      return {
        bg: 'bg-sky-500/20',
        text: 'text-sky-400',
        border: 'border-sky-500/40',
        badge: 'bg-sky-600 text-white',
        pulse: false,
      };
    case 'baja':
    default:
      return {
        bg: 'bg-slate-500/20',
        text: 'text-slate-400',
        border: 'border-slate-500/40',
        badge: 'bg-slate-700 text-slate-200',
        pulse: false,
      };
  }
}

export function getStatusStyles(status: ReportStatus) {
  switch (status) {
    case 'pendiente':
      return {
        label: 'Pendiente',
        bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
        dot: 'bg-yellow-400',
      };
    case 'en_revision':
      return {
        label: 'En Revisión',
        bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        dot: 'bg-blue-400',
      };
    case 'en_atencion':
      return {
        label: 'En Atención',
        bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
        dot: 'bg-indigo-400',
      };
    case 'derivado':
      return {
        label: 'Derivado (Serenazgo/Muni)',
        bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        dot: 'bg-purple-400',
      };
    case 'resuelto':
      return {
        label: 'Resuelto',
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        dot: 'bg-emerald-400',
      };
    case 'archivado':
      return {
        label: 'Archivado',
        bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
        dot: 'bg-slate-400',
      };
    case 'rechazado':
      return {
        label: 'Rechazado',
        bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        dot: 'bg-rose-400',
      };
    default:
      return {
        label: status,
        bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
        dot: 'bg-slate-400',
      };
  }
}

// Web Audio API Synthesizer for instant tactical sirens & alert sounds
class AudioAlertSynth {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playEmergencySiren() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      const now = this.ctx.currentTime;

      // Frecuencias alternantes de sirena policial (600Hz <-> 950Hz)
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.linearRampToValueAtTime(950, now + 0.25);
      osc.frequency.linearRampToValueAtTime(600, now + 0.5);
      osc.frequency.linearRampToValueAtTime(950, now + 0.75);
      osc.frequency.linearRampToValueAtTime(600, now + 1.0);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.0);
    } catch (e) {
      console.warn('Audio alert unavailable:', e);
    }
  }

  playPing() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const now = this.ctx.currentTime;

      osc.frequency.setValueAtTime(880, now); // A5 note
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.3);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {
      console.warn('Audio ping unavailable:', e);
    }
  }
}

export const audioAlert = new AudioAlertSynth();
