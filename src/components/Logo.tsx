export function Logo({ size = 'lg' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-3xl',
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`${sizeClasses[size]} bg-primary-500 rounded-2xl flex items-center justify-center shadow-glow`}>
        <span className="text-surface-900 font-bold">U</span>
      </div>
      <div>
        <h1 className={`font-bold text-white ${size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-xl' : 'text-lg'}`}>
          UrGigs
        </h1>
        {size === 'lg' && (
          <p className="text-sm text-surface-400 font-medium -mt-0.5">Find work. Find workers.</p>
        )}
      </div>
    </div>
  );
}
