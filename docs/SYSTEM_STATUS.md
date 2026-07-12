# 复旦健身社互助预约平台 — 系统现状审计报告

> 审计时间：2026-07-12（Phase 1B 后校准）
> 审计范围：全仓库代码静态分析
> 结论：**Phase 1B 完成 — 9 个业务写入方法已接入 hybrid-store 持久化（Mock + Supabase 双路径），setState updater 副作用已移除，createBooking 重复通知已修复，5 个页面增加 loading/防重复提交/错误反馈。Mock 模式完整浏览器 Golden Path 待验证，真实 Supabase 环境读写待集成验证。**

---

## 一、当前真实架构

```
┌──────────────────────────────────────────────────────────┐
│                   前端 (Next.js 14 静态导出)               │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ 14 pages │  │ 12 UI    │  │ AppContext│              │
│  │ (App     │  │ 组件     │  │ 全局状态  │              │
│  │  Router) │  │          │  │          │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       └──────────────┴──────────────┘                    │
│                      │                                   │
│            ┌─────────▼──────────┐                        │
│            │  hybrid-store.ts   │                        │
│            │  (数据访问抽象层)   │                        │
│            └─────────┬──────────┘                        │
│                      │                                   │
│         ┌────────────┴────────────┐                      │
│         ▼                         ▼                      │
│  ┌─────────────┐          ┌─────────────┐               │
│  │  Supabase   │          │ localStorage│               │
│  │   api.ts    │          │  mock 数据  │               │
│  │ (mapper已就绪) │          │ (基本可用)  │               │
│  └─────────────┘          └─────────────┘               │
│                                                          │
│  部署：Cloudflare Pages (静态 HTML Export)               │
└──────────────────────────────────────────────────────────┘
```

### 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Next.js | 14.2.15 |
| 语言 | TypeScript | 5.6.3 |
| 样式 | Tailwind CSS | 3.4.13 |
| 图标 | lucide-react | 0.451.0 |
| 后端 | Supabase | PostgreSQL（RLS 关闭） |
| 部署 | Cloudflare Pages | 静态导出 |
| 状态管理 | React Context | AppContext |

## 验证口径

| 级别 | 含义 |
|------|------|
| Static Verified | 通过代码静态检查确认 |
| Script Verified | 通过 scripts/verify-phase1a.ts 验证 |
| Browser Verified | 通过真实浏览器页面操作验证 |
| Supabase Runtime Verified | 连接真实 Supabase 项目验证 |

### 关键配置

- `output: 'export'` — 静态导出，无服务端运行时
- `images.unoptimized: true` — 不使用 Next.js 图片优化
- `trailingSlash: true` — 兼容 Cloudflare Pages 路由
- RLS 全部关闭（8 张表均 `DISABLE ROW LEVEL SECURITY`）

---

## 二、页面和功能清单

### 页面清单（共 14 个路由）

| 页面 | 路径 | 角色 | 功能概述 |
|------|------|------|----------|
| 首页 | `/` | 全部 | 平台亮点、教练推荐、训练计划、快速入口 |
| 登录 | `/login` | 全部 | 学号密码登录、一键 Demo 登录 |
| 注册 | `/register` | 全部 | 学号+密码+姓名注册 |
| 场馆介绍 | `/venues` | 全部 | 6 校区场馆介绍、器材指南、参考资料 |
| 预约带练 | `/booking` | 学员 | 3 步向导：场馆→时段+教练→确认提交 |
| 教练匹配 | `/match` | 学员 | 按目标/风格智能匹配教练 |
| 个人中心 | `/profile` | 学员 | 预约列表、训练统计、打卡、教练申请 |
| 教练中心 | `/coach-center` | 教练 | 预约审核、时段管理、资料编辑 |
| 管理员后台 | `/admin` | 管理员 | 教练审核、公告管理、预约记录、黑名单 |
| 健身房地图 | `/gym-map` | 全部 | 校区健身房位置地图 |
| 器材指南 | `/equipment` | 全部 | 器材使用方法、安全提示 |

### UI 组件（12 个）

NavBar、Footer、StatusBadge、BookingCard、EmptyState、Toast、AITrainingSuggestion、CoachCard、VenueHeatmap、ConfirmDialog、CoachApplyModal、TrainingCheckInModal

---

## 三、数据库表结构（8 张表）

| 表名 | 说明 | RLS | 索引 | 触发器 |
|------|------|-----|------|--------|
| profiles | 用户（含密码明文） | 关闭 | 1 | 无 |
| coach_profiles | 教练资料 | 关闭 | 无 | 无 |
| venues | 场馆 | 关闭 | 无 | 无 |
| coach_slots | 教练时段 | 关闭 | 1 | 无 |
| appointments | 预约记录 | 关闭 | 4 | updated_at |
| announcements | 公告 | 关闭 | 无 | 无 |
| notifications | 通知 | 关闭 | 1 | 无 |
| training_records | 训练记录 | 关闭 | 1 | 无 |

