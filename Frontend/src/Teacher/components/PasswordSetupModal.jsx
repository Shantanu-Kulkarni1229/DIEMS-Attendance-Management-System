import React, { useState } from 'react';
import { patch } from '../../services/apiClient';
import { logout } from '../../services/session';
import { ButtonSpinner } from './Skeletons';

export default function PasswordSetupModal({ onClose, theme = 'light' }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Simple validation checks
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  
  const isValid = hasMinLength && hasUpper && hasNumber && hasSpecial && (newPassword === confirmPassword) && newPassword.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      await patch('/api/auth/change-password', {
        currentPassword,
        newPassword
      });
      onClose();
    } catch (error) {
      setErrorMessage(error.message || 'Failed to change password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className={`${theme === 'dark' ? 'bg-slate-900/95 border-slate-700 text-slate-100' : 'bg-white/90 border-white text-slate-800'} backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-8 relative animate-in fade-in zoom-in duration-300`}>
        
        {/* Decorative elements */}
        <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-blue-400 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-[-50px] left-[-50px] w-32 h-32 bg-purple-400 rounded-full blur-3xl opacity-20 pointer-events-none"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-blue-100">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Set Your New Password</h2>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            For security purposes, please create a new password before continuing to your dashboard.
          </p>
        </div>

        <form className="space-y-4 relative z-10" onSubmit={handleSubmit}>
          {errorMessage && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {errorMessage}
            </div>
          )}
          
          {/* Current Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Current Temporary Password</label>
            <div className="relative">
              <input 
                type={showCurrent ? "text" : "password"} 
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all pr-10"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showCurrent ? 
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0a10.05 10.05 0 015.188-1.52m4.242 1.52a10.05 10.05 0 012.392 1.52M19.121 19.121a10.05 10.05 0 002.392-1.52A10.05 10.05 0 0012 5" /></svg>
                  :
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                }
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">New Password</label>
            <div className="relative">
              <input 
                type={showNew ? "text" : "password"} 
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all pr-10"
                placeholder="Create new password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {/* Same eye icon logic */}
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </button>
            </div>
            
            {/* Password Rules */}
            <div className="mt-3 grid grid-cols-2 gap-y-1.5 text-xs">
              <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600' : 'text-slate-400'}`}>
                <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${hasMinLength ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                  {hasMinLength && <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
                8+ Characters
              </div>
              <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-600' : 'text-slate-400'}`}>
                <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${hasUpper ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                  {hasUpper && <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
                1 Uppercase
              </div>
              <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600' : 'text-slate-400'}`}>
                <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${hasNumber ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                  {hasNumber && <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
                1 Number
              </div>
              <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-600' : 'text-slate-400'}`}>
                <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${hasSpecial ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                  {hasSpecial && <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
                1 Special Char
              </div>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 mt-2">Confirm New Password</label>
            <div className="relative">
              <input 
                type={showConfirm ? "text" : "password"} 
                className={`w-full px-4 py-2.5 bg-white border ${confirmPassword.length > 0 && newPassword !== confirmPassword ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'} rounded-xl outline-none text-sm transition-all pr-10`}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </button>
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <button 
              type="submit"
              disabled={!isValid || isSubmitting}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                isValid && !isSubmitting
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? <div className="flex items-center justify-center"><ButtonSpinner size={4} /></div> : 'Continue to Dashboard'}
            </button>
            <button 
              type="button"
              onClick={logout}
              className="w-full py-3 rounded-xl font-semibold text-sm text-slate-500 hover:bg-slate-50 transition-colors"
            >
              Cancel & Logout
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
