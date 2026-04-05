import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  BanknotesIcon,
  ArchiveBoxIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { useFarm } from '../context/FarmContext';
import { useState } from 'react';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: HomeIcon, end: true },
  { to: '/employees', label: 'Empleados', icon: UsersIcon, end: false },
  { to: '/payroll', label: 'Nómina', icon: BanknotesIcon, end: false },
  { to: '/lots', label: 'Lotes', icon: ArchiveBoxIcon, end: false },
];

export function Sidebar() {
  const { farms, activeFarm, setActiveFarmId } = useFarm();
  const [farmOpen, setFarmOpen] = useState(false);

  return (
    <aside className="w-64 min-h-screen bg-[#2c1810] flex flex-col flex-shrink-0">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-[#3d2318]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">&#9749;</span>
          <span className="text-white font-bold text-lg leading-tight">Chainbytes</span>
        </div>
        <p className="text-[#c07a52] text-xs">Coffee Supply Chain</p>
      </div>

      {/* Farm selector */}
      {farms.length > 1 && (
        <div className="px-4 py-3 border-b border-[#3d2318]">
          <button
            onClick={() => setFarmOpen((v) => !v)}
            className="w-full flex items-center justify-between text-left bg-[#3d2318] hover:bg-[#5c3420] rounded-lg px-3 py-2 transition-colors"
          >
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {activeFarm?.name ?? 'Select farm'}
              </p>
              <p className="text-[#c07a52] text-xs truncate">{activeFarm?.location ?? ''}</p>
            </div>
            <ChevronDownIcon
              className={`w-4 h-4 text-[#c07a52] flex-shrink-0 transition-transform ${farmOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {farmOpen && (
            <div className="mt-1 bg-[#3d2318] rounded-lg overflow-hidden">
              {farms.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setActiveFarmId(f.id);
                    setFarmOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-[#5c3420] transition-colors ${
                    f.id === activeFarm?.id ? 'text-[#f7931a]' : 'text-white'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Single farm display */}
      {farms.length === 1 && activeFarm && (
        <div className="px-4 py-3 border-b border-[#3d2318]">
          <div className="bg-[#3d2318] rounded-lg px-3 py-2">
            <p className="text-white text-sm font-medium truncate">{activeFarm.name}</p>
            <p className="text-[#c07a52] text-xs truncate">{activeFarm.location}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#f7931a] text-white'
                  : 'text-[#e8c9a8] hover:bg-[#3d2318] hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-[#3d2318]">
        <p className="text-[#7a4528] text-xs text-center">
          app.chainbytes.io
        </p>
      </div>
    </aside>
  );
}
