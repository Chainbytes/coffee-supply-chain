export type Role = 'worker' | 'foreman' | 'farm_owner' | 'mill_operator' | 'exporter' | 'roaster';

export interface AppUser {
  id: string;
  name: string;
  role: Role;
  farmId: string;
}

// Worker stack
export type WorkerStackParamList = {
  WorkerHome: undefined;
  QRScanner: undefined;
  ShiftHistory: undefined;
  PaymentHistory: undefined;
};

// Foreman stack
export type ForemanStackParamList = {
  ForemanHome: undefined;
  CreateShift: undefined;
  WorkerList: { shiftId: string };
  CloseShift: { shiftId: string };
};

// Farm owner stack
export type FarmStackParamList = {
  FarmHome: undefined;
  LotList: undefined;
  LotDetail: { lotId: string };
  Payroll: { shiftId: string };
};

// Supply chain stack
export type SupplyStackParamList = {
  CustodyTransfer: undefined;
  LotProvenance: { lotId: string };
};
