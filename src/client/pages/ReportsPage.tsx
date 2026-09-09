import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  BarChart3, 
  Printer, 
  ArrowUpRight, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  Award,
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { apiRequest } from '../lib/api';

export const ReportsPage: React.FC = () => {
  const { workshopId } = useParams<{ workshopId: string }>();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [issuedCert, setIssuedCert] = useState<any>(null);

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(`/reports/${workshopId}`);
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workshopId) loadReport();
  }, [workshopId]);

  const handleIssueCertificate = async () => {
    try {
      const res = await apiRequest('/certificates/issue', {
        method: 'POST',
        body: JSON.stringify({
          workshopId,
          participantId: 'seed_admin_id'
        })
      });
      setIssuedCert(res);
      alert(`تم إصدار الشهادة بنجاح! رمز التحقق: ${res.certificateCode}`);
    } catch (err: any) {
      alert(err.message || 'فشل إصدار الشهادة');
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-400 font-medium">جارٍ إعداد وتوليد التقرير التحليلي...</div>;
  }

  if (!report) {
    return <div className="text-center py-20 text-rose-500 font-bold">لا توجد بيانات تقرير لهذه الورشة</div>;
  }

  const { workshop, metrics, prePostComparison } = report;

  return (
    <div className="space-y-6">
      
      {/* Action Header - Hidden during print */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">تقرير مخرجات الورشة والقياس</h1>
          <p className="text-sm text-slate-500 mt-1">التقرير التحليلي الشامل لمؤشرات الأداء والأثر المعرفي</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>طباعة التقرير</span>
          </button>

          <button
            onClick={handleIssueCertificate}
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm shadow-brand-100 transition"
          >
            <Award className="w-4 h-4" />
            <span>إصدار شهادة معتمدة</span>
          </button>
        </div>
      </div>

      {/* Printable Report Sheet (AC-011) */}
      <div className="printable-area bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-8">
        
        {/* Report Official Banner */}
        <div className="border-b border-slate-100 pb-6 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-brand-600 mb-1">
              <Sparkles className="w-4 h-4" />
              <span>منصة ورش — تقرير الأداء الختامي</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900">{workshop?.title}</h2>
            <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
              <span>رمز الورشة: <strong className="text-slate-800">{workshop?.code}</strong></span>
              <span>تاريخ الإنعقاد: <strong className="text-slate-800">{workshop?.start_date}</strong></span>
              <span>المكان: <strong className="text-slate-800">{workshop?.location_name || 'حضوري'}</strong></span>
            </div>
          </div>
          <div className="text-left text-xs text-slate-400">
            تاريخ التوليد: {new Date(report.generatedAt).toLocaleDateString('ar-SA')}
          </div>
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <span className="text-xs text-slate-500 block mb-1">العدد المستهدف</span>
            <span className="text-2xl font-black text-slate-800">{metrics.totalRegistered}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">مشارك مسجل</span>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <span className="text-xs text-slate-500 block mb-1">الحضور الفعلي</span>
            <span className="text-2xl font-black text-emerald-600">{metrics.presentAttendees}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">مشارك حاضر</span>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <span className="text-xs text-slate-500 block mb-1">نسبة الحضور</span>
            <span className="text-2xl font-black text-brand-600">{metrics.attendanceRate}%</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">من إجمالي المستهدف</span>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <span className="text-xs text-slate-500 block mb-1">إجمالي التفاعلات</span>
            <span className="text-2xl font-black text-amber-600">{metrics.totalSubmissions}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">إجابة مسجلة</span>
          </div>
        </div>

        {/* Pre vs Post Assessment Comparison (AC-010) */}
        {prePostComparison && prePostComparison.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-600" />
              <h3 className="text-lg font-black text-slate-900">مصفوفة قياس الأثر المعرفي (القبلي مقابل البعدي)</h3>
            </div>
            
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="p-3">المعيار أو المحور</th>
                    <th className="p-3 text-center">المتوسط القبلي (من 5)</th>
                    <th className="p-3 text-center">المتوسط البعدي (من 5)</th>
                    <th className="p-3 text-center">الفارق</th>
                    <th className="p-3 text-center">نسبة التطور</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {prePostComparison.map((comp: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold">{comp.comparisonKey}</td>
                      <td className="p-3 text-center font-mono">{comp.preMean}</td>
                      <td className="p-3 text-center font-mono font-bold text-brand-700">{comp.postMean}</td>
                      <td className="p-3 text-center font-mono text-emerald-600 font-bold">
                        +{comp.difference}
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-0.5 text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <ArrowUpRight className="w-3 h-3" />
                          +{comp.percentageChange}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Certificate Quick Verification Notice if issued */}
        {issuedCert && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6 text-amber-600" />
              <div>
                <h4 className="font-bold text-amber-900 text-xs">تم إصدار الشهادة للمشارك</h4>
                <p className="text-[11px] text-amber-700 mt-0.5 font-mono">الرمز: {issuedCert.certificateCode}</p>
              </div>
            </div>
            <Link
              to={`/certificates/verify/${issuedCert.certificateCode}`}
              target="_blank"
              className="text-xs font-bold bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 transition"
            >
              فحص الشهادة
            </Link>
          </div>
        )}

        {/* Executive Summary */}
        <div className="border-t border-slate-100 pt-6">
          <h3 className="text-sm font-bold text-slate-800 mb-2">الخلاصة والتوصيات التنفيذية:</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            أظهرت الورشة التدريبية تفاعلاً إيجابياً ملموساً بنسبة حضور بلغت {metrics.attendanceRate}%، مع تسجيل تقدم واضح في المعايير القبلية والبعدية. يُوصى بالاستمرار في متابعة خطط العمل الفردية والجماعية التي أنتجتها المجموعات أثناء الورشة.
          </p>
        </div>

      </div>
    </div>
  );
};
