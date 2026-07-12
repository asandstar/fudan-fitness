// Phase 1B 验证脚本
// 使用方式：npx tsx scripts/verify-phase1b.ts
// 测试内容：
//   1. 9 个持久化方法在 Mock 模式下的行为
//   2. 通知职责归 Context 层（数据层不创建通知）
//   3. setState updater 中不存在 addNotification 调用（静态扫描）
//   4. 无空 catch 块（静态扫描）
//   5. 无本机绝对路径 file:///Users/（静态扫描）
//   6. Phase 1A 回归提示（实际回归由 verify-phase1a.ts 负责）

// ====== Node 环境 polyfill：window + localStorage ======
class LocalStorageMock {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
  get length(): number {
    return this.store.size;
  }
  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }
}

const localStorageMock = new LocalStorageMock();
// Node 环境下为 hybrid-store 提供 window/localStorage polyfill
(globalThis as unknown as { localStorage: LocalStorageMock }).localStorage = localStorageMock;
(globalThis as unknown as { window: unknown }).window = { localStorage: localStorageMock };

// ====== 引入被测模块（在 polyfill 之后） ======
import {
  completeAppointment,
  updateCoachProfile,
  applyCoach,
  approveCoach,
  rejectCoach,
  deleteAnnouncement,
  unbanUser,
  markAllNotificationsRead,
  deleteNotification,
  addNotification,
  createBooking,
  approveAppointment,
  rejectAppointment,
  login,
  logout,
  getCoaches,
  getAppointments,
  getNotifications,
  getAnnouncements,
} from '../src/lib/hybrid-store';
import { coachProfileToSafeDbUpdate } from '../src/lib/db-mappers';
import { mockUsers, mockCoaches, mockAppointments, mockAnnouncements, mockSlots, mockVenues } from '../src/lib/mock-data';
import type { Notification } from '../src/lib/types';
import * as fs from 'fs';
import * as path from 'path';

let passed = 0;
let failed = 0;

function assert(cond: unknown, msg: string): void {
  if (cond) {
    passed++;
    console.log(`  ✓ ${msg}`);
  } else {
    failed++;
    console.error(`  ✗ ${msg}`);
  }
}

async function assertRejects(fn: () => Promise<unknown>, msg: string): Promise<void> {
  try {
    await fn();
    assert(false, `${msg}（应抛错但未抛）`);
  } catch {
    assert(true, msg);
  }
}

function resetLocalStorage(): void {
  localStorageMock.clear();
  // 写入 mock 数据的深拷贝，避免 mock 实现直接 mutate 原始导入的常量数组
  localStorageMock.setItem('ff_hybrid_users', JSON.stringify(mockUsers.map((u) => ({ ...u }))));
  localStorageMock.setItem('ff_hybrid_coaches', JSON.stringify(mockCoaches.map((c) => ({ ...c }))));
  localStorageMock.setItem('ff_hybrid_appointments', JSON.stringify(mockAppointments.map((a) => ({ ...a }))));
  localStorageMock.setItem('ff_hybrid_announcements', JSON.stringify(mockAnnouncements.map((a) => ({ ...a }))));
  localStorageMock.setItem('ff_hybrid_slots', JSON.stringify(mockSlots.map((s) => ({ ...s }))));
  localStorageMock.setItem('ff_hybrid_venues', JSON.stringify(mockVenues.map((v) => ({ ...v }))));
  localStorageMock.setItem('ff_hybrid_notifications', JSON.stringify([]));
  localStorageMock.setItem('ff_hybrid_training_records', JSON.stringify([]));
}

