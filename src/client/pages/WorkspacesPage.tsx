import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Plus, Check, ArrowLeft, Building2, FolderKanban } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export const WorkspacesPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeWorkspaceId, setActiveWorkspaceId } = useAuth();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/workspaces');
      setWorkspaces(data || []);
      if (!activeWorkspaceId && data?.length > 0) {
        setActiveWorkspaceId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await apiRequest('/workspaces', {
        method: 'POST',
        body: JSON.stringify({ name, slug, description })
      });
      setShowModal(false);
      setName('');
      setSlug('');
      setDescription('');
      await loadWorkspaces();
      setActiveWorkspaceId(created.id);
    } catch (err: any) {
      alert(err.message || 'فشل إنشاء مساحة العمل');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">مساحات العمل</h1>
          <p className="text-sm text-slate-500 mt-1">إدارة بيئات وعزل المنظمات والورش التابعة لكل جهة</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-brand-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء مساحة جديدة</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 font-medium">جارٍ تحميل مساحات العمل...</div>
      ) : workspaces.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
          <Layers className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">لا توجد مساحات عمل بعد</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">قم بإنشاء أول مساحة عمل لتنظيم ورش العمل والبرامج والمنظمات التابعة لك.</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand-700"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء مساحة الآن</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {workspaces.map((ws) => {
            const isCurrent = activeWorkspaceId === ws.id;
            return (
              <div
                key={ws.id}
                className={`bg-white rounded-2xl border p-6 transition-all relative flex flex-col justify-between ${
                  isCurrent 
                    ? 'border-brand-500 ring-2 ring-brand-100 shadow-md' 
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold">
                      <FolderKanban className="w-5 h-5" />
                    </div>
                    {isCurrent && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-brand-100 text-brand-800 px-2.5 py-1 rounded-full">
                        <Check className="w-3.5 h-3.5" />
                        المساحة النشطة
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{ws.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ws.description || 'لا يوجد وصف للمساحة'}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">slug: {ws.slug}</span>
                  <div className="flex gap-2">
                    {!isCurrent && (
                      <button
                        onClick={() => setActiveWorkspaceId(ws.id)}
                        className="text-xs font-bold text-slate-600 hover:text-brand-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition"
                      >
                        تحديد كنشطة
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setActiveWorkspaceId(ws.id);
                        navigate('/workshops');
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-800"
                    >
                      <span>الورش</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <h2 className="text-lg font-black text-slate-900 mb-4">إنشاء مساحة عمل جديدة</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المساحة</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                  }}
                  placeholder="مثال: أكاديمية التحول الرقمي"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المعرف الفريد (Slug)</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="digital-transformation"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الوصف (اختياري)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="وصف مختصر لمجال هذه المساحة..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition shadow-sm"
                >
                  إنشاء المساحة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
