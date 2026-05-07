import LoginForm from './components/LoginForm';
import LogoImage from '../../../assets/Logo.png';

const stats = [
  { value: '12K+', label: 'Active students' },
  { value: '340+', label: 'Faculty members' },
  { value: '99.9%', label: 'Uptime' },
];

const features = [
  {
    title: 'Real-time tracking',
    desc: 'Attendance updates instantly across all devices.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: 'Smart dashboards',
    desc: 'Personalized views for admins, teachers, and students.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    title: 'Automated alerts',
    desc: 'Notify students and parents when thresholds are breached.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
];

const LoginPage = ({ onSubmit, loading, error }) => {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-sky-100 opacity-50 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-cyan-100 opacity-40 blur-3xl" />
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

        {/* ── Left: Branding panel ── */}
        <div className="hidden lg:flex flex-col justify-between h-full py-4">

          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-sky-100 flex items-center justify-center overflow-hidden">
              <img src={LogoImage} alt="DIEMS" className="w-9 h-9 object-contain" />
            </div>
            <div>
              <p className="text-lg font-extrabold text-slate-900 tracking-tight leading-none">DIEMS</p>
              <p className="text-[11px] font-semibold text-sky-500 tracking-[0.15em] uppercase mt-0.5">Attendance Portal</p>
            </div>
          </div>

          {/* Hero text */}
          <div className="flex-1">
            <h1 className="text-5xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-5">
              Attendance<br />
              <span className="text-sky-600">made simple.</span>
            </h1>
            <p className="text-base text-slate-500 font-medium leading-relaxed max-w-sm">
              One unified portal for Super Admins, Admins, Teachers, and Students. Secure, fast, and always up to date.
            </p>

            {/* Stats row */}
            <div className="flex items-center gap-6 mt-10">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-200 my-8 w-full" />

            {/* Features */}
            <div className="space-y-5">
              {features.map((f) => (
                <div key={f.title} className="flex items-start gap-3.5">
                  <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mt-0.5">
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{f.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom badge */}
          <div className="mt-12 flex items-center gap-2 text-xs text-slate-400 font-semibold">
            <svg className="w-3.5 h-3.5 text-sky-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Enterprise-grade security · All data encrypted at rest
          </div>
        </div>

        {/* ── Right: Form card ── */}
        <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-sky-100 flex items-center justify-center overflow-hidden">
              <img src={LogoImage} alt="DIEMS" className="w-7 h-7 object-contain" />
            </div>
            <div>
              <p className="text-base font-extrabold text-slate-900 tracking-tight">DIEMS</p>
              <p className="text-[10px] font-semibold text-sky-500 tracking-widest uppercase">Attendance Portal</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/60 p-8">
            <LoginForm onSubmit={onSubmit} loading={loading} error={error} />
          </div>

          <p className="text-center text-xs text-slate-400 font-medium mt-5">
            © {new Date().getFullYear()} DIEMS · All rights reserved
          </p>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;