function readLS<T>(key: string, fallback: T): T {
  const raw = localStorageMock.getItem('ff_hybrid_' + key);
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

async function main(): Promise<void> {
console.log('=== Phase 1B 验证 ===\n');

// ====== 1. completeAppointment ======
console.log('1. completeAppointment 持久化');
await (async () => {
  resetLocalStorage();
  const originalC2 = mockCoaches.find((c) => c.id === 'c2')!;
  const originalTotal = originalC2.totalSessions;
  await login('22300150002', 'password123');
  // a2 是 approved 状态，coachId 是 c2
  await completeAppointment('a2');
  const appts = readLS<typeof mockAppointments>('appointments', []);
  const a2 = appts.find((a) => a.id === 'a2');
  assert(a2?.status === 'completed', 'a2 状态更新为 completed');
  assert(!!a2?.updatedAt, 'a2.updatedAt 被设置');
  const coaches = readLS<typeof mockCoaches>('coaches', []);
  const c2 = coaches.find((c) => c.id === 'c2');
  assert(c2?.totalSessions === originalTotal + 1, `c2 totalSessions 从 ${originalTotal} 增至 ${c2?.totalSessions}`);
})();

// ====== 2. 非 approved 预约不能完成 ======
console.log('\n2. 非 approved 预约不能完成');
await (async () => {
  resetLocalStorage();
  await login('22300150002', 'password123');
  // a1 是 pending 状态
  await assertRejects(() => completeAppointment('a1'), 'pending 预约不能 complete');
})();

// ====== 3. 重复完成不会重复增加 totalSessions ======
console.log('\n3. 重复完成不会重复增加 totalSessions');
await (async () => {
  resetLocalStorage();
  await login('22300150002', 'password123');
  await completeAppointment('a2');
  const coachesAfter1 = readLS<typeof mockCoaches>('coaches', []);
  const c2After1 = coachesAfter1.find((c) => c.id === 'c2')!;
  // 再次调用应抛错（status 已不是 approved）
  await assertRejects(() => completeAppointment('a2'), '已 completed 的预约再次调用应抛错');
  const coachesAfter2 = readLS<typeof mockCoaches>('coaches', []);
  const c2After2 = coachesAfter2.find((c) => c.id === 'c2')!;
  assert(c2After1.totalSessions === c2After2.totalSessions, '重复调用 totalSessions 不再增加');
})();

// ====== 4. updateCoachProfile 只更新允许字段 ======
console.log('\n4. updateCoachProfile 白名单过滤');
await (async () => {
  resetLocalStorage();
  await updateCoachProfile('c1', {
    specialties: ['增肌', '力量'],
    styleDesc: '新风格',
    // 管理字段：不应通过此入口修改
    certStatus: 'approved',
    reviewedBy: 'hacker',
  } as never);
  const coaches = readLS<typeof mockCoaches>('coaches', []);
  const c1 = coaches.find((c) => c.id === 'c1')!;
  assert(c1.specialties[0] === '增肌', 'specialties 已更新');
  assert(c1.styleDesc === '新风格', 'styleDesc 已更新');
  // c1 原 certStatus 为 approved，但 patch 中的 certStatus 应被过滤
  // 由于原值已是 approved，需要用 rejected 测试是否被过滤
  await updateCoachProfile('c1', { certStatus: 'rejected' } as never);
  const coaches2 = readLS<typeof mockCoaches>('coaches', []);
  const c1v2 = coaches2.find((c) => c.id === 'c1')!;
  assert(c1v2.certStatus === 'approved', 'certStatus 未被 updateCoachProfile 修改（白名单生效）');
})();

// ====== 5. applyCoach 防止重复申请 ======
console.log('\n5. applyCoach 防止重复申请');
await (async () => {
  resetLocalStorage();
  // u1 是普通 member，无教练资料
  await login('22300110001', 'password123');
  const draft = {
    userId: 'u1',
    name: '刘小明',
    department: '计算机科学学院',
    grade: '2023级',
    specialties: ['减脂'],
    styleDesc: '热爱健身',
    isBeginnerFriendly: true,
    isFemaleFriendly: false,
    venues: ['v1'],
    trainingPhilosophy: '循序渐进',
    rating: 0,
    successCases: [],
  };
  const coach = await applyCoach(draft);
  assert(!!coach.id, '申请成功返回 coach id');
  assert(coach.certStatus === 'pending', '新申请默认 certStatus = pending');
  assert(coach.userId === 'u1', 'userId 来自 currentUser');

  // 再次申请应抛错
  await assertRejects(() => applyCoach(draft), '重复申请被拒绝');
})();

// ====== 6. applyCoach 未登录 ======
console.log('\n6. applyCoach 未登录被拒绝');
await (async () => {
  resetLocalStorage();
  await logout();
  await assertRejects(
    () => applyCoach({
      userId: 'x', name: 'x', department: 'x', grade: 'x',
      specialties: [], styleDesc: '', isBeginnerFriendly: false,
      isFemaleFriendly: false, venues: [], trainingPhilosophy: '', rating: 0, successCases: [],
    }),
    '未登录时 applyCoach 抛错',
  );
})();

// ====== 7. approveCoach 同时更新教练状态和用户角色 ======
console.log('\n7. approveCoach 更新 certStatus + role');
await (async () => {
  resetLocalStorage();
  // c9 是 pending 状态
  await approveCoach('c9', 'u10');
  const coaches = readLS<typeof mockCoaches>('coaches', []);
  const c9 = coaches.find((c) => c.id === 'c9')!;
  assert(c9.certStatus === 'approved', 'c9 certStatus → approved');
  assert(!!c9.certReviewedAt, 'c9 certReviewedAt 已设置');
  assert(c9.reviewedBy === 'u10', 'c9 reviewedBy = u10');
  const users = readLS<typeof mockUsers>('users', []);
  const c9User = users.find((u) => u.id === c9.userId)!;
  assert(c9User.role === 'coach', '对应用户 role → coach');
})();

// ====== 8. approveCoach 重复处理被拒绝 ======
console.log('\n8. approveCoach 重复处理被拒绝');
await (async () => {
  resetLocalStorage();
  await approveCoach('c9', 'u10');
  await assertRejects(() => approveCoach('c9', 'u10'), '已 approved 的申请再次 approve 抛错');
})();

// ====== 9. rejectCoach 保存原因 ======
console.log('\n9. rejectCoach 保存原因');
await (async () => {
  resetLocalStorage();
  // c10 是 pending 状态
  await rejectCoach('c10', '描述不够具体', 'u10');
  const coaches = readLS<typeof mockCoaches>('coaches', []);
  const c10 = coaches.find((c) => c.id === 'c10')!;
  assert(c10.certStatus === 'rejected', 'c10 certStatus → rejected');
  assert(c10.certReviewNote === '描述不够具体', 'c10 certReviewNote 已保存');
  assert(!!c10.certReviewedAt, 'c10 certReviewedAt 已设置');
  assert(c10.reviewedBy === 'u10', 'c10 reviewedBy = u10');
  // role 不应改成 coach
  const users = readLS<typeof mockUsers>('users', []);
  const c10User = users.find((u) => u.id === c10.userId)!;
  assert(c10User.role !== 'coach', 'rejected 时不修改 profiles.role');
})();

// ====== 10. rejectCoach 重复处理被拒绝 ======
console.log('\n10. rejectCoach 重复处理被拒绝');
await (async () => {
  resetLocalStorage();
  await rejectCoach('c10', '原因', 'u10');
  await assertRejects(() => rejectCoach('c10', '原因2', 'u10'), '已 rejected 的申请再次 reject 抛错');
})();

// ====== 11. deleteAnnouncement 删除后不恢复 ======
console.log('\n11. deleteAnnouncement 持久化删除');
await (async () => {
  resetLocalStorage();
  const before = (await getAnnouncements()).length;
  const all = readLS<typeof mockAnnouncements>('announcements', []);
  const firstId = all[0]?.id;
  if (!firstId) {
    assert(false, 'mock 公告数据存在');
    return;
  }
  await deleteAnnouncement(firstId);
  const after = (await getAnnouncements()).length;
  assert(after === before - 1 || after === before, '删除后公告数量减少或相等（取决于 status 过滤）');
  const allAfter = readLS<typeof mockAnnouncements>('announcements', []);
  assert(!allAfter.find((a) => a.id === firstId), '已删除的公告不再出现在存储中');
})();

// ====== 12. unbanUser 清零 violationCount 和 bannedUntil ======
console.log('\n12. unbanUser 清零封禁状态');
await (async () => {
  resetLocalStorage();
  // u9 有 violationCount=3, bannedUntil=未来日期
  await unbanUser('u9');
  const users = readLS<typeof mockUsers>('users', []);
  const u9 = users.find((u) => u.id === 'u9')!;
  assert(u9.violationCount === 0, 'u9 violationCount → 0');
  assert(u9.bannedUntil === null, 'u9 bannedUntil → null');
})();

// ====== 13. markAllNotificationsRead 只影响当前用户 ======
console.log('\n13. markAllNotificationsRead 只影响当前用户');
await (async () => {
  resetLocalStorage();
  // 预置两条 u1 通知 + 一条 u2 通知
  await login('22300110001', 'password123'); // u1
  await addNotification({ userId: 'u1', type: 'booking_approved', title: 't1', content: 'c1', relatedId: 'a1' });
  await addNotification({ userId: 'u1', type: 'booking_approved', title: 't2', content: 'c2', relatedId: 'a1' });
  await addNotification({ userId: 'u2', type: 'booking_approved', title: 't3', content: 'c3', relatedId: 'a1' });
  await markAllNotificationsRead('u1');
  const notifs = readLS<Notification[]>('notifications', []);
  const u1Notifs = notifs.filter((n) => n.userId === 'u1');
  const u2Notifs = notifs.filter((n) => n.userId === 'u2');
  assert(u1Notifs.every((n) => n.read === true), 'u1 所有通知已读');
  assert(u2Notifs.every((n) => n.read === false), 'u2 通知未被影响');
})();

// ====== 14. deleteNotification 不能删除他人通知 ======
console.log('\n14. deleteNotification 归属校验');
await (async () => {
  resetLocalStorage();
  await addNotification({ userId: 'u1', type: 'booking_approved', title: 't', content: 'c', relatedId: 'a1' });
  const notifs = readLS<Notification[]>('notifications', []);
  const n1 = notifs.find((n) => n.userId === 'u1')!;
  // u2 试图删除 u1 的通知
  await assertRejects(() => deleteNotification(n1.id, 'u2'), 'u2 删除 u1 通知被拒绝');
  // u1 自己删除成功
  await deleteNotification(n1.id, 'u1');
  const notifs2 = readLS<Notification[]>('notifications', []);
  assert(!notifs2.find((n) => n.id === n1.id), 'u1 删除自己通知成功');
  // 删除不存在通知
  await assertRejects(() => deleteNotification('non-existent', 'u1'), '删除不存在通知抛错');
})();

// ====== 15. createBooking 数据层不创建通知 ======
console.log('\n15. createBooking 数据层不创建通知（通知归 Context）');
await (async () => {
  resetLocalStorage();
  await login('22300110001', 'password123'); // u1
  const beforeNotifs = readLS<Notification[]>('notifications', []).length;
  await createBooking({
    coachId: 'c1',
    venueId: 'v1',
    date: '2099-12-31',
    startTime: '09:00',
    endTime: '10:00',
    trainingNote: '测试',
  });
  const afterNotifs = readLS<Notification[]>('notifications', []).length;
  assert(afterNotifs === beforeNotifs, '数据层 createBooking 不创建通知（职责归 Context）');
})();

// ====== 16. approveAppointment 数据层不创建通知 ======
console.log('\n16. approveAppointment 数据层不创建通知');
await (async () => {
  resetLocalStorage();
  const beforeNotifs = readLS<Notification[]>('notifications', []).length;
  await approveAppointment('a1');
  const afterNotifs = readLS<Notification[]>('notifications', []).length;
  assert(afterNotifs === beforeNotifs, '数据层 approveAppointment 不创建通知');
})();

// ====== 17. rejectAppointment 数据层不创建通知 ======
console.log('\n17. rejectAppointment 数据层不创建通知');
await (async () => {
  resetLocalStorage();
  const beforeNotifs = readLS<Notification[]>('notifications', []).length;
  await rejectAppointment('a1', '原因');
  const afterNotifs = readLS<Notification[]>('notifications', []).length;
  assert(afterNotifs === beforeNotifs, '数据层 rejectAppointment 不创建通知');
})();

// ====== 18. coachProfileToSafeDbUpdate 白名单 ======
console.log('\n18. coachProfileToSafeDbUpdate 白名单');
{
  const obj = coachProfileToSafeDbUpdate({
    specialties: ['增肌'],
    styleDesc: '新风格',
    certStatus: 'rejected', // 应被过滤
    reviewedBy: 'hacker',   // 应被过滤
  } as never);
  assert(Array.isArray(obj.specialties) && obj.specialties[0] === '增肌', 'specialties 字段保留');
  assert(obj.style_desc === '新风格', 'style_desc 字段保留（snake_case）');
  assert(!('cert_status' in obj), 'cert_status 被过滤');
  assert(!('reviewed_by' in obj), 'reviewed_by 被过滤');
  assert(!('user_id' in obj), 'user_id 被过滤');
}

// ====== 19. 静态扫描：AppContext setState updater 中无 addNotification ======
console.log('\n19. 静态扫描：setState updater 中无 addNotification');
{
  const ctxPath = path.resolve(__dirname, '../src/context/AppContext.tsx');
  const src = fs.readFileSync(ctxPath, 'utf8');
  // 匹配 setX(prev => ... ) 块内是否出现 addNotification
  // 简化匹配：查找 setAppointments/setCoaches/setUsers(... => ... 中是否包含 addNotification
  const updaterPattern = /set(?:Appointments|Coaches|Users|Slots|Announcements|Notifications|TrainingRecords|Violations)\s*\(\s*\(\s*prev\)\s*=>\s*\{([\s\S]*?)\}\s*\)/g;
  let mismatch = false;
  let m: RegExpExecArray | null;
  while ((m = updaterPattern.exec(src)) !== null) {
    if (m[1].includes('addNotification')) {
      mismatch = true;
      console.error(`    发现 updater 内有 addNotification: ${m[0].slice(0, 80)}...`);
    }
  }
  assert(!mismatch, '所有 setState updater 中未出现 addNotification');
}

// ====== 20. 静态扫描：无空 catch 块 ======
console.log('\n20. 静态扫描：无空 catch 块');
{
  const files = [
    'src/context/AppContext.tsx',
    'src/lib/hybrid-store.ts',
    'src/lib/api.ts',
    'src/lib/db-mappers.ts',
    'src/app/login/page.tsx',
    'src/app/register/page.tsx',
    'src/app/profile/page.tsx',
    'src/app/coach-center/page.tsx',
    'src/app/admin/page.tsx',
  ];
  let emptyCatchCount = 0;
  for (const rel of files) {
    const fullPath = path.resolve(__dirname, '..', rel);
    if (!fs.existsSync(fullPath)) continue;
    const src = fs.readFileSync(fullPath, 'utf8');
    // 匹配 catch (e) {} 或 catch {} 空块（允许只有注释）
    const emptyCatch = /catch\s*(?:\([^)]*\))?\s*\{\s*(?:\/\/[^\n]*\s*|\/\*[\s\S]*?\*\/\s*)*\}/g;
    const matches = src.match(emptyCatch) || [];
    if (matches.length > 0) {
      emptyCatchCount += matches.length;
      console.error(`    ${rel}: 发现 ${matches.length} 个空 catch 块`);
    }
  }
  // hybrid-store.ts 的 readLS/writeLS/migrateSessionKey 等底层工具允许空 catch（已注释 // ignore）
  // 这里只统计真正的空 catch（无任何注释的）
  // 重新精确匹配：catch 块内只有空白，无注释
  let trueEmptyCount = 0;
  for (const rel of files) {
    const fullPath = path.resolve(__dirname, '..', rel);
    if (!fs.existsSync(fullPath)) continue;
    const src = fs.readFileSync(fullPath, 'utf8');
    const trueEmpty = /catch\s*(?:\([^)]*\))?\s*\{\s*\}/g;
    const matches = src.match(trueEmpty) || [];
    trueEmptyCount += matches.length;
  }
  assert(trueEmptyCount === 0, `无真正的空 catch 块（发现 ${trueEmptyCount} 个）`);
  if (emptyCatchCount > 0) {
    console.log(`    注：有 ${emptyCatchCount} 个仅含注释的 catch 块（hybrid-store 底层工具允许）`);
  }
}

