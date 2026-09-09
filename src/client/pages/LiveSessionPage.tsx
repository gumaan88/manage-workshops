import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Radio, 
  Play, 
  Square, 
  Users, 
  Clock, 
  CheckCircle, 
  ExternalLink,
  RefreshCw,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { apiRequest } from '../lib/api';

export const LiveSessionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [workshop, setWorkshop] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [liveState, setLiveState] = useState<any>(null);
  const [selectedActId, setSelectedActId] = useState<string>('');
  const [submissionsCount, setSubmissionsCount] = useState<number>(0);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [ws, acts, live] = await Promise.all([
        apiRequest(`/workshops/${id}`),
        apiRequest(`/activities?workshopId=${id}`),
        apiRequest(`/live/${id}`)
      ]);
      setWorkshop(ws);
      setActivities(acts || []);
      setLiveState(live);
      if (live?.active_activity_id) {
        setSelectedActId(live.active_activity_id);
        const subs = await apiRequest(`/submissions?activityId=${live.active_activity_id}`);
        setSubmissionsCount(subs?.length || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadData();
      // Poll every 3 seconds for live counter updates (AC-008)
      const interval = setInterval(async () => {
        try {
          const live = await apiRequest(`/live/${id}`);
          setLiveState(live);
          if (live?.active_activity_id) {
            const subs = await apiRequest(`/submissions?activityId=${live.active_activity_id}`);
            setSubmissionsCount(subs?.length || 0);
          }
        } catch (_) {}
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [id]);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const handleToggleActivity = async (isActive: boolean) => {
    if (!selectedActId && isActive) {
      alert('يرجى اختيار نشاط أولاً');
      return;
    }
    try {
      const updated = await apiRequest(`/live/${id}/activity`, {
        method: 'POST',
        body: JSON.stringify({
          activityId: selectedActId,
          isActive
        })
      });
      setLiveState(updated);
      setIsTimerRunning(isActive);
      if (!isActive) setTimerSeconds(0);
    } catch (err: any) {
      alert(err.message || 'فشل تحديث حالة النشاط');
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-400 font-medium">جارٍ تحميل لوحة التشغيل المباشر...</div>;
  }

  const activeActObj = activities.find((a) => a.id === liveState?.active_activity_id);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">LIVE FACILITATOR CONSOLE</span>
          </div>
          <h1 className="text-2xl font-black">{workshop?.title}</h1>
          <p className="text-xs text-slate-400 mt-1">التحكم المباشر في الأنشطة وتتبع تسليمات المشاركين لحظياً</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/participant/${id}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold transition border border-slate-700"
          >
            <ExternalLink className="w-4 h-4" />
            <span>فتح غرفة المشارك</span>
          </Link>
          <Link
            to={`/workshops/${id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-white"
          >
            <span>العودة للورشة</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Activity Control */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">إدارة الأنشطة والتمارين المباشرة</h2>
            <span className="text-xs font-bold text-slate-400 font-mono">نسخة الحالة: v{liveState?.version || 1}</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">اختر النشاط للبدء أو التشغيل:</label>
            <select
              value={selectedActId}
              onChange={(e) => setSelectedActId(e.target.value)}
              disabled={liveState?.is_active === 1}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:outline-none disabled:opacity-50"
            >
              <option value="">-- اختر نشاطاً من القائمة --</option>
              {activities.map((act) => (
                <option key={act.id} value={act.id}>
                  [{act.activity_type}] {act.title}
                </option>
              ))}
            </select>
          </div>

          {/* Action Trigger Buttons */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-500 block mb-0.5">حالة النشاط المحدد:</span>
              <span className="text-sm font-black text-slate-800">
                {liveState?.is_active === 1 ? '🟢 معروض ومفتوح للمشاركين الآن' : '⚪ مغلق حالياً'}
              </span>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              {liveState?.is_active === 1 ? (
                <button
                  onClick={() => handleToggleActivity(false)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-rose-100 transition"
                >
                  <Square className="w-4 h-4" />
                  <span>إغلاق النشاط وإنهاء الوقت</span>
                </button>
              ) : (
                <button
                  onClick={() => handleToggleActivity(true)}
                  disabled={!selectedActId}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-emerald-100 transition"
                >
                  <Play className="w-4 h-4" />
                  <span>بدء النشاط وعرضه للمشاركين</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Activity Details */}
          {activeActObj && (
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-sm font-bold text-slate-800 mb-2">محتوى النشاط النشط حالياً:</h3>
              <div className="bg-brand-50/50 border border-brand-100 rounded-xl p-4">
                <h4 className="font-bold text-brand-900 text-sm">{activeActObj.title}</h4>
                <div className="mt-2 space-y-1">
                  {activeActObj.fields?.map((f: any, idx: number) => (
                    <div key={idx} className="text-xs text-slate-600 flex items-center gap-2">
                      <span className="w-4 h-4 rounded bg-brand-100 text-brand-800 flex items-center justify-center font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <span>{f.label}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({f.fieldType})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Counters & Timer */}
        <div className="space-y-6">
          {/* Live Timer Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 mb-2">
              <Clock className="w-4 h-4" />
              <span>الوقت المستغرق للنشاط</span>
            </div>
            <div className="text-4xl font-black font-mono text-slate-900 tracking-wider">
              {formatTimer(timerSeconds)}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">يبدأ العداد تلقائياً فور بدء النشاط</p>
          </div>

          {/* Submissions Counter Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 mb-2">
              <Users className="w-4 h-4" />
              <span>إجمالي التسليمات المستلمة</span>
            </div>
            <div className="text-5xl font-black text-brand-600">
              {submissionsCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">يتم التحديث تلقائياً كل 3 ثوانٍ</p>
          </div>
        </div>

      </div>
    </div>
  );
};
