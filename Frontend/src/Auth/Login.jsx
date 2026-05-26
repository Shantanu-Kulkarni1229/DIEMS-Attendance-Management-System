import { useState } from 'react';
import Illustration from './Illustration';
import { post } from '../services/apiClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null); // { type: 'error'|'success', text }
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage({ type: 'error', text: 'Please enter both email and password.' });
      return;
    }
    setMessage(null);
    setIsLoading(true);

    try {
      const body = await post('/api/auth/login', { email, password });

      if (!body || !body.token) {
        const raw = 'Login failed';
        const low = String(raw).toLowerCase();
        let friendly = 'Login failed. Please try again.';
        if (low.includes('invalid') || low.includes('credentials') || low.includes('unauthorized')) friendly = 'Invalid email or password.';
        else if (low.includes('network') || low.includes('fetch')) friendly = 'Network error — cannot reach server.';
        else if (low.includes('jwt') || low.includes('secret')) friendly = 'Server configuration error. Contact admin.';

        console.error('Login error (raw):', raw);
        setMessage({ type: 'error', text: friendly });
        return;
      }

      // success
      localStorage.setItem('token', body.token);
      if (body.user) localStorage.setItem('user', JSON.stringify(body.user));
      const role = body && body.user && body.user.role ? String(body.user.role).toLowerCase() : null;
      setMessage({ type: 'success', text: 'Login successful — redirecting...' });
      setTimeout(() => {
        if (role === 'superadmin') window.location.href = '/superadmin';
        else if (role === 'admin') window.location.href = '/admin';
        else if (role === 'teacher') window.location.href = '/teacher';
        else if (role === 'student') window.location.href = '/student';
        else window.location.href = '/';
      }, 700);
    } catch (err) {
      console.error(err);
      const txt = err && err.message ? String(err.message) : 'Login failed';
      if (txt.toLowerCase().includes('failed to fetch')) setMessage({ type: 'error', text: 'Network error — cannot reach server.' });
      else setMessage({ type: 'error', text: 'Login failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="grid grid-cols-12 gap-6 w-full max-w-6xl">
        {/* LEFT - Illustration */}
        <div className="col-span-7 flex items-center">
          <div className="w-full">
            <Illustration colorful />
          </div>
        </div>

        {/* RIGHT - Login Card */}
        <div className="col-span-5 flex justify-center">
          <div className="w-full max-w-md bg-white/60 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-sky-200/40 ring-1 ring-sky-100 relative z-20">
            {/* College Branding Header */}
            <div className="flex flex-col items-center mb-8 pb-6 border-b border-sky-100">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-sky-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                  <path d="M10 17l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" fill="white" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-slate-800">DIEMS</h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide">Attendance Management System</p>
            </div>

            <div className="flex flex-col items-center">
              <h3 className="text-xl font-semibold text-slate-800">Welcome Back!</h3>
              <p className="text-sm text-slate-500 mb-6">Login to access your dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {message && (
                <div className={message.type === 'success' ? 'text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md' : 'text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md'}>
                  {message.text}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-sky-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12H8m8 0a4 4 0 10-8 0 4 4 0 008 0z" />
                    </svg>
                  </span>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email address" className="w-full h-12 pl-11 pr-3 rounded-xl border border-sky-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-sky-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c-1.657 0-3 1.567-3 3.5S10.343 18 12 18s3-1.567 3-3.5S13.657 11 12 11z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 11V8a5 5 0 10-10 0v3" />
                    </svg>
                  </span>
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="w-full h-12 pl-11 pr-10 rounded-xl border border-sky-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200" />
                  <button type="button" aria-label="Toggle password visibility" onClick={() => setShowPassword(s => !s)} className="absolute inset-y-0 right-3 flex items-center text-slate-400">
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10a9.96 9.96 0 012.025-5.576" />
                        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M2 2l20 20" />
                        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17.94 17.94A10.97 10.97 0 0112 20c-5.523 0-10-4.477-10-10 0-2.486.897-4.76 2.38-6.5" />
                        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9.88 9.88a3 3 0 104.24 4.24" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" className="h-4 w-4 text-sky-500 rounded" /> Remember me
                </label>
                <a className="text-sm text-sky-600 hover:underline">Forgot Password?</a>
              </div>

              <button type="submit" disabled={isLoading} className={`w-full h-12 rounded-xl bg-gradient-to-r from-sky-500 to-sky-400 text-white font-semibold shadow-md flex items-center justify-center gap-3 ${isLoading ? 'opacity-80 cursor-wait' : ''}`}>
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    <span>Logging in...</span>
                  </>
                ) : (
                  'Login'
                )}
              </button>

              <div className="flex items-center gap-2 text-xs text-slate-500 mt-4 justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-sky-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3a1 1 0 002 0V7zm-1 7a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z" clipRule="evenodd" />
                </svg>
                <span>Professional ERP Access Portal</span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
