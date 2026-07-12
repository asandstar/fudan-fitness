# 稳定化修复计划 — STABILIZATION_PLAN

> 生成时间：2026-07-12
> 更新时间：2026-07-12（Phase 1B 完成后校准）
> 基于：SYSTEM_STATUS.md + GOLDEN_PATH.md + KNOWN_ISSUES.md
> 原则：小范围、低风险修复，不新增功能，不重写项目

---

## Phase 1A：基础设施修复

**状态：Completed**

### 已完成项

| # | 任务 | 对应 ISSUE | 验证级别 |
|---|------|-----------|----------|
| 1 | 会话恢复（getCurrentUser 接入 AppContext） | ISSUE-001 | Static Verified + Script Verified |
| 2 | 数据 mapper（db-mappers.ts，8 个实体） | ISSUE-002 | Static Verified + Script Verified |
| 3 | localStorage key 统一和迁移 | ISSUE-006 | Static Verified + Script Verified |
| 4 | logout 私有状态清理（violations） | ISSUE-007 | Static Verified |
| 5 | Phase 1A 验证脚本（scripts/verify-phase1a.ts） | — | Script Verified（73/73 通过） |

### 验证结果

| 检查项 | 结果 |
|--------|------|
| TypeScript typecheck (`npx tsc --noEmit`) | ✅ 0 错误 |
| Lint (`npm run lint`) | ✅ 通过（1 个无关警告） |
| Build (`npm run build`) | ✅ 14 页面全部生成 |
| 验证脚本 (`npx tsx scripts/verify-phase1a.ts`) | ✅ 73/73 通过 |

### 未覆盖

- Mock 浏览器完整 Golden Path：Browser Verification Pending
- 真实 Supabase 环境读写：Supabase Runtime Verification Pending

---

## Phase 1B：业务写入和交互稳定化

**状态：Completed**

### 范围

1. 修复 9 个用户主动触发但不持久化的方法（ISSUE-003 中的 9 个，不含 sweepExpired）。
2. 移除 setState updater 中的异步通知副作用（ISSUE-011）。
3. 修复 createBooking 重复通知（ISSUE-012）。
4. Context 方法不得静默吞错（ISSUE-010）。
5. 页面增加 loading、防重复提交和失败提示（ISSUE-009）。
6. 不修改数据库 Schema。
7. 不实现 RPC。
8. 不接入 Auth 或 RLS。

### 已完成项

| # | 任务 | 对应 ISSUE | 验证级别 |
|---|------|-----------|----------|
| 1 | 9 个 Context 方法接入 hybrid-store 持久化 | ISSUE-003 | Static Verified + Script Verified |
| 2 | 移除 setState updater 中的异步通知副作用 | ISSUE-011 | Static Verified + Script Verified |
| 3 | 修复 createBooking 重复通知（数据层不创建通知） | ISSUE-012 | Static Verified + Script Verified |
| 4 | Context 方法错误传播（移除空 catch） | ISSUE-010 | Static Verified + Script Verified |
| 5 | 5 个页面 loading/防重复提交/错误反馈 | ISSUE-009 | Static Verified + Script Verified |
| 6 | Admin 删除公告/解禁用户确认弹窗 | ISSUE-021 | Static Verified + Script Verified |
| 7 | Coach Complete 确认弹窗 | ISSUE-022 | Static Verified + Script Verified |
| 8 | Phase 1B 验证脚本（scripts/verify-phase1b.ts） | — | Script Verified（51/51 通过） |

### 9 个已修复方法

