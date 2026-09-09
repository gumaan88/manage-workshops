import fs from 'fs';
import path from 'path';

export async function runSeed(db: any) {
  console.log('🌱 Starting Seed Execution for Workshops Platform...');

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'eng.gumaan@gmail.com';
  const adminName = 'م. جمعان سعيد';
  const facilitatorEmail = process.env.SEED_FACILITATOR_EMAIL || 'facilitator@example.test';
  const participantEmail = process.env.SEED_PARTICIPANT_EMAIL || 'participant@example.test';

  const now = new Date().toISOString();

  // 1. Seed Users
  const usersToSeed = [
    { id: 'usr_admin', name: adminName, email: adminEmail, role: 'platform_admin' },
    { id: 'usr_facilitator', name: 'الميسر المعتمد', email: facilitatorEmail, role: 'user' },
    { id: 'usr_participant', name: 'مشارك تجريبي', email: participantEmail, role: 'user' },
  ];

  for (const u of usersToSeed) {
    try {
      await db.run(
        `INSERT INTO "user" (id, name, email, emailVerified, locale, platform_role, status, createdAt, updatedAt)
         VALUES (?, ?, ?, 1, 'ar', ?, 'active', ?, ?)
         ON CONFLICT(email) DO UPDATE SET name = excluded.name, platform_role = excluded.platform_role`,
        [u.id, u.name, u.email, u.role, now, now]
      );
    } catch (err: any) {
      console.log(`User notice: ${err.message}`);
    }
  }

  // 2. Seed Default Workspace
  const wsId = 'ws_digital_transformation';
  await db.run(
    `INSERT INTO workspaces (id, name, slug, description, owner_id, status, created_at, updated_at)
     VALUES (?, 'أكاديمية التحول الرقمي', 'digital-transformation', 'المساحة التدريبية الرئيسية لبرامج التحول الرقمي وبناء القدرات', 'usr_admin', 'active', ?, ?)
     ON CONFLICT(id) DO NOTHING`,
    [wsId, now, now]
  );

  // Add memberships
  for (const u of usersToSeed) {
    await db.run(
      `INSERT INTO workspace_memberships (id, workspace_id, user_id, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO NOTHING`,
      [`wsm_${u.id}`, wsId, u.id, u.role === 'platform_admin' ? 'owner' : 'member', now, now]
    );
  }

  // 3. Seed Reference Workshop
  const workshopId = 'ws_dt_2026';
  await db.run(
    `INSERT INTO workshops (id, workspace_id, title, code, description, format, location_name, start_date, end_date, max_participants, status, is_template, created_at, updated_at)
     VALUES (?, ?, 'ورشة التحول الرقمي وأثره على المستفيد', 'DT-2026-01', 'ورشة توعوية قيادية تفاعلية لمدة أربع ساعات تركز على مفاهيم التحول الرقمي وأثره المباشر على جودة الخدمات والمستفيدين', 'in_person', 'مركز التدريب الرئيسي - القاعة الكبرى', '2026-09-15', '2026-09-15', 50, 'in_progress', 0, ?, ?)
     ON CONFLICT(id) DO NOTHING`,
    [workshopId, wsId, now, now]
  );

  // Live state
  await db.run(
    `INSERT INTO live_states (id, workshop_id, active_activity_id, is_active, version, updated_at)
     VALUES ('ls_dt_2026', ?, null, 0, 1, ?)
     ON CONFLICT(id) DO NOTHING`,
    [workshopId, now]
  );

  // 4. Seed Workshop Agenda
  const agendaItems = [
    { title: 'الاستقبال والتسجيل والترحيب بالمشاركين', start: '08:30', end: '09:00', order: 1 },
    { title: 'الجلسة الأولى: مفاهيم التحول الرقمي وواقعه اليوم', start: '09:00', end: '10:15', order: 2 },
    { title: 'استراحة وتواصل شبكي', start: '10:15', end: '10:30', order: 3 },
    { title: 'الجلسة الثانية: تطبيق عملي ومصفوفة أولويات المستفيد', start: '10:30', end: '12:00', order: 4 },
    { title: 'عرض مخرجات المجموعات والتوصيات الختامية', start: '12:00', end: '12:30', order: 5 },
  ];

  for (const item of agendaItems) {
    await db.run(
      `INSERT INTO agenda_items (id, workshop_id, day_number, title, start_time, end_time, order_index, created_at)
       VALUES (?, ?, 1, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO NOTHING`,
      [`agenda_${item.order}`, workshopId, item.title, item.start, item.end, item.order, now]
    );
  }

  // 5. Seed Groups
  const groups = [
    { id: 'grp_1', name: 'المجموعة الأولى (الخدمات الإلكترونية)', order: 1 },
    { id: 'grp_2', name: 'المجموعة الثانية (تجربة المستفيد)', order: 2 },
    { id: 'grp_3', name: 'المجموعة الثالثة (البنية الرقمية والبيانات)', order: 3 },
    { id: 'grp_4', name: 'المجموعة الرابعة (الحوكمة وإدارة التغيير)', order: 4 },
    { id: 'grp_5', name: 'المجموعة الخامسة (الابتكار والذكاء الاصطناعي)', order: 5 },
  ];

  for (const g of groups) {
    await db.run(
      `INSERT INTO workshop_groups (id, workshop_id, name, order_index, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO NOTHING`,
      [g.id, workshopId, g.name, g.order, now]
    );
  }

  // 6. Seed Activities: Pre-Assessment & Post-Assessment & Exercise
  const preAssessmentFields = JSON.stringify([
    { key: 'q1', label: 'ما مستوى معرفتك بمفاهيم التحول الرقمي الحكومي؟', fieldType: 'rating_scale', required: true, comparisonKey: 'comp_knowledge' },
    { key: 'q2', label: 'ما مدى وضوح دور المستفيد في تصميم الخدمات الرقمية؟', fieldType: 'rating_scale', required: true, comparisonKey: 'comp_beneficiary' },
  ]);

  await db.run(
    `INSERT INTO activities (id, workshop_id, title, activity_type, target_audience, is_anonymous, time_limit_minutes, status, fields_json, created_at, updated_at)
     VALUES ('act_pre_assessment', ?, 'التقييم القبلي لمستوى الوعي بالتحول الرقمي', 'pre_assessment', 'all', 0, 10, 'published', ?, ?, ?)
     ON CONFLICT(id) DO NOTHING`,
    [workshopId, preAssessmentFields, now, now]
  );

  const postAssessmentFields = JSON.stringify([
    { key: 'q1', label: 'ما مستوى معرفتك بمفاهيم التحول الرقمي بعد حضور الورشة؟', fieldType: 'rating_scale', required: true, comparisonKey: 'comp_knowledge' },
    { key: 'q2', label: 'ما مدى وضوح دور المستفيد في تصميم الخدمات الرقمية الآن؟', fieldType: 'rating_scale', required: true, comparisonKey: 'comp_beneficiary' },
  ]);

  await db.run(
    `INSERT INTO activities (id, workshop_id, title, activity_type, target_audience, is_anonymous, time_limit_minutes, status, fields_json, created_at, updated_at)
     VALUES ('act_post_assessment', ?, 'التقييم البعدي لأثر الورشة التدريبية', 'post_assessment', 'all', 0, 10, 'published', ?, ?, ?)
     ON CONFLICT(id) DO NOTHING`,
    [workshopId, postAssessmentFields, now, now]
  );

  const exerciseFields = JSON.stringify([
    { key: 'ex_problem', label: 'حدد التحدي الرقمي الأبرز الذي يواجه المستفيد في منظمتك', fieldType: 'long_text', required: true },
    { key: 'ex_priority', label: 'أولوية المعالجة المقترحة', fieldType: 'single_choice', required: true, options: ['أولوية عاجلة وقصيرة المدى', 'أولوية متوسطة المدى', 'مبادرة استراتيجية طويلة المدى'] },
  ]);

  await db.run(
    `INSERT INTO activities (id, workshop_id, title, activity_type, target_audience, is_anonymous, time_limit_minutes, status, fields_json, created_at, updated_at)
     VALUES ('act_group_exercise', ?, 'تمرين تطبيقي: تحديد أولويات رحلة المستفيد', 'group_exercise', 'all', 0, 25, 'published', ?, ?, ?)
     ON CONFLICT(id) DO NOTHING`,
    [workshopId, exerciseFields, now, now]
  );

  // 7. Seed 22 Organizations
  const orgNames = [
    'وزارة الاتصالات وتقنية المعلومات',
    'هيئة الحكومة الرقمية',
    'وزارة الموارد البشرية والتنمية الاجتماعية',
    'هيئة كفاءة الإنفاق والمشروعات الحكومية',
    'وزارة النقل والخدمات اللوجستية',
    'هيئة الزكاة والضريبة والجمارك',
    'وزارة التجارة',
    'وزارة البلديات والإسكان',
    'صندوق التنمية الوطني',
    'هيئة البيانات والذكاء الاصطناعي (سدايا)',
    'وزارة الصحة',
    'وزارة التعليم',
    'بنك التنمية الاجتماعية',
    'المركز الوطني للتعليم الإلكتروني',
    'الهيئة العامة للمنشآت الصغيرة والمتوسطة (منشآت)',
    'المؤسسة العامة للتأمينات الاجتماعية',
    'هيئة رعاية الأشخاص ذوي الإعاقة',
    'المركز الوطني لإدارة الدين',
    'مؤسسة العون للتنمية',
    'مؤسسة أثر للعمل الخيري',
    'مؤسسة الغويري للتطوير والتدريب',
    'مركز التميز للاستشارات الرقمية'
  ];

  for (let i = 0; i < orgNames.length; i++) {
    const orgId = `org_${i + 1}`;
    await db.run(
      `INSERT INTO organizations (id, workspace_id, name, code, type, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'standard', ?, ?)
       ON CONFLICT(id) DO NOTHING`,
      [orgId, wsId, orgNames[i], `ORG-${(i + 1).toString().padStart(2, '0')}`, now, now]
    );
  }

  console.log('✅ Seed completed successfully! 3 Users, 1 Workspace, 1 Workshop, 5 Agenda items, 5 Groups, 3 Activities, and 22 Organizations seeded.');
}
