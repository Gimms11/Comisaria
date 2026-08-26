import React, { useEffect, useState } from 'react';
import { Users, UserPlus, ShieldCheck, Mail, Lock, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { Officer } from '../../types';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import { formatDateTime } from '../../lib/utils';

export const OfficersView: React.FC = () => {
  const { officer: currentOfficer } = useAuthStore();
  const isAdmin = currentOfficer?.role === 'admin';

  const [officers, setOfficers] = useState<Officer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'operador',
  });

  const fetchOfficers = async () => {
    try {
      setIsLoading(true);
      const data = await api.listOfficers();
      setOfficers(data);
    } catch (e) {
      console.warn('Error al cargar lista de oficiales:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficers();
  }, []);

  const handleCreateOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await api.createOfficer(form);
      setIsModalOpen(false);
      setForm({ full_name: '', email: '', password: '', role: 'operador' });
      fetchOfficers();
    } catch (err: any) {
      alert(err.message || 'Error al registrar oficial');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (officer: Officer) => {
    try {
      await api.updateOfficer(officer.id, { is_active: !officer.is_active });
      fetchOfficers();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar estado del oficial');
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-sky-400" />
            Dotación y Personal Policial (MS-01)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gestión de cuentas institucionales, control de acceso basado en roles (RBAC) y claves de seguridad.
          </p>
        </div>
        {isAdmin ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="gap-2"
          >
            <UserPlus className="w-4 h-4" /> Registrar Oficial
          </Button>
        ) : (
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-amber-400 font-mono flex items-center gap-2">
            <span>🛡️ Modo Supervisión (Lectura)</span>
          </div>
        )}
      </div>

      {/* Officers Table */}
      <Card className="bg-slate-900/90 border-slate-800 p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              <tr>
                <th className="py-3.5 px-4">Oficial</th>
                <th className="py-3.5 px-4">Correo Institucional</th>
                <th className="py-3.5 px-4">Rol Asignado</th>
                <th className="py-3.5 px-4">Estado Cuenta</th>
                <th className="py-3.5 px-4">Fecha Registro</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
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
                    <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-sky-400" />
                      {o.full_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono text-xs">{o.email}</td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          o.role === 'admin'
                            ? 'urgent'
                            : o.role === 'comisario'
                            ? 'warning'
                            : 'info'
                        }
                      >
                        {o.role.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                          o.is_active
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-red-500/10 text-red-400 border-red-500/30'
                        }`}
                      >
                        {o.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 font-mono">
                      {o.created_at ? formatDateTime(o.created_at) : 'Guardia'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isAdmin ? (
                        <Button
                          variant={o.is_active ? 'outline' : 'success'}
                          size="sm"
                          className="text-xs"
                          onClick={() => handleToggleActive(o)}
                        >
                          {o.is_active ? 'Desactivar' : 'Activar'}
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-500 font-mono">Solo Admin</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Register Officer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Nuevo Efectivo Policial"
        subtitle="Asigne credenciales y privilegios institucionales de acceso"
        maxWidth="md"
      >
        <form onSubmit={handleCreateOfficer} className="space-y-4 text-left">
          <Input
            label="Grado y Nombre Completo"
            required
            placeholder="Ej: Mayor PNP Carlos Mendoza"
            value={form.full_name}
            onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
          />

          <Input
            label="Correo Electrónico Institucional"
            type="email"
            required
            placeholder="carlos.mendoza@policia.gob.pe"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
          />

          <Input
            label="Contraseña de Acceso Temporal (Mínimo 8 caracteres)"
            type="password"
            required
            placeholder="••••••••••••"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
          />

          <Select
            label="Nivel de Privilegio (Rol RBAC)"
            value={form.role}
            onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
            options={[
              { value: 'operador', label: 'Operador (Revisión y Despacho)' },
              { value: 'comisario', label: 'Comisario (Supervisión y Estadísticas)' },
              { value: 'admin', label: 'Administrador General del Sistema' },
              { value: 'moderador', label: 'Moderador Cívico' },
            ]}
          />

          <Button type="submit" variant="primary" size="sm" className="w-full" isLoading={isSubmitting}>
            Confirmar Registro Policial
          </Button>
        </form>
      </Modal>
    </div>
  );
};
