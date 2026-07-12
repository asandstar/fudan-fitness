# 审计验证报告 — AUDIT_VERIFICATION

> 验证时间：2026-07-12
> 更新时间：2026-07-12（Phase 1B 完成后）
> 验证方式：代码静态分析（grep + 精确行号核对）+ 单元测试脚本 + TypeScript typecheck + Lint + Build
> 验证基准：2026-07-12 上一轮审计产出的 SYSTEM_STATUS、GOLDEN_PATH、KNOWN_ISSUES、STABILIZATION_PLAN

---

## 验证口径

| 级别 | 含义 |
|------|------|
| Static Verified | 通过代码静态检查确认 |
| Script Verified | 通过 scripts/verify-phase1a.ts 验证 |
| Browser Verified | 通过真实浏览器页面操作验证 |
| Supabase Runtime Verified | 连接真实 Supabase 项目验证 |

---

## 一、文档存在性验证

| 文档 | 声称路径 | 实际存在 | 备注 |
|------|----------|----------|------|
| SYSTEM_STATUS.md | `docs/SYSTEM_STATUS.md` | ✅ 是 | 17699 字节 |
| GOLDEN_PATH.md | `docs/GOLDEN_PATH.md` | ✅ 是 | 11778 字节 |
| KNOWN_ISSUES.md | `docs/KNOWN_ISSUES.md` | ✅ 是 | 22730 字节 |
| STABILIZATION_PLAN.md | `docs/STABILIZATION_PLAN.md` | ✅ 是 | 17698 字节 |

**结论：4 份文档均真实存在。**

---

## 二、关键结论逐条验证

### V-01：AppContext 初始化调用 `login('', '')`