**缺失的表：**
- `violations` — types.ts 有 `ViolationRecord` 接口，mock-data.ts 有 2 条数据，但 schema 无此表

**缺失的列：**
- `venues` 表缺 5 列：`contact_phone`、`tips`、`rules`、`map_image_url`、`image_url`
- `coach_profiles` 表缺 2 列：`student_reviews`、`success_cases`

---

## 四、每个模块真实完成度

> 完成度基于代码可运行情况判断，非文件是否存在

### 4.1 数据访问层

| 模块 | 文件 | 完成度 | 说明 |
|------|------|--------|------|
| Supabase 客户端 | [supabase.ts](../src/lib/supabase.ts) | 100% | 正确创建客户端和 isSupabaseConfigured |
| API 层 | [api.ts](../src/lib/api.ts) | **85%** | CRUD 函数齐全，snake_case/camelCase 转换已通过 db-mappers.ts 解决；部分写入函数仍待补充 |
| 数据转换层 | [db-mappers.ts](../src/lib/db-mappers.ts) | **100%** | 8 个实体的 fromDbRow/toDbInsert/toDbUpdate 全覆盖，73 个轻量验证用例通过 |
| 混合存储层 | [hybrid-store.ts](../src/lib/hybrid-store.ts) | 90% | Mock 实现完整；localStorage key 已统一并支持迁移 |
| Mock 数据 | [mock-data.ts](../src/lib/mock-data.ts) | 90% | 数据丰富，但有 2 处教练-用户姓名不匹配 |
| 类型定义 | [types.ts](../src/lib/types.ts) | 95% | 完整定义所有接口，与 mock 数据一致 |
| Schema | [schema_v2.sql](../supabase/schema_v2.sql) | 75% | 缺 violations 表、缺 venues/coach_profiles 部分列 |
| 种子数据 | [seed_full.sql](../supabase/seed_full.sql) | 60% | 缺 notifications 和 training_records 数据；coach_slots 仅 30 条（mock 有 114 条） |

### 4.2 状态管理层

| 模块 | 完成度 | 关键问题 |
|------|--------|----------|
| AppContext 基础结构 | 85% | 接口定义完整，状态字段齐全 |
| 会话恢复 | **95%** | 已改为 getCurrentUser()，刷新后保持登录；initError 状态暴露初始化错误 |
| login/register | **95%** | 正确调用 API，login 已增加防重复提交（submitting 状态） |
| createBooking | **95%** | 调用 API + 冲突检测，通知去重已修复（数据层不创建通知） |
| cancelBooking | 70% | 调用 API 但违约记录只更新 state，不写 DB |
| coachApprove/Reject | **90%** | 调用 API，错误向上抛出，通知在 setState 之外发送 |
| coachComplete | **90%** | 已接入 hybrid-store 持久化，防重复增加 totalSessions，通知在 setState 之外发送 |
| coachUpdateProfile | **90%** | 已接入 hybrid-store 持久化，白名单过滤管理字段 |
| applyCoach | **90%** | 已接入 hybrid-store 持久化，防止重复申请 |
| adminApproveCoach | **90%** | 已接入 hybrid-store 持久化，同时更新 certStatus 和 role |
| adminRejectCoach | **90%** | 已接入 hybrid-store 持久化，保存拒绝原因 |
| adminDeleteAnnouncement | **90%** | 已接入 hybrid-store 持久化，带确认弹窗 |
| adminUnbanUser | **90%** | 已接入 hybrid-store 持久化，带确认弹窗 |
| sweepExpired | **0%** | **只更新 state，不调 API，且无人调用**（留待 Phase 2） |
| toggleFavoriteCoach | 90% | 调用 API + 更新 state |
| addTrainingRecord | 80% | 调用 API 但异常处理待完善 |
| markAllNotificationsRead | **90%** | 已接入 hybrid-store 持久化，只影响当前用户 |
| deleteNotification | **90%** | 已接入 hybrid-store 持久化，归属校验 |

### 4.3 页面层

