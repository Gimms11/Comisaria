import React, { useEffect, useState } from 'react';
import {
  MapPin,
  Share2,
  Send,
  Building2,
  Eye,
  CheckCircle2,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../../services/api';
import { CommunityReportDetail, CommunityReportListItem, ReportStatus } from '../../types';
import { useUiStore } from '../../stores/uiStore';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { formatDateTime, formatTimeAgo, getStatusStyles } from '../../lib/utils';

// Custom Leaflet Icons using SVG
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `<div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.5);"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
};

const pinPending = createCustomIcon('#eab308'); // yellow
const pinDerivado = createCustomIcon('#a855f7'); // purple
const pinResuelto = createCustomIcon('#10b981'); // green
const pinDefault = createCustomIcon('#0284c7'); // blue

export const CommunityMapView: React.FC = () => {
  const { selectedCommunityReportCode, openCommunityReportModal, closeCommunityReportModal } =
    useUiStore();

  const [reports, setReports] = useState<CommunityReportListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<CommunityReportDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Derivation Form
  const [derivationForm, setDerivationForm] = useState<{
    entity: string;
    officeNumber: string;
    note: string;
  }>({
    entity: 'Serenazgo Municipal de La Tinguiña',
    officeNumber: '',
    note: '',
  });
  const [isSubmittingDerivation, setIsSubmittingDerivation] = useState(false);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const res = await api.listCommunityReports({ limit: 100 });
      setReports(res?.items || []);
    } catch (e) {
      console.warn('Error al cargar reportes comunitarios:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Cargar detalle del modal
  useEffect(() => {
    if (selectedCommunityReportCode) {
      setIsLoadingDetail(true);
      api
        .getCommunityReportByCode(selectedCommunityReportCode)
        .then((data) => setSelectedReport(data))
        .catch((err) => console.error('Error al cargar reporte vecinal:', err))
        .finally(() => setIsLoadingDetail(false));
    } else {
      setSelectedReport(null);
    }
  }, [selectedCommunityReportCode]);

  const handleDerive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    try {
      setIsSubmittingDerivation(true);
      const compositeNote = `Derivado a ${derivationForm.entity}. Oficio: ${
        derivationForm.officeNumber || 'Sin número'
      }. Glosa: ${derivationForm.note}`;

      await api.updateCommunityReportStatus(selectedReport.id, {
        status: 'derivado',
        note: compositeNote,
      });

      // Recargar reporte
      const updated = await api.getCommunityReportByCode(selectedReport.public_code);
      setSelectedReport(updated);
      setDerivationForm({
        entity: 'Serenazgo Municipal de La Tinguiña',
        officeNumber: '',
        note: '',
      });
      fetchReports();
    } catch (err: any) {
      alert(err.message || 'Error al derivar reporte');
    } finally {
      setIsSubmittingDerivation(false);
    }
  };

  // Coordenadas default de La Tinguiña, Ica, Perú
  const defaultCenter: [number, number] = [-14.0321, -75.7289];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <MapPin className="w-7 h-7 text-purple-400" />
            Mapa Vecinal & Centro de Derivación (MS-03)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Geolocalización en tiempo real de incidentes cívicos, luminarias, ruidos y articulación con Serenazgo de La Tinguiña.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={fetchReports}>
          Refrescar Mapa
        </Button>
      </div>

      {/* Map & Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Map (8 cols) */}
        <div className="lg:col-span-8 h-[600px] rounded-2xl overflow-hidden glass-panel border border-slate-800 relative">
          <MapContainer
            center={defaultCenter}
            zoom={14}
            scrollWheelZoom={true}
            className="w-full h-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {reports.map((r) => {
              // Si no tiene coords, emular dentro de La Tinguiña
              const lat = r.latitude || -14.0321 + (Math.sin(r.public_code.length) * 0.008);
              const lng = r.longitude || -75.7289 + (Math.cos(r.public_code.length) * 0.008);

              const pinIcon =
                r.status === 'pendiente'
                  ? pinPending
                  : r.status === 'derivado'
                  ? pinDerivado
                  : r.status === 'resuelto'
                  ? pinResuelto
                  : pinDefault;

              return (
                <Marker key={r.id} position={[lat, lng]} icon={pinIcon}>
                  <Popup>
                    <div className="text-left space-y-1.5 p-1 min-w-[200px]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-sky-400">
                          {r.public_code}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatTimeAgo(r.created_at)}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white">{r.category_name}</p>
                      <p className="text-xs text-slate-300 line-clamp-2">{r.description}</p>
                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-[11px] text-purple-400 font-semibold">
                          {r.shares_count} difusiones
                        </span>
                        <button
                          onClick={() => openCommunityReportModal(r.public_code)}
                          className="text-xs text-sky-400 hover:text-sky-300 font-bold underline cursor-pointer"
                        >
                          Ver / Derivar
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Map Legend Overlay */}
          <div className="absolute bottom-4 left-4 z-20 glass-panel rounded-xl p-3 text-xs space-y-1.5 border border-slate-700/80 bg-slate-950/90 shadow-xl">
            <p className="font-bold text-slate-300 font-mono text-[11px] mb-1">LEYENDA VECINAL</p>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-slate-300">Pendiente de Atención</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-slate-300">Derivado a Serenazgo</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-300">Resuelto / Concluido</span>
            </div>
          </div>
        </div>

        {/* Incident List & Derivation Hub (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="bg-slate-900/90 border-slate-800 h-[600px] flex flex-col">
            <CardHeader className="shrink-0">
              <CardTitle className="text-base">
                Reportes Ciudadanos ({reports.length})
              </CardTitle>
            </CardHeader>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {isLoading ? (
                <p className="text-center py-10 text-slate-500 text-xs">Cargando mapa...</p>
              ) : reports.length === 0 ? (
                <p className="text-center py-10 text-slate-500 text-xs">Sin reportes registrados</p>
              ) : (
                reports.map((r) => {
                  const statusStyle = getStatusStyles(r.status);
                  return (
                    <div
                      key={r.id}
                      onClick={() => openCommunityReportModal(r.public_code)}
                      className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 cursor-pointer transition-colors space-y-2 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-purple-400">
                          {r.public_code}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {formatTimeAgo(r.created_at)}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-white">{r.category_name}</p>
                      <p className="text-xs text-slate-300 line-clamp-2">{r.description}</p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px]">
                        <span className={`px-2 py-0.5 rounded border font-semibold ${statusStyle.bg}`}>
                          {statusStyle.label}
                        </span>
                        <span className="text-slate-400 flex items-center gap-1 font-mono">
                          <Share2 className="w-3 h-3 text-purple-400" /> {r.shares_count}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Community Report Detail & Derivation Modal */}
      <Modal
        isOpen={!!selectedCommunityReportCode}
        onClose={closeCommunityReportModal}
        title={selectedReport ? `Reporte Vecinal: ${selectedReport.public_code}` : 'Cargando...'}
        subtitle={
          selectedReport
            ? `${selectedReport.category?.name} • Registrado ${formatDateTime(
                selectedReport.created_at
              )}`
            : ''
        }
        maxWidth="2xl"
      >
        {isLoadingDetail || !selectedReport ? (
          <div className="py-12 text-center text-slate-400">Cargando reporte vecinal...</div>
        ) : (
          <div className="space-y-6 text-left">
            {/* Description & Location */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Detalle del Incidente Cívico
              </h4>
              <p className="text-sm text-slate-200 leading-relaxed">{selectedReport.description}</p>
              <div className="pt-2 text-xs text-slate-400 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-purple-400" />
                <span>{selectedReport.address_reference || 'La Tinguiña, Ica'}</span>
              </div>
            </div>

            {/* Photos */}
            {selectedReport.media_urls?.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Fotografía del Reporte
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {selectedReport.media_urls.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt="Evidencia vecinal"
                      className="w-full h-40 object-cover rounded-xl border border-slate-800"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Derivation to Municipal Authorities / Serenazgo */}
            <form
              onSubmit={handleDerive}
              className="p-4 rounded-xl bg-gradient-to-br from-purple-950/40 to-slate-900 border border-purple-500/40 space-y-4"
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-400" />
                <h4 className="text-sm font-bold text-white">
                  Derivar Incidente a Autoridad Municipal
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Entidad Competente"
                  value={derivationForm.entity}
                  onChange={(e) =>
                    setDerivationForm((prev) => ({ ...prev, entity: e.target.value }))
                  }
                  options={[
                    {
                      value: 'Serenazgo Municipal de La Tinguiña',
                      label: 'Serenazgo de La Tinguiña',
                    },
                    {
                      value: 'Subgerencia de Seguridad Ciudadana',
                      label: 'Seguridad Ciudadana MDLT',
                    },
                    {
                      value: 'Fiscalización y Control Municipal',
                      label: 'Fiscalización & Ruidos Molestos',
                    },
                    {
                      value: 'EMAPICA (Aguas y Desagüe)',
                      label: 'EMAPICA - Fugas / Alcantarillado',
                    },
                    {
                      value: 'ElectroDunas (Alumbrado Público)',
                      label: 'ElectroDunas - Luminarias',
                    },
                  ]}
                />

                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-semibold text-slate-300">
                    Número de Oficio / Cuaderno PNP
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: OF-089-2026-PNP/TING"
                    value={derivationForm.officeNumber}
                    onChange={(e) =>
                      setDerivationForm((prev) => ({ ...prev, officeNumber: e.target.value }))
                    }
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-slate-300">
                  Instrucción u Observación de la Derivación
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Especifique el requerimiento para la unidad municipal..."
                  value={derivationForm.note}
                  onChange={(e) =>
                    setDerivationForm((prev) => ({ ...prev, note: e.target.value }))
                  }
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="w-full bg-purple-600 hover:bg-purple-500 shadow-purple-600/30"
                isLoading={isSubmittingDerivation}
              >
                Derivar y Notificar a Serenazgo
              </Button>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
};
