import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Officer } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatDateTime } from '../../lib/utils';

interface OfficerTableProps {
  officers: Officer[];
  isLoading: boolean;
  isAdmin: boolean;
  onToggleActive: (officer: Officer) => void;
}

export const OfficerTable: React.FC<OfficerTableProps> = ({
  officers,
  isLoading,
  isAdmin,
  onToggleActive,
}) => {
  return (
    <Card className="bg-slate-900/90 border-slate-800 p-0 overflow-hidden">
      {/* Mobile View: Clean Card List (< md) */}
      <div className="block md:hidden divide-y divide-slate-800/80 p-3 space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-slate-500 text-xs font-mono">
            Cargando dotación policial...
          </div>
        ) : officers.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No se encontraron oficiales registrados.
          </div>
        ) : (
          officers.map((o) => (
            <div
              key={o.id}
              className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="font-bold text-white text-sm">{o.full_name}</span>
                </div>
                <Badge
                  variant={
                    o.role === 'admin'
                      ? 'urgent'
                      : o.role === 'comisario'
                      ? 'warning'
                      : 'info'
                  }
                  className="whitespace-nowrap shrink-0"
                >
                  {o.role.toUpperCase()}
                </Badge>
              </div>

              <p className="text-xs text-slate-400 font-mono">{o.email}</p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/70 text-xs">
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border whitespace-nowrap shrink-0 ${
                    o.is_active
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-red-500/10 text-red-400 border-red-500/30'
                  }`}
                >
                  {o.is_active ? 'Activo' : 'Inactivo'}
                </span>

                {isAdmin && (
                  <Button
                    variant={o.is_active ? 'outline' : 'success'}
                    size="sm"
                    className="text-xs py-1 h-7"
                    onClick={() => onToggleActive(o)}
                  >
                    {o.is_active ? 'Desactivar' : 'Activar'}
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop / Tablet View: Full Table (>= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
            <tr>
              <th className="py-3.5 px-4 whitespace-nowrap">Oficial</th>
              <th className="py-3.5 px-4 whitespace-nowrap">Correo Institucional</th>
              <th className="py-3.5 px-4 whitespace-nowrap">Rol Asignado</th>
              <th className="py-3.5 px-4 whitespace-nowrap">Estado Cuenta</th>
              <th className="py-3.5 px-4 whitespace-nowrap">Fecha Registro</th>
              <th className="py-3.5 px-4 text-right whitespace-nowrap">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  Cargando dotación policial...
                </td>
              </tr>
            ) : officers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  No se encontraron oficiales registrados.
                </td>
              </tr>
            ) : (
              officers.map((o) => (
                <tr key={o.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2 whitespace-nowrap">
                    <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
                    {o.full_name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 font-mono text-xs whitespace-nowrap">{o.email}</td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <Badge
                      variant={
                        o.role === 'admin'
                          ? 'urgent'
                          : o.role === 'comisario'
                          ? 'warning'
                          : 'info'
                      }
                      className="whitespace-nowrap shrink-0"
                    >
                      {o.role.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold border whitespace-nowrap shrink-0 ${
                        o.is_active
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}
                    >
                      {o.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-400 font-mono whitespace-nowrap">
                    {o.created_at ? formatDateTime(o.created_at) : 'Guardia'}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    {isAdmin ? (
                      <Button
                        variant={o.is_active ? 'outline' : 'success'}
                        size="sm"
                        className="text-xs whitespace-nowrap"
                        onClick={() => onToggleActive(o)}
                      >
                        {o.is_active ? 'Desactivar' : 'Activar'}
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-500 font-mono whitespace-nowrap">Solo Admin</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
