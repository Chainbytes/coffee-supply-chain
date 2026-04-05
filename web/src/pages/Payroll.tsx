import { useEffect, useState, useCallback } from 'react';
import {
  BoltIcon,
  ArrowDownTrayIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import {
  getAnalytics,
  getShift,
  payShift,
  getBtcPrice,
  exportCsv,
  satsToUsd,
  formatSats,
  type Analytics,
  type Shift,
} from '../api';
import { useFarm } from '../context/FarmContext';
import { Header } from '../components/Header';
import { Badge } from '../components/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';

interface ShiftWithWorkers extends Shift {
  checkin_count?: number;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-SV', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function Payroll() {
  const { activeFarm } = useFarm();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [btcUsd, setBtcUsd] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payingShiftId, setPayingShiftId] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [paySuccess, setPaySuccess] = useState<string | null>(null);
  const [expandedShiftId, setExpandedShiftId] = useState<string | null>(null);
  const [shiftDetail, setShiftDetail] = useState<ShiftWithWorkers | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    if (!activeFarm) return;
    setLoading(true);
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
    }
  }, [activeFarm]);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePay(shiftId: string) {
    setPayingShiftId(shiftId);
    setPayError(null);
    setPaySuccess(null);
    try {
      const result = await payShift(shiftId);
      setPaySuccess(
        `Pago completado: ${result.payments.length} trabajadores, ${formatSats(result.total_sats)}`
      );
      // Reload analytics after payment
      await load();
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Error al procesar pago');
    } finally {
      setPayingShiftId(null);
    }
  }

  async function handleExpandShift(shiftId: string) {
    if (expandedShiftId === shiftId) {
      setExpandedShiftId(null);
      setShiftDetail(null);
      return;
    }
    setExpandedShiftId(shiftId);
    setDetailLoading(true);
    try {
      const detail = await getShift(shiftId);
      setShiftDetail({ ...detail, checkin_count: detail.checkins?.length ?? 0 });
    } catch {
      // Non-critical — just hide detail
    } finally {
      setDetailLoading(false);
    }
  }

  if (loading) return <LoadingSpinner message="Cargando nomina..." />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;
  if (!analytics) return null;

  const totalPaidSats = analytics.total_payments_sats;
  const exportUrl = activeFarm ? exportCsv(activeFarm.id) : '#';

  return (
    <div className="flex flex-col flex-1">
      <Header title="Nomina" onRefresh={load} />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Summary bar */}
        <div className="bg-[#f7931a] rounded-xl px-6 py-4 flex flex-wrap gap-6 items-center justify-between">
          <div>
            <p className="text-white/80 text-xs uppercase tracking-wider mb-0.5">Total Pagado</p>
            <p className="text-white text-2xl font-bold">
              {totalPaidSats.toLocaleString()} sats
            </p>
            {btcUsd && (
              <p className="text-white/70 text-sm">
                ≈ ${satsToUsd(totalPaidSats, btcUsd)} USD
              </p>
            )}
          </div>
          <a
            href={exportUrl}
            download
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Exportar CSV
          </a>
        </div>

        {/* Alerts */}
        {paySuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center gap-2">
            <BoltIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800">{paySuccess}</p>
            <button
              onClick={() => setPaySuccess(null)}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              &times;
            </button>
          </div>
        )}
        {payError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-2">
            <p className="text-sm text-red-800">{payError}</p>
            <button
              onClick={() => setPayError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              &times;
            </button>
          </div>
        )}

        {/* Shifts table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f5e8d8]">
            <h3 className="font-semibold text-[#2c1810]">Turnos</h3>
          </div>
          {analytics.recent_shifts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <ClockIcon className="w-12 h-12 text-[#c07a52]" />
              <p className="text-sm text-[#9c5a35]">No hay turnos registrados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#fff8e7] border-b border-[#f5e8d8]">
                    <th className="text-left px-6 py-3 text-[#7a4528] font-medium">Fecha</th>
                    <th className="text-left px-6 py-3 text-[#7a4528] font-medium">
                      Check-ins
                    </th>
                    <th className="text-left px-6 py-3 text-[#7a4528] font-medium">Estado</th>
                    <th className="text-left px-6 py-3 text-[#7a4528] font-medium">Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.recent_shifts.map((shift, i) => (
                    <>
                      <tr
                        key={shift.id}
                        className={`border-b border-[#f5e8d8] cursor-pointer hover:bg-[#fff3d4]/50 transition-colors ${
                          i % 2 === 0 ? 'bg-white' : 'bg-[#fff8e7]/50'
                        }`}
                        onClick={() => handleExpandShift(shift.id)}
                      >
                        <td className="px-6 py-3.5 text-[#2c1810]">
                          {formatDate(shift.date)}
                        </td>
                        <td className="px-6 py-3.5 text-[#2c1810]">
                          {shift.worker_count ?? 0}
                        </td>
                        <td className="px-6 py-3.5">
                          <Badge variant={shift.status} />
                        </td>
                        <td className="px-6 py-3.5" onClick={(e) => e.stopPropagation()}>
                          {shift.status === 'closed' ? (
                            <button
                              onClick={() => handlePay(shift.id)}
                              disabled={payingShiftId === shift.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f7931a] text-white rounded-lg text-xs font-medium hover:bg-[#d4780e] transition-colors disabled:opacity-50"
                            >
                              <BoltIcon className="w-3.5 h-3.5" />
                              {payingShiftId === shift.id ? 'Pagando...' : 'Pagar'}
                            </button>
                          ) : (
                            <span className="text-xs text-[#9c5a35]">Turno abierto</span>
                          )}
                        </td>
                      </tr>
                      {expandedShiftId === shift.id && (
                        <tr key={`${shift.id}-detail`} className="bg-[#fff8e7]">
                          <td colSpan={4} className="px-6 py-4">
                            {detailLoading ? (
                              <p className="text-sm text-[#9c5a35]">Cargando detalle...</p>
                            ) : shiftDetail ? (
                              <div className="text-sm text-[#2c1810]">
                                <p className="font-medium mb-2">Check-ins del turno:</p>
                                {(shiftDetail as unknown as { checkins?: Array<{ id: string; worker_name?: string; name?: string; checked_in_at: string }> }).checkins?.length === 0 ? (
                                  <p className="text-[#9c5a35]">Sin check-ins.</p>
                                ) : (
                                  <ul className="space-y-1">
                                    {(shiftDetail as unknown as { checkins?: Array<{ id: string; worker_name?: string; name?: string; checked_in_at: string }> }).checkins?.map((c) => (
                                      <li key={c.id} className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-[#f7931a] flex-shrink-0" />
                                        <span>{c.worker_name ?? c.name}</span>
                                        <span className="text-[#9c5a35] ml-auto text-xs">
                                          {new Date(c.checked_in_at).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ) : null}
                          </td>
                        </tr>
                      )}
                    </>
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
