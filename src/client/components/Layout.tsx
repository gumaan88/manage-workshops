import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Compass, 
  Layers, 
  Users, 
  BarChart3, 
  LogOut, 
  Menu, 
  X, 
  WifiOff, 
  CheckCircle2, 
  Award,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, switchDevUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navItems = [
    { label: 'مساحات العمل', path: '/workspaces', icon: Layers },
    { label: 'الورش التدريبية', path: '/workshops', icon: Compass },
    { label: 'التقارير والمؤشرات', path: '/reports', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-arabic">
      {/* Offline Alert Banner (AC-006) */}
      {!isOnline && (
        <div className="bg-amber-600 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2 shadow-inner">
          <WifiOff className="w-4 h-4" />
          <span>أنت تعمل في وضع عدم الاتصال. يتم حفظ إجاباتك كمسودات محلية في جهازك وستتم مزامنتها تلقائياً عند عودة الاتصال.</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Brand Logo & Title */}
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2 text-brand-600 font-extrabold text-xl tracking-tight">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-md">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-900 leading-tight font-black">منصة ورش</span>
                  <span className="text-[10px] text-brand-600 font-medium tracking-wider">WORKSHOPS PLATFORM</span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      active 
                        ? 'bg-brand-50 text-brand-700' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Profile & Dev Switcher */}
            <div className="hidden md:flex items-center gap-3">
              {/* Quick Role Switcher for seamless Pair Programming & Demo */}
              <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium text-slate-600">
                <span className="px-2 text-slate-400">التبديل التجريبي:</span>
                <button 
                  onClick={() => switchDevUser('eng.gumaan@gmail.com')}
                  className="px-2 py-1 rounded hover:bg-white transition-all text-brand-700 font-bold"
                  title="مدير النظام الرئيسي"
                >
                  المدير
                </button>
                <button 
                  onClick={() => switchDevUser('facilitator@example.test')}
                  className="px-2 py-1 rounded hover:bg-white transition-all hover:text-brand-700"
                  title="ميسر الورشة"
                >
                  الميسر
                </button>
                <button 
                  onClick={() => switchDevUser('participant@example.test')}
                  className="px-2 py-1 rounded hover:bg-white transition-all hover:text-brand-700"
                  title="المشارك"
                >
                  المشارك
                </button>
              </div>

              {user ? (
                <div className="flex items-center gap-2 pl-2 border-r border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center font-bold text-sm">
                    {user.name?.charAt(0) || 'م'}
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-bold text-slate-800">{user.name}</span>
                    <span className="text-[10px] text-slate-500">{user.email}</span>
                  </div>
                  <button 
                    onClick={() => logout()}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="تسجيل الخروج"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="text-xs font-bold bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 transition"
                >
                  تسجيل الدخول
                </Link>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <div className="flex md:hidden items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <Icon className="w-5 h-5 text-brand-600" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">الحساب: {user?.name || 'غير مسجل'}</span>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="text-xs text-rose-600 font-bold flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                خروج
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <p>منصة ورش © 2026 — منصة إدارة دورة حياة ورش العمل متعددة الجهات والمساحات</p>
      </footer>
    </div>
  );
};
