// API helper for Chainbytes Coffee Supply Chain backend

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

// ------------------------------------------------------------------ types

export interface Farm {
  id: string;
  name: string;
  location: string;
  altitude_m: number;
  owner_name: string;
  created_at: string;
  worker_count?: number;
}

export interface Worker {
  id: string;
  farm_id: string;
  name: string;
  phone: string | null;
  photo_url: string | null;
  role: 'worker' | 'foreman';
  liquid_address: string;
  lightning_address: string | null;
  created_at: string;
}

export interface Shift {
  id: string;
  farm_id: string;
  foreman_id: string;
  date: string;
  status: 'open' | 'closed';
  qr_data: string;
  liquid_tx: string | null;
  closed_at: string | null;
  created_at: string;
}

export interface ShiftDetail extends Shift {
  checkins: Checkin[];
  qr_image?: string;
  qr_payload?: {
    shiftId: string;
    farmId: string;
    foremanId: string;
    date: string;
    checkinUrl: string;
    expiresAt: string;
  };
}

export interface Checkin {
  id: string;
  shift_id: string;
  worker_id: string;
  checked_in_at: string;
  signature: string | null;
  name?: string;
  liquid_address?: string;
}

export interface Lot {
  id: string;
  shift_id: string;
  farm_id: string;
  weight_kg: number;
  grade: 'A' | 'B' | 'C';
  gps_lat: number | null;
  gps_lng: number | null;
  asset_id: string;
  notes: string | null;
  created_at: string;
}

export interface LotDetail {
  lot: Lot;
  transfers: Transfer[];
}

export interface Transfer {
  id: string;
  lot_id: string;
  from_entity: string;
  to_entity: string;
  entity_type: 'farm' | 'wet_mill' | 'dry_mill' | 'exporter' | 'roaster';
  metadata: Record<string, unknown> | null;
  timestamp: string;
}

export interface Payment {
  id: string;
  worker_id: string;
  shift_id: string;
  amount_sats: number;
  lightning_invoice: string;
  payment_hash: string;
  status: 'pending' | 'paid' | 'failed';
  paid_at: string | null;
  created_at: string;
  shift_date?: string;
}

export interface PaymentHistoryResponse {
  worker: { id: string; name: string };
  payments: Payment[];
  total_paid_sats: number;
}

export interface PayrollResult {
  shift_id: string;
  shift_date: string;
  total_workers: number;
  paid_count: number;
  failed_count: number;
  total_sats_paid: number;
  payments: Array<{
    worker_id: string;
    worker_name: string;
    payment_id?: string;
    amount_sats?: number;
    invoice?: string;
    status: 'paid' | 'failed';
    error?: string;
  }>;
  lightning_demo_mode: boolean;
}

export interface ProvenanceData {
  lot: Lot;
  farm: Farm;
  shift: Shift;
  workers: Array<{ name: string; photo_url: string | null; checked_in_at: string }>;
  transfers: Transfer[];
  payment_summary: { worker_count: number; total_sats: number };
}

export interface CreateShiftResponse extends ShiftDetail {
  qr_image: string;
  qr_payload: {
    shiftId: string;
    farmId: string;
    foremanId: string;
    date: string;
    checkinUrl: string;
    expiresAt: string;
  };
}

export interface CreateLotResponse {
  lot: Lot;
  asset: { asset_id: string };
  provenance_url: string;
  qr_image: string;
}

// ------------------------------------------------------------------ helpers

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`No se pudo conectar al servidor. (${msg})`);
  }

  const text = await response.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Respuesta inválida del servidor (${response.status})`);
  }

  if (!response.ok) {
    const errData = data as { error?: string };
    throw new Error(errData?.error ?? `Error ${response.status}`);
  }

  return data as T;
}

function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

function get<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' });
}

// ------------------------------------------------------------------ farm

export const api = {
  // Health
  health: () => get<{ status: string; timestamp: string }>('/health'),

  // Farms
  getFarms: () => get<Farm[]>('/farm'),
  getFarm: (id: string) => get<Farm>(`/farm/${id}`),
  createFarm: (body: { name: string; location: string; altitude_m: number; owner_name: string }) =>
    post<Farm>('/farm', body),

  // Workers
  getWorkers: (farmId?: string) =>
    get<Worker[]>(farmId ? `/worker?farm_id=${farmId}` : '/worker'),
  getWorker: (id: string) => get<Worker>(`/worker/${id}`),
  createWorker: (body: {
    farm_id: string;
    name: string;
    phone?: string;
    role?: 'worker' | 'foreman';
    lightning_address?: string;
  }) => post<Worker>('/worker', body),
  getWorkerPayments: (id: string) => get<PaymentHistoryResponse>(`/worker/${id}/payments`),

  // Shifts
  getShift: (id: string) => get<ShiftDetail>(`/shift/${id}`),
  createShift: (body: { farm_id: string; foreman_id: string; date?: string }) =>
    post<CreateShiftResponse>('/shift', body),
  checkIn: (shiftId: string, body: { worker_id: string; signature?: string }) =>
    post<{ checkin: Checkin; worker: { id: string; name: string } }>(
      `/shift/${shiftId}/checkin`,
      body
    ),
  closeShift: (shiftId: string) =>
    post<{
      shift: Shift;
      checkin_count: number;
      liquid_record: { asset_id: string };
      workers: Array<{ id: string; name: string }>;
    }>(`/shift/${shiftId}/close`, {}),

  // Lots
  getLot: (id: string) => get<LotDetail>(`/lot/${id}`),
  createLot: (body: {
    shift_id: string;
    weight_kg: number;
    grade: 'A' | 'B' | 'C';
    gps_lat?: number;
    gps_lng?: number;
    notes?: string;
  }) => post<CreateLotResponse>('/lot', body),
  transferLot: (
    lotId: string,
    body: {
      to_entity: string;
      entity_type: 'wet_mill' | 'dry_mill' | 'exporter' | 'roaster';
      metadata?: Record<string, unknown>;
    }
  ) => post<{ transfer: Transfer; liquid_tx: { tx_id: string } }>(`/lot/${lotId}/transfer`, body),

  // Payroll
  runPayroll: (body: { shift_id: string; amount_sats?: number; worker_ids?: string[] }) =>
    post<PayrollResult>('/payroll', body),

  // Provenance
  getProvenance: (lotId: string) => get<ProvenanceData>(`/provenance/${lotId}/data`),
};

export default api;