| 维度 | 详情 |
|------|------|
| 上轮结论 | AppContext 第 147-160 行 useEffect 调用 `login('', '')` 而非 `getCurrentUser()` |
| 验证方式 | grep 源码 + 精确读取 |
| 实际代码位置 | [AppContext.tsx L150](../src/context/AppContext.tsx#L150) |
| 实际代码 | `const user = await login('', '');` |
| 验证结果 | ✅ **Confirmed** |

---

### V-02：`getCurrentUser` 已实现但未被使用

| 维度 | 详情 |
|------|------|
| 上轮结论 | api.ts 和 hybrid-store.ts 都已实现 getCurrentUser，但 AppContext 从未调用 |
| 验证方式 | grep `getCurrentUser` 全文 |
| api.ts | 第 113 行 `export async function getCurrentUser()` — ✅ 存在 |
| hybrid-store.ts | 第 537 行 `export async function getCurrentUser()` — ✅ 存在 |
| AppContext | 未 import，未调用 — ✅ 确认 |
| 验证结果 | ✅ **Confirmed** |

---

### V-03：api.ts 缺少 snake_case → camelCase 显式转换

| 维度 | 详情 |
|------|------|
| 上轮结论 | 所有 Supabase 查询返回值直接 `as User` 强制类型断言 |
| 验证方式 | grep `as (User\|Venue\|Coach...)` |
| 统计结果 | 共 14 处不安全断言，覆盖 User(3)、Venue(1)、CoachProfile(1)、CoachSlot(2)、Appointment(2)、Notification(1)、TrainingRecord(2)、Announcement(1)、User[](1) |
| 验证结果 | ✅ **Confirmed** |

---

### V-04：Supabase 返回 snake_case 直接被断言为 camelCase 类型

| 维度 | 详情 |
|------|------|
| 上轮结论 | DB 返回 `student_id`，代码期望 `studentId`，直接 as 断言掩盖差异 |
| 验证方式 | 比对 schema 列名与 types.ts 字段名 |
| schema 列名 | `student_id`、`created_at`、`is_available`、`cert_status` 等 — 全部 snake_case |
| types.ts 字段 | `studentId`、`createdAt`、`isAvailable`、`certStatus` 等 — 全部 camelCase |
| api.ts 返回 | `return data as User` 等 — 无任何转换 |
| 验证结果 | ✅ **Confirmed** |

---

### V-05：`addSlot` 和 `createAnnouncement` 写入 camelCase 对象

| 维度 | 详情 |
|------|------|
| 上轮结论 | insert 时直接传 camelCase 对象给 DB |
| 验证方式 | 精确读取源码 |
| addSlot (api.ts L174-182) | `.insert(slot)`，`slot` 类型为 `Omit<CoachSlot, 'id'>`（camelCase）— ✅ 确认 |
| createAnnouncement (api.ts L353-360) | `.insert(announcement)`，类型含 `isPinned` 等 camelCase — ✅ 确认 |
| 其他写入函数 | `createAppointment` 使用 snake_case 字段构造对象（第 240-261 行）— 那处是正确的 |
| 验证结果 | ✅ **Confirmed**（addSlot 和 createAnnouncement 两处确认存在，其他写入函数部分正确） |

---

### V-06：localStorage 存在两套 current user key

| 维度 | 详情 |
|------|------|
| 上轮结论 | api.ts 用 `ff_current_user_id`，hybrid-store 用 `ff_hybrid_current_user_id` |
| 验证方式 | grep 全文 |
| api.ts 第 27 行 | `const CURRENT_USER_KEY = 'ff_current_user_id';` — ✅ |
| hybrid-store | 使用 `LS_PREFIX + 'current_user_id'`（`ff_hybrid_current_user_id`）— ✅ |
| 验证结果 | ✅ **Confirmed** |

---

### V-07：logout 遗漏清理 violations

| 维度 | 详情 |
|------|------|
| 上轮结论 | logout 清了 notifications 和 trainingRecords，但没清 violations |
| 验证方式 | 读取 logoutHandler |
| 实际代码（第 189-194 行） | `setCurrentUser(null); setNotifications([]); setTrainingRecords([]);` |
| violations 状态 | AppContext 第 60 行定义了 `violations` 状态 — ✅ 存在 |
| logout 中清理情况 | 未清理 — ✅ 确认 |
| 验证结果 | ✅ **Confirmed** |

---

### V-08：十个仅修改 state 的方法

| 维度 | 详情 |
|------|------|
| 上轮结论 | 10 个 Context 方法只操作 state 不调 API |
| 验证方式 | 逐方法核对源码 |

| # | 方法 | 只改 state？ | 行号 | 备注 |
|---|------|-------------|------|------|
| 1 | coachCompleteAppointment | ✅ 是 | 412-438 | 无 try，无 API 调用 |
| 2 | coachUpdateProfile | ✅ 是 | 458-461 | 同步函数，无 API |
| 3 | applyCoach | ✅ 是 | 463-483 | 同步函数，无 API |
| 4 | adminApproveCoach | ✅ 是 | 485-511 | 同步函数，无 API |
| 5 | adminRejectCoach | ✅ 是 | 513-533 | 同步函数，无 API |
| 6 | adminDeleteAnnouncement | ✅ 是 | 543-545 | 同步函数，无 API |
| 7 | adminUnbanUser | ✅ 是 | 547-551 | 同步函数，无 API |
| 8 | markAllNotificationsRead | ✅ 是 | 208-210 | 无 API 调用 |
| 9 | deleteNotification | ✅ 是 | 212-214 | 同步函数，无 API |
| 10 | sweepExpired | ✅ 是 | 221-236 | 无 API 调用 |
| 11 | adminPublishAnnouncement | ⚠️ 有 API 调用 | 535-541 | 调用了 `apiCreateAnnouncement`，上轮审计未列出 |

**验证结果：⚠️ Partially Confirmed**
- 上轮列出的 10 个方法全部确认为只改 state — ✅
- 但上轮遗漏了 adminPublishAnnouncement 是**有** API 调用的（不在"只改 state"列表中）— 上轮列表本身准确
- 实际"只改 state"的方法数量是 10 个（与上轮一致），但上轮没有提到 adminPublishAnnouncement 这个例外

---

### V-09：通知在 setState 回调中发送

| 维度 | 详情 |
|------|------|
| 上轮结论 | coachApprove/Reject/Complete 在 setAppointments 的 map 回调中调用 addNotification |
| 验证方式 | 精确读取源码 |
| coachApproveAppointment（第 356-386 行） | ✅ 在 map 回调中调用 addNotification |
| coachRejectAppointment（第 388-410 行） | ✅ 在 map 回调中调用 addNotification |
| coachCompleteAppointment（第 412-438 行） | ✅ 在 map 回调中调用 addNotification |
| 验证结果 | ✅ **Confirmed** |

---

### V-10：Schema 缺 violations 表

| 维度 | 详情 |
|------|------|
| 上轮结论 | schema_v2.sql 无 violations 表，但 types.ts 有 ViolationRecord 接口 |
| 验证方式 | grep schema_v2.sql |
| schema 中表数量 | profiles、coach_profiles、venues、coach_slots、appointments、announcements、notifications、training_records — 共 8 张 |
| 无 violations 表 | ✅ 确认 |
| 验证结果 | ✅ **Confirmed** |

---

### V-11：Schema 缺 venues 表 5 列

| 维度 | 详情 |
|------|------|
| 上轮结论 | venues 缺 contact_phone、tips、rules、map_image_url、image_url |
| 验证方式 | 比对 schema 与 types.ts Venue |
| schema venues 列 | id, name, campus, address, open_time, close_time, capacity, facilities, description, bookable, display_order, features, layout_info, peak_hours, transportation, created_at, updated_at — 共 17 列 |
| types.ts Venue 额外字段 | contactPhone、tips、rules、mapImageUrl、imageUrl — 5 个 |
| 验证结果 | ✅ **Confirmed** |

---

### V-12：教练姓名与关联用户不匹配（c9/c10）

| 维度 | 详情 |
|------|------|
| 上轮结论 | c9（孙婷婷）关联 u7（周佳琪），c10（周文博）关联 u8（林浩然） |
| 验证方式 | 静态核对 mock-data.ts |
| mock-data.ts c9（L700-L704） | `userId='u7'`, `name='孙婷婷'`, `department='管理学院'`, `grade='2023级'` |
| mock-data.ts u7（L105-L110） | `name='周佳琪'`, `department='管理学院'`, `grade='2023级'` → 姓名**不匹配**（孙婷婷 ≠ 周佳琪） |
| mock-data.ts c10（L717-L721） | `userId='u8'`, `name='周文博'`, `department='数学科学学院'`, `grade='2021级'` |
| mock-data.ts u8（L117-L122） | `name='林浩然'`, `department='数学科学学院'`, `grade='2023级'` → 姓名**不匹配**（周文博 ≠ 林浩然），年级**不匹配**（2021级 ≠ 2023级） |
| seed_full.sql | coach_profiles 表 INSERT 列表无 name 列（L148：`id, user_id, specialties, style_desc, ...`），c9/c10 姓名应来自关联用户，但 mock-data.ts 中 coach 自带 name 字段与 user 不一致（ISSUE-018 已确认） |
| 验证结果 | ✅ **Confirmed** |

---

## 三、文档内容与代码一致性检查

| 检查项 | 结果 | 说明 |
|--------|------|------|
| SYSTEM_STATUS 模块完成度 | ✅ 基本一致 | 完成度描述与代码状态吻合 |
| KNOWN_ISSUES 问题描述 | ✅ 一致 | 已验证的 11 个结论全部准确 |
| STABILIZATION_PLAN 任务 | ✅ 一致 | 任务列表合理 |
| GOLDEN_PATH 流程步骤 | ⚠️ 部分夸大 | 文档暗示"已确认可用的功能"超出实际验证范围，部分基于代码推断而非运行验证 |

---

## 四、上轮审计中发现的不准确之处

### A-01：adminPublishAnnouncement 未被列入"有 API 调用"的例外

上轮审计列出了 10 个"只改 state"的方法，但未明确说明 adminPublishAnnouncement 是**有** API 调用的。上轮列表本身（10 个方法）是准确的，但背景信息不完整。

### A-02：GOLDEN_PATH 中"刷新后预约仍然存在"的结论过于绝对

GOLDEN_PATH 文档步骤 6 验收标准写"刷新后用户登出"，这是准确的。但 SYSTEM_STATUS 中"Mock 模式下可用的功能"列表给人的印象是预约可持久化——实际上预约确实写入 localStorage，问题在于刷新后用户登出导致看不到。

### A-03：未提到 api.ts 的 createAppointment 写入方式是正确的

上轮审计强调了 addSlot 和 createAnnouncement 的写入问题，但没有说明 createAppointment 等其他写入函数其实已经在正确使用 snake_case。这一点对理解问题范围有帮助。

## 五、Phase 1A 修复后状态验证

> 验证时间：2026-07-12
> 验证方式：代码静态分析 + 单元测试脚本 + TypeScript typecheck + Lint + Build

### 已修复的问题

| # | 问题 | 对应 ISSUE | 原结论 | 修复后状态 | 验证方式 | 验证级别 |
|---|------|-----------|--------|------------|----------|----------|
| 1 | AppContext 初始化调用 `login('', '')` | ISSUE-001 | Confirmed | ✅ **Fixed** | 已替换为 `getCurrentUser()`，见 AppContext.tsx L156-L183 | Static Verified + Script Verified |
| 2 | `getCurrentUser` 未被使用 | ISSUE-001 | Confirmed | ✅ **Fixed** | AppContext 初始化和 loginHandler 均使用 | Static Verified + Script Verified |
| 3 | api.ts 缺少 snake_case 转换 | ISSUE-002 | Confirmed | ✅ **Fixed** | 新增 db-mappers.ts，所有读取函数使用 mapper，删除 as 断言 | Static Verified + Script Verified |
| 4 | snake_case 直接断言为 camelCase | ISSUE-002 | Confirmed | ✅ **Fixed** | 8 个实体均有 fromDbRow 显式转换 | Static Verified + Script Verified |
| 5 | addSlot/createAnnouncement 写入 camelCase | ISSUE-002 | Confirmed | ✅ **Fixed** | addSlot、createAnnouncement、registerByStudentId 等使用 toDbInsert | Static Verified + Script Verified |
| 6 | localStorage 两套 key | ISSUE-006 | Confirmed | ✅ **Fixed** | 统一为 `ff_session_user_id`，支持旧 key 迁移 | Static Verified + Script Verified |
| 7 | logout 遗漏清理 violations | ISSUE-007 | Confirmed | ✅ **Fixed** | logoutHandler 添加 setViolations([]) | Static Verified |
| 8 | 10 个仅修改 state 的方法 | ISSUE-003 | Partially Confirmed | ⏳ **Deferred** | 本轮不处理，留待 Phase 1B | — |

### 新增交付物

1. [src/lib/db-mappers.ts](../src/lib/db-mappers.ts) — 8 个实体的数据转换层
2. [scripts/verify-phase1a.ts](../scripts/verify-phase1a.ts) — 73 个 mapper 和会话回归验证用例
3. `initError` 状态 — 初始化错误不再静默吞掉

### 构建验证

| 检查项 | 结果 | 验证级别 |
|--------|------|----------|
| TypeScript typecheck (`npx tsc --noEmit`) | ✅ 通过，0 错误 | Static Verified |
| Lint (`npm run lint`) | ✅ 通过（1 个无关警告） | Static Verified |
| Build (`npm run build`) | ✅ 通过，14 个页面全部生成 | Static Verified |
| 验证脚本 (`npx tsx scripts/verify-phase1a.ts`) | ✅ 73/73 通过 | Script Verified |

### 未解决（留待下一轮）

1. 10 个仅修改 state 的方法不持久化（ISSUE-003）
2. cancelBooking 违约记录不写入 DB（ISSUE-004）
3. 并发预约冲突（ISSUE-005）
4. Schema 缺少 violations 表和部分列（ISSUE-013, 014, 015）
5. 通知在 setState 回调中发送（ISSUE-011）
6. createBooking 通知重复（ISSUE-012）
7. 多处空 catch 吞错（ISSUE-010，本轮仅修复了初始化和 refreshData）
8. 防重复提交（ISSUE-009）

---

## 六、验证总结

| 类别 | 数量 |
|------|------|
| ✅ Confirmed（完全确认） | 11 项 |
| ⚠️ Partially Confirmed（部分确认） | 1 项（10 个方法列表准确，但未提及例外） |
| ❌ Not Confirmed（未确认） | 0 项 |
| ⏳ Requires Runtime Verification | 0 项 |

**总体评价：上一轮审计质量较高，核心结论基本准确。** 主要偏差在于对部分细节的描述不够完整（如 adminPublishAnnouncement 有 API 调用），以及少量未验证的推断性结论（如 mock 数据一致性）。

---

## 七、本轮实施前的状态确认

进入 Phase 1A 实施前，确认以下基础事实：

1. ✅ 工作目录：`fudan-fitness`
2. ✅ git 状态：无已跟踪文件修改，docs 目录存在未跟踪文件。
3. ✅ 4 份审计文档真实存在
4. ✅ 无测试框架（package.json 无 jest/vitest/playwright）
5. ✅ TypeScript 可用（typescript 5.6.3）
6. ✅ ESLint 可用（eslint 8.57.1 + eslint-config-next）
7. ✅ Next.js build 可用

---

## 八、Phase 1B 修复后状态验证

> 验证时间：2026-07-12
> 验证方式：代码静态分析 + 单元测试脚本（verify-phase1b.ts）+ TypeScript typecheck + Lint + Build + grep 检查

### 已修复的问题

| # | 问题 | 对应 ISSUE | 原结论 | 修复后状态 | 验证方式 | 验证级别 |
|---|------|-----------|--------|------------|----------|----------|
| 1 | 9 个 Context 方法只改 state 不调 API | ISSUE-003 | Confirmed | ⚠️ Partially Fixed | 9 个方法接入 hybrid-store 持久化，sweepExpired 排除 | Static Verified + Script Verified |
| 2 | 通知在 setState 回调中发送 | ISSUE-011 | Confirmed | ✅ Fixed | 9 个方法 updater 为纯函数，通知在 updater 之外发送 | Static Verified + Script Verified |
| 3 | createBooking 重复通知 | ISSUE-012 | Confirmed | ✅ Fixed | 数据层不创建通知，统一由 Context 层发送 | Static Verified + Script Verified |
| 4 | 多处空 catch 吞错 | ISSUE-010 | Confirmed | ✅ Fixed | 9 个方法错误向上抛出，页面 try/catch 捕获 | Static Verified + Script Verified |
| 5 | 大量异步操作无防重复提交 | ISSUE-009 | Confirmed | ✅ Fixed | 5 个页面增加 loadingKeys/action key | Static Verified + Script Verified |
| 6 | Admin 删除公告/解禁用户无确认弹窗 | ISSUE-021 | Confirmed | ✅ Fixed | 新增 Modal 确认弹窗 | Static Verified + Script Verified |
| 7 | Coach Complete 无确认弹窗 | ISSUE-022 | Confirmed | ✅ Fixed | 新增 completeTarget 确认弹窗 | Static Verified + Script Verified |

### 新增交付物

1. [scripts/verify-phase1b.ts](../scripts/verify-phase1b.ts) — 51 个验证用例覆盖持久化、通知、静态扫描
2. [src/lib/db-mappers.ts](../src/lib/db-mappers.ts) — 新增 `coachProfileToSafeDbUpdate` 白名单过滤函数
3. `getErrorMessage(error: unknown): string` — 错误归一化工具（AppContext.tsx）
4. hybrid-store 9 个新接口：`completeAppointment`、`updateCoachProfile`、`applyCoach`、`approveCoach`、`rejectCoach`、`deleteAnnouncement`、`unbanUser`、`markAllNotificationsRead`、`deleteNotification`

### 9 个方法实现矩阵

| # | 方法 | api.ts | hybrid-store Mock | hybrid-store Supabase 路由 | Context 调用 |
|---|------|--------|-------------------|---------------------------|-------------|
| 1 | coachCompleteAppointment | ✅ completeAppointment | ✅ mockCompleteAppointment | ✅ | ✅ |
| 2 | coachUpdateProfile | ✅ updateCoachProfile（白名单） | ✅ mockUpdateCoachProfile | ✅ | ✅ |
| 3 | applyCoach | ✅ applyCoach | ✅ mockApplyCoach | ✅ | ✅ |
| 4 | adminApproveCoach | ✅ approveCoach（重写） | ✅ mockApproveCoach | ✅ | ✅ |
| 5 | adminRejectCoach | ✅ rejectCoach（重写） | ✅ mockRejectCoach | ✅ | ✅ |
| 6 | adminDeleteAnnouncement | ✅ deleteAnnouncement | ✅ mockDeleteAnnouncement | ✅ | ✅ |
| 7 | adminUnbanUser | ✅ unbanUser | ✅ mockUnbanUser | ✅ | ✅ |
| 8 | markAllNotificationsRead | ✅ markAllNotificationsRead | ✅ mockMarkAllNotificationsRead | ✅ | ✅ |
| 9 | deleteNotification | ✅ deleteNotification | ✅ mockDeleteNotification | ✅ | ✅ |

### 通知职责最终归属

| 操作 | 数据层职责 | Context 层职责 |
|------|-----------|---------------|
| createBooking | 只持久化 appointment | 发送教练通知 + 学员通知 |
| approveAppointment | 只持久化 status 更新 | 发送学员通知 |
| rejectAppointment | 只持久化 status + reason 更新 | 发送学员通知 |
| completeAppointment | 只持久化 status + totalSessions 更新 | 发送学员通知 |

> 数据层（hybrid-store/mock）已移除所有通知创建代码，添加注释 `// Phase 1B: 通知职责归 Context 层`。

### 构建验证

| 检查项 | 结果 | 验证级别 |
|--------|------|----------|
| TypeScript typecheck (`npx tsc --noEmit`) | ✅ 通过，0 错误 | Static Verified |
| Lint (`npm run lint`) | ✅ 通过（1 个无关警告） | Static Verified |
| Build (`npm run build`) | ✅ 通过，14 个页面全部生成 | Static Verified |
| Phase 1A 验证脚本 (`npx tsx scripts/verify-phase1a.ts`) | ✅ 73/73 通过（无回归） | Script Verified |
| Phase 1B 验证脚本 (`npx tsx scripts/verify-phase1b.ts`) | ✅ 51/51 通过 | Script Verified |
| grep 检查空 catch | ✅ 无真正空 catch | Static Verified |
| grep 检查 setState updater 中的 addNotification | ✅ 无 | Static Verified |
| grep 检查本机绝对路径 | ✅ 无 | Static Verified |

### 未解决（留待后续阶段）

1. sweepExpired 不持久化且无人调用（ISSUE-019，留待 Phase 2 定时任务）
2. cancelBooking 违约记录不写入 DB（ISSUE-004，留待 Phase 2 violations 表）
3. 并发预约冲突（ISSUE-005，留待 Phase 2 唯一索引）
4. Schema 缺少 violations 表和部分列（ISSUE-013, 014, 015，留待 Phase 2）
5. 多表更新非原子（如 adminApproveCoach 同时更新 coach_profiles 和 profiles，留待 Phase 2 事务）
6. 客户端权限保护不足（adminApproveCoach 等仅 Context 层校验 role，留待 Phase 3 RLS）
7. Mock 浏览器完整 Golden Path：Browser Verification Pending
8. 真实 Supabase 环境读写：Supabase Runtime Verification Pending