| # | 方法 | Mock 持久化路径 | Supabase 持久化路径 |
|---|------|----------------|---------------------|
| 1 | `coachCompleteAppointment` | localStorage `ff_hybrid_appointments` + `ff_hybrid_coaches` | appointments 表 + coach_profiles 表 |
| 2 | `coachUpdateProfile` | localStorage `ff_hybrid_coaches` | coach_profiles 表（白名单过滤） |
| 3 | `applyCoach` | localStorage `ff_hybrid_coaches` | coach_profiles 表 INSERT |
| 4 | `adminApproveCoach` | localStorage `ff_hybrid_coaches` + `ff_hybrid_users` | coach_profiles 表 + profiles 表 |
| 5 | `adminRejectCoach` | localStorage `ff_hybrid_coaches` | coach_profiles 表 |
| 6 | `adminDeleteAnnouncement` | localStorage `ff_hybrid_announcements` | announcements 表 DELETE |
| 7 | `adminUnbanUser` | localStorage `ff_hybrid_users` | profiles 表 |
| 8 | `markAllNotificationsRead` | localStorage `ff_hybrid_notifications` | notifications 表 |
| 9 | `deleteNotification` | localStorage `ff_hybrid_notifications` | notifications 表 DELETE |

> sweepExpired 排除（需要定时任务基础设施，留待 Phase 2）。

### 统一修复模式

```typescript
// 修改后
const someMethod = useCallback(async (id: string) => {
  await apiSomeOperation(id);  // 先调 API（失败时抛出 Error）
  setSomeState(prev => prev.map(...));  // 再更新 state（纯函数 updater）
  // 通知在 updater 之外发送，try/catch 不阻断主流程
  try { await addNotification(...); } catch (e) { console.warn(...); }
}, []);
```

### 验证结果

| 检查项 | 结果 |
|--------|------|
| TypeScript typecheck (`npx tsc --noEmit`) | ✅ 0 错误 |
| Lint (`npm run lint`) | ✅ 通过（1 个无关警告） |
| Build (`npm run build`) | ✅ 14 页面全部生成 |
| Phase 1A 验证脚本 (`npx tsx scripts/verify-phase1a.ts`) | ✅ 73/73 通过（无回归） |
| Phase 1B 验证脚本 (`npx tsx scripts/verify-phase1b.ts`) | ✅ 51/51 通过 |
| grep 检查空 catch | ✅ 无真正空 catch |
| grep 检查 setState updater 中的 addNotification | ✅ 无 |
| grep 检查本机绝对路径 | ✅ 无 |

### 未覆盖

- Mock 浏览器完整 Golden Path：Browser Verification Pending
- 真实 Supabase 环境读写：Supabase Runtime Verification Pending
- sweepExpired 定时执行：留待 Phase 2
- 数据库事务原子性：9 个方法的多表更新非原子，留待 Phase 2 文档记录

---

## Phase 2：数据库一致性

**状态：Deferred**

### 范围

1. 并发预约约束（ISSUE-005）— 添加部分唯一索引
2. violations 表（ISSUE-013, ISSUE-004）— 新增表 + cancelBooking 违约持久化
3. 预约状态事务（可选 RPC，ISSUE-005 补充）
4. Schema 缺失字段（ISSUE-014, ISSUE-015）— venues 5 列、coach_profiles 2 列
5. Seed 数据修复（ISSUE-016, ISSUE-017, ISSUE-018）
6. mock 数据修复（ISSUE-008, ISSUE-024, ISSUE-025）
7. sweepExpired 定时任务（ISSUE-019）
8. 移除 booking 页面 600ms 人为延迟（ISSUE-020）

---

## Phase 3：认证和权限

**状态：Deferred**

### 范围

1. Supabase Auth 接入
2. profiles 与 auth.users 关联
3. RLS Policy 设计
4. 明文密码迁移（bcrypt/argon2）

---

## 每完成一个 Task 需运行

1. `npx tsc --noEmit` — TypeScript 类型检查
2. `npx next lint` — ESLint 检查
3. `npm run build` — 构建验证

---

## 禁止事项

- 不使用 `any` 类型绕过类型检查
- 不使用 `eslint-disable` 绕过 lint
- 不使用空 catch 块吞掉错误
- 不修改数据库 Schema（Phase 1B 期间）
- 不实现数据库 RPC（Phase 1B 期间）
- 不接入 Supabase Auth 或 RLS（Phase 1B 期间）
