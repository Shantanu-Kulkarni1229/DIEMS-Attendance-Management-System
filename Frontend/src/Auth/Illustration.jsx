export default function Illustration({colorful}){
  return (
    <div className="relative pointer-events-none">
      <div className={`mx-auto w-[520px] h-[320px] rounded-2xl shadow-2xl border border-white/50 p-6 ${colorful ? 'bg-gradient-to-br from-sky-400 via-sky-200 to-white' : 'bg-gradient-to-br from-white to-sky-50'}`}>
        <div className="flex h-full">
          <aside className="w-28 bg-white/20 rounded-xl p-3">
            <div className="h-6 bg-sky-200 rounded mb-3"></div>
            <div className="space-y-3 mt-2">
              <div className="h-3 bg-white rounded shadow-sm"></div>
              <div className="h-3 bg-white rounded shadow-sm w-5/6"></div>
              <div className="h-3 bg-white rounded shadow-sm w-3/4"></div>
              <div className="h-3 bg-white rounded shadow-sm w-2/3"></div>
            </div>
          </aside>

          <main className="flex-1 ml-4">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-6 w-44 bg-white rounded shadow-sm"></div>
                <div className="h-3 w-28 bg-white/60 rounded"></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white rounded shadow"></div>
                <div className="h-10 w-10 bg-white rounded shadow"></div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="col-span-2 bg-white rounded-lg p-3 shadow">
                <div className="h-24 bg-sky-50 rounded"></div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-6 w-6 bg-sky-200 rounded-full"></div>
                  <div className="h-4 w-24 bg-slate-100 rounded"></div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 shadow flex flex-col items-center justify-center">
                <div className="h-14 w-14 bg-sky-100 rounded-full mb-2"></div>
                <div className="text-sm text-slate-600">2,450</div>
                <div className="text-xs text-slate-400">Total Students</div>
              </div>
            </div>

            <div className="mt-4 bg-white/30 rounded-lg p-3 shadow">
              <div className="h-28 bg-gradient-to-r from-white/40 to-sky-100 rounded"></div>
            </div>
          </main>
        </div>
      </div>

      {/* Decorative props */}
      <div className="absolute -left-12 -bottom-8 w-28 h-28 bg-white/80 rounded-lg shadow-md flex items-center justify-center">
        <div className="h-12 w-12 bg-sky-300 rounded"></div>
      </div>
      <div className="absolute -right-8 -bottom-10 w-24 h-24 bg-white/70 rounded-lg shadow-md flex items-center justify-center">
        <div className="h-12 w-12 bg-sky-200 rounded"></div>
      </div>
    </div>
  )
}
