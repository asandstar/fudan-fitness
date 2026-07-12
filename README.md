# 复旦健身社互助预约平台

> 基于 Next.js + React + TypeScript 的校园健身互助预约网站，连接学员与认证教练，实现科学训练指导。
> 当前版本：Phase 1B 完成（业务写入持久化 + 交互稳定化）

## 🏠 在线体验

https://fudan-fitness.pages.dev/

**一键登录账号**（登录页点击即可体验不同角色）：
- 学员·刘小明（普通社员，已预约 2 次）
- 教练·张明（认证教练，有待审核预约）
- 学员·吴雨桐（被禁约，测试禁约提示）
- 管理员（后台全部权限）

## ✨ 功能特性

### 核心功能
- **预约带练**：学员选择场馆 → 时段 → 教练，填写训练需求并提交预约
- **教练审核**：教练查看收到的预约，通过/拒绝审核，标记课程完成
- **个人中心**：学员查看本周预约额度、违约记录，管理预约，申请成为认证教练
- **时段管理**：教练自主设置可约时段，支持开启/关闭
- **管理后台**：教练审核、公告发布、预约记录查询、黑名单管理
- **通知中心**：预约状态变更通知，支持标记已读和删除

### 业务规则
- ✅ 每周最多预约 3 次，满额提示并禁用预约按钮
- ✅ 开课前 24 小时可免费取消，之后取消记违约
- ✅ 违约累计 3 次自动禁约 30 天
- ✅ 同一教练同一时段仅可被预约一次
- ✅ 已被预约的时段不可再次选择
- ✅ 所有写操作防重复提交（loading 状态锁定）
- ✅ 操作失败显示错误 Toast，不显示成功
- ✅ 关键操作带确认弹窗（删除公告、解禁用户、完成带练）

### 用户角色
- **学员**：浏览场馆和教练，预约带练，管理个人预约
- **认证教练**：审核预约，管理可约时段，查看带练统计
- **管理员**：审核教练申请，发布公告，管理预约记录和黑名单

## 🛠️ 技术栈

- **框架**: Next.js 14 (App Router) + React 18
- **语言**: TypeScript 5.6
- **样式**: Tailwind CSS 3
- **图标**: lucide-react
- **状态管理**: React Context + hybrid-store 抽象层
- **数据后端**: Supabase（PostgreSQL + Auth + Realtime，可选）
- **部署**: Cloudflare Pages（静态导出）

## 🏗️ 架构概览

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
│  │ (db-mappers)│          │             │               │
│  └─────────────┘          └─────────────┘               │
│                                                          │
│  部署：Cloudflare Pages (静态 HTML Export)               │
└──────────────────────────────────────────────────────────┘
```

### 数据访问分层

项目采用三层架构，确保 Mock 模式和 Supabase 模式行为一致：

1. **页面层**（`src/app/`）：只调用 AppContext，不直接访问数据层
2. **Context 层**（`src/context/AppContext.tsx`）：业务流程编排 + 通知触发
3. **数据层**（`src/lib/hybrid-store.ts`）：根据配置选择 Supabase API 或 localStorage Mock

### 模式切换

- **Mock 模式**（默认）：未配置 Supabase 环境变量时自动启用，数据存储在 localStorage
- **Supabase 模式**：配置 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 后启用

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
npm run build
```

构建产物输出到 `out/` 目录，可直接部署到任意静态托管平台。

### 配置 Supabase（可选）

复制 `.env.local.example` 为 `.env.local` 并填写 Supabase 项目信息：

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

未配置时自动使用 Mock 模式（localStorage 持久化）。

### 数据库初始化

如需启用 Supabase 后端，依次执行：

1. `supabase/schema_v2.sql` — 创建表结构
2. `supabase/seed_full.sql` — 写入种子数据

> 注意：当前 RLS 全部关闭，仅适用于 Demo 环境。生产部署前需启用 RLS（计划在 Phase 3）。

### 静态导出部署

项目已配置 `output: 'export'`，支持零配置部署：

**Cloudflare Pages**:
- Build command: `npm run build`
- Build output directory: `out`
- Framework preset: Next.js (Static HTML Export)

**Netlify**:
- Build command: `npm run build`
- Publish directory: `out`

## 📁 项目结构

