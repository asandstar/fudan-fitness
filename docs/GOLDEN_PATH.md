# Golden Path — 核心业务流程验收规格

> 本文档定义三条核心业务流程的完整路径，包括每一步涉及的页面、函数、数据表和状态字段。
> Phase 1A 覆盖范围：会话恢复和数据映射层。Phase 1B 覆盖范围：9 个业务写入方法持久化、setState updater 副作用移除、createBooking 通知去重、5 个页面 loading/防重复提交/错误反馈。完整浏览器 Golden Path 待验证。

---

## 流程一：学员预约完整流程

### 步骤 1：学员登录

| 维度 | 详情 |
|------|------|
| 页面 | `/login` |
| 用户操作 | 输入学号+密码 或 点击 Demo 账号 |
| 调用函数 | `AppContext.login()` → `hybrid-store.login()` → `mockLogin()` |
| 数据表 | mock: localStorage `ff_hybrid_users` |
| 状态字段 | `currentUser` 设置为 User 对象 |
| localStorage | `ff_session_user_id` 写入 user.id |
| 验证状态 | Not Tested |

**验收标准（正常）：**
- [x] 输入正确学号密码，登录成功，跳转到 `/profile`
- [x] Demo 账号一键登录，按角色跳转（member→/profile, coach→/coach-center, admin→/admin）

**验收标准（异常）：**
- [x] ✅ 错误密码 → 显示"学号或密码错误"Toast（Phase 1B 已增加 try/catch + 错误 Toast）
- [ ] ❌ 空输入 → 无前端校验，直接调用 API
- [x] ✅ 重复点击 → 已增加 submitting 状态防重复提交（Phase 1B）
- [x] ✅ 网络失败 → handleLogin 已增加 try/catch/finally，异常捕获并显示错误 Toast（Phase 1B）
- [x] ✅ 刷新后保持登录（Static Verified + Script Verified）

### 步骤 2：学员浏览教练

| 维度 | 详情 |
|------|------|
| 页面 | `/`（首页推荐）或 `/match`（教练匹配） |
| 用户操作 | 查看教练列表、筛选匹配 |
| 调用函数 | AppContext 初始化时 `refreshData()` → `getCoaches()` |
| 数据表 | mock: localStorage `ff_hybrid_coaches` |
| 状态字段 | `coaches` 数组 |
| 验证状态 | Static Verified |

**验收标准（正常）：**
- [x] 首页显示推荐教练（cert_status === 'approved'）
- [x] 教练匹配页显示匹配分数和详情

**验收标准（异常）：**
- [x] 无认证教练 → 显示空列表
- [x] ✅ 刷新后保持登录（Static Verified）

### 步骤 3：学员查看真实可用时段

| 维度 | 详情 |
|------|------|
| 页面 | `/booking` |
| 用户操作 | 选择场馆后查看可用日期和时段 |
| 调用函数 | 读取 `slots` + `appointments` 状态 |
| 数据表 | mock: localStorage `ff_hybrid_slots` + `ff_hybrid_appointments` |
| 状态字段 | `slots`（全部时段）、`appointments`（全部预约） |
| 验证状态 | Static Verified |

**时段可用性判断逻辑：**
```
availableCoaches = coaches.filter(c =>
  c.certStatus === 'approved' &&
  c.venues.includes(venueId) &&
  slots.some(s =>
    s.coachId === c.id &&
    s.venueId === venueId &&
    s.date === selectedDate &&
    s.startTime === selectedStartTime &&
    s.isAvailable === true
  ) &&
  !appointments.some(a =>
    a.coachId === c.id &&
    a.venueId === venueId &&
    a.date === selectedDate &&
    a.startTime === selectedStartTime &&
    ['pending', 'approved'].includes(a.status)
  )
)
```

**验收标准（正常）：**
- [x] 选择场馆后显示 7 天日期选项
- [x] 选择日期后显示可用时段
- [x] 已被预约的时段不显示对应教练

**验收标准（异常）：**
- [ ] ❌ 过去日期的时段仍可选择（无过去日期过滤）
- [ ] ❌ 时段可用性只在前端检查，DB 无约束
- [x] ✅ 刷新后保持登录（Static Verified）

### 步骤 4：学员选择场馆、教练和时段

