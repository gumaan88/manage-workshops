import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Compass, 
  Calendar, 
  Users, 
  Radio, 
  Copy, 
  Plus, 
  Clock, 
  CheckCircle, 
  BarChart3, 
  FileText,
  Layers,
  ArrowRight,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { apiRequest } from '../lib/api';

export const WorkshopDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workshop, setWorkshop] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'agenda' | 'activities' | 'groups'>('agenda');

  // Agenda modal
  const [showAgendaModal, setShowAgendaModal] = useState(false);
  const [agendaTitle, setAgendaTitle] = useState('');
  const [agendaStartTime, setAgendaStartTime] = useState('09:00');
  const [agendaEndTime, setAgendaEndTime] = useState('10:00');
  const [agendaDay, setAgendaDay] = useState(1);

  const loadData = async () => {
    try {
      setLoading(true);
      const wsData = await apiRequest(`/workshops/${id}`);
      setWorkshop(wsData);

      const actData = await apiRequest(`/activities?workshopId=${id}`);
      setActivities(actData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const handleClone = async () => {
    if (!confirm('هل تريد استنساخ هذه الورشة كقالب لورشة جديدة؟')) return;
    try {
      const cloned = await apiRequest(`/workshops/${id}/clone`, { method: 'POST' });
      alert('تم استنساخ الورشة بنجاح!');
      navigate(`/workshops/${cloned.id}`);
    } catch (err: any) {
      alert(err.message || 'فشل استنساخ الورشة');
    }
  };

  const handleAddAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest(`/workshops/${id}/agenda`, {
        method: 'POST',
        body: JSON.stringify({
          workshopId: id,
          dayNumber: Number(agendaDay),
          title: agendaTitle,
          startTime: agendaStartTime,
          endTime: agendaEndTime,
          orderIndex: (workshop?.agenda?.length || 0) + 1
        })
      });
      setShowAgendaModal(false);
      setAgendaTitle('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'فشل إضافة الفقرة');
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-400 font-medium">جارٍ تحميل تفاصيل الورشة...</div>;
  }

  if (!workshop) {
    return <div className="text-center py-20 text-rose-500 font-bold">الورشة غير موجودة</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg">
                {workshop.code}
              </span>
              <span className="text-xs font-bold bg-brand-50 text-brand-700 px-2.5 py-0.5 rounded-lg">
                {workshop.format === 'in_person' ? 'حضوري' : 'عن بُعد'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{workshop.title}</h1>
            <p className="text-sm text-slate-500 mt-2 max-w-3xl leading-relaxed">{workshop.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to={`/live/${workshop.id}`}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:from-amber-600 hover:to-amber-700 transition shadow-sm shadow-amber-200"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span>شاشة الميسر المباشرة</span>
            </Link>

            <Link
              to={`/participant/${workshop.id}`}
              target="_blank"
              className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2.5 rounded-xl font-bold text-sm transition"
            >
              <ExternalLink className="w-4 h-4 text-slate-500" />
              <span>غرفة المشارك</span>
            </Link>

            <Link
              to={`/reports/${workshop.id}`}
              className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2.5 rounded-xl font-bold text-sm transition"
            >
              <BarChart3 className="w-4 h-4 text-slate-500" />
              <span>التقارير</span>
            </Link>

            <button
              onClick={handleClone}
              className="inline-flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2.5 rounded-xl font-bold text-sm transition"
              title="استنساخ الورشة كقالب لورشة جديدة"
            >
              <Copy className="w-4 h-4" />
              <span className="hidden sm:inline">استنساخ قالب</span>
            </button>
          </div>
        </div>

        {/* Quick Meta Stats */}
        <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-600">
          <div>
            <span className="text-slate-400 block mb-0.5">التاريخ:</span>
            <span className="font-bold text-slate-800">{workshop.start_date}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">الموقع:</span>
            <span className="font-bold text-slate-800">{workshop.location_name || 'غير محدد'}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">عدد المجموعات:</span>
            <span className="font-bold text-slate-800">{workshop.groups?.length || 0} مجموعات</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">الأنشطة المضافة:</span>
            <span className="font-bold text-slate-800">{activities.length} نشاط</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('agenda')}
          className={`pb-3 text-sm font-bold border-b-2 transition ${
            activeTab === 'agenda' 
              ? 'border-brand-600 text-brand-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          جدول الأعمال والأجندة ({workshop.agenda?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('activities')}
          className={`pb-3 text-sm font-bold border-b-2 transition ${
            activeTab === 'activities' 
              ? 'border-brand-600 text-brand-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          الأنشطة والاستبيانات ({activities.length})
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`pb-3 text-sm font-bold border-b-2 transition ${
            activeTab === 'groups' 
              ? 'border-brand-600 text-brand-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          المجموعات التدريبية ({workshop.groups?.length || 0})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'agenda' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm">فقرات الأجندة الزمنية</h3>
            <button
              onClick={() => setShowAgendaModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-brand-50 text-brand-700 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة فقرة</span>
            </button>
          </div>

          {workshop.agenda?.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-400 text-sm">
              لا توجد فقرات في الأجندة بعد.
            </div>
          ) : (
            <div className="space-y-2">
              {workshop.agenda?.map((item: any) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-16 text-center bg-slate-50 border border-slate-100 py-1.5 rounded-lg text-xs font-mono font-bold text-slate-700">
                      {item.start_time} - {item.end_time}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{item.title}</h4>
                      {item.description && <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-400">اليوم {item.day_number}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'activities' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm">قائمة الأنشطة والتمارين</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activities.map((act) => (
              <div key={act.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {act.activity_type}
                    </span>
                    {act.is_anonymous === 1 && (
                      <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded">
                        مجهول الهوية
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{act.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">عدد الحقول: {act.fields?.length || 0}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>الجمهور: {act.target_audience === 'all' ? 'الجميع' : act.target_audience}</span>
                  <span className="font-bold text-emerald-600">نشط</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'groups' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {workshop.groups?.map((g: any) => (
            <div key={g.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-xs mb-2">
                #{g.order_index}
              </div>
              <h4 className="font-bold text-slate-900 text-sm">{g.name}</h4>
              <p className="text-xs text-slate-400 mt-1">مجموعة عمل تفاعلية</p>
            </div>
          ))}
        </div>
      )}

      {/* Add Agenda Modal */}
      {showAgendaModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-lg font-black text-slate-900 mb-4">إضافة فقرة جديدة للأجندة</h2>
            <form onSubmit={handleAddAgenda} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عنوان الفقرة</label>
                <input
                  type="text"
                  required
                  value={agendaTitle}
                  onChange={(e) => setAgendaTitle(e.target.value)}
                  placeholder="مثال: الجلسة الأولى: مدخل إلى التحول الرقمي"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">وقت البدء</label>
                  <input
                    type="time"
                    required
                    value={agendaStartTime}
                    onChange={(e) => setAgendaStartTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">وقت الانتهاء</label>
                  <input
                    type="time"
                    required
                    value={agendaEndTime}
                    onChange={(e) => setAgendaEndTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAgendaModal(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition shadow-sm"
                >
                  إضافة للأجندة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
