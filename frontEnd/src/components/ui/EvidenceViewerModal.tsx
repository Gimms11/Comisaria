import React, { useEffect, useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Image as ImageIcon,
  ShieldCheck,
} from 'lucide-react';
import { Button } from './Button';
import { resolveMediaUrl } from '../../lib/utils';

export interface EvidenceItem {
  id?: string;
  url: string;
  thumbnailUrl?: string | null;
  caption?: string;
  mediaType?: string;
  sizeBytes?: number | null;
  createdAt?: string;
}

interface EvidenceViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: EvidenceItem[];
  initialIndex?: number;
  reportCode?: string;
  categoryName?: string;
}

export const EvidenceViewerModal: React.FC<EvidenceViewerModalProps> = ({
  isOpen,
  onClose,
  items,
  initialIndex = 0,
  reportCode,
  categoryName,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, items.length - 1)));
      setImgLoaded(false);
    }
  }, [isOpen, initialIndex, items.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && items.length > 1) {
        handlePrev();
      }
      if (e.key === 'ArrowRight' && items.length > 1) {
        handleNext();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, items.length, currentIndex]);

  if (!isOpen || items.length === 0) return null;

  const currentItem = items[currentIndex] || items[0];

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setImgLoaded(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setImgLoaded(false);
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 overflow-hidden animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Dark backdrop */}
      <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md" />

      {/* Main Container */}
      <div
        className="relative w-full max-w-5xl h-[92vh] flex flex-col glass-panel bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30 shrink-0">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {reportCode && (
                  <span className="font-mono font-bold text-sm text-sky-400">
                    {reportCode}
                  </span>
                )}
                {categoryName && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                    {categoryName}
                  </span>
                )}
                <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Metadatos EXIF Sanitizados
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Prueba {currentIndex + 1} de {items.length}
                {formatFileSize(currentItem.sizeBytes) && ` • ${formatFileSize(currentItem.sizeBytes)}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={resolveMediaUrl(currentItem.url)}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Descargar</span>
            </a>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Cerrar visor"
              className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Viewport with Center Image and Side Nav Buttons */}
        <div className="relative flex-1 bg-black/70 flex items-center justify-center p-4 min-h-0 select-none">
          {/* Previous Button */}
          {items.length > 1 && (
            <button
              onClick={handlePrev}
              aria-label="Evidencia anterior"
              className="absolute left-3 sm:left-6 z-20 w-11 h-11 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700/80 shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 focus:outline-none cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Main Image Container */}
          <div className="w-full h-full flex items-center justify-center relative">
            {!imgLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
                <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-mono">Cargando prueba...</span>
              </div>
            )}
            <img
              src={resolveMediaUrl(currentItem.url)}
              alt={currentItem.caption || `Evidencia ${currentIndex + 1}`}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgLoaded(true)}
              className={`max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-opacity duration-200 ${
                imgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </div>

          {/* Next Button */}
          {items.length > 1 && (
            <button
              onClick={handleNext}
              aria-label="Siguiente evidencia"
              className="absolute right-3 sm:right-6 z-20 w-11 h-11 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700/80 shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 focus:outline-none cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Bottom Thumbnail Strip (when multiple images) */}
        {items.length > 1 && (
          <div className="px-4 py-3 bg-slate-950 border-t border-slate-800/80 flex items-center justify-center gap-2 overflow-x-auto shrink-0">
            {items.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setImgLoaded(false);
                  setCurrentIndex(idx);
                }}
                className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                  idx === currentIndex
                    ? 'border-sky-400 scale-105 shadow-md shadow-sky-500/30'
                    : 'border-slate-800 opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={resolveMediaUrl(item.thumbnailUrl || item.url)}
                  alt={`Miniatura ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

