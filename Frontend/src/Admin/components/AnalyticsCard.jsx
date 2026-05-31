export default function AnalyticsCard({ title, type, data }) {
  const lineData = Array.isArray(data) ? data : [];
  const donutData = !Array.isArray(data) && data ? data : { total: 0, segments: [] };

  if (type === 'line') {
    return (
      <div className="bg-white/60 backdrop-blur rounded-2xl p-6 shadow-lg border border-sky-100 h-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <button className="text-xs text-sky-600 font-medium px-3 py-1 rounded-full bg-sky-50 hover:bg-sky-100">This Week</button>
        </div>

        {lineData.length === 0 ? (
          <div className="h-64 rounded-xl border border-dashed border-sky-100 flex items-center justify-center text-sm text-slate-500">
            No trend data available yet.
          </div>
        ) : (
          <>
            <div className="relative h-64 flex items-end justify-between gap-2">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                <div className="border-t border-sky-100"></div>
                <div className="border-t border-sky-100"></div>
                <div className="border-t border-sky-100"></div>
                <div className="border-t border-sky-100"></div>
              </div>

              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {(() => {
                  const denom = Math.max(1, lineData.length - 1);
                  const points = lineData
                    .map((item, index) => {
                      const x = (index / denom) * 100;
                      const y = 100 - (Number(item.value) || 0);
                      return `${x} ${y}`;
                    })
                    .join(' ');
                  return (
                    <>
                      <polyline points={points} fill="none" stroke="#0ea5e9" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                      {lineData.map((item, index) => {
                        const x = (index / denom) * 100;
                        const y = 100 - (Number(item.value) || 0);
                        return <circle key={index} cx={x} cy={y} r="2.5" fill="#0ea5e9" vectorEffect="non-scaling-stroke" />;
                      })}
                    </>
                  );
                })()}
              </svg>

              {lineData.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center justify-end relative z-10">
                  <div className="w-full max-w-3 rounded-full" style={{ height: `${item.value}%`, background: 'rgba(14, 165, 233, 0.1)' }}></div>
                  <span className="text-xs text-slate-600 mt-2 font-medium">{item.day}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 mt-6 text-xs text-slate-600">
              <div className="h-1 w-8 rounded-full bg-sky-400"></div>
              <span>Attendance % - Weekly trend</span>
            </div>
          </>
        )}
      </div>
    );
  }

  if (type === 'donut') {
    return (
      <div className="bg-white/60 backdrop-blur rounded-2xl p-6 shadow-lg border border-sky-100 h-full">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">{title}</h3>

        <div className="flex flex-col items-center">
          <div className="relative w-40 h-40 mb-6">
            <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
              {(() => {
                const radius = 45;
                const circumference = 2 * Math.PI * radius;
                let offset = 0;
                const total = Math.max(1, donutData.total || 0);

                return donutData.segments.map((segment) => {
                  const dash = (segment.value / total) * circumference;
                  const circle = (
                    <circle
                      key={segment.label}
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="none"
                      stroke={segment.color}
                      strokeWidth="12"
                      strokeDasharray={`${dash} ${circumference - dash}`}
                      strokeDashoffset={-offset}
                    />
                  );
                  offset += dash;
                  return circle;
                });
              })()}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-sm font-bold text-slate-800">{donutData.total || 0}</p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
          </div>

          <div className="space-y-2 w-full">
            {donutData.segments.length > 0 ? (
              donutData.segments.map((segment) => {
                const percent = donutData.total ? Math.round((segment.value / donutData.total) * 100) : 0;
                return (
                  <div key={segment.label} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: segment.color }}></div>
                    <span className="text-xs text-slate-700">{segment.label} - {segment.value} ({percent}%)</span>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-slate-500">No attendance data available yet.</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
