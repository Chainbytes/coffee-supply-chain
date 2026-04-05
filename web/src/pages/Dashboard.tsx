import { useEffect, useState, useCallback } from 'react';
import {
  UsersIcon,
  ClipboardDocumentListIcon,
  ArchiveBoxIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { getAnalytics, getBtcPrice, satsToUsd, type Analytics } from '../api';
import { useFarm } from '../context/FarmContext';
import { Header } from '../components/Header';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-SV', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString('es-SV', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Dashboard() {
  const { activeFarm } = useFarm();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [btcUsd, setBtcUsd] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (silent = false) => {
      if (!activeFarm) return;
      if (!silent) setLoading(true);
      setError(null);
      try {
        const [analyticsData, price] = await Promise.all([
          getAnalytics(activeFarm.id),
          getBtcPrice().catch(() => null),
        ]);
        setAnalytics(analyticsData);
        if (price) setBtcUsd(price.usd);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar datos');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeFarm]
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  if (loading) return <LoadingSpinner message="Cargando analíticas..." />;
  if (error) return <ErrorMessage message={error} onRetry={() => load()} />;
  if (!analytics) return null;

  const payUsd =
    btcUsd != null ? `≈ $${satsToUsd(analytics.total_payments_sats, btcUsd)} USD` : undefined;

  return (
    <div className="flex flex-col flex-1">
      <Header title="Dashboard" onRefresh={handleRefresh} refreshing={refreshing} />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Farm info banner */}
        <div className="bg-[#2c1810] rounded-xl px-6 py-5 text-white flex flex-wrap gap-6 items-center">
          <div>
            <p className="text-[#c07a52] text-xs uppercase tracking-wider mb-1">Finca</p>
            <h2 className="text-2xl font-bold">{activeFarm?.name}</h2>
          </div>
          <div className="h-10 w-px bg-[#5c3420] hidden sm:block" />
          <div>
            <p className="text-[#c07a52] text-xs uppercase tracking-wider mb-1">Ubicacion</p>
            <p className="font-medium">{activeFarm?.location}</p>
          </div>
          <div className="h-10 w-px bg-[#5c3420] hidden sm:block" />
          <div>
            <p className="text-[#c07a52] text-xs uppercase tracking-wider mb-1">Altitud</p>
            <p className="font-medium">{activeFarm?.altitude_m ?? '—'} m</p>
          </div>
          <div className="h-10 w-px bg-[#5c3420] hidden sm:block" />
          <div>
            <p className="text-[#c07a52] text-xs uppercase tracking-wider mb-1">Propietario</p>
            <p className="font-medium">{activeFarm?.owner_name}</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Trabajadores"
            value={analytics.worker_count}
            icon={<UsersIcon className="w-5 h-5" />}
          />
          <StatCard
            label="Turnos"
            value={analytics.shift_count}
            icon={<ClipboardDocumentListIcon className="w-5 h-5" />}
          />
          <StatCard
            label="Lotes"
            value={analytics.lot_count}
            icon={<ArchiveBoxIcon className="w-5 h-5" />}
          />
          <StatCard
            label="Total Pagos"
            value={`${analytics.total_payments_sats.toLocaleString()} sats`}
            sub={payUsd}
            icon={<BoltIcon className="w-5 h-5" />}
            accent
          />
        </div>

        {/* Recent shifts table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f5e8d8]">
            <h3 className="font-semibold text-[#2c1810]">Turnos Recientes</h3>
          </div>
          {analytics.recent_shifts.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-[#9c5a35]">
              No hay turnos registrados aun.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#fff8e7] border-b border-[#f5e8d8]">
                    <th className="text-left px-6 py-3 text-[#7a4528] font-medium">Fecha</th>
                    <th className="text-left px-6 py-3 text-[#7a4528] font-medium">Trabajadores</th>
                    <th className="text-left px-6 py-3 text-[#7a4528] font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.recent_shifts.map((shift, i) => (
                    <tr
                      key={shift.id}
                      className={`border-b border-[#f5e8d8] last:border-0 ${
                        i % 2 === 0 ? 'bg-white' : 'bg-[#fff8e7]/50'
                      }`}
                    >
                      <td className="px-6 py-3.5 text-[#2c1810]">{formatDate(shift.date)}</td>
                      <td className="px-6 py-3.5 text-[#2c1810]">
                        {shift.worker_count ?? 0} check-ins
                      </td>
                      <td className="px-6 py-3.5">
                        <Badge variant={shift.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent check-ins */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f5e8d8]">
            <h3 className="font-semibold text-[#2c1810]">Ultimos Check-ins</h3>
          </div>
          {analytics.recent_checkins.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-[#9c5a35]">
              No hay check-ins registrados aun.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#fff8e7] border-b border-[#f5e8d8]">
                    <th className="text-left px-6 py-3 text-[#7a4528] font-medium">Trabajador</th>
                    <th className="text-left px-6 py-3 text-[#7a4528] font-medium">Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.recent_checkins.map((c, i) => (
                    <tr
                      key={c.id}
                      className={`border-b border-[#f5e8d8] last:border-0 ${
                        i % 2 === 0 ? 'bg-white' : 'bg-[#fff8e7]/50'
                      }`}
                    >
                      <td className="px-6 py-3.5 text-[#2c1810] font-medium">{c.worker_name}</td>
                      <td className="px-6 py-3.5 text-[#7a4528]">{formatTime(c.checked_in_at)}</td>
                    </tr>
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
