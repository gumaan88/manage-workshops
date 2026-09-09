# الاستاك والبنية والنشر

## 1. القرار المعماري

تطبيق TypeScript كامل في مستودع واحد، يُنشر كوحدة Cloudflare Worker واحدة تخدم API وملفات React الثابتة. هذا يقلل العمليات والنطاقات وCORS، ويستفيد من Workers Static Assets التي تدعم نشر الكود والأصول معًا وتوجيه SPA رسميًا.

## 2. الاستاك الملزم

| الطبقة | التقنية | السبب |
|---|---|---|
| اللغة | TypeScript strict | عقد نوعي مشترك وتقليل أخطاء الواجهة/API |
| الواجهة | React + Vite | واجهة تفاعلية، بناء سريع، ودعم رسمي ضمن Cloudflare Workers |
| التوجيه | React Router | مسارات الإدارة والمشارك المتداخلة وحماية المسارات |
| بيانات العميل | TanStack Query | cache وإعادة المحاولة وحالات الطلب والمزامنة |
| النماذج | React Hook Form + Zod | نماذج ديناميكية وتحقيق مشترك |
| التصميم | Tailwind CSS + مكونات مبنية على Radix primitives | RTL، وصولية، وتخصيص دون قفل SaaS |
| API | Hono على Cloudflare Workers | Web Standards، middleware خفيف، TypeScript |
| العقود | Zod + OpenAPI generation | تحقق runtime وتوثيق من مصدر واحد |
| ORM | Drizzle ORM | دعم D1/SQLite وترحيلات قابلة للمراجعة |
| المصادقة | Better Auth + Drizzle adapter | جلسات وبريد/كلمة مرور بدل مصادقة مخصصة عالية المخاطر |
| قاعدة البيانات | Cloudflare D1 | علائقية، منخفضة التشغيل، ملائمة للحجم المتوقع |
| الملفات | Cloudflare R2 private bucket | مواد ومرفقات دون روابط عامة دائمة |
| PWA | Vite PWA/Workbox + IndexedDB | غلاف يعمل مع ضعف الاتصال ومسودات محلية |
| الاختبار | Vitest + Cloudflare Workers Vitest integration + React Testing Library | وحدة وتكامل في runtime قريب من الإنتاج |
| E2E | Playwright | تدفقات حقيقية عربية وجوال وصلاحيات |
| الجودة | ESLint + Prettier + TypeScript + dependency audit | بوابات CI قابلة للتكرار |

على الوكيل استخدام أحدث إصدارات مستقرة متوافقة وقت البناء وتثبيتها في lockfile، لا نسخ أرقام قديمة من المواصفة. أي استبدال لمكتبة ملزمة يحتاج سببًا تقنيًا واختبارات تكافؤ.

## 3. خدمات لا تُضاف دون حاجة

- لا Durable Objects في الإصدار الأول؛ live polling برقم إصدار كافٍ.
- لا KV كمصدر حقيقة؛ D1 هو المصدر العلائقي. يمكن Cache API للمواد العامة فقط.
- لا Queue إلزامية عند الإطلاق؛ المهام الصغيرة عبر Cron وبجدول jobs. إذا أثبت الحمل حاجة، تُضاف Queues دون تغيير العقود.
- لا خدمة بحث خارجية؛ بحث D1 المفهرس يكفي.
- لا تخزين PII في Analytics Engine.

## 4. هيكل المستودع المطلوب

```text
apps/web/                  React UI
src/worker/                Hono entry, middleware, routes
src/domain/                use-cases and policies
src/data/                  Drizzle schema and repositories
src/contracts/             Zod request/response schemas
src/shared/                shared types and utilities
drizzle/                   generated SQL migrations
scripts/                   seed, export, verification scripts
tests/unit/
tests/integration/
tests/e2e/
public/                    icons and offline assets
docs/                      generated API and implementation decisions
wrangler.jsonc
package.json
```

يمكن أن يستخدم الوكيل تنظيمًا قريبًا إذا حافظ على الفصل: route لا يحتوي SQL مباشر، repository لا يقرر صلاحية، ومكونات الواجهة لا تستدعي D1.

## 5. أسلوب API

- Base: `/api/v1`، JSON، UTF-8.
- نفس الأصل في الإنتاج: `https://workshops.gumaan.app/api/v1`.
- شكل النجاح: `{ "data": ..., "meta": ... }`.
- شكل الخطأ: `{ "error": { "code": "...", "message": "...", "fieldErrors": {}, "requestId": "..." } }`.
- pagination cursor-based للقوائم الكبيرة، وpage-based مقبول لقوائم الإدارة الصغيرة إذا حافظ على عقد ثابت.
- timestamps UTC ISO-8601؛ أرقام المقاييس أرقام لا نصوص.
- `Idempotency-Key` للدعوات الجماعية والإرسال النهائي وإصدار الشهادات.
- ETag/version للتعديل المتزامن.

