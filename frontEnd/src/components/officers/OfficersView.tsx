import React, { useEffect, useState, useCallback } from 'react';
import { Users, UserPlus, Shield } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { Officer } from '../../types';
import { Button } from '../ui/Button';
import { OfficerCreateFormData } from '../../lib/validations';
import { OfficerTable } from './OfficerTable';
import { OfficerCreateModal } from './OfficerCreateModal';

export const OfficersView: React.FC = () => {
  const { officer: currentOfficer } = useAuthStore();
  const isAdmin = currentOfficer?.role === 'admin';

  const [officers, setOfficers] = useState<Officer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchOfficers = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.listOfficers();
      setOfficers(data);
    } catch (e) {
      console.warn('Error al cargar lista de oficiales:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOfficers();
  }, [fetchOfficers]);

  const handleCreateOfficer = async (data: OfficerCreateFormData) => {
    try {
      await api.createOfficer(data);
      await fetchOfficers();
    } catch (err: any) {
      alert(err.message || 'Error al registrar oficial');
      throw err;
    }
  };

  const handleToggleActive = async (officer: Officer) => {
    try {
      await api.updateOfficer(officer.id, { is_active: !officer.is_active });
      await fetchOfficers();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar estado del oficial');
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shrink-0 flex items-center justify-center">
              <Users className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400 shrink-0" />
            </div>
            <span>Dotación & Personal Policial</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-2xl">
            Gestión de cuentas institucionales, control de roles (RBAC) y credenciales policiales.
          </p>
        </div>
        {isAdmin ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="gap-2 whitespace-nowrap shrink-0"
          >
            <UserPlus className="w-4 h-4 shrink-0" /> Registrar Oficial
          </Button>
        ) : (
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-amber-400 font-mono flex items-center gap-2 whitespace-nowrap shrink-0">
            <Shield className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Modo Supervisión (Solo Lectura)</span>
          </div>
        )}
      </div>

      {/* Officers Table / Card List */}
      <OfficerTable
        officers={officers}
        isLoading={isLoading}
        isAdmin={isAdmin}
        onToggleActive={handleToggleActive}
      />

      {/* Register Officer Modal */}
      <OfficerCreateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOfficer}
      />
    </div>
  );
};
