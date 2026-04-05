// Base URL from env or default to production backend
export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://134.122.8.237:3002';

// Default farm ID from env (can be overridden at runtime via localStorage)
export const DEFAULT_FARM_ID = import.meta.env.VITE_FARM_ID ?? '';

// ------------------------------------------------------------------ Types

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
  pay_rate_sats: number;
  overtime_multiplier: number;
  created_at: string;
}

export interface Shift {
  id: string;
  farm_id: string;
  foreman_id: string;
  date: string;
  status: 'open' | 'closed';
  liquid_tx: string | null;
  closed_at: string | null;
  created_at: string;
  worker_count?: number;
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

export interface Transfer {
  id: string;
  lot_id: string;
  from_entity: string;
  to_entity: string;
  entity_type: string;
  metadata: Record<string, unknown> | null;
  timestamp: string;
}

export interface Checkin {
  id: string;
  worker_id: string;
  worker_name: string;
  checked_in_at: string;
  shift_id: string;
}

export interface Analytics {
  farm_id: string;
  farm_name: string;
  worker_count: number;
  shift_count: number;
  lot_count: number;
  total_checkins: number;
  total_payments_sats: number;
  recent_shifts: Shift[];
  recent_checkins: Checkin[];
}

export interface Payment {
  id: string;
  worker_id: string;
  shift_id: string;
  amount_sats: number;
  status: 'paid' | 'pending' | 'failed';
  lightning_payment_hash: string | null;
  created_at: string;
  shift_date?: string;
}

export interface PayrollResult {
  shift_id: string;
  payments: Array<{
    worker_id: string;
    worker_name: string;
    amount_sats: number;
    status: string;
    payment_hash?: string;
  }>;
  total_sats: number;
}

export interface BtcPrice {
  usd: number;
  timestamp: string;
}

export interface ProvenanceData {
  lot: Lot;
  farm: Farm;
  shift: Shift;
  workers: Array<{ name: string; photo_url: string | null; checked_in_at: string }>;
  transfers: Transfer[];
  payment_summary: { worker_count: number; total_sats: number } | null;
}

// ------------------------------------------------------------------ Helpers

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as { error?: string }).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

// ------------------------------------------------------------------ Farm

export const getFarms = () => request<Farm[]>('/farm');

export const getFarm = (id: string) => request<Farm>(`/farm/${id}`);

export const getAnalytics = (farmId: string) =>
  request<Analytics>(`/farm/${farmId}/analytics`);

export const exportCsv = (farmId: string): string =>
  `${API_BASE}/farm/${farmId}/export?format=csv`;

// ------------------------------------------------------------------ Worker

export const getWorkers = (farmId: string) =>
  request<Worker[]>(`/worker?farm_id=${farmId}`);

export const createWorker = (data: {
  farm_id: string;
  name: string;
  phone?: string;
  photo_url?: string;
  role?: string;
  lightning_address?: string;
}) => request<Worker>('/worker', { method: 'POST', body: JSON.stringify(data) });

export const updateWorker = (
  id: string,
  data: Partial<Pick<Worker, 'name' | 'phone' | 'photo_url' | 'role' | 'lightning_address'>>
) => request<Worker>(`/worker/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const updatePayRate = (
  id: string,
  data: { pay_rate_sats: number; overtime_multiplier?: number }
) =>
  request<Worker>(`/worker/${id}/pay-rate`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

// ------------------------------------------------------------------ Shift

export const getShift = (id: string) =>
  request<Shift & { checkins: Checkin[] }>(`/shift/${id}`);

// ------------------------------------------------------------------ Lot

export const getLots = (farmId: string) =>
  request<Lot[]>(`/lot?farm_id=${farmId}`);

export const getLot = (id: string) =>
  request<{ lot: Lot; transfers: Transfer[] }>(`/lot/${id}`);

export const getProvenance = (lotId: string) =>
  request<ProvenanceData>(`/provenance/${lotId}/data`);

// ------------------------------------------------------------------ Payroll

export const payShift = (shiftId: string) =>
  request<PayrollResult>('/payroll', {
    method: 'POST',
    body: JSON.stringify({ shift_id: shiftId }),
  });

// ------------------------------------------------------------------ Price

export const getBtcPrice = () => request<BtcPrice>('/btc-price');

// ------------------------------------------------------------------ Utils

export function satsToUsd(sats: number, btcUsd: number): string {
  const usd = (sats / 100_000_000) * btcUsd;
  return usd.toFixed(2);
}

export function formatSats(sats: number): string {
  return sats.toLocaleString() + ' sats';
}