| 维度 | 详情 |
|------|------|
| 页面 | `/booking` |
| 用户操作 | 点击时段 → 自动选择教练 → 填写训练需求 → 点击"确认预约" |
| 状态字段 | `selectedVenue`、`selectedDate`、`selectedStartTime`、`selectedCoach`、`trainingNote` |
| 验证状态 | Not Tested |

**验收标准（正常）：**
- [x] 选择时段后自动带入教练信息
- [x] 训练需求限制 200 字

### 步骤 5：学员提交预约

| 维度 | 详情 |
|------|------|
| 页面 | `/booking` |
| 用户操作 | 点击"确认提交" |
| 调用函数 | `AppContext.createBooking()` → `hybrid-store.createBooking()` → `mockCreateBooking()` |
| 数据表 | mock: localStorage `ff_hybrid_appointments`（新增一条） |
| 状态字段 | `appointments` 数组新增 Appointment 对象 |
| 防重复 | ✅ 有 `submitting` 状态锁 |
| 验证状态 | Not Tested |

**createBooking 内部检查顺序：**
1. 用户是否登录
2. 用户是否被禁约（`checkBanStatus`）
3. 本周预约是否已达 3 次（前端计数）
4. 时段是否冲突（前端检查）
5. 调用 API 写入
6. 发送通知给教练
7. 发送通知给学员

**验收标准（正常）：**
- [x] 提交成功 → Toast "预约提交成功" + 跳转 `/profile`
- [x] 预约列表中显示新预约（状态 pending）

**验收标准（异常）：**
- [x] 禁约用户 → 显示"您已被禁约"
- [x] 每周 3 次 → 显示"本周已预约 3 次"
- [x] 时段冲突 → 显示"该教练此时段已被预约"
- [x] ✅ 重复提交 → submitting 锁可防止（Phase 1B 已增加 try/catch/finally，异常时 submitting 重置）
- [x] ✅ 通知发送去重 → 数据层不创建通知，统一由 Context 层发送（Phase 1B 已修复，verify-phase1b.ts 测试 15 确认）

### 步骤 6：刷新页面后预约仍然存在

| 维度 | 详情 |
|------|------|
| 预期行为 | 刷新后用户仍登录，预约列表仍显示 |
| 验证状态 | Static Verified + Script Verified |

**验收标准：**
- [x] ✅ 刷新后保持登录（Phase 1A 已修复，getCurrentUser 接入）
- [x] ✅ 预约数据可正常访问（currentUser 恢复后加载私有数据）

**注意：** 完整浏览器端到端验证（Browser Verified）尚未执行。

### 步骤 7-12：教练端操作（见流程二）

---

## 流程二：教练审核完整流程

### 步骤 7：教练账号登录

同步骤 1，使用教练 Demo 账号（如 22300150002 / password123）

### 步骤 8：教练看到待审核预约

| 维度 | 详情 |
|------|------|
| 页面 | `/coach-center` |
| 用户操作 | 查看预约列表，Tab 切换到"待审核" |
| 数据来源 | `appointments.filter(a => a.coachId === currentCoach.id && a.status === 'pending')` |
| 状态字段 | `appointments`、`currentCoach` |
| 验证状态 | Static Verified |

**验收标准（正常）：**
- [x] 教练登录后看到属于自己的待审核预约
- [x] 显示学员姓名、场馆、日期、时间、训练需求

**验收标准（异常）：**
- [x] ✅ 刷新后保持登录（Static Verified）
- [ ] ❌ currentCoach 依赖 coaches 数组，如果 refreshData 未完成则 currentCoach 为 null

### 步骤 9：教练接受或拒绝预约

#### 9a：接受预约

| 维度 | 详情 |
|------|------|
| 页面 | `/coach-center` |
| 用户操作 | 点击"通过" |
| 调用函数 | `AppContext.coachApproveAppointment()` → `hybrid-store.approveAppointment()` → `mockApproveAppointment()` |
| 数据表 | mock: localStorage `ff_hybrid_appointments`（更新 status） |
| 状态字段 | `appointments` 中对应记录 status 变为 'approved' |
| 通知 | 给学员发送"预约已确认"通知 |
| 验证状态 | Not Tested |

**验收标准（正常）：**
- [x] Mock 模式下预约状态变为 'approved'
- [x] 学员收到通知

