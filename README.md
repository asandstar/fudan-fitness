# 复旦健身社互助预约平台

> 基于 Next.js + React + TypeScript 的校园健身互助预约网站，连接学员与认证教练，实现科学训练指导。

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

### 业务规则
- ✅ 每周最多预约 3 次，满额提示并禁用预约按钮
- ✅ 开课前 24 小时可免费取消，之后取消记违约
- ✅ 违约累计 3 次自动禁约 30 天
- ✅ 同一教练同一时段仅可被预约一次
- ✅ 已被预约的时段不可再次选择
- ✅ 提交预约按钮防重复点击
- ✅ 所有弹窗有关闭按钮和返回路径

### 用户角色
- **学员**：浏览场馆和教练，预约带练，管理个人预约
- **认证教练**：审核预约，管理可约时段，查看带练统计
- **管理员**：审核教练申请，发布公告，管理预约记录和黑名单

## 🛠️ 技术栈

- **框架**: Next.js 14 (App Router) + React 18
- **语言**: TypeScript
- **样式**: Tailwind CSS 3
- **图标**: lucide-react
- **状态管理**: React Context + localStorage
- **部署**: Cloudflare Pages（静态导出）

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
├── public/images/          # 静态资源
├── src/
│   ├── app/                # 页面路由（App Router）
│   │   ├── page.tsx           # 首页
│   │   ├── venues/page.tsx    # 场馆介绍页
│   │   ├── booking/page.tsx   # 教练预约页（核心）
│   │   ├── profile/page.tsx   # 个人中心
│   │   ├── coach-center/page.tsx  # 教练中心
│   │   ├── admin/             # 管理员后台（独立布局）
│   │   └── login/page.tsx     # Mock 登录页
│   ├── components/ui/       # 通用组件
│   │   ├── NavBar.tsx         # 顶部导航栏
│   │   ├── Footer.tsx         # 页脚
│   │   ├── VenueCard.tsx      # 场馆卡片（3 种变体）
│   │   ├── CoachCard.tsx      # 教练卡片
│   │   ├── TimeSlotGrid.tsx   # 时段网格选择器
│   │   ├── StatusBadge.tsx    # 状态徽章
│   │   ├── Modal.tsx          # 通用弹窗
│   │   └── EmptyState/ErrorState/Toast.tsx
│   ├── context/AppContext.tsx # 全局状态管理
│   ├── lib/                 # 数据层
│   │   ├── types.ts           # TypeScript 类型定义
│   │   ├── constants.ts       # 业务规则常量
│   │   ├── utils.ts           # 工具函数
│   │   └── mock-data.ts       # Mock 数据（日期动态化）
│   └── styles/globals.css    # 全局样式（设计 Token）
├── next.config.js           # Next.js 配置
├── tailwind.config.ts       # Tailwind CSS 配置
└── package.json
```

## 📊 数据模型

核心实体：
- **User**：用户（学员/教练/管理员）
- **Venue**：场馆（可预约/展示中/敬请期待）
- **CoachProfile**：教练资料（擅长领域、风格描述、认证状态）
- **CoachSlot**：教练可用时段
- **Appointment**：预约记录（状态机：pending → approved → completed/cancelled/rejected/expired/no_show）
- **Announcement**：公告
- **ViolationRecord**：违约记录

## 🎨 设计规范

项目使用复旦健身社专属设计 Token：
- 主色：薄荷绿 `#4ECDC4`
- 强调色：珊瑚色 `#FF8A80`
- 背景色：暖白 `#F5F5F0`
- 字体：PingFang SC / Noto Sans SC

## 📝 开发说明

### Mock 数据动态化

Mock 数据中的日期相对今天动态生成，保证 Demo 时段网格始终有可约项。

### 状态管理

MVP 阶段使用 React Context 管理全局状态，数据通过 localStorage 持久化。二期可迁移到 Supabase 实时数据库。

### 静态导出

项目配置了 `output: 'export'`，所有页面静态生成，无 SSR/API Route 依赖，可部署到任意静态托管平台。

## 📄 License

MIT

---

*复旦健身社互助预约平台 - 学生社团内部使用*
