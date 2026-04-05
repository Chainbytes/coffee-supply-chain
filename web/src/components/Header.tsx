import { useFarm } from '../context/FarmContext';
import { MapPinIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  title: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function Header({ title, onRefresh, refreshing }: HeaderProps) {
  const { activeFarm } = useFarm();

  return (
    <header className="bg-white border-b border-[#e8c9a8] px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-[#2c1810]">{title}</h1>
        {activeFarm && (
          <div className="flex items-center gap-1 mt-0.5">
            <MapPinIcon className="w-3.5 h-3.5 text-[#9c5a35]" />
            <span className="text-sm text-[#7a4528]">
              {activeFarm.location}
              {activeFarm.altitude_m ? ` · ${activeFarm.altitude_m}m` : ''}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#7a4528] hover:text-[#2c1810] hover:bg-[#f5e8d8] rounded-lg transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        )}
        <div className="text-right">
          <p className="text-sm font-medium text-[#2c1810]">{activeFarm?.owner_name ?? ''}</p>
          <p className="text-xs text-[#9c5a35]">Propietario</p>
        </div>
      </div>
    </header>
  );
}
