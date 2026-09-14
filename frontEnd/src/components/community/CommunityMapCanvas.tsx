import React, { useEffect } from 'react';
import { ZoomIn, ZoomOut, LocateFixed } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { CommunityReportListItem } from '../../types';
import { formatTimeAgo } from '../../lib/utils';

const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `<div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.5);"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
};

const pinPending = createCustomIcon('#eab308');
const pinRevision = createCustomIcon('#3b82f6');
const pinEnAtencion = createCustomIcon('#6366f1');
const pinDerivado = createCustomIcon('#a855f7');
const pinResuelto = createCustomIcon('#10b981');
const pinArchivado = createCustomIcon('#64748b');
const pinRechazado = createCustomIcon('#e11d48');
const pinDefault = createCustomIcon('#0284c7');

export const DEFAULT_CENTER: [number, number] = [-14.0321, -75.7289];
export const MIN_ZOOM = 12;
export const MAX_ZOOM = 18;
export const DISTRICT_BOUNDS: [[number, number], [number, number]] = [
  [-14.16, -75.86],
  [-13.90, -75.60],
];

const MapBridge: React.FC<{
  currentZoom: number;
  onZoomChange: (z: number) => void;
  resetSignal: number;
}> = ({ currentZoom, onZoomChange, resetSignal }) => {
  const map = useMap();

  useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    },
  });

  useEffect(() => {
    if (map.getZoom() !== currentZoom) {
      map.setZoom(currentZoom);
    }
  }, [currentZoom, map]);

  useEffect(() => {
    if (resetSignal > 0) {
      map.setView(DEFAULT_CENTER, 14, { animate: true });
    }
  }, [resetSignal, map]);

  return null;
};

interface CommunityMapCanvasProps {
  reports: CommunityReportListItem[];
  mapZoom: number;
  onZoomChange: (z: number) => void;
  resetSignal: number;
  onResetView: () => void;
  onSelectReport: (code: string) => void;
}

export const CommunityMapCanvas: React.FC<CommunityMapCanvasProps> = ({
  reports,
  mapZoom,
  onZoomChange,
  resetSignal,
  onResetView,
  onSelectReport,
}) => {
  const getZoomLabel = (zoom: number) => {
    if (zoom <= 12) return 'Distrito Amplio (12x)';
    if (zoom === 13) return 'Sector Urbano (13x)';
    if (zoom === 14) return 'La Tinguiña Centro (14x)';
    if (zoom === 15) return 'Barrios y Avenidas (15x)';
    if (zoom === 16) return 'Nivel Manzana (16x)';
    if (zoom === 17) return 'Nivel Calle (17x)';
    return 'Detalle Predial Máximo (18x)';
  };

  return (
    <div className="h-[380px] sm:h-[480px] lg:h-[600px] rounded-2xl overflow-hidden glass-panel border border-slate-800 relative group">
      {/* Zoom Control Bar */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 glass-panel rounded-xl sm:rounded-2xl p-1.5 sm:p-2.5 border border-slate-700/90 bg-slate-950/90 shadow-2xl backdrop-blur-md flex items-center gap-1.5 sm:gap-3 max-w-[calc(100%-1.5rem)]">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onZoomChange(Math.max(MIN_ZOOM, mapZoom - 1))}
            disabled={mapZoom <= MIN_ZOOM}
            title="Alejar mapa"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-2">
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={1}
              value={mapZoom}
              onChange={(e) => onZoomChange(Number(e.target.value))}
              className="w-16 sm:w-28 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400"
            />
          </div>

          <button
            type="button"
            onClick={() => onZoomChange(Math.min(MAX_ZOOM, mapZoom + 1))}
            disabled={mapZoom >= MAX_ZOOM}
            title="Acercar mapa"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        <div className="h-4 w-px bg-slate-800" />

        <div className="text-[11px] font-mono font-semibold text-purple-300 whitespace-nowrap min-w-[130px]">
          {getZoomLabel(mapZoom)}
        </div>

        <div className="h-4 w-px bg-slate-800" />

        <button
          type="button"
          onClick={onResetView}
          title="Centrar en La Tinguiña"
          className="px-2.5 py-1 rounded-lg bg-purple-950/80 hover:bg-purple-900/90 text-purple-300 hover:text-white border border-purple-500/40 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-sm"
        >
          <LocateFixed className="w-3.5 h-3.5 text-purple-400" />
          <span>Tinguiña</span>
        </button>
      </div>

      <MapContainer
        center={DEFAULT_CENTER}
        zoom={mapZoom}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        maxBounds={DISTRICT_BOUNDS}
        maxBoundsViscosity={1.0}
        zoomControl={false}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
        />

        <MapBridge
          currentZoom={mapZoom}
          onZoomChange={onZoomChange}
          resetSignal={resetSignal}
        />

        {reports.map((r) => {
          const lat = r.latitude || -14.0321 + Math.sin(r.public_code.length) * 0.008;
          const lng = r.longitude || -75.7289 + Math.cos(r.public_code.length) * 0.008;

          const pinIcon =
            r.status === 'pendiente'
              ? pinPending
              : r.status === 'en_revision'
              ? pinRevision
              : r.status === 'derivado'
              ? pinDerivado
              : r.status === 'en_atencion'
              ? pinEnAtencion
              : r.status === 'resuelto'
              ? pinResuelto
              : r.status === 'archivado'
              ? pinArchivado
              : r.status === 'rechazado'
              ? pinRechazado
              : pinDefault;

          return (
            <Marker key={r.id} position={[lat, lng]} icon={pinIcon}>
              <Popup>
                <div className="text-left space-y-1.5 p-1 min-w-[200px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-sky-400 whitespace-nowrap">
                      {r.public_code}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                      {formatTimeAgo(r.created_at)}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white">{r.category_name}</p>
                  <p className="text-xs text-slate-300 line-clamp-2">{r.description}</p>
                  <div className="pt-2 flex items-center justify-between border-t border-slate-800 mt-1">
                    <span className="text-[11px] text-purple-400 font-semibold whitespace-nowrap">
                      {r.shares_count} difusiones
                    </span>
                    <button
                      onClick={() => onSelectReport(r.public_code)}
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
        <p className="font-bold text-slate-300 font-mono text-[11px] mb-1">ESTADOS VECINALES</p>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-yellow-500 shrink-0" />
          <span className="text-slate-300 whitespace-nowrap">Pendiente de Atención</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-purple-500 shrink-0" />
          <span className="text-slate-300 whitespace-nowrap">Derivado a Serenazgo / Muni</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-indigo-500 shrink-0" />
          <span className="text-slate-300 whitespace-nowrap">En Atención (Cuadrilla en Sitio)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-slate-300 whitespace-nowrap">Resuelto / Concluido</span>
        </div>
      </div>
    </div>
  );
};