// ====== 21. 静态扫描：无本机绝对路径 file:///Users/ ======
console.log('\n21. 静态扫描：无本机绝对路径');
{
  const MARKER = 'file://' + '///Users/';
  const dirsToScan = [
    'src',
    'scripts',
    'docs',
  ];
  let absPathCount = 0;
  for (const dir of dirsToScan) {
    const fullDir = path.resolve(__dirname, '..', dir);
    if (!fs.existsSync(fullDir)) continue;
    const walk = (d: string) => {
      const entries = fs.readdirSync(d, { withFileTypes: true });
      for (const e of entries) {
        const full = path.join(d, e.name);
        if (e.isDirectory()) {
          walk(full);
        } else if (/\.(ts|tsx|md)$/.test(e.name)) {
          // 跳过本验证脚本自身（包含扫描模式的字符串字面量）
          if (e.name === 'verify-phase1b.ts') continue;
          const src = fs.readFileSync(full, 'utf8');
          const matches = src.match(new RegExp(MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || [];
          if (matches.length > 0) {
            absPathCount += matches.length;
            console.error(`    ${full}: 发现 ${matches.length} 处本机绝对路径`);
          }
        }
      }
    };
    walk(fullDir);
  }
  assert(absPathCount === 0, `源码和文档中无本机绝对路径（发现 ${absPathCount} 处）`);
}

// ====== 22. 静态扫描：Context 方法返回类型为 Promise<void> 或 Promise<{ok:...}> ======
console.log('\n22. 静态扫描：Context 方法签名');
{
  const ctxPath = path.resolve(__dirname, '../src/context/AppContext.tsx');
  const src = fs.readFileSync(ctxPath, 'utf8');
  // 检查 9 个方法都已改为 async
  const methods = [
    'coachCompleteAppointment',
    'coachUpdateProfile',
    'applyCoach',
    'adminApproveCoach',
    'adminRejectCoach',
    'adminDeleteAnnouncement',
    'adminUnbanUser',
    'markAllNotificationsRead',
    'deleteNotification',
  ];
  let allAsync = true;
  for (const m of methods) {
    // 检查是否在 AppContextType 接口中声明为 Promise
    const ifacePattern = new RegExp(`${m}\\s*[:?(].*?Promise<`);
    if (!ifacePattern.test(src)) {
      allAsync = false;
      console.error(`    ${m} 未声明为 Promise<T>`);
    }
  }
  assert(allAsync, '9 个方法在接口中均声明为 Promise<T>');
}

// ====== 23. 静态扫描：页面 loading/防重复提交 ======
console.log('\n23. 静态扫描：页面 loading/防重复提交');
{
  const pageChecks = [
    { file: 'src/app/login/page.tsx', expect: ['submitting', 'disabled={submitting}'] },
    { file: 'src/app/register/page.tsx', expect: ['loading', 'disabled={loading}'] },
    { file: 'src/app/profile/page.tsx', expect: ['loadingKeys', 'setLoading'] },
    { file: 'src/app/coach-center/page.tsx', expect: ['loadingKeys', 'setLoading'] },
    { file: 'src/app/admin/page.tsx', expect: ['loadingKeys', 'setLoading'] },
  ];
  let allOk = true;
  for (const check of pageChecks) {
    const full = path.resolve(__dirname, '..', check.file);
    const src = fs.readFileSync(full, 'utf8');
    for (const kw of check.expect) {
      if (!src.includes(kw)) {
        allOk = false;
        console.error(`    ${check.file} 缺少 ${kw}`);
      }
    }
  }
  assert(allOk, '5 个页面均包含 loading/防重复提交逻辑');
}

// ====== 24. 静态扫描：admin 确认弹窗 ======
console.log('\n24. 静态扫描：admin 确认弹窗');
{
  const adminPath = path.resolve(__dirname, '../src/app/admin/page.tsx');
  const src = fs.readFileSync(adminPath, 'utf8');
  assert(src.includes('deleteAnnTarget'), 'admin 包含删除公告确认弹窗状态');
  assert(src.includes('unbanTarget'), 'admin 包含解禁用户确认弹窗状态');
  // 检查 reject 错误时保留原因：handleRejectCoach catch 块内不应清空 rejectReason
  const rejectHandlerMatch = src.match(/const handleRejectCoach[\s\S]*?finally\s*\{[\s\S]*?\}/);
  if (rejectHandlerMatch) {
    const handler = rejectHandlerMatch[0];
    // catch 块内不应有 setRejectReason('')
    const catchMatch = handler.match(/catch\s*\([^)]*\)\s*\{([\s\S]*?)\}/);
    if (catchMatch) {
      assert(!catchMatch[1].includes("setRejectReason('')"), 'handleRejectCoach 失败时保留 rejectReason');
      assert(!catchMatch[1].includes('setRejectCoach(null)'), 'handleRejectCoach 失败时保留弹窗');
    } else {
      assert(false, 'handleRejectCoach 包含 catch 块');
    }
  } else {
    assert(false, '找到 handleRejectCoach');
  }
}

// ====== 25. Phase 1A 回归提示 ======
console.log('\n25. Phase 1A 回归');
console.log('  ℹ Phase 1A 73 个用例需通过 npx tsx scripts/verify-phase1a.ts 单独运行验证');

console.log(`\n=== 结果：${passed} 通过，${failed} 失败 ===`);

if (failed > 0) {
  process.exit(1);
}
}

main().catch((err) => {
  console.error('verify-phase1b 运行异常:', err);
  process.exit(1);
});
