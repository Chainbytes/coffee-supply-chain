import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: ReactNode;
  accent?: boolean;
}

export function StatCard({ label, value, sub, icon, accent }: StatCardProps) {
  return (
    <div
      className={`rounded-xl p-5 flex items-start gap-4 shadow-sm ${
        accent ? 'bg-[#f7931a] text-white' : 'bg-white'
      }`}
    >
      <div
        className={`rounded-lg p-2.5 flex-shrink-0 ${
          accent ? 'bg-white/20' : 'bg-[#f5e8d8]'
        }`}
      >
        <span className={accent ? 'text-white' : 'text-[#9c5a35]'}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className={`text-sm font-medium ${accent ? 'text-white/80' : 'text-[#7a4528]'}`}>
          {label}
        </p>
        <p className={`text-2xl font-bold mt-0.5 truncate ${accent ? 'text-white' : 'text-[#2c1810]'}`}>
          {value}
        </p>
        {sub && (
          <p className={`text-xs mt-0.5 ${accent ? 'text-white/70' : 'text-[#9c5a35]'}`}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}