```
fudan-fitness/
├── public/images/              # 静态资源
├── src/
│   ├── app/                    # 页面路由（App Router）
│   │   ├── page.tsx               # 首页
│   │   ├── login/page.tsx         # 登录页
│   │   ├── register/page.tsx      # 注册页
│   │   ├── venues/page.tsx        # 场馆介绍页
│   │   ├── booking/page.tsx       # 教练预约页（核心）
│   │   ├── match/page.tsx         # 教练匹配页
│   │   ├── profile/page.tsx       # 个人中心
│   │   ├── coach-center/page.tsx  # 教练中心
│   │   ├── admin/page.tsx         # 管理员后台
│   │   ├── gym-map/page.tsx       # 健身房地图
│   │   └── equipment/page.tsx     # 器材指南
│   ├── components/ui/          # 通用组件（12 个）
│   ├── context/AppContext.tsx  # 全局状态管理
│   ├── lib/                    # 数据层
│   │   ├── types.ts               # TypeScript 类型定义
│   │   ├── constants.ts           # 业务规则常量
│   │   ├── utils.ts               # 工具函数
│   │   ├── mock-data.ts           # Mock 数据（日期动态化）
│   │   ├── supabase.ts            # Supabase 客户端
│   │   ├── api.ts                 # Supabase API 封装
│   │   ├── db-mappers.ts          # 数据库字段映射层
│   │   └── hybrid-store.ts        # 混合存储抽象层
│   └── styles/globals.css      # 全局样式（设计 Token）
├── supabase/                   # 数据库 Schema 和种子数据
│   ├── schema_v2.sql              # 表结构（8 张表）
│   ├── seed_full.sql              # 完整种子数据
│   └── seed.sql                   # 基础种子数据
├── scripts/                    # 验证脚本
│   ├── verify-phase1a.ts          # Phase 1A 回归验证（73 用例）
│   └── verify-phase1b.ts          # Phase 1B 持久化验证（51 用例）
├── docs/                       # 系统文档
│   ├── SYSTEM_STATUS.md           # 系统现状审计
│   ├── GOLDEN_PATH.md             # 核心业务流程验收
│   ├── KNOWN_ISSUES.md            # 已知问题清单
│   ├── STABILIZATION_PLAN.md      # 稳定化修复计划
│   └── AUDIT_VERIFICATION.md      # 审计验证报告
├── next.config.js              # Next.js 配置
├── tailwind.config.ts          # Tailwind CSS 配置
└── package.json
```

## 📊 数据模型

核心实体（8 张表）：

| 实体 | 表名 | 说明 |
|------|------|------|
| User | profiles | 用户（学员/教练/管理员，含密码明文） |
| CoachProfile | coach_profiles | 教练资料（擅长领域、风格描述、认证状态） |
| Venue | venues | 场馆（可预约/展示中/敬请期待） |
| CoachSlot | coach_slots | 教练可用时段 |
| Appointment | appointments | 预约记录（pending → approved → completed/cancelled/rejected） |
| Announcement | announcements | 公告 |
| Notification | notifications | 通知 |
| TrainingRecord | training_records | 训练打卡记录 |

> ViolationRecord 接口已定义，但 violations 表尚未创建（计划在 Phase 2）。

## 🎨 设计规范

项目使用复旦健身社专属设计 Token：
- 主色：薄荷绿 `#4ECDC4`
- 强调色：珊瑚色 `#FF8A80`
- 背景色：暖白 `#F5F5F0`
- 字体：PingFang SC / Noto Sans SC

## 🧪 验证

项目使用轻量验证脚本（无需测试框架）：

```bash
# Phase 1A 回归验证（73 用例：数据映射 + 会话恢复）
npx tsx scripts/verify-phase1a.ts

# Phase 1B 持久化验证（51 用例：9 个方法持久化 + 通知去重 + 静态扫描）
npx tsx scripts/verify-phase1b.ts
```

### 验证结果

| 检查项 | 结果 |
|--------|------|
| TypeScript typecheck | ✅ 0 错误 |
| ESLint | ✅ 通过（1 个预先存在的警告） |
| Build | ✅ 14 页面全部生成 |
| Phase 1A 验证 | ✅ 73/73 通过 |
| Phase 1B 验证 | ✅ 51/51 通过 |
| Browser Verification | ⏳ Pending |
| Supabase Runtime Verification | ⏳ Pending |

## 📝 开发说明

### Mock 数据动态化

Mock 数据中的日期相对今天动态生成，保证 Demo 时段网格始终有可约项。

### 状态管理

使用 React Context 管理全局状态，通过 hybrid-store 抽象层实现 Mock/Supabase 双模式：
- **Mock 模式**：数据持久化到 localStorage（`ff_session_` 前缀）
- **Supabase 模式**：通过 db-mappers.ts 进行 camelCase ↔ snake_case 转换

### 静态导出

项目配置了 `output: 'export'`，所有页面静态生成，无 SSR/API Route 依赖，可部署到任意静态托管平台。

## 🗺️ 开发路线图

### 已完成

- **Phase 1A**：会话恢复 + 数据映射层（db-mappers.ts，8 个实体）
- **Phase 1B**：9 个业务写入方法持久化 + 交互稳定化（loading/防重复/错误反馈）

### 计划中

- **Phase 2**：数据库一致性（并发约束、violations 表、事务、Schema 补全）
- **Phase 3**：认证和权限（Supabase Auth、RLS Policy、密码加密）

详见 [docs/STABILIZATION_PLAN.md](docs/STABILIZATION_PLAN.md)。

## 📄 License

Apache License 2.0

Copyright 2026 复旦健身社

详见 [LICENSE](LICENSE) 文件。

---

*复旦健身社互助预约平台 - 学生社团内部使用*
