import React from 'react';
import { BookOpen, ChevronRight, ArrowUpRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { GuideItem } from '../../types';

interface DashboardRecentGuidesCardProps {
  guides: GuideItem[];
  onNavigate: () => void;
}

export const DashboardRecentGuidesCard: React.FC<DashboardRecentGuidesCardProps> = ({
  guides,
  onNavigate,
}) => {
  return (
    <Card className="bg-slate-900/90 border-slate-800/90 flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl shadow-xl w-full min-h-[340px]">
      <div className="flex flex-col">
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800/80">
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="w-4 h-4 text-sky-400 shrink-0" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono truncate">
              Guías Cívicas TikTok
            </h3>
          </div>
          <span className="text-[11px] text-sky-400 font-mono font-semibold">
            {guides.length} guías
          </span>
        </div>

        <div className="space-y-3 my-2">
          {guides.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">
              No hay guías registradas
            </p>
          ) : (
            guides.slice(0, 3).map((guide) => (
              <div
                key={guide.id}
                onClick={onNavigate}
                className="p-3 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800/90 flex items-center justify-between gap-3 cursor-pointer transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${
                        guide.is_published
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {guide.is_published ? 'PUBLICADA' : 'BORRADOR'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                      {guide.duration_seconds}s
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-white line-clamp-2 mt-1 leading-snug">
                    {guide.title}
                  </p>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">{guide.summary}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 ml-1" />
              </div>
            ))
          )}
        </div>
      </div>

      <div className="pt-2.5 mt-2 border-t border-slate-800/80">
        <Button
          variant="outline"
          size="sm"
          onClick={onNavigate}
          className="w-full text-xs py-1.5 justify-center border-slate-800 hover:border-sky-500/50 hover:bg-sky-950/20 text-sky-300"
        >
          Gestionar Biblioteca de Guías ({guides.length}) <ArrowUpRight className="w-3.5 h-3.5 ml-1.5" />
        </Button>
      </div>
    </Card>
  );
};
