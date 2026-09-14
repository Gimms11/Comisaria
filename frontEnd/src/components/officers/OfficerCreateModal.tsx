import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { officerCreateSchema, OfficerCreateFormData } from '../../lib/validations';

interface OfficerCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: OfficerCreateFormData) => Promise<void>;
}

export const OfficerCreateModal: React.FC<OfficerCreateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OfficerCreateFormData>({
    resolver: zodResolver(officerCreateSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      role: 'operador',
    },
  });

  const handleFormSubmit = async (data: OfficerCreateFormData) => {
    await onSubmit(data);
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Registrar Nuevo Efectivo Policial"
      subtitle="Asigne credenciales y privilegios institucionales de acceso"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 text-left" noValidate>
        <Input
          label="Grado y Nombre Completo"
          placeholder="Ej: Mayor PNP Carlos Mendoza"
          error={errors.full_name?.message}
          {...register('full_name')}
        />

        <Input
          label="Correo Electrónico Institucional"
          type="email"
          placeholder="carlos.mendoza@policia.gob.pe"
          leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="relative">
          <Input
            label="Contraseña de Acceso (Mínimo 8 car., Mayús., Minús. y Número)"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••••••"
            leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
            error={errors.password?.message}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-9 text-slate-400 hover:text-slate-200"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <Select
          label="Nivel de Privilegio (Rol RBAC)"
          error={errors.role?.message}
          {...register('role')}
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
  );
};
