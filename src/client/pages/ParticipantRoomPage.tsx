import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Sparkles, 
  Clock, 
  Send, 
  CheckCircle2, 
  WifiOff, 
  RefreshCw,
  HelpCircle,
  FileCheck,
  Award
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { saveLocalDraft, getLocalDraft, clearLocalDraft } from '../lib/offlineDrafts';

export const ParticipantRoomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [workshop, setWorkshop] = useState<any>(null);
  const [liveState, setLiveState] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [draftSavedTime, setDraftSavedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Poll live state
  useEffect(() => {
    let isMounted = true;

    const fetchLive = async () => {
      try {
        const live = await apiRequest(`/live/${id}`);
        if (isMounted) {
          setLiveState(live);
        }
      } catch (_) {}
    };

    const initialLoad = async () => {
      try {
        const ws = await apiRequest(`/workshops/${id}`);
        if (isMounted) setWorkshop(ws);
        await fetchLive();
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initialLoad();

    // 3-second live state polling (AC-008)
    const interval = setInterval(fetchLive, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [id]);

  // Load offline draft when active activity changes (AC-006)
  useEffect(() => {
    const loadDraft = async () => {
      if (liveState?.active_activity_id && liveState?.is_active === 1) {
        const draft = await getLocalDraft(liveState.active_activity_id);
        if (draft) {
          setAnswers(draft.answers || {});
          setDraftSavedTime(new Date(draft.savedAt).toLocaleTimeString('ar-SA'));
        } else {
          setAnswers({});
          setDraftSavedTime(null);
        }
        setIsSubmitted(false);
      }
    };
    loadDraft();
  }, [liveState?.active_activity_id, liveState?.is_active]);

  // Save draft locally on answers update (AC-006)
  const handleAnswerChange = async (key: string, value: any) => {
    const updated = { ...answers, [key]: value };
    setAnswers(updated);

    if (liveState?.active_activity_id && id) {
      await saveLocalDraft(liveState.active_activity_id, id, updated);
      setDraftSavedTime(new Date().toLocaleTimeString('ar-SA'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveState?.active_activity_id) return;

    setSubmitting(true);
    try {
      const idempotencyKey = `sub_${id}_${liveState.active_activity_id}_${localStorage.getItem('dev_user_email') || 'part'}`;
      
      await apiRequest('/submissions', {
        method: 'POST',
        body: JSON.stringify({
          activityId: liveState.active_activity_id,
          answers,
          isDraft: false,
          idempotencyKey
        })
      });

      await clearLocalDraft(liveState.active_activity_id);
      setIsSubmitted(true);
    } catch (err: any) {
      alert(err.message || 'فشل إرسال الإجابات');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <RefreshCw className="w-8 h-8 text-brand-400 animate-spin mb-3" />
        <p className="text-sm font-bold">جارٍ الاتصال بغرفة الورشة المباشرة...</p>
      </div>
    );
  }

  const activeActivity = liveState?.activeActivity;
  const isActivityOpen = liveState?.is_active === 1 && activeActivity;

  return (
    <div className="min-h-screen bg-slate-50 font-arabic pb-12">
      {/* Mobile Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 py-3.5 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-bold text-slate-500 uppercase">غرفة المشارك التفاعلية</span>
          </div>
          <h1 className="text-sm font-black text-slate-900 truncate max-w-[240px] sm:max-w-md">
            {workshop?.title}
          </h1>
        </div>

        {draftSavedTime && (
          <div className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 flex items-center gap-1">
            <FileCheck className="w-3 h-3" />
            <span>مسودة محفوظة {draftSavedTime}</span>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto px-4 pt-5">
        
        {/* Waiting State: When facilitator hasn't activated an activity yet */}
        {!isActivityOpen && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm space-y-4 my-8">
            <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-2xl mx-auto flex items-center justify-center">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">بانتظار بدء النشاط من الميسر</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-sm mx-auto">
                يرجى الانتظار، ستظهر الأسئلة والتمارين هنا فور إطلاقها من شاشة الميسر دون الحاجة لتحديث الصفحة.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>الاتصال بالبث المباشر نشط</span>
            </div>
          </div>
        )}

        {/* Submitted State */}
        {isActivityOpen && isSubmitted && (
          <div className="bg-white rounded-2xl border border-emerald-200 p-8 text-center shadow-md space-y-4 my-8 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">تم استلام مشاركتك بنجاح!</h2>
              <p className="text-xs text-slate-500 mt-1">
                شكراً لتفاعلك. تم تسجيل إجابتك لدى ميسر الورشة وسينتقل العرض تلقائياً عند بدء النشاط التالي.
              </p>
            </div>
            <button
              onClick={() => setIsSubmitted(false)}
              className="text-xs font-bold text-brand-600 hover:text-brand-800 underline mt-2"
            >
              تعديل الإجابة
            </button>
          </div>
        )}

        {/* Active Activity Form */}
        {isActivityOpen && !isSubmitted && (
          <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            
            {/* Activity Card Banner */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full">
                  نشاط مباشر مفتوح
                </span>
                {activeActivity.is_anonymous === 1 && (
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                    إجابات مجهولة الهوية
                  </span>
                )}
              </div>
              <h2 className="text-lg font-black text-slate-900">{activeActivity.title}</h2>
            </div>

            {/* Dynamic Form Fields */}
            <div className="space-y-4">
              {activeActivity.fields?.map((field: any, idx: number) => (
                <div key={field.key} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
                  <label className="block text-sm font-bold text-slate-800">
                    <span className="text-brand-600 ml-1.5">{idx + 1}.</span>
                    {field.label}
                    {field.required && <span className="text-rose-500 mr-1">*</span>}
                  </label>

                  {/* Rating scale 1-5 */}
                  {field.fieldType === 'rating_scale' && (
                    <div className="flex items-center justify-between gap-2 pt-2">
                      {[1, 2, 3, 4, 5].map((val) => {
                        const selected = answers[field.key] === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleAnswerChange(field.key, val)}
                            className={`flex-1 py-3 rounded-xl font-black text-base transition-all ${
                              selected
                                ? 'bg-brand-600 text-white shadow-md shadow-brand-200 ring-2 ring-brand-300'
                                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                            }`}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Single Choice Radio */}
                  {field.fieldType === 'single_choice' && field.options && (
                    <div className="space-y-2 pt-1">
                      {field.options.map((opt: string) => {
                        const selected = answers[field.key] === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleAnswerChange(field.key, opt)}
                            className={`w-full text-right p-3 rounded-xl border text-xs font-bold transition flex items-center justify-between ${
                              selected
                                ? 'bg-brand-50 border-brand-500 text-brand-800 ring-1 ring-brand-500'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span>{opt}</span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selected ? 'border-brand-600 bg-brand-600' : 'border-slate-300'}`}>
                              {selected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Long text / TextArea */}
                  {field.fieldType === 'long_text' && (
                    <textarea
                      rows={3}
                      value={answers[field.key] || ''}
                      onChange={(e) => handleAnswerChange(field.key, e.target.value)}
                      placeholder="اكتب إجابتك أو تحليلك هنا..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  )}

                  {/* Short text */}
                  {field.fieldType === 'short_text' && (
                    <input
                      type="text"
                      value={answers[field.key] || ''}
                      onChange={(e) => handleAnswerChange(field.key, e.target.value)}
                      placeholder="إجابتك..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Sticky Submit Button */}
            <div className="pt-3 sticky bottom-4 z-10">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-black py-3.5 px-6 rounded-2xl shadow-xl shadow-brand-200 flex items-center justify-center gap-2 text-base transition disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
                <span>{submitting ? 'جارٍ الإرسال...' : 'إرسال الإجابات والمشاركة'}</span>
              </button>
            </div>
          </form>
        )}

      </main>
    </div>
  );
};
