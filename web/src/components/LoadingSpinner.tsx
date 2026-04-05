export function LoadingSpinner({ message = 'Cargando...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-8 h-8 border-4 border-[#e8c9a8] border-t-[#f7931a] rounded-full animate-spin" />
      <p className="text-sm text-[#9c5a35]">{message}</p>
    </div>
  );
}
