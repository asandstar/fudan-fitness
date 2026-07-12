// Phase 1A 最小验证脚本
// 使用方式：npx tsx scripts/verify-phase1a.ts
// 测试内容：db-mappers 转换正确性、localStorage key 迁移逻辑

import {
  userFromDbRow, userToDbInsert, userToDbUpdate,
  venueFromDbRow, venueToDbInsert,
  coachProfileFromDbRow, coachProfileToDbInsert,
  coachSlotFromDbRow, coachSlotToDbInsert,
  appointmentFromDbRow, appointmentToDbInsert,
  announcementFromDbRow, announcementToDbInsert,
  notificationFromDbRow, notificationToDbInsert,
  trainingRecordFromDbRow, trainingRecordToDbInsert,
} from '../src/lib/db-mappers';

let passed = 0;
let failed = 0;

function assert(cond: unknown, msg: string) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${msg}`);
  } else {
    failed++;
    console.error(`  ✗ ${msg}`);
  }
}

console.log('=== Phase 1A 验证 ===\n');

// --- User mapper ---
console.log('1. User Mapper');
{
  const dbRow = {
    id: 'u1',
    student_id: '22300110001',
    password: 'password123',
    name: '测试用户',
    department: '计算机科学技术学院',
    grade: '2023级',
    role: 'member',
    avatar_url: null,
    violation_count: 0,
    banned_until: null,
    created_at: '2025-09-01T00:00:00.000Z',
    favorite_coaches: ['c1', 'c2'],
  };
  const user = userFromDbRow(dbRow);
  assert(user.id === 'u1', 'user.id 正确');
  assert(user.studentId === '22300110001', 'user.studentId 转换正确');
  assert(user.violationCount === 0, 'user.violationCount 转换正确');
  assert(user.bannedUntil === null, 'user.bannedUntil null 处理正确');
  assert(user.createdAt === '2025-09-01T00:00:00.000Z', 'user.createdAt 转换正确');
  assert(Array.isArray(user.favoriteCoaches) && user.favoriteCoaches[0] === 'c1', 'user.favoriteCoaches 数组转换正确');
  assert(user.avatarUrl === undefined, 'user.avatarUrl null → undefined 正确');

  const dbInsert = userToDbInsert({
    studentId: '22300110002',
    password: 'test',
    name: '新用户',
    department: '物理系',
    grade: '2024级',
    role: 'member',
    violationCount: 0,
    bannedUntil: null,
    createdAt: '2026-01-01T00:00:00.000Z',
  });
  assert(dbInsert.student_id === '22300110002', 'toDbInsert student_id 正确');
  assert('avatar_url' in dbInsert === false, '可选字段未定义时不插入 avatar_url');
}

// --- Venue mapper ---
console.log('\n2. Venue Mapper');
{
  const dbRow = {
    id: 'v1',
    name: '邯郸南区健身房',
    campus: 'handan-south',
    address: '邯郸路220号',
    open_time: '06:00',
    close_time: '22:00',
    capacity: 80,
    facilities: ['跑步机', '哑铃'],
    description: '测试场馆',
    bookable: true,
    display_order: 1,
    image_url: null,
    features: ['落地窗', '空调'],
    layout_info: '一楼有氧区',
    peak_hours: '18:00-20:00',
    tips: null,
    transportation: '公交直达',
    rules: null,
    contact_phone: null,
    map_image_url: null,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-06-01T00:00:00.000Z',
  };
  const venue = venueFromDbRow(dbRow);
  assert(venue.openTime === '06:00', 'venue.openTime 转换正确');
  assert(venue.displayOrder === 1, 'venue.displayOrder 转换正确');
  assert(venue.bookable === true, 'venue.bookable 布尔转换正确');
  assert(Array.isArray(venue.facilities), 'venue.facilities 数组转换正确');
  assert(venue.tips === undefined, 'venue.tips null → undefined 正确');
  assert(venue.contactPhone === undefined, 'venue.contactPhone null → undefined 正确');

  const dbInsert = venueToDbInsert({
    name: '新馆',
    campus: 'jiangwan',
    address: '淞沪路2005号',
    openTime: '07:00',
    closeTime: '21:00',
    capacity: 50,
    facilities: ['哑铃'],
    description: '',
    bookable: false,
    displayOrder: 99,
    tips: ['注意安全'],
  });
  assert(dbInsert.open_time === '07:00', 'toDbInsert open_time 正确');
  assert(dbInsert.bookable === false, 'toDbInsert bookable 正确');
  assert(Array.isArray(dbInsert.tips), 'toDbInsert tips 数组保留');
}

// --- CoachProfile mapper ---
console.log('\n3. CoachProfile Mapper');
{
  const dbRow = {
    id: 'c1',
    user_id: 'u2',
    name: '张教练',
    department: '体育教学部',
    grade: '2020级',
    specialties: ['增肌', '减脂'],
    style_desc: '科学训练，循序渐进',
    is_beginner_friendly: true,
    is_female_friendly: false,
    total_sessions: 50,
    total_students: 30,
    cert_status: 'approved',
    cert_applied_at: '2025-09-01T00:00:00.000Z',
    cert_reviewed_at: '2025-09-10T00:00:00.000Z',
    cert_review_note: null,
    reviewed_by: null,
    venues: ['v1', 'v2'],
    created_at: '2025-09-01T00:00:00.000Z',
    training_philosophy: '健康第一',
    rating: 4.8,
    student_reviews: null,
    success_cases: null,
  };
  const coach = coachProfileFromDbRow(dbRow);
  assert(coach.userId === 'u2', 'coach.userId 转换正确');
  assert(coach.styleDesc === '科学训练，循序渐进', 'coach.styleDesc 转换正确');
  assert(coach.isBeginnerFriendly === true, 'coach.isBeginnerFriendly 布尔转换正确');
  assert(coach.isFemaleFriendly === false, 'coach.isFemaleFriendly 布尔转换正确');
  assert(coach.totalSessions === 50, 'coach.totalSessions 转换正确');
  assert(coach.certStatus === 'approved', 'coach.certStatus 转换正确');
  assert(coach.certAppliedAt === '2025-09-01T00:00:00.000Z', 'coach.certAppliedAt 转换正确');
  assert(Array.isArray(coach.venues), 'coach.venues 数组转换正确');
  assert(coach.trainingPhilosophy === '健康第一', 'coach.trainingPhilosophy 转换正确');
  assert(coach.rating === 4.8, 'coach.rating 数字转换正确');
  assert(coach.studentReviews === undefined, 'coach.studentReviews null → undefined 正确');
}

// --- CoachSlot mapper ---
console.log('\n4. CoachSlot Mapper');
{
  const dbRow = {
    id: 's1',
    coach_id: 'c1',
    venue_id: 'v1',
    date: '2026-07-12',
    start_time: '09:00',
    end_time: '10:00',
    is_available: true,
  };
  const slot = coachSlotFromDbRow(dbRow);
  assert(slot.coachId === 'c1', 'slot.coachId 转换正确');
  assert(slot.venueId === 'v1', 'slot.venueId 转换正确');
  assert(slot.startTime === '09:00', 'slot.startTime 转换正确');
  assert(slot.isAvailable === true, 'slot.isAvailable 布尔转换正确');

  const dbInsert = coachSlotToDbInsert({
    coachId: 'c1',
    venueId: 'v2',
    date: '2026-07-13',
    startTime: '10:00',
    endTime: '11:00',
    isAvailable: false,
  });
  assert(dbInsert.coach_id === 'c1', 'toDbInsert coach_id 正确');
  assert(dbInsert.is_available === false, 'toDbInsert is_available 正确');
}

// --- Appointment mapper ---
console.log('\n5. Appointment Mapper');
{
  const dbRow = {
    id: 'a1',
    student_id: 'u1',
    coach_id: 'c1',
    venue_id: 'v1',
    date: '2026-07-12',
    start_time: '09:00',
    end_time: '10:00',
    status: 'pending',
    training_note: '想练胸',
    cancel_reason: null,
    cancelled_at: null,
    cancelled_by: null,
    created_at: '2026-07-10T10:00:00.000Z',
    updated_at: null,
  };
  const appt = appointmentFromDbRow(dbRow);
  assert(appt.studentId === 'u1', 'appt.studentId 转换正确');
  assert(appt.coachId === 'c1', 'appt.coachId 转换正确');
  assert(appt.venueId === 'v1', 'appt.venueId 转换正确');
  assert(appt.startTime === '09:00', 'appt.startTime 转换正确');
  assert(appt.status === 'pending', 'appt.status 正确');
  assert(appt.trainingNote === '想练胸', 'appt.trainingNote 转换正确');
  assert(appt.cancelReason === undefined, 'appt.cancelReason null → undefined 正确');

  const dbInsert = appointmentToDbInsert({
    studentId: 'u2',
    coachId: 'c2',
    venueId: 'v2',
    date: '2026-07-13',
    startTime: '14:00',
    endTime: '15:00',
    status: 'approved',
    createdAt: '2026-07-11T00:00:00.000Z',
  });
  assert(dbInsert.student_id === 'u2', 'toDbInsert student_id 正确');
  assert(dbInsert.start_time === '14:00', 'toDbInsert start_time 正确');
  assert('cancel_reason' in dbInsert === false, '可选字段未定义时不插入 cancel_reason');
}

// --- Announcement mapper ---
console.log('\n6. Announcement Mapper');
{
  const dbRow = {
    id: 'ann1',
    title: '测试公告',
    content: '公告内容',
    is_pinned: true,
    status: 'published',
    published_at: '2026-07-10T00:00:00.000Z',
  };
  const ann = announcementFromDbRow(dbRow);
  assert(ann.isPinned === true, 'ann.isPinned 转换正确');
  assert(ann.publishedAt === '2026-07-10T00:00:00.000Z', 'ann.publishedAt 转换正确');

  const dbInsert = announcementToDbInsert({
    title: '新公告',
    content: '内容',
    isPinned: false,
    status: 'draft',
    publishedAt: '2026-07-12T00:00:00.000Z',
  });
  assert(dbInsert.is_pinned === false, 'toDbInsert is_pinned 正确');
}

// --- Notification mapper ---
console.log('\n7. Notification Mapper');
{
  const dbRow = {
    id: 'n1',
    user_id: 'u1',
    type: 'booking_approved',
    title: '预约已确认',
    content: '您的预约已通过',
    read: false,
    related_id: 'a1',
    created_at: '2026-07-11T00:00:00.000Z',
  };
  const notif = notificationFromDbRow(dbRow);
  assert(notif.userId === 'u1', 'notif.userId 转换正确');
  assert(notif.read === false, 'notif.read 布尔转换正确');
  assert(notif.relatedId === 'a1', 'notif.relatedId 转换正确');
  assert(notif.type === 'booking_approved', 'notif.type 正确');
}

// --- TrainingRecord mapper ---
console.log('\n8. TrainingRecord Mapper');
{
  const dbRow = {
    id: 'tr1',
    user_id: 'u1',
    appointment_id: 'a1',
    date: '2026-07-12',
    duration: 60,
    workout_type: '力量训练',
    intensity: 'medium',
    calories: 300,
    note: '状态不错',
    photo_url: null,
    created_at: '2026-07-12T12:00:00.000Z',
  };
  const rec = trainingRecordFromDbRow(dbRow);
  assert(rec.userId === 'u1', 'rec.userId 转换正确');
  assert(rec.appointmentId === 'a1', 'rec.appointmentId 转换正确');
  assert(rec.workoutType === '力量训练', 'rec.workoutType 转换正确');
  assert(rec.intensity === 'medium', 'rec.intensity 正确');
  assert(rec.calories === 300, 'rec.calories 数字转换正确');
  assert(rec.note === '状态不错', 'rec.note 正确');
  assert(rec.photoUrl === undefined, 'rec.photoUrl null → undefined 正确');
}

// --- userToDbUpdate 部分更新测试 ---
console.log('\n9. Update 部分字段测试');
{
  const update = userToDbUpdate({
    violationCount: 1,
    bannedUntil: '2026-07-20T00:00:00.000Z',
  });
  assert('violation_count' in update && update.violation_count === 1, 'userToDbUpdate 只包含指定字段 violation_count');
  assert('banned_until' in update, 'userToDbUpdate 只包含指定字段 banned_until');
  assert('student_id' in update === false, 'userToDbUpdate 不包含未指定字段');
}

// --- 类型断言安全检查 ---
console.log('\n10. 类型安全验证');
{
  const emptyRow: Record<string, unknown> = {};
  const user = userFromDbRow(emptyRow);
  assert(typeof user.id === 'string', '空 row → user.id 为字符串（不是 undefined）');
  assert(typeof user.studentId === 'string', '空 row → user.studentId 为字符串');
  assert(typeof user.violationCount === 'number', '空 row → violationCount 为数字（0）');
  assert(user.bannedUntil === null, '空 row → bannedUntil 为 null');
  assert(Array.isArray(user.favoriteCoaches) === false, '空 row → favoriteCoaches 为 undefined');
}

// --- localStorage key 迁移逻辑模拟 ---
console.log('\n11. localStorage key 迁移逻辑');
{
  const SESSION_USER_KEY = 'ff_session_user_id';
  const LEGACY_KEYS = ['ff_current_user_id', 'ff_hybrid_current_user_id'];

  function simulateMigrate(store: Map<string, string>): void {
    if (store.has(SESSION_USER_KEY)) return;
    for (const oldKey of LEGACY_KEYS) {
      const val = store.get(oldKey);
      if (val !== undefined) {
        store.set(SESSION_USER_KEY, val);
        store.delete(oldKey);
        return;
      }
    }
  }

  // 测试旧 key ff_current_user_id 迁移
  const store1 = new Map<string, string>();
  store1.set('ff_current_user_id', 'u1');
  simulateMigrate(store1);
  assert(store1.get(SESSION_USER_KEY) === 'u1', 'ff_current_user_id → canonical key 迁移成功');
  assert(!store1.has('ff_current_user_id'), '迁移后旧 key 被删除');

  // 测试旧 key ff_hybrid_current_user_id 迁移
  const store2 = new Map<string, string>();
  store2.set('ff_hybrid_current_user_id', 'u2');
  simulateMigrate(store2);
  assert(store2.get(SESSION_USER_KEY) === 'u2', 'ff_hybrid_current_user_id → canonical key 迁移成功');
  assert(!store2.has('ff_hybrid_current_user_id'), '迁移后旧 key 被删除');

  // 测试已有 canonical key 不迁移
  const store3 = new Map<string, string>();
  store3.set(SESSION_USER_KEY, 'u3');
  store3.set('ff_current_user_id', 'u1_legacy');
  simulateMigrate(store3);
  assert(store3.get(SESSION_USER_KEY) === 'u3', '已有 canonical key 时不覆盖');

  // 测试无 key 不报错
  const store4 = new Map<string, string>();
  simulateMigrate(store4);
  assert(store4.size === 0, '无 key 时不创建数据');
}

console.log(`\n=== 结果：${passed} 通过，${failed} 失败 ===`);

if (failed > 0) {
  process.exit(1);
}