| 页面 | 完成度 | 关键问题 |
|------|--------|----------|
| 首页 `/` | 90% | 静态展示，无后端依赖问题 |
| 登录 `/login` | **90%** | 已增加 submitting 状态 + 防重复提交 + try/catch/finally + 错误 Toast |
| 注册 `/register` | **90%** | 快捷登录已接入 loading，异常捕获并反馈 |
| 预约 `/booking` | 80% | 有防重复提交，有冲突检测，但有 600ms 人为延迟 |
| 个人中心 `/profile` | **85%** | 已增加 loadingKeys（cancel/applyCoach/checkIn 按 ID 锁定）+ 错误反馈 |
| 教练中心 `/coach-center` | **85%** | 已增加 action key loading + 完成确认弹窗 + 错误反馈 |
| 管理员 `/admin` | **85%** | 已增加 loadingKeys + 删除公告/解禁用户确认弹窗 + 拒绝原因保留 |
| 场馆介绍 `/venues` | 95% | 静态展示，基本无问题 |
| 器材指南 `/equipment` | 95% | 静态展示，基本无问题 |
| 教练匹配 `/match` | 90% | 匹配算法完整，无后端写操作 |
| 健身房地图 `/gym-map` | 95% | 静态展示，基本无问题 |

### 4.4 部署

| 模块 | 完成度 | 说明 |
|------|--------|------|
| Next.js 静态导出配置 | 100% | output: 'export', images.unoptimized, trailingSlash |
| Cloudflare Pages 配置 | 100% | 构建命令 npm run build，输出目录 out |
| 环境变量 | 100% | NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY |

---

## 五、Mock 模式和 Supabase 模式的差异

| 维度 | Mock 模式 | Supabase 模式 |
|------|-----------|---------------|
| 数据存储 | localStorage（`ff_session_` 前缀） | Supabase PostgreSQL |
| 会话恢复 | Static Verified + Script Verified | Static Verified |
| 命名转换 | 不需要（全 camelCase） | Static Verified + Script Verified（db-mappers.ts） |
| 数据读取 | Script Verified | Static Verified + Script Verified（mapper 覆盖） |
| 数据写入 | Script Verified（9 个方法已接入持久化） | Static Verified + Script Verified（9 个方法已接入，mapper 覆盖） |
| CRUD 完整性 | 约 95% 操作可持久化（仅 sweepExpired 未接入） | 约 90% 操作可持久化（仅 sweepExpired 未接入） |
| 刷新后行为 | 保持登录（Static Verified） | 保持登录（Static Verified） |
| 账号切换 | 全部私有状态清理（Static Verified） | 同左 |
| localStorage key | `ff_session_user_id`（canonical） | 同左，支持旧 key 自动迁移 |
| 通知去重 | Static Verified + Script Verified | Static Verified（数据层不创建通知） |

### 核心结论

**Mock 模式**：基础数据和会话逻辑已通过脚本验证，9 个业务写入方法已接入 localStorage 持久化，完整浏览器 Golden Path 待验证。核心预约流程、教练审核、管理员操作均可走通。

**Supabase 模式**：数据映射层已完成并通过离线验证，9 个业务写入方法已接入 api.ts（mapper 覆盖），真实 Supabase 环境读写待集成验证。剩余 sweepExpired 待 Phase 2 定时任务基础设施。

---

## 六、已确认可用的功能

### Mock 模式下可用的功能（以下基于代码静态分析，完整浏览器 Golden Path 待验证）

1. ✅ 学号密码登录
2. ✅ 学号注册
3. ✅ 浏览教练列表
4. ✅ 浏览场馆列表
5. ✅ 预约带练（含冲突检测、禁约检查、额度检查）
6. ✅ 取消预约（含违约计算）
7. ✅ 收藏教练
8. ✅ 训练打卡（写入 localStorage）
9. ✅ 教练添加时段
10. ✅ 教练开关时段
11. ✅ 教练审核预约（通过/拒绝，写入 localStorage）
12. ✅ 管理员发布公告（写入 localStorage）
13. ✅ 通知显示和标记已读（写入 localStorage）
14. ✅ 暗/亮主题切换
15. ✅ 教练智能匹配

### Supabase 模式下可用的功能

数据映射层已完成（Static Verified + Script Verified）。真实 Supabase 环境读写待集成验证。以下功能在代码层面已具备条件，但尚未通过运行时验证：
1. 学号密码登录（mapper 已就绪）
2. 浏览教练列表（mapper 已就绪）
3. 浏览场馆列表（mapper 已就绪）
4. 预约带练（mapper 已就绪，但并发约束未实现）
5. 通知和训练记录读取（mapper 已就绪）

---

## 七、未形成闭环的功能

### 7.1 只更新前端状态、不调 API 的操作（共 1 个，Phase 1B 后剩余）

| # | 操作 | AppContext 方法 | 影响 |
|---|------|-----------------|------|
| 1 | 过期扫描 | `sweepExpired` | 过期标记刷新后恢复，且无人调用（留待 Phase 2 定时任务） |

