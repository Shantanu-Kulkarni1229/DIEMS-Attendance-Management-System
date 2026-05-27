export default function AnalyticsCard({ title, type, data }) {
  if (type === 'line') {
    return (
      <div className="bg-white/60 backdrop-blur rounded-2xl p-6 shadow-lg border border-sky-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <button className="text-xs text-sky-600 font-medium px-3 py-1 rounded-full bg-sky-50 hover:bg-sky-100">This Week</button>
        </div>

        {/* Line Chart */}
        <div className="relative h-64 flex items-end justify-between gap-2">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            <div className="border-t border-sky-100"></div>
            <div className="border-t border-sky-100"></div>
            <div className="border-t border-sky-100"></div>
            <div className="border-t border-sky-100"></div>
          </div>

          {/* Data points with connecting line */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {(() => {
              const denom = Math.max(1, data.length - 1);
              const points = data.map((d, i) => {
                const x = (i / denom) * 100;
                const y = 100 - (Number(d.value) || 0);
                return `${x} ${y}`;
              }).join(' ');
              return (
                <>
                  <polyline points={points} fill="none" stroke="#0ea5e9" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                  {data.map((d, i) => {
                    const x = (i / denom) * 100;
                    const y = 100 - (Number(d.value) || 0);
                    return <circle key={i} cx={x} cy={y} r="2.5" fill="#0ea5e9" vectorEffect="non-scaling-stroke" />;
                  })}
                </>
              );
            })()}
          </svg>

          {/* Bar representations */}
          {data.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end relative z-10">
              <div className="w-full max-w-3 rounded-full" style={{ height: `${d.value}%`, background: 'rgba(14, 165, 233, 0.1)' }}></div>
              <span className="text-xs text-slate-600 mt-2 font-medium">{d.day}</span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-slate-600">
          <div className="h-1 w-8 rounded-full bg-sky-400"></div>
          <span>Attendance % - Weekly trend</span>
        </div>
      </div>
    );
  }

  if (type === 'donut') {
    return (
      <div className="bg-white/60 backdrop-blur rounded-2xl p-6 shadow-lg border border-sky-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">{title}</h3>

        <div className="flex flex-col items-center">
          {/* Donut Chart */}
          <div className="relative w-40 h-40 mb-6">
            <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
              {/* Blue segment (75.6%) */}
              <circle cx="60" cy="60" r="45" fill="none" stroke="#0ea5e9" strokeWidth="12" strokeDasharray={`${212.3} 280.6`} />
              {/* Yellow segment (18.4%) */}
              <circle cx="60" cy="60" r="45" fill="none" stroke="#f59e0b" strokeWidth="12" strokeDasharray={`${51.6} 280.6`} style={{ strokeDashoffset: '-212.3' }} />
              {/* Red segment (6.0%) */}
              <circle cx="60" cy="60" r="45" fill="none" stroke="#ef4444" strokeWidth="12" strokeDasharray={`${16.8} 280.6`} style={{ strokeDashoffset: '-263.9' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-sm font-bold text-slate-800">1,856</p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2 w-full">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-sky-400"></div>
              <span className="text-xs text-slate-700">Present - 1,402 (75.6%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-amber-400"></div>
              <span className="text-xs text-slate-700">Absent - 342 (18.4%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-400"></div>
              <span className="text-xs text-slate-700">Late - 112 (6.0%)</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
