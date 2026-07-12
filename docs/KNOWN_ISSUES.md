# 已知问题清单 — KNOWN_ISSUES

> 审计时间：2026-07-12
> 更新时间：2026-07-12（Phase 1B 完成后）
> 共发现 28 个问题，按严重级别排列

---

## 验证口径

| 级别 | 含义 |
|------|------|
| Static Verified | 通过代码静态检查确认 |
| Script Verified | 通过 scripts/verify-phase1a.ts 或 verify-phase1b.ts 验证 |
| Browser Verification Pending | 浏览器端到端验证待执行 |
| Supabase Runtime Verification Pending | 真实 Supabase 环境验证待执行 |

---

## P0 — 系统阻断级（5 个）

### ISSUE-001：会话恢复完全失效，刷新即登出

| 维度 | 详情 |
|------|------|
| 编号 | ISSUE-001 |
| 问题标题 | 会话恢复完全失效，刷新即登出 |
| 严重级别 | P0 — 系统阻断 |
| 问题表现 | 每次刷新页面后用户被自动登出，需重新输入账号密码 |
| 影响范围 | 所有页面、所有用户、Mock 和 Supabase 两种模式 |
| 复现步骤 | 1. 任意账号登录 → 2. 按 F5 刷新页面 → 3. 用户被登出，跳转到登录页 |
| 根因判断 | AppContext.tsx 第 147-160 行 useEffect 中调用 `login('', '')` 而非 `getCurrentUser()`。`login('', '')` 传入空字符串，mock 模式返回 null，Supabase 模式抛出"学号或密码错误"被 catch 吞掉。`getCurrentUser()` 函数已在 api.ts 和 hybrid-store.ts 中实现，但从未被导入或调用。 |
| 建议修复方式 | 将 AppContext 初始化改为调用 `getCurrentUser()` 而非 `login('', '')`。同时在 hybrid-store.ts 中导出 `getCurrentUser` 函数。 |
| 涉及文件 | [AppContext.tsx](../src/context/AppContext.tsx#L147-L160)、[hybrid-store.ts](../src/lib/hybrid-store.ts#L537-L542)、[api.ts](../src/lib/api.ts#L113-L125) |
| 当前状态 | ✅ Fixed（Phase 1A） |
| 修复说明 | AppContext 初始化改为调用 `getCurrentUser()` 从本地存储恢复会话；新增 `loadPublicData` 和 `loadUserData` 拆分公共数据和用户私有数据加载；新增 `initError` 状态暴露初始化错误；增加取消标志防止组件卸载后更新 state。 |
| 验证级别 | Static Verified + Script Verified |
| 浏览器验证 | Browser Verification Pending |
| Supabase 验证 | Supabase Runtime Verification Pending |

---

### ISSUE-002：snake_case/camelCase 转换完全缺失

| 维度 | 详情 |
|------|------|
| 编号 | ISSUE-002 |
| 问题标题 | Supabase API 层缺少 snake_case/camelCase 字段转换 |
| 严重级别 | P0 — 系统阻断 |
| 问题表现 | Supabase 模式下所有数据读取返回 undefined，整个应用不可用 |
| 影响范围 | 所有使用 Supabase 的场景（约 20 个 API 函数） |
| 复现步骤 | 1. 配置 NEXT_PUBLIC_SUPABASE_URL 和 ANON_KEY → 2. 登录 → 3. 所有页面数据为空（user.studentId 等字段为 undefined） |
| 根因判断 | api.ts 中所有查询返回值直接 `as User` / `as CoachProfile` 强制转换类型，但 Supabase 返回的是 snake_case（如 `student_id`、`created_at`），前端类型定义是 camelCase（如 `studentId`、`createdAt`）。无任何转换函数。写入方向也有 3 个函数（addSlot、createAnnouncement、toggleSlot 参数）传 camelCase 给 DB。 |
| 建议修复方式 | 1. 添加 `snakeToCamel` 和 `camelToSnake` 转换函数；2. 为每个实体创建转换映射；3. 在所有 API 读取函数返回时做转换；4. 在所有 API 写入函数的 insert/update 时做转换。 |
| 涉及文件 | [api.ts](../src/lib/api.ts)（全文） |
| 当前状态 | ✅ Fixed（Phase 1A） |
| 修复说明 | 新增 `src/lib/db-mappers.ts`，为 User、CoachProfile、Venue、CoachSlot、Appointment、Announcement、Notification、TrainingRecord 8 个实体提供 fromDbRow、toDbInsert、toDbUpdate 显式转换函数；改造 api.ts 所有读取函数使用 mapper，删除所有 `as User` 等不安全类型断言；修复 addSlot、createAnnouncement、registerByStudentId 等写入函数的 camelCase → snake_case 转换。 |
| 验证级别 | Static Verified + Script Verified |
| 浏览器验证 | Browser Verification Pending |
| Supabase 验证 | Supabase Runtime Verification Pending |

---

### ISSUE-003：10 个 Context 方法只更新前端状态不调 API

| 维度 | 详情 |
|------|------|
| 编号 | ISSUE-003 |
| 问题标题 | 10 个 AppContext 方法只操作 React state，数据不持久化 |
| 严重级别 | P0 — 数据丢失 |
| 问题表现 | 教练完成带练、教练修改资料、学员申请教练、管理员审核教练、管理员删除公告、管理员解禁用户等操作刷新后丢失 |
| 影响范围 | 教练中心、管理员后台、个人中心 |
| 复现步骤 | 1. 教练登录 → 2. 点击"完成带练" → 3. UI 显示已完成 → 4. 刷新页面 → 5. 状态恢复为"已确认" |
| 根因判断 | 以下方法在 AppContext 中只有 `setState` 调用，缺少对应的 API 调用：`coachCompleteAppointment`、`coachUpdateProfile`、`applyCoach`、`adminApproveCoach`、`adminRejectCoach`、`adminDeleteAnnouncement`、`adminUnbanUser`、`markAllNotificationsRead`、`deleteNotification`、`sweepExpired`。其中部分方法在 api.ts 中已有对应函数（如 `api.completeAppointment`、`api.approveCoach`、`api.rejectCoach`、`api.deleteAnnouncement`、`api.unbanUser`），但未被调用。 |
| 建议修复方式 | 为每个方法添加对应的 API 调用。对于已有 API 函数的直接接入；对于没有 API 函数的（如 applyCoach、coachUpdateProfile），新增 API 函数。 |
| 涉及文件 | [AppContext.tsx](../src/context/AppContext.tsx)、[api.ts](../src/lib/api.ts)、[hybrid-store.ts](../src/lib/hybrid-store.ts)、[db-mappers.ts](../src/lib/db-mappers.ts) |
| 当前状态 | ⚠️ Partially Fixed（Phase 1B） |
| 修复说明 | 9 个方法已接入 hybrid-store 统一持久化（Mock + Supabase 双路径）：`coachCompleteAppointment`、`coachUpdateProfile`、`applyCoach`、`adminApproveCoach`、`adminRejectCoach`、`adminDeleteAnnouncement`、`adminUnbanUser`、`markAllNotificationsRead`、`deleteNotification`。`sweepExpired` 排除（需要定时任务基础设施，留待 Phase 2）。新增 `coachProfileToSafeDbUpdate` 白名单过滤管理字段。新增 `getErrorMessage` 错误归一化工具。 |
| 验证级别 | Static Verified + Script Verified |
| 浏览器验证 | Browser Verification Pending |
| Supabase 验证 | Supabase Runtime Verification Pending |

---

### ISSUE-004：cancelBooking 违约记录不写入数据库

| 维度 | 详情 |
|------|------|
| 编号 | ISSUE-004 |
| 问题标题 | 取消预约时违约记录只更新 React state，不写入 DB |
| 严重级别 | P0 — 数据丢失 |
| 问题表现 | 学员取消预约产生违约后，刷新页面违约记录消失，violation_count 归零 |
| 影响范围 | 个人中心取消预约、禁约机制 |
| 复现步骤 | 1. 学员预约 → 2. 24h 内取消（产生违约）→ 3. UI 显示违约 → 4. 刷新 → 5. 违约记录消失 |
| 根因判断 | AppContext.tsx 第 332-354 行，cancelBooking 中违约处理只调用 `setViolations` 和 `setUsers`（更新 violationCount 和 bannedUntil），不写入任何持久化存储。schema 中也没有 violations 表。 |
| 建议修复方式 | 1. 在 schema 中添加 violations 表；2. 在 api.ts 中添加 createViolation 和 updateProfileViolationCount 函数；3. 在 cancelBooking 中调用 API 持久化违约记录和用户禁约状态。 |
| 涉及文件 | [AppContext.tsx](../src/context/AppContext.tsx#L332-L354)、[schema_v2.sql](../supabase/schema_v2.sql) |
| 当前状态 | 未修复 |

---

### ISSUE-005：同一教练时段可被并发重复预约

| 维度 | 详情 |
|------|------|
| 编号 | ISSUE-005 |
| 问题标题 | 预约冲突检测仅在前端执行，数据库无唯一约束 |
| 严重级别 | P0 — 数据一致性 |
| 问题表现 | 两个学员同时预约同一教练同一时段，前端检查可能同时通过，导致重复预约 |
| 影响范围 | 预约系统 |
| 复现步骤 | 1. 学员 A 和学员 B 同时打开预约页面 → 2. 选择同一教练同一时段 → 3. 同时点击提交 → 4. 两条预约都创建成功 |
| 根因判断 | AppContext.createBooking 第 266-276 行的冲突检测基于 `appointments` 数组（React state），两个客户端的 state 可能都不包含对方的预约。schema 中 appointments 表没有针对 (coach_id, date, start_time, status) 的唯一约束。 |
| 建议修复方式 | 1. 在 appointments 表添加部分唯一索引：`CREATE UNIQUE INDEX ... ON appointments(coach_id, date, start_time) WHERE status IN ('pending', 'approved')`；2. 或使用 PostgreSQL RPC 函数在事务中检查冲突并插入。 |
| 涉及文件 | [AppContext.tsx](../src/context/AppContext.tsx#L266-L276)、[schema_v2.sql](../supabase/schema_v2.sql#L77-L92) |
| 当前状态 | 未修复 |

---

## P1 — 高严重度（8 个）

### ISSUE-006：localStorage key 不一致

| 维度 | 详情 |
|------|------|
| 编号 | ISSUE-006 |
| 问题标题 | api.ts 和 hybrid-store.ts 使用不同的 localStorage key 存储用户 ID |
| 严重级别 | P1 |
| 问题表现 | 配置切换（Supabase ↔ Mock）时会话丢失 |
| 根因判断 | api.ts 第 27 行用 `'ff_current_user_id'`，hybrid-store.ts 第 17 行用 `'ff_hybrid_'` 前缀（即 `'ff_hybrid_current_user_id'`） |
| 建议修复方式 | 统一为一个 key，建议用 hybrid-store.ts 的 `ff_hybrid_current_user_id` |
| 涉及文件 | [api.ts#L27](../src/lib/api.ts#L27)、[hybrid-store.ts#L17](../src/lib/hybrid-store.ts#L17) |
| 当前状态 | ✅ Fixed（Phase 1A） |
| 修复说明 | 统一为 canonical key `ff_session_user_id`；api.ts 和 hybrid-store.ts 均使用此 key；实现自动迁移逻辑：读取到旧 key（`ff_current_user_id`、`ff_hybrid_current_user_id`）后自动迁移到 canonical key 并删除旧 key；登录时只写 canonical key；登出时清理 canonical key 和所有旧 key。 |
| 验证级别 | Static Verified + Script Verified |
| 浏览器验证 | Browser Verification Pending |

---

### ISSUE-007：账号切换时 violations 状态未清除

| 维度 | 详情 |
|------|------|
| 编号 | ISSUE-007 |
| 问题标题 | logout 时 violations 数组未清空，切换账号后残留 |
| 严重级别 | P1 |
| 根因判断 | AppContext.tsx 第 189-194 行 logoutHandler 清除了 notifications 和 trainingRecords 但未清除 violations |
| 建议修复方式 | 在 logoutHandler 中添加 `setViolations([])` |
| 涉及文件 | [AppContext.tsx#L189-L194](../src/context/AppContext.tsx#L189-L194) |
| 当前状态 | ✅ Fixed（Phase 1A） |
| 修复说明 | logoutHandler 中添加 `setViolations([])`，与 notifications、trainingRecords 一同在登出时清理。 |
| 验证级别 | Static Verified |
| 浏览器验证 | Browser Verification Pending |

---

### ISSUE-008：教练姓名与关联用户不匹配

| 维度 | 详情 |
|------|------|
| 编号 | ISSUE-008 |
| 问题标题 | 教练 c9（孙婷婷）关联 u7（周佳琪），教练 c10（周文博）关联 u8（林浩然） |
| 严重级别 | P1 |
| 根因判断 | mock-data.ts 和 seed_full.sql 中 c9.userId=u7 但 c9.name="孙婷婷" 而 u7.name="周佳琪"；c10 同理 |
| 建议修复方式 | 统一 c9/c10 的 name 与对应用户 name 一致，或修正 userId 指向 |
| 涉及文件 | [mock-data.ts](../src/lib/mock-data.ts)、[seed_full.sql](../supabase/seed_full.sql) |
| 静态核对说明 | c9.name='孙婷婷' vs u7.name='周佳琪'；c10.name='周文博' vs u8.name='林浩然'；c10.grade='2021级' vs u8.grade='2023级' |
| 验证级别 | Static Verified |
| 当前状态 | Confirmed（静态核对） |

### ISSUE-009：大量异步操作无防重复提交

| 维度 | 详情 |
|------|------|
| 编号 | ISSUE-009 |
| 问题标题 | 登录、取消预约、教练审核、管理员操作等均无防重复提交 |
| 严重级别 | P1 |
| 影响范围 | login、profile、coach-center、admin 页面 |
| 根因判断 | 这些页面的按钮没有 loading 状态和 disabled 属性 |
| 建议修复方式 | 为所有异步操作添加 loading 状态 + disabled 按钮 |
| 涉及文件 | [login/page.tsx](../src/app/login/page.tsx)、[register/page.tsx](../src/app/register/page.tsx)、[profile/page.tsx](../src/app/profile/page.tsx)、[coach-center/page.tsx](../src/app/coach-center/page.tsx)、[admin/page.tsx](../src/app/admin/page.tsx) |
| 当前状态 | ✅ Fixed（Phase 1B） |
| 修复说明 | 5 个页面全部增加 loading 状态和防重复提交：login 增加 `submitting` 状态 + 按钮 disabled；register 快捷登录接入统一 loading；profile 使用 `loadingKeys` 按 `cancel:<id>` / `applyCoach` / `checkIn:<id>` 锁定；coach-center 使用 action key（`approve:<id>` / `reject:<id>` / `complete:<id>` / `toggle:<id>`）锁定，冲突按钮互斥禁用；admin 使用 `loadingKeys` 按 `approveCoach:<id>` / `rejectCoach:<id>` / `publishAnn` / `deleteAnn:<id>` / `unban:<id>` 锁定。所有按钮增加动态文本（处理中...）和 try/catch/finally。 |
| 验证级别 | Static Verified + Script Verified |
| 浏览器验证 | Browser Verification Pending |

### ISSUE-010：多处异常被 catch 静默吞掉

| 维度 | 详情 |
|------|------|
| 编号 | ISSUE-010 |
| 问题标题 | AppContext 中多个方法用空 catch 块吞掉异常，用户无感知 |
| 严重级别 | P1 |
| 根因判断 | coachApproveAppointment、coachRejectAppointment、coachCompleteAppointment、coachToggleSlot、coachAddSlot、addTrainingRecord、refreshData 等方法的 catch 块为空或只有 `// ignore` |
| 建议修复方式 | 将异常向上抛出或返回错误对象，让调用方（页面）能展示错误提示 |
| 涉及文件 | [AppContext.tsx](../src/context/AppContext.tsx)、[login/page.tsx](../src/app/login/page.tsx)、[register/page.tsx](../src/app/register/page.tsx)、[profile/page.tsx](../src/app/profile/page.tsx)、[coach-center/page.tsx](../src/app/coach-center/page.tsx)、[admin/page.tsx](../src/app/admin/page.tsx) |
| 当前状态 | ✅ Fixed（Phase 1B） |
| 修复说明 | AppContext 中 9 个方法的空 catch 全部移除，错误直接抛出由页面捕获；页面层所有异步操作使用 try/catch/finally，失败时显示错误 Toast，不显示成功状态。通知发送失败使用 try/catch 但不阻断主流程（记录 console.warn）。hybrid-store.ts 底层工具函数（readLS/writeLS/migrateSessionKeyIfNeeded）保留 `// ignore` 注释 catch 块，因为 localStorage 不可用时的降级行为是设计意图。 |
| 验证级别 | Static Verified + Script Verified |
| 浏览器验证 | Browser Verification Pending |

### ISSUE-011：通知在 setState 回调中发送，可能不执行

| 维度 | 详情 |
|------|------|
| 编号 | ISSUE-011 |
| 问题标题 | coachApprove/Reject/Complete 在 setAppointments 的 map 回调中调用 addNotification |
| 严重级别 | P1 |
| 根因判断 | React 的 setState updater 函数应该是纯函数，在其中调用异步副作用（addNotification）可能导致：1. 通知不发送；2. 严格模式下重复执行 |
| 建议修复方式 | 将通知发送逻辑移到 setState 之外，先查找 appointment 再 setState 再发通知 |
| 涉及文件 | [AppContext.tsx](../src/context/AppContext.tsx) |
| 当前状态 | ✅ Fixed（Phase 1B） |
| 修复说明 | 9 个 Context 方法全部重构为"先调用 API → 纯函数 setState updater → updater 之外发送通知"模式。updater 内不再调用任何异步函数。通知发送使用独立 try/catch 包裹，失败时记录 console.warn 但不阻断主流程（数据持久化已成功）。coachApproveAppointment、coachRejectAppointment、coachCompleteAppointment 三个原先在 map 回调中发送通知的方法均已修复。 |
| 验证级别 | Static Verified + Script Verified（verify-phase1b.ts 静态扫描确认 setState updater 中无 addNotification 调用） |
| 浏览器验证 | Browser Verification Pending |

### ISSUE-012：createBooking 通知发送重复

| 维度 | 详情 |
|------|------|
| 编号 | ISSUE-012 |
| 问题标题 | AppContext.createBooking 和 mockCreateBooking 各发一次通知，导致双倍通知 |
| 严重级别 | P1 |
| 根因判断 | AppContext.createBooking 第 282-299 行发送通知，mockCreateBooking 第 150-166 行也发送通知 |
| 建议修复方式 | 从 mockCreateBooking 中移除通知发送逻辑，统一由 AppContext 层处理 |
| 涉及文件 | [AppContext.tsx](../src/context/AppContext.tsx)、[hybrid-store.ts](../src/lib/hybrid-store.ts) |
| 当前状态 | ✅ Fixed（Phase 1B） |
| 修复说明 | 通知职责重新划分：数据层（hybrid-store/mock）只负责数据持久化，Context 层负责业务流程编排和通知触发。从 mockCreateBooking、mockApproveAppointment、mockRejectAppointment 中移除通知创建代码，添加注释 `// Phase 1B: 通知职责归 Context 层`。createBooking 现在只由 Context 层发送通知（教练 1 条 + 学员 1 条），approveAppointment/rejectAppointment/completeAppointment 也由 Context 层在持久化成功后发送 1 条通知。 |
| 验证级别 | Static Verified + Script Verified（verify-phase1b.ts 测试 15-17 确认数据层不创建通知） |
| 浏览器验证 | Browser Verification Pending |

### ISSUE-013：Schema 缺少 violations 表

| 维度 | 详情 |
|------|------|
| 编号 | ISSUE-013 |
| 问题标题 | schema_v2.sql 未定义 violations 表，违约记录无法持久化 |
| 严重级别 | P1 |
| 根因判断 | types.ts 有 ViolationRecord 接口，mock-data.ts 有 2 条违约数据，但 schema 中无对应表 |
| 建议修复方式 | 在 schema 中添加 violations 表 |
| 涉及文件 | [schema_v2.sql](../supabase/schema_v2.sql) |
| 当前状态 | 未修复 |

---

## P2 — 中严重度（10 个）

### ISSUE-014：Schema 缺少 venues 表 5 列

| 维度 | 详情 |
|------|------|
| 编号 | ISSUE-014 |
| 问题标题 | venues 表缺少 contact_phone、tips、rules、map_image_url、image_url 列 |
| 严重级别 | P2 |
| 根因判断 | types.ts Venue 接口有这些字段，mock 数据有值，但 schema 没有对应列 |
| 建议修复方式 | ALTER TABLE venues ADD COLUMN ... |
| 涉及文件 | [schema_v2.sql](../supabase/schema_v2.sql#L46-L62) |
| 当前状态 | 未修复 |

### ISSUE-015：Schema 缺少 coach_profiles 表 2 列

| 维度 | 详情 |
|------|------|
| 编号 | ISSUE-015 |
| 问题标题 | coach_profiles 表缺少 student_reviews 和 success_cases 列 |
| 严重级别 | P2 |
| 涉及文件 | [schema_v2.sql#L22-L43](../supabase/schema_v2.sql#L22-L43) |
| 当前状态 | 未修复 |

### ISSUE-016：Seed 缺少 notifications 和 training_records 数据

| 维度 | 详情 |
|------|------|
| 编号 | ISSUE-016 |
| 问题标题 | seed_full.sql 未覆盖 notifications 和 training_records 两张表 |
| 严重级别 | P2 |
| 涉及文件 | [seed_full.sql](../supabase/seed_full.sql) |
| 当前状态 | 未修复 |

### ISSUE-017：coach_slots seed 仅 30 条（mock 有 114 条）

| 维度 | 详情 |
|------|------|
| 编号 | ISSUE-017 |
| 问题标题 | seed_full.sql 仅插入了前 30 条时段，DB Demo 可约时段明显少于 Mock Demo |
| 严重级别 | P2 |
| 涉及文件 | [seed_full.sql](../supabase/seed_full.sql) |
| 当前状态 | 未修复 |

### ISSUE-018：coach_profiles seed 未插入 name/department/grade

| 维度 | 详情 |
|------|------|
| 编号 | ISSUE-018 |
| 问题标题 | seed 的 coach_profiles INSERT 未包含 name、department、grade 三列 |
| 严重级别 | P2 |
| 涉及文件 | [seed_full.sql](../supabase/seed_full.sql) |
| 当前状态 | 未修复 |

### ISSUE-019：12h 自动过期机制无法执行

| 维度 | 详情 |
|------|------|
| 编号 | ISSUE-019 |
| 问题标题 | sweepExpired 函数只更新 state 且无人调用，静态导出无法执行定时任务 |
| 严重级别 | P2 |
| 根因判断 | 1. sweepExpired 只操作 React state；2. 没有任何 useEffect 或路由调用它；3. 静态导出无服务端运行时 |
| 建议修复方式 | 使用 Supabase Edge Function + Cron，或 PostgreSQL 触发器 + pg_cron |
| 涉及文件 | [AppContext.tsx#L221-L236](../src/context/AppContext.tsx#L221-L236) |
| 当前状态 | 未修复 |

### ISSUE-020：Booking 页面 600ms 人为延迟

| 维度 | 详情 |
|------|------|
| 编号 | ISSUE-020 |
| 问题标题 | 预约提交有 `await new Promise(r => setTimeout(r, 600))` 模拟延迟 |
| 严重级别 | P2 |
| 建议修复方式 | 移除人为延迟 |
| 涉及文件 | [booking/page.tsx](../src/app/booking/page.tsx) |
| 当前状态 | 未修复 |

### ISSUE-021：Admin 删除公告/解禁用户无确认弹窗

| 维度 | 详情 |
|------|------|
| 编号 | ISSUE-021 |
| 问题标题 | 管理员删除公告和解禁用户操作直接执行，无二次确认 |
| 严重级别 | P2 |
| 建议修复方式 | 添加 ConfirmDialog |
| 涉及文件 | [admin/page.tsx](../src/app/admin/page.tsx) |
| 当前状态 | ✅ Fixed（Phase 1B） |
| 修复说明 | admin 页面新增 `deleteAnnTarget` 和 `unbanTarget` 状态，用于控制确认弹窗显示。删除公告前弹出 Modal 显示公告标题要求确认，解禁用户前弹出 Modal 显示用户姓名要求确认。确认后才执行异步操作，操作期间按钮 disabled。catch 块不关闭弹窗（保留上下文方便重试），只有 try 成功后才清空 target。 |
| 验证级别 | Static Verified + Script Verified |
| 浏览器验证 | Browser Verification Pending |

### ISSUE-022：Coach Complete 无确认弹窗

| 维度 | 详情 |
|------|------|
| 编号 | ISSUE-022 |
| 问题标题 | 教练点击"完成"直接标记，无确认弹窗，误操作不可撤销 |
| 严重级别 | P2 |
| 涉及文件 | [coach-center/page.tsx](../src/app/coach-center/page.tsx) |
| 当前状态 | ✅ Fixed（Phase 1B） |
| 修复说明 | coach-center 页面新增 `completeTarget` 状态，点击"完成"按钮后弹出 Modal 显示预约详情（学员、场馆、日期、时间）要求确认。确认后才调用 `coachCompleteAppointment`，操作期间按钮 disabled（action key = `complete:<id>`）。catch 块不关闭弹窗（保留上下文方便重试），只有 try 成功后才清空 target。 |
| 验证级别 | Static Verified + Script Verified |
| 浏览器验证 | Browser Verification Pending |

### ISSUE-023：MonthlyCalendar 跨月判断 bug

| 维度 | 详情 |
|------|------|
| 编号 | ISSUE-023 |
| 问题标题 | `isFuture = day > today.getDate()` 在跨月场景下出错 |
| 严重级别 | P2 |
| 根因判断 | 比较的是日期号而非完整日期对象，跨月时判断错误 |
| 涉及文件 | [profile/page.tsx](../src/app/profile/page.tsx) |
| 当前状态 | 未修复 |

---

## P3 — 低严重度（5 个）

### ISSUE-024：QUICK_LOGIN_ACCOUNTS 标签错误

| 维度 | 详情 |
|------|------|
| 编号 | ISSUE-024 |
| 问题标题 | 钱梦瑶（u17，role=coach）被标注为"减脂学员" |
| 严重级别 | P3 |
| 涉及文件 | [mock-data.ts](../src/lib/mock-data.ts) |
| 当前状态 | 未修复 |

### ISSUE-025：mockUsers 注释过期

| 维度 | 详情 |
|------|------|
| 编号 | ISSUE-025 |
| 问题标题 | 注释写"20 人"，实际 29 人 |
| 严重级别 | P3 |
| 涉及文件 | [mock-data.ts](../src/lib/mock-data.ts) |
| 当前状态 | 未修复 |

### ISSUE-026：seed 基准日期偏移

| 维度 | 详情 |
|------|------|
| 编号 | ISSUE-026 |
| 问题标题 | seed_full.sql 基准日期 2026-07-11，hardcode 日期会随时间偏移 |
| 严重级别 | P3 |
| 涉及文件 | [seed_full.sql](../supabase/seed_full.sql) |
| 当前状态 | 未修复 |

### ISSUE-027：Admin 状态分布遗漏 no_show

| 维度 | 详情 |
|------|------|
| 编号 | ISSUE-027 |
| 问题标题 | 管理员后台预约状态分布硬编码了 6 种状态，遗漏了 no_show |
| 严重级别 | P3 |
| 涉及文件 | [admin/page.tsx](../src/app/admin/page.tsx) |
| 当前状态 | 未修复 |

### ISSUE-028：getTrainingStats 连续打卡逻辑混乱

| 维度 | 详情 |
|------|------|
| 编号 | ISSUE-028 |
| 问题标题 | `diffDays === tempStreak` 条件语义不明，连续打卡计算可能出错 |
| 严重级别 | P3 |
| 涉及文件 | [AppContext.tsx#L562-L616](../src/context/AppContext.tsx#L562-L616) |
| 当前状态 | 未修复 |