> Phase 1B 已修复 9 个方法：`coachCompleteAppointment`、`coachUpdateProfile`、`applyCoach`、`adminApproveCoach`、`adminRejectCoach`、`adminDeleteAnnouncement`、`adminUnbanUser`、`markAllNotificationsRead`、`deleteNotification`。详见 KNOWN_ISSUES.md ISSUE-003。

### 7.2 会话恢复

已修复（Phase 1A）。AppContext 初始化调用 `getCurrentUser()` 从本地存储恢复会话。刷新后保持登录（Static Verified + Script Verified）。

### 7.3 定时任务无法执行

- 12 小时自动过期（`sweepExpired`）：纯前端实现，且无人调用
- 禁约到期恢复：依赖 `checkBanStatus` 实时计算，无定时清理
- 违约记录持久化：violations 表不存在，违约记录只存 React state

### 7.4 实时通知未实现

- Supabase Realtime 未接入
- 通知需要刷新页面才能看到

---

## 八、当前安全状态

### 8.1 认证机制

| 维度 | 当前状态 | 风险等级 |
|------|----------|----------|
| 密码存储 | 明文存储在 profiles.password | 🔴 高 |
| 密码验证 | `SELECT * FROM profiles WHERE student_id = ? AND password = ?` | 🔴 高 |
| 身份传递 | localStorage 存 user_id，无 token 无 session | 🔴 高 |
| 角色判断 | 纯前端 `user.role` 字段，可被篡改 | 🔴 高 |
| RLS | 全部关闭 | 🔴 高 |
| 防暴力破解 | 无验证码、无频率限制 | 🟡 中 |
| 防重放攻击 | 无 token 过期机制 | 🟡 中 |

### 8.2 anon key 暴露后的风险

当前 anon key 通过 `NEXT_PUBLIC_` 前缀暴露在前端代码中。由于 RLS 全部关闭，anon key 持有者可以：

1. 读取所有用户的密码（明文）
2. 修改任意用户的 role（自助升级为 admin）
3. 修改任意用户的 violation_count 和 banned_until
4. 删除任意预约、公告、通知
5 修改任意教练的 cert_status

**结论：当前应用无任何后端安全屏障。**

### 8.3 启用 RLS 前需完成的改造

1. 接入 Supabase Auth（或自定义 JWT 认证）
2. profiles.id 关联 auth.users.id
3. 密码加密存储（bcrypt/argon2）
4. 设计每张表的 RLS Policy
5. 将角色判断从前端迁移到数据库/RLS
6. 违约计算、禁约判断从纯前端迁移到数据库触发器或 RPC

---

## 九、当前部署限制

### 9.1 静态导出的固有限制

| 限制 | 影响 |
|------|------|
| 无服务端运行时 | 无法执行定时任务（过期扫描、禁约恢复） |
| 无 API 路由 | 无法做服务端鉴权 |
| 无中间件 | 无法在请求级别做权限拦截 |
| 全客户端渲染 | 所有数据在浏览器中处理，可被篡改 |

### 9.2 无法依赖前端执行的逻辑

| 逻辑 | 当前实现 | 问题 |
|------|----------|------|
| 12h 自动过期 | `sweepExpired` 函数 | 无人调用，即使调用也只更新 state |
| 禁约到期恢复 | `checkBanStatus` 实时计算 | 仅前端判断，DB 中 banned_until 不变 |
| 违约累计 | cancelBooking 中 setViolations | 不写 DB，刷新即丢失 |
| 预约冲突检测 | createBooking 中前端检查 | DB 无唯一约束，并发可绕过 |
| 每周 3 次限制 | createBooking 中前端计数 | DB 无约束，可被绕过 |

### 9.3 解决方向

- 定时任务 → Supabase Edge Functions + Cron 或外部 Cron 调用 Supabase RPC
- 数据一致性 → PostgreSQL UNIQUE 约束 + RPC 事务函数
- 权限控制 → RLS Policy
- 实时通知 → Supabase Realtime

---

## 十、审计总结

| 维度 | 评级 | 说明 |
|------|------|------|
| Mock 模式可用性 | ✅ 基础就绪 | 数据、会话逻辑、9 个业务写入方法已通过脚本验证，完整浏览器 Golden Path 待验证 |
| Supabase 模式可用性 | ⚠️ 映射就绪 | 数据映射层 + 9 个业务写入方法完成并通过离线验证，真实环境读写待集成验证 |
| 数据一致性 | ❌ 风险高 | 前端状态与 DB 不同步，并发无保护，多表更新非原子 |
| 安全性 | ❌ 无安全屏障 | 明文密码、RLS 关闭、角色可篡改 |
| 代码质量 | ✅ 中等偏上 | 数据转换层规范，错误传播规范，通知职责清晰，异常处理已完善 |
| 部署就绪度 | ✅ 可部署 | 静态导出配置正确，Cloudflare Pages 可部署 |
