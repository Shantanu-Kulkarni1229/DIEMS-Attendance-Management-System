export default function StatCard({ title, value, growth, icon }) {
  const getIcon = (iconType) => {
    const icons = {
      students: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10h.01M13 16H3v-2a6 6 0 0112 0v2zm4-12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      teachers: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      attendance: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      rate: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    };
    return icons[iconType];
  };

  return (
    <div className="bg-white/60 backdrop-blur rounded-2xl p-6 shadow-lg border border-sky-100 hover:shadow-xl hover:border-sky-200 transition-all duration-200 relative overflow-hidden">
      {/* Floating accent shape */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-sky-100 to-blue-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity -mr-12 -mt-12"></div>

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm text-slate-600 font-medium mb-2">{title}</p>
          <h3 className="text-3xl font-bold text-slate-800 mb-3">{value}</h3>
          <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414-1.414L13.586 7H12z" clipRule="evenodd" />
            </svg>
            {growth}
          </p>
        </div>
        <div className="p-3 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 flex items-center justify-center">
          {getIcon(icon)}
        </div>
      </div>
    </div>
  );
}