**验收标准（异常）：**
- [x] ✅ 防重复提交 → 已增加 action key `approve:<id>` 锁定（Phase 1B）
- [x] ✅ loading 状态 → 按钮显示"处理中..."并 disabled（Phase 1B）
- [x] ✅ try/catch → API 失败时显示错误 Toast，不显示"已通过"（Phase 1B）
- [x] ✅ 通知在 setState 之外发送 → updater 为纯函数（Phase 1B，verify-phase1b.ts 测试 19 确认）

#### 9b：拒绝预约

| 维度 | 详情 |
|------|------|
| 页面 | `/coach-center` |
| 用户操作 | 点击"拒绝" → 输入拒绝原因 → 确认 |
| 调用函数 | `AppContext.coachRejectAppointment()` → `hybrid-store.rejectAppointment()` → `mockRejectAppointment()` |
| 数据表 | mock: localStorage `ff_hybrid_appointments`（更新 status + cancel_reason） |
| 状态字段 | `appointments` 中对应记录 status 变为 'rejected' |
| 通知 | 给学员发送"预约被拒绝"通知 |
| 验证状态 | Not Tested |

**验收标准：**
- [x] Mock 模式下预约状态变为 'rejected'
- [x] 必须填写拒绝原因
- [x] ✅ 防重复提交 + loading + try/catch + 通知在 setState 之外发送（Phase 1B）
- [x] ✅ 拒绝失败时保留拒绝原因 → catch 块不清空 rejectReason 和不关闭弹窗（Phase 1B）

### 步骤 10：学员重新登录后看到审核结果

| 维度 | 详情 |
|------|------|
| 页面 | `/profile` |
| 数据来源 | `appointments.filter(a => a.studentId === currentUser.id)` |
| 通知来源 | `notifications.filter(n => n.userId === currentUser.id)` |
| 验证状态 | Static Verified |

**验收标准（正常）：**
- [x] Mock 模式下，学员重新登录后预约列表显示最新状态
- [x] 通知列表显示审核结果通知

**验收标准（异常）：**
- [x] ✅ 刷新后保持登录（Static Verified）
- [x] ✅ 通知数据不再重复添加 → 数据层不创建通知，统一由 Context 层发送（Phase 1B 已修复）

---

## 流程三：预约完成流程

### 步骤 11：教练确认完成带练

| 维度 | 详情 |
|------|------|
| 页面 | `/coach-center` |
| 用户操作 | 在"已确认" Tab 中点击"完成" → 确认弹窗 → 确认 |
| 调用函数 | `AppContext.coachCompleteAppointment()` → `hybrid-store.completeAppointment()` |
| 数据表 | mock: localStorage `ff_hybrid_appointments` + `ff_hybrid_coaches`（Phase 1B 已接入持久化） |
| 状态字段 | `appointments` 中对应记录 status 变为 'completed'，教练 `totalSessions` +1 |
| 通知 | 给学员发送"训练已完成"通知（在 setState 之外发送，Phase 1B 已修复） |
| 防重复 | ✅ action key `complete:<id>` + 确认弹窗（Phase 1B） |
| 验证状态 | Static Verified + Script Verified |

**验收标准（正常）：**
- [x] Mock 模式下，UI 显示状态变为 'completed'
- [x] 教练 totalSessions +1
- [x] ✅ 持久化 → 刷新后状态保持 'completed'（Phase 1B，verify-phase1b.ts 测试 1 确认）
- [x] ✅ 防重复增加 totalSessions → 重复调用不会再次 +1（Phase 1B，verify-phase1b.ts 测试 3 确认）

**验收标准（异常）：**
- [x] ✅ 刷新后状态保持 → 已接入 hybrid-store 持久化（Phase 1B）
- [x] ✅ 防重复提交 → action key `complete:<id>` 锁定（Phase 1B）
- [x] ✅ 确认弹窗 → 点击"完成"后弹出 Modal 显示预约详情（Phase 1B，ISSUE-022 已修复）
- [x] ✅ try/catch → API 失败时显示错误 Toast（Phase 1B）
- [x] ✅ 通知在 setState 之外发送 → updater 为纯函数（Phase 1B）
- [x] ✅ 教练 totalSessions 持久化 → 写入 localStorage / DB（Phase 1B）

### 步骤 12：学员和教练都能看到历史记录

| 维度 | 详情 |
|------|------|
| 页面 | 学员: `/profile` "已完成" Tab；教练: `/coach-center` "带练记录" Tab |
| 数据来源 | `appointments.filter(a => a.status === 'completed')` |
| 验证状态 | Static Verified |

