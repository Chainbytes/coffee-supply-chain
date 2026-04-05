import { useEffect, useState, useCallback } from 'react';
import {
  PlusIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import {
  getWorkers,
  updateWorker,
  updatePayRate,
  createWorker,
  type Worker,
} from '../api';
import { useFarm } from '../context/FarmContext';
import { Header } from '../components/Header';
import { Badge } from '../components/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';

interface EditState {
  name: string;
  phone: string;
  photo_url: string;
  pay_rate_sats: string;
}

interface NewWorkerState {
  name: string;
  phone: string;
  role: 'worker' | 'foreman';
  lightning_address: string;
}

export default function Employees() {
  const { activeFarm } = useFarm();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({
    name: '',
    phone: '',
    photo_url: '',
    pay_rate_sats: '',
  });
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newWorker, setNewWorker] = useState<NewWorkerState>({
    name: '',
    phone: '',
    role: 'worker',
    lightning_address: '',
  });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!activeFarm) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getWorkers(activeFarm.id);
      setWorkers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar trabajadores');
    } finally {
      setLoading(false);
    }
  }, [activeFarm]);

  useEffect(() => {
    load();
  }, [load]);

  function startEdit(w: Worker) {
    setEditingId(w.id);
    setEditState({
      name: w.name,
      phone: w.phone ?? '',
      photo_url: w.photo_url ?? '',
      pay_rate_sats: String(w.pay_rate_sats ?? 0),
    });
  }

  async function saveEdit(w: Worker) {
    setSaving(true);
    try {
      const profileUpdate = await updateWorker(w.id, {
        name: editState.name,
        phone: editState.phone || undefined,
        photo_url: editState.photo_url || undefined,
      });
      const payRate = Number(editState.pay_rate_sats);
      if (!isNaN(payRate) && payRate !== w.pay_rate_sats) {
        await updatePayRate(w.id, { pay_rate_sats: payRate });
        setWorkers((prev) =>
          prev.map((worker) =>
            worker.id === w.id ? { ...profileUpdate, pay_rate_sats: payRate } : worker
          )
        );
      } else {
        setWorkers((prev) =>
          prev.map((worker) => (worker.id === w.id ? profileUpdate : worker))
        );
      }
      setEditingId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddWorker() {
    if (!activeFarm || !newWorker.name.trim()) {
      setAddError('El nombre es requerido');
      return;
    }
    setAdding(true);
    setAddError(null);
    try {
      const w = await createWorker({
        farm_id: activeFarm.id,
        name: newWorker.name.trim(),
        phone: newWorker.phone || undefined,
        role: newWorker.role,
        lightning_address: newWorker.lightning_address || undefined,
      });
      setWorkers((prev) => [...prev, w]);
      setShowAdd(false);
      setNewWorker({ name: '', phone: '', role: 'worker', lightning_address: '' });
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Error al crear trabajador');
    } finally {
      setAdding(false);
    }
  }

  if (loading) return <LoadingSpinner message="Cargando empleados..." />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;

  return (
    <div className="flex flex-col flex-1">
      <Header title="Empleados" onRefresh={load} />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Add worker button */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#2c1810] text-white rounded-lg hover:bg-[#3d2318] transition-colors text-sm font-medium"
          >
            <PlusIcon className="w-4 h-4" />
            Agregar Trabajador
          </button>
        </div>

        {/* Add worker modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <h2 className="text-lg font-bold text-[#2c1810] mb-4">Nuevo Trabajador</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-[#7a4528] mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={newWorker.name}
                    onChange={(e) => setNewWorker((p) => ({ ...p, name: e.target.value }))}
                    className="w-full border border-[#e8c9a8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f7931a]"
                    placeholder="Maria Garcia"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#7a4528] mb-1">
                    Telefono
                  </label>
                  <input
                    type="tel"
                    value={newWorker.phone}
                    onChange={(e) => setNewWorker((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full border border-[#e8c9a8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f7931a]"
                    placeholder="+503 7XXX-XXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#7a4528] mb-1">Rol</label>
                  <select
                    value={newWorker.role}
                    onChange={(e) =>
                      setNewWorker((p) => ({
                        ...p,
                        role: e.target.value as 'worker' | 'foreman',
                      }))
                    }
                    className="w-full border border-[#e8c9a8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f7931a]"
                  >
                    <option value="worker">Trabajador</option>
                    <option value="foreman">Capataz</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#7a4528] mb-1">
                    Lightning Address
                  </label>
                  <input
                    type="text"
                    value={newWorker.lightning_address}
                    onChange={(e) =>
                      setNewWorker((p) => ({ ...p, lightning_address: e.target.value }))
                    }
                    className="w-full border border-[#e8c9a8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f7931a]"
                    placeholder="maria@wallet.io"
                  />
                </div>
                {addError && (
                  <p className="text-red-600 text-sm">{addError}</p>
                )}
              </div>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => {
                    setShowAdd(false);
                    setAddError(null);
                  }}
                  className="flex-1 px-4 py-2 border border-[#e8c9a8] rounded-lg text-sm text-[#7a4528] hover:bg-[#f5e8d8] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddWorker}
                  disabled={adding}
                  className="flex-1 px-4 py-2 bg-[#f7931a] text-white rounded-lg text-sm font-medium hover:bg-[#d4780e] transition-colors disabled:opacity-50"
                >
                  {adding ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Workers table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {workers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <UserCircleIcon className="w-12 h-12 text-[#c07a52]" />
              <p className="text-sm text-[#9c5a35]">No hay trabajadores registrados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#fff8e7] border-b border-[#f5e8d8]">
                    <th className="text-left px-6 py-3 text-[#7a4528] font-medium">Nombre</th>
                    <th className="text-left px-6 py-3 text-[#7a4528] font-medium">Telefono</th>
                    <th className="text-left px-6 py-3 text-[#7a4528] font-medium">Rol</th>
                    <th className="text-left px-6 py-3 text-[#7a4528] font-medium">
                      Tasa (sats/turno)
                    </th>
                    <th className="text-left px-6 py-3 text-[#7a4528] font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map((w, i) => (
                    <tr
                      key={w.id}
                      className={`border-b border-[#f5e8d8] last:border-0 ${
                        i % 2 === 0 ? 'bg-white' : 'bg-[#fff8e7]/50'
                      }`}
                    >
                      {editingId === w.id ? (
                        <>
                          <td className="px-6 py-3">
                            <input
                              type="text"
                              value={editState.name}
                              onChange={(e) =>
                                setEditState((p) => ({ ...p, name: e.target.value }))
                              }
                              className="w-full border border-[#e8c9a8] rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#f7931a]"
                            />
                          </td>
                          <td className="px-6 py-3">
                            <input
                              type="tel"
                              value={editState.phone}
                              onChange={(e) =>
                                setEditState((p) => ({ ...p, phone: e.target.value }))
                              }
                              className="w-full border border-[#e8c9a8] rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#f7931a]"
                              placeholder="Opcional"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={w.role} />
                          </td>
                          <td className="px-6 py-3">
                            <input
                              type="number"
                              value={editState.pay_rate_sats}
                              onChange={(e) =>
                                setEditState((p) => ({ ...p, pay_rate_sats: e.target.value }))
                              }
                              className="w-28 border border-[#e8c9a8] rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#f7931a]"
                              min={0}
                            />
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => saveEdit(w)}
                                disabled={saving}
                                className="p-1.5 bg-[#f7931a] text-white rounded-lg hover:bg-[#d4780e] transition-colors disabled:opacity-50"
                              >
                                <CheckIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-1.5 text-[#7a4528] hover:bg-[#f5e8d8] rounded-lg transition-colors"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-2">
                              {w.photo_url ? (
                                <img
                                  src={w.photo_url}
                                  alt={w.name}
                                  className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                                />
                              ) : (
                                <UserCircleIcon className="w-7 h-7 text-[#c07a52] flex-shrink-0" />
                              )}
                              <span className="font-medium text-[#2c1810]">{w.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-[#7a4528]">{w.phone ?? '—'}</td>
                          <td className="px-6 py-3.5">
                            <Badge variant={w.role} />
                          </td>
                          <td className="px-6 py-3.5 text-[#2c1810]">
                            {w.pay_rate_sats ? w.pay_rate_sats.toLocaleString() : '—'}
                          </td>
                          <td className="px-6 py-3.5">
                            <button
                              onClick={() => startEdit(w)}
                              className="p-1.5 text-[#9c5a35] hover:bg-[#f5e8d8] rounded-lg transition-colors"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </>
                      )}
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
