import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Award, CheckCircle2, XCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { apiRequest } from '../lib/api';

export const CertificateVerifyPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCert = async () => {
      try {
        setLoading(true);
        const data = await apiRequest(`/certificates/verify/${code}`);
        setCert(data);
      } catch (err: any) {
        setError(err.message || 'رمز الشهادة غير صالح أو ملغاة');
      } finally {
        setLoading(false);
      }
    };
    if (code) fetchCert();
  }, [code]);

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 font-arabic">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center space-y-6">
        
        {loading ? (
          <div className="py-12 text-slate-400 font-bold">جارٍ التحقق من الشهادة عبر النظام المركزي...</div>
        ) : error ? (
          <div className="space-y-4 py-8">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full mx-auto flex items-center justify-center">
              <XCircle className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-black text-slate-900">شهادة غير صالحة</h1>
            <p className="text-xs text-rose-600 font-medium">{error}</p>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in zoom-in duration-200">
            {/* Header Stamp */}
            <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-amber-400 text-white rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-amber-200">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>شهادة معتمدة وموثقة رسمياً</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900">وثيقة إتمام ورشة عمل</h1>
              <p className="text-xs text-slate-500 mt-1 font-mono">الرمز: {cert.certificateCode}</p>
            </div>

            {/* Certificate Details Card */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-right space-y-3">
              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5">تمنح للمشارك/ـة:</span>
                <span className="text-lg font-black text-slate-900">{cert.recipientName}</span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5">عنوان الورشة:</span>
                <span className="text-sm font-bold text-brand-700">{cert.workshopTitle}</span>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center text-xs text-slate-500">
                <span>تاريخ الإصدار: <strong>{new Date(cert.issuedAt).toLocaleDateString('ar-SA')}</strong></span>
                <span className="text-emerald-600 font-bold">الحالة: سارية</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>تم التحقق من الوثيقة بأمان دون كشف أي بيانات شخصية حساسة</span>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100">
          <Link
            to="/workshops"
            className="text-xs font-bold text-brand-600 hover:text-brand-800"
          >
            الانتقال إلى منصة ورش
          </Link>
        </div>

      </div>
    </div>
  );
};
