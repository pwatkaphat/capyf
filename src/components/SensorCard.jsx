export default function SensorCard({ title, value, unit, icon: Icon, colorClass, action }) {
  return (
    <div className="glass-card p-6 relative overflow-hidden group flex flex-col justify-between">
      {/* Decorative gradient blur in background */}
      <div className={`absolute -right-6 -top-6 w-32 h-32 opacity-20 blur-2xl rounded-full ${colorClass.bg} transition-all duration-500 group-hover:opacity-40 group-hover:scale-150`}></div>
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${colorClass.bg} ${colorClass.text} shadow-sm transition-transform duration-300 group-hover:scale-110`}>
              <Icon size={28} strokeWidth={2} />
            </div>
            <h2 className="text-lg font-semibold text-slate-600">{title}</h2>
          </div>
          {action && (
            <div className="relative z-20">
              {action}
            </div>
          )}
        </div>
        
        <div className="flex items-baseline gap-2 mt-auto">
          <span className="text-5xl font-extrabold tracking-tight text-slate-800">
            {value !== null && value !== undefined ? value : '--'}
          </span>
          <span className="text-xl font-bold text-slate-400">{unit}</span>
        </div>
      </div>
    </div>
  );
}