## 6. البيئات

| البيئة | الغرض | البيانات |
|---|---|---|
| local | التطوير والاختبارات | D1/R2 محلية وSeed كامل |
| preview | قبول قبل الإنتاج | بيانات اصطناعية، نطاق workers.dev أو preview |
| production | الاستخدام الحقيقي | D1 وR2 مستقلان وأسرار مستقلة |

لا تستخدم قاعدة الإنتاج في preview. لا تُنسخ بيانات مستخدمين حقيقية إلى local.

## 7. إعداد Cloudflare

1. إنشاء Worker باسم `gumaan-workshops`.
2. إنشاء D1 إنتاجية `gumaan-workshops-prod` وpreview منفصلة.
3. إنشاء R2 خاص `gumaan-workshops-files-prod` وpreview منفصل.
4. ضبط assets كـSPA و`run_worker_first` لمسارات `/api/*` و`/join/*` و`/certificates/verify/*` إذا احتاجت server routing؛ بقية مسارات React تعود إلى `index.html`.
5. ضبط الأسرار عبر Wrangler أو Dashboard، لا في `wrangler.jsonc`.
6. نشر الترحيلات ثم التطبيق ثم Seed المرجعي فقط في local/preview. في الإنتاج ينشئ bootstrap أول مدير دون Seed التجريبي.
7. ربط Custom Domain `workshops.gumaan.app` بالـWorker. يجب أن تكون منطقة `gumaan.app` على حساب Cloudflare نفسه وفق متطلبات Custom Domains.
8. تفعيل Workers Logs ومراجعة health endpoint.

## 8. CI/CD

في كل Pull Request:

1. install من lockfile.
2. format check وlint وtypecheck.
3. تطبيق migrations على قاعدة محلية فارغة.
4. تشغيل Seed مرتين لإثبات idempotency.
5. unit وintegration.
6. build.
7. Playwright لمسارات smoke على preview عند الإمكان.

على `main`: نشر preview/production حسب سياسة المستودع، مع منع النشر إن فشلت البوابات. يستخدم Cloudflare API Token محدودًا وGitHub Environment approval للإنتاج.

## 9. استراتيجية البريد

يوجد interface باسم `EmailProvider` وتنفيذ HTTP provider يضبط بالأسرار. عند غياب المزود:

- تعمل الإشعارات داخل النظام.
- يستطيع المسؤول نسخ رابط الدعوة/الاستعادة يدويًا.
- تظهر حالة «البريد غير مهيأ» بوضوح ولا يدعي النظام أن الرسالة أرسلت.

لا يربط منطق الدعوات بمزود واحد، ولا يمنع غياب البريد تجربة المنصة.

## 10. الأداء المستهدف

- تحميل أولي على هاتف متوسط واتصال 4G: هدف LCP أقل من 2.5 ثانية للصفحات العامة و3.5 ثانية للوحة بعد الدخول.
- API read شائع p95 أقل من 500ms في الظروف المعتادة بعد الإطلاق والقياس.
- قائمة 10,000 مشارك تستخدم pagination وفهارس ولا تُحمّل كاملة.
- الورشة المرجعية 22 مشاركًا يجب أن تعمل براحة، واختبار حمل مرجعي لـ200 مشارك متزامن في ورشة واحدة على polling متباعد.
- الصور مضغوطة، route-based code splitting، والمواد الكبيرة لا تمر عبر الذاكرة كاملة إن أمكن streaming.

## 11. أوامر متوقعة في المشروع النهائي

```bash
npm ci
npm run dev
npm run db:migrate:local
npm run db:seed:local
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run deploy:preview
npm run deploy:production
```

كل أمر موثق في README النهائي ويعمل كما هو أو يفشل برسالة تشرح الإعداد الناقص.

## 12. مراجع رسمية للاستاك

- Workers Static Assets وSPA: https://developers.cloudflare.com/workers/static-assets/
- Hono على Workers: https://hono.dev/docs/getting-started/cloudflare-workers
- Drizzle مع D1: https://orm.drizzle.team/docs/sqlite/connect-cloudflare-d1
- Better Auth مع Hono: https://better-auth.com/docs/integrations/hono
- Better Auth Drizzle adapter: https://better-auth.com/docs/adapters/drizzle
- Custom Domains: https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- اختبار Workers بـVitest: https://developers.cloudflare.com/workers/testing/vitest-integration/
