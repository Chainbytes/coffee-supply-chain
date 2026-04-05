import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <ExclamationTriangleIcon className="w-10 h-10 text-red-400" />
      <p className="text-sm text-[#7a4528] max-w-sm text-center">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-4 py-2 text-sm bg-[#2c1810] text-white rounded-lg hover:bg-[#3d2318] transition-colors"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