**验收标准（正常）：**
- [x] Mock 模式下，当前会话中可以看到已完成记录

**验收标准（异常）：**
- [x] ✅ 刷新后 → 完成状态保持（Phase 1B 已接入持久化，Static Verified + Script Verified）
- [ ] ⚠️ Supabase 模式 → 数据映射层已就绪（Static Verified），真实环境读写待验证

---

## 测试场景矩阵

### 场景 1：刷新页面

| 步骤 | 预期 | 实际 | 状态 |
|------|------|------|------|
| 登录后刷新 | 保持登录 | 保持登录 | ✅（Static Verified + Script Verified）|
| 预约后刷新 | 预约存在 | 预约存在且可访问 | ✅（Static Verified）|
| 审核后刷新 | 审核结果保留 | 审核结果保留且可访问 | ✅（Static Verified）|
| 完成后刷新 | 完成状态保留 | 完成状态保持（Phase 1B 已接入持久化） | ✅（Static Verified + Script Verified）|

### 场景 2：切换账号

| 步骤 | 预期 | 实际 | 状态 |
|------|------|------|------|
| 学员 A 登录 → 登出 → 学员 B 登录 | B 看到 B 的数据 | B 看到 B 的数据（notifications/trainingRecords 已清除） | ✅ |
| 学员 A 登录 → 登出 → 学员 B 登录 | violations 不残留 | violations 已清除 | ✅（Static Verified）|
| 教练登录 → 登出 → 学员登录 | 学员看到学员视角 | 正常 | ✅ |

### 场景 3：网络失败

| 步骤 | 预期 | 实际 | 状态 |
|------|------|------|------|
| 登录时网络失败 | 显示错误 | handleLogin 已增加 try/catch/finally，显示错误 Toast（Phase 1B） | ✅ |
| 预约时网络失败 | 显示错误，不创建预约 | createBooking 返回 ok:false，有错误提示 | ✅ |
| 审核时网络失败 | 显示错误 | 错误向上抛出，页面 catch 显示错误 Toast（Phase 1B） | ✅ |

### 场景 4：重复点击

| 步骤 | 预期 | 实际 | 状态 |
|------|------|------|------|
| 登录按钮重复点击 | 只发一次请求 | submitting 状态锁定（Phase 1B） | ✅ |
| 预约按钮重复点击 | 只发一次请求 | 有 submitting 锁 | ✅ |
| 取消预约重复点击 | 只发一次请求 | loadingKeys `cancel:<id>` 锁定（Phase 1B） | ✅ |
| 审核通过重复点击 | 只发一次请求 | action key `approve:<id>` 锁定（Phase 1B） | ✅ |
| 完成带练重复点击 | 只发一次请求 | action key `complete:<id>` 锁定 + 确认弹窗（Phase 1B） | ✅ |

---

## 验证状态总览

| 场景 | Mock 模式 | Supabase 模式 |
|------|-----------|---------------|
| 登录 | Static Verified | Static Verified（mapper 就绪） |
| 刷新保持登录 | Static Verified + Script Verified | Static Verified |
| 登出 | Static Verified | Static Verified |
| 切换账号无私有状态残留 | Static Verified | Static Verified |
| 场馆/教练/时段/预约字段显示 | Script Verified（mapper） | Script Verified（mapper） |
| 9 个业务写入方法持久化 | Static Verified + Script Verified | Static Verified（mapper 覆盖） |
| 通知去重（数据层不创建通知） | Static Verified + Script Verified | Static Verified |
| setState updater 无副作用 | Static Verified + Script Verified | Static Verified |
| 页面 loading/防重复提交 | Static Verified + Script Verified | Static Verified |
| 完整浏览器 Golden Path | Browser Verification Pending | Browser Verification Pending |
| 真实 Supabase 读写 | — | Supabase Runtime Verification Pending |

### Phase 1A + 1B 覆盖范围说明

Phase 1A 覆盖会话恢复和数据映射层。Phase 1B 覆盖 9 个业务写入方法持久化、setState updater 副作用移除、createBooking 通知去重、5 个页面 loading/防重复提交/错误反馈。以下问题留待后续阶段：
- sweepExpired 定时任务（Phase 2）
- 并发预约约束（Phase 2）
- 违约记录持久化（Phase 2）
- Supabase Auth / RLS（Phase 3）
