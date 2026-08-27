import React from 'react';
import { Eye, ThumbsUp, Clock, Paperclip, CheckCircle2, EyeOff, Trash2, Pencil } from 'lucide-react';
import { GuideItem } from '../../types';

interface GuideAdminCardProps {
  guide: GuideItem;
  onTogglePublish: (guide: GuideItem) => void | Promise<void>;
  onEdit?: (guide: GuideItem) => void;
  onAttachResource?: (guide: GuideItem) => void;
  onDelete?: (guide: GuideItem) => void | Promise<void>;
  isToggling?: boolean;
}

export const GuideAdminCard: React.FC<GuideAdminCardProps> = ({
  guide,
  onTogglePublish,
  onEdit,
  onAttachResource,
  onDelete,
  isToggling = false,
}) => {
  const isPublished = guide.is_published;

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xl shadow-black/30 hover:border-slate-700 transition-all group w-full">
      {/* 1. Sección de Video Formato Vertical Balanceado 4:5 (Top) */}
      <div className="relative aspect-[4/5] bg-slate-950 w-full overflow-hidden border-b border-slate-800/80 flex items-center justify-center">
        {guide.main_video_url ? (
          <video
            src={guide.main_video_url}
            controls
            playsInline
            preload="metadata"
            className="w-full h-full object-cover"
          />
        ) : guide.thumbnail_url ? (
          <img
            src={guide.thumbnail_url}
            alt={guide.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-slate-600 text-xs font-mono flex flex-col items-center gap-1.5 p-4 text-center">
            <span className="font-semibold text-slate-500">Sin video asignado</span>
            <span className="text-[10px] text-slate-600">Formato Vertical 4:5</span>
          </div>
        )}

        {/* Badge Duración (Superpuesto en esquina superior derecha) */}
        {guide.duration_seconds ? (
          <div className="absolute top-2.5 right-2.5 pointer-events-none z-10">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-black/75 backdrop-blur-sm border border-white/10 text-slate-200 shadow">
              <Clock className="w-3 h-3 text-slate-400" />
              {guide.duration_seconds}s
            </span>
          </div>
        ) : null}
      </div>

      {/* 2. Contenido (Middle / Bottom) */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3 text-left">
        <div className="space-y-2">
          {/* Categoría */}
          <p className="text-[10px] font-bold tracking-wider uppercase text-cyan-400 font-mono">
            {guide.category_name || guide.category_id || 'GUÍAS RÁPIDAS'}
          </p>

          {/* Fila Título + Badge "Publicado en App" */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-cyan-300 transition-colors flex-1">
              {guide.title}
            </h3>

            {/* Badge de Publicación al lado del título */}
            <div className="shrink-0 pt-0.5">
              {isPublished ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Publicado en App
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Oculto
                </span>
              )}
            </div>
          </div>

          {/* Descripción */}
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-normal">
            {guide.summary || 'Sin descripción disponible.'}
          </p>
        </div>

        {/* 3. Estadísticas */}
        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-slate-400 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>{guide.view_count || 0} vistas</span>
          </div>

          <div className="flex items-center gap-1.5">
            <ThumbsUp className="w-3.5 h-3.5 text-slate-500" />
            <span>{guide.helpful_count || 0} útiles</span>
          </div>
        </div>

        {/* 4. Acciones */}
        <div className="pt-2 flex items-center gap-2">
          {/* Botón Principal (Ocultar / Publicar) */}
          <button
            type="button"
            disabled={isToggling}
            onClick={() => onTogglePublish(guide)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-sm active:scale-[0.98] ${
              isPublished
                ? 'bg-slate-800/90 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            } disabled:opacity-50`}
          >
            {isPublished ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                <span>Ocultar</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Publicar</span>
              </>
            )}
          </button>

          {/* Botón Cuadrado Editar */}
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(guide)}
              title="Editar Guía"
              className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-700 hover:border-amber-500/40 transition-all flex items-center justify-center active:scale-[0.95]"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}

          {/* Botón Cuadrado Adjuntar Recurso */}
          {onAttachResource && (
            <button
              type="button"
              onClick={() => onAttachResource(guide)}
              title="Adjuntar PDF o Enlace Oficial"
              className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 border border-slate-700 hover:border-cyan-500/40 transition-all flex items-center justify-center active:scale-[0.95]"
            >
              <Paperclip className="w-4 h-4" />
            </button>
          )}

          {/* Botón Eliminar */}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(guide)}
              title="Eliminar Guía"
              className="p-2 rounded-xl bg-slate-800/90 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 transition-all flex items-center justify-center active:scale-[0.95]"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
