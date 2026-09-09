import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Compass, 
  Plus, 
  Calendar, 
  Users, 
  MapPin, 
  Radio, 
  BarChart3, 
  ArrowLeft,
  Sparkles,
  Layers
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export const WorkshopsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeWorkspaceId } = useAuth();
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [format, setFormat] = useState('in_person');
  const [locationName, setLocationName] = useState('قاعة المؤتمرات الرئيسية');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [maxParticipants, setMaxParticipants] = useState(50);

  const loadWorkshops = async () => {
    try {
      setLoading(true);
      const url = activeWorkspaceId ? `/workshops?workspaceId=${activeWorkspaceId}` : '/workshops';
      const data = await apiRequest(url);
      setWorkshops(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkshops();
  }, [activeWorkspaceId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspaceId) {
      alert('يرجى تحديد مساحة عمل أولاً');
      return;
    }

    try {
      const created = await apiRequest('/workshops', {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: activeWorkspaceId,
          title,
          code,
          description,
          format,
          locationName,
          startDate,
          endDate,
          maxParticipants: Number(maxParticipants),
          participantApprovalPolicy: 'automatic'
        })
      });

      setShowCreateModal(false);
      navigate(`/workshops/${created.id}`);
    } catch (err: any) {
      alert(err.message || 'فشل إنشاء الورشة');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>جارية الآن</span>;
      case 'published':
        return <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">منشورة</span>;
      case 'completed':
        return <span className="text-[11px] font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">مكتملة</span>;
      default:
        return <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">مسودة</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">ورش العمل</h1>
          <p className="text-sm text-slate-500 mt-1">تخطيط، تشغيل، وتقييم الورش التفاعلية</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-brand-700 transition shadow-sm shadow-brand-100"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء ورشة جديدة</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 font-medium">جارٍ تحميل ورش العمل...</div>
      ) : workshops.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
          <Compass className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">لا توجد ورش عمل مسجلة</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">ابدأ بإضافة ورشة عمل جديدة وتحديد أهدافها وأجندتها وأنشطتها.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand-700"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء أول ورشة</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {workshops.map((ws) => (
            <div
              key={ws.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-brand-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-mono font-bold text-slate-400">{ws.code}</span>
                  {getStatusBadge(ws.status)}
                </div>

                <Link to={`/workshops/${ws.id}`} className="block group">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition">
                    {ws.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {ws.description || 'لا يوجد وصف مضاف للورشة'}
                  </p>
                </Link>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{ws.start_date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>الحد الأقصى: {ws.max_participants} مشارك</span>
                  </div>
                  {ws.location_name && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ws.location_name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <Link
                  to={`/live/${ws.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-bold transition"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>التشغيل المباشر</span>
                </Link>

                <Link
                  to={`/workshops/${ws.id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-800"
                >
                  <span>التفاصيل</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-black text-slate-900 mb-4">إنشاء ورشة عمل جديدة</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عنوان الورشة</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: ورشة التحول الرقمي وأثره على المستفيد"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رمز الورشة</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="DT-2026-01"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نوع التنفيذ</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    <option value="in_person">حضوري</option>
                    <option value="remote">عن بُعد</option>
                    <option value="hybrid">هجين</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المكان أو القاعة</label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="مثال: فندق الفورسيزونز - القاعة الملكية"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ البدء</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الانتهاء</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الوصف</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="موجز عن محاور وأهداف الورشة..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition shadow-sm"
                >
                  حفظ وإنشاء الورشة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
