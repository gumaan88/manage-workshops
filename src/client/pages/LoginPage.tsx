import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, ShieldCheck, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser, switchDevUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      await refreshUser();
      navigate('/workshops');
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (userEmail: string) => {
    switchDevUser(userEmail);
    navigate('/workshops');
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        
        {/* Header Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-brand-600 to-brand-400 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-brand-200 mb-3">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">تسجيل الدخول</h1>
          <p className="text-sm text-slate-500 mt-1">مرحباً بك في منصة ورش التدريبية والتفاعلية</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="eng.gumaan@gmail.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-brand-700 focus:ring-4 focus:ring-brand-100 transition shadow-md shadow-brand-100 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? 'جارٍ الدخول...' : 'دخول إلى المنصة'}</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Access Bar */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-400 text-center mb-3">أو الدخول المباشر للحسابات التجريبية:</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('eng.gumaan@gmail.com')}
              className="px-3 py-2 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 rounded-xl text-xs font-bold text-slate-700 transition"
            >
              المدير
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('facilitator@example.test')}
              className="px-3 py-2 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 rounded-xl text-xs font-bold text-slate-700 transition"
            >
              الميسر
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('participant@example.test')}
              className="px-3 py-2 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 rounded-xl text-xs font-bold text-slate-700 transition"
            >
              المشارك
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
