import { useEffect, useState, useCallback } from 'react';
import {
  ArchiveBoxIcon,
  ChevronDownIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { getLots, getProvenance, type Lot, type ProvenanceData } from '../api';
import { useFarm } from '../context/FarmContext';
import { Header } from '../components/Header';
import { Badge } from '../components/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';

const ENTITY_LABELS: Record<string, string> = {
  farm: 'Finca',
  wet_mill: 'Beneficio Humedo',
  dry_mill: 'Beneficio Seco',
  exporter: 'Exportador',
  roaster: 'Tostador',
};

function formatTs(ts: string): string {
  return new Date(ts).toLocaleString('es-SV', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface LotRowProps {
  lot: Lot;
}

function LotRow({ lot }: LotRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [provenance, setProvenance] = useState<ProvenanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExpand() {
    setExpanded((v) => !v);
    if (!expanded && !provenance) {
      setLoading(true);
      setError(null);
      try {
        const data = await getProvenance(lot.id);
        setProvenance(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar proveniencia');
      } finally {
        setLoading(false);
      }
    }
  }

  const publicUrl = `http://134.122.8.237:3002/provenance/${lot.id}`;

  return (
    <>
      <tr
        className="border-b border-[#f5e8d8] cursor-pointer hover:bg-[#fff3d4]/50 transition-colors bg-white"
        onClick={handleExpand}
      >
        <td className="px-6 py-3.5">
          <div className="flex items-center gap-2">
            <ChevronDownIcon
              className={`w-4 h-4 text-[#9c5a35] transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`}
            />
            <span className="font-mono text-xs text-[#9c5a35] truncate max-w-[120px]" title={lot.id}>
              {lot.id.slice(0, 8)}...
            </span>
          </div>
        </td>
        <td className="px-6 py-3.5 text-[#2c1810]">{lot.weight_kg} kg</td>
        <td className="px-6 py-3.5">
          <Badge variant={lot.grade} label={`Grado ${lot.grade}`} />
        </td>
        <td className="px-6 py-3.5">
          <span className="font-mono text-xs text-[#9c5a35] truncate max-w-[160px] block" title={lot.asset_id}>
            {lot.asset_id?.slice(0, 16)}...
          </span>
        </td>
        <td className="px-6 py-3.5 text-[#7a4528] text-xs">
          {new Date(lot.created_at).toLocaleDateString('es-SV')}
        </td>
        <td className="px-6 py-3.5" onClick={(e) => e.stopPropagation()}>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[#f7931a] hover:text-[#d4780e]"
          >
            Ver
            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
          </a>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-[#fff8e7]">
          <td colSpan={6} className="px-6 py-5">
            {loading && (
              <p className="text-sm text-[#9c5a35]">Cargando proveniencia...</p>
            )}
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            {provenance && (
              <div className="space-y-4">
                {/* Farm info */}
                <div className="text-sm">
                  <p className="font-medium text-[#2c1810] mb-1">
                    {provenance.farm?.name} — {provenance.farm?.location}
                  </p>
                  {provenance.lot.notes && (
                    <p className="text-[#7a4528]">Notas: {provenance.lot.notes}</p>
                  )}
                  {provenance.lot.gps_lat && provenance.lot.gps_lng && (
                    <p className="text-[#9c5a35] text-xs">
                      GPS: {provenance.lot.gps_lat.toFixed(4)}, {provenance.lot.gps_lng.toFixed(4)}
                    </p>
                  )}
                </div>

                {/* Workers */}
                {provenance.workers.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[#7a4528] uppercase tracking-wider mb-2">
                      Trabajadores ({provenance.workers.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {provenance.workers.map((w, idx) => (
                        <span
                          key={idx}
                          className="bg-[#f5e8d8] text-[#5c3420] text-xs px-2.5 py-1 rounded-full"
                        >
                          {w.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timeline */}
                {provenance.transfers.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[#7a4528] uppercase tracking-wider mb-3">
                      Cadena de Custodia
                    </p>
                    <div className="relative">
                      <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-[#e8c9a8]" />
                      <div className="space-y-4 pl-9">
                        {provenance.transfers.map((t) => (
                          <div key={t.id} className="relative">
                            <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-[#f7931a] border-2 border-white" />
                            <div className="bg-white rounded-lg p-3 border border-[#e8c9a8] shadow-sm">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-medium text-[#2c1810]">
                                    {ENTITY_LABELS[t.entity_type] ?? t.entity_type}
                                  </p>
                                  <p className="text-xs text-[#7a4528] mt-0.5">
                                    {t.from_entity} → {t.to_entity}
                                  </p>
                                  {t.metadata && Object.keys(t.metadata).length > 0 && (
                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                      {Object.entries(t.metadata).map(([k, v]) => {
                                        if (k === 'workers' && Array.isArray(v)) return null;
                                        return (
                                          <span key={k} className="text-xs bg-[#f5e8d8] text-[#5c3420] px-1.5 py-0.5 rounded">
                                            {k}: {String(v)}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs text-[#9c5a35] flex-shrink-0">
                                  {formatTs(t.timestamp)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment summary */}
                {provenance.payment_summary && provenance.payment_summary.total_sats > 0 && (
                  <div className="bg-[#fff3d4] border border-[#f7931a]/30 rounded-lg px-4 py-3 flex items-center gap-3">
                    <span className="text-[#f7931a] text-lg">&#9889;</span>
                    <div>
                      <p className="text-sm font-medium text-[#2c1810]">
                        {provenance.payment_summary.worker_count} trabajadores pagados
                      </p>
                      <p className="text-xs text-[#7a4528]">
                        {provenance.payment_summary.total_sats.toLocaleString()} sats via Lightning
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export default function Lots() {
  const { activeFarm } = useFarm();
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!activeFarm) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getLots(activeFarm.id);
      setLots(Array.isArray(data) ? data : []);
    } catch {
      // The backend may not expose a bulk-lots-by-farm endpoint yet — show empty state gracefully
      setLots([]);
    } finally {
      setLoading(false);
    }
  }, [activeFarm]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingSpinner message="Cargando lotes..." />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;

  return (
    <div className="flex flex-col flex-1">
      <Header title="Lotes y Proveniencia" onRefresh={load} />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {lots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <ArchiveBoxIcon className="w-12 h-12 text-[#c07a52]" />
              <p className="text-sm text-[#9c5a35]">No hay lotes de cosecha registrados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#fff8e7] border-b border-[#f5e8d8]">
                    <th className="text-left px-6 py-3 text-[#7a4528] font-medium">ID</th>
                    <th className="text-left px-6 py-3 text-[#7a4528] font-medium">Peso</th>
                    <th className="text-left px-6 py-3 text-[#7a4528] font-medium">Grado</th>
                    <th className="text-left px-6 py-3 text-[#7a4528] font-medium">Asset ID</th>
                    <th className="text-left px-6 py-3 text-[#7a4528] font-medium">Fecha</th>
                    <th className="text-left px-6 py-3 text-[#7a4528] font-medium">Proveniencia</th>
                  </tr>
                </thead>
                <tbody>
                  {lots.map((lot) => (
                    <LotRow key={lot.id} lot={lot} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
