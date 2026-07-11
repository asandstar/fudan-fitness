# 后端集成实施计划

## 一、现状分析

### 当前架构
- **纯前端**：Next.js 14 + React 18 + TypeScript + Tailwind CSS
- **状态管理**：AppContext 集中管理所有状态（React Context + localStorage）
- **数据实体**：6个核心实体 + 4个辅助实体

### 数据实体清单

| 实体 | 核心字段 | 关系 |
|------|----------|------|
| **User** | id, studentId, password, name, role, violationCount, bannedUntil | 关联 Appointment, CoachProfile |
| **CoachProfile** | id, userId, specialties, certStatus, venues[] | 属于 User，关联 Venue |
| **Venue** | id, name, campus, facilities[] | 被 CoachProfile、Appointment 关联 |
| **Appointment** | id, studentId, coachId, venueId, date, status | 关联 User、Coach、Venue |
| **CoachSlot** | id, coachId, venueId, date, startTime, isAvailable | 关联 Coach、Venue |
| **Announcement** | id, title, content, isPinned | 独立 |
| **Notification** | id, userId, type, title, read | 关联 User |
| **TrainingRecord** | id, userId, appointmentId, duration, calories | 关联 User、Appointment |

### 当前 CRUD 操作（AppContext）

| 操作 | 方法 |
|------|------|
| 认证 | `login()`, `logout()` |
| 预约 | `createBooking()`, `cancelBooking()` |
| 教练 | `coachApproveAppointment()`, `coachRejectAppointment()`, `coachToggleSlot()`, `coachAddSlot()`, `coachUpdateProfile()` |
| 申请 | `applyCoach()` |
| 管理 | `adminApproveCoach()`, `adminRejectCoach()`, `adminPublishAnnouncement()`, `adminUnbanUser()` |
| 通知 | `addNotification()`, `markNotificationRead()`, `deleteNotification()` |
| 打卡 | `addTrainingRecord()` |
| 收藏 | `toggleFavoriteCoach()` |

---

## 二、技术选型

### 推荐：Supabase

| 维度 | 说明 |
|------|------|
| **免费额度** | 500MB 数据库、1GB 文件存储、2GB 带宽/月 |
| **Auth 服务** | 邮箱登录、OAuth（微信/GitHub）、RLS 行级权限 |
| **Realtime** | 预约状态变更实时推送 |
| **零运维** | 无需服务器，与 Next.js 无缝集成 |
| **代码提示** | AppContext 注释明确写了"二期迁移:将下列方法替换为 Supabase API 调用" |

### 不推荐方案

| 方案 | 原因 |
|------|------|
| Firebase | NoSQL 需重构数据模型、免费额度小 |
| 自建后端 | 需运维、部署成本高、不适合学生社团 |

---

## 三、实施步骤

### 步骤1：环境准备（手动）

1. 注册 Supabase 账号：https://supabase.com
2. 创建新项目：`fudan-fitness`
3. 记录连接信息：
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
4. 安装依赖：
   ```bash
   npm install @supabase/supabase-js
   ```

### 步骤2：创建数据库 Schema

**文件**：`supabase/schema.sql`（在 Supabase Dashboard 执行）

```sql
-- 用户表（扩展 Supabase auth.users）
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  student_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  department TEXT,
  grade TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  avatar_url TEXT,
  violation_count INT DEFAULT 0,
  banned_until TIMESTAMPTZ,
  favorite_coaches TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 教练资料表
CREATE TABLE coach_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  specialties TEXT[] NOT NULL,
  style_desc TEXT,
  is_beginner_friendly BOOLEAN DEFAULT false,
  is_female_friendly BOOLEAN DEFAULT false,
  total_sessions INT DEFAULT 0,
  total_students INT DEFAULT 0,
  cert_status TEXT DEFAULT 'none',
  venues TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 场馆表
CREATE TABLE venues (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  campus TEXT NOT NULL,
  address TEXT,
  open_time TEXT,
  close_time TEXT,
  capacity INT,
  facilities TEXT[],
  description TEXT,
  bookable BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0
);

-- 预约表
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id),
  coach_id UUID REFERENCES coach_profiles(id),
  venue_id TEXT REFERENCES venues(id),
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  training_note TEXT,
  cancel_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 教练时段表
CREATE TABLE coach_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES coach_profiles(id),
  venue_id TEXT REFERENCES venues(id),
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  is_available BOOLEAN DEFAULT true
);

-- 公告表
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  is_pinned BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'published',
  published_at TIMESTAMPTZ DEFAULT NOW()
);

-- 通知表
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  read BOOLEAN DEFAULT false,
  related_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 训练记录表
CREATE TABLE training_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  appointment_id UUID REFERENCES appointments(id),
  date DATE NOT NULL,
  duration INT,
  workout_type TEXT,
  intensity TEXT,
  calories INT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_appointments_student ON appointments(student_id);
CREATE INDEX idx_appointments_coach ON appointments(coach_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_slots_coach_date ON coach_slots(coach_id, date);

-- RLS 行级权限（简化版）
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own appointments" ON appointments FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
```

### 步骤3：创建 Supabase 客户端

**文件**：`src/lib/supabase.ts`（新建）

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### 步骤4：创建数据访问层

**文件**：`src/lib/api.ts`（新建）

封装所有 CRUD 操作：

```typescript
// 用户认证
export async function signIn(email: string, password: string) { ... }
export async function signUp(email: string, password: string, profile: ProfileInsert) { ... }
export async function signOut() { ... }
export async function getCurrentUser() { ... }

// 预约操作
export async function createAppointment(draft: BookingDraft) { ... }
export async function cancelAppointment(id: string) { ... }
export async function getAppointments(filters?: AppointmentFilters) { ... }

// 教练操作
export async function getCoaches() { ... }
export async function updateCoachProfile(id: string, patch: Partial<CoachProfile>) { ... }
export async function getCoachSlots(coachId: string) { ... }
export async function toggleSlot(slotId: string) { ... }

// ... 其他操作
```

### 步骤5：重构 AppContext

**文件**：`src/context/AppContext.tsx`（修改）

将所有本地状态和操作替换为 Supabase API 调用：

| 原实现 | 新实现 |
|--------|--------|
| `useState(mockUsers)` | `useQuery(() => api.getProfiles())` |
| `login()` 本地验证 | `api.signIn()` |
| `createBooking()` 本地 push | `api.createAppointment()` |
| `localStorage` 持久化 | Supabase 数据库持久化 |

### 步骤6：迁移认证流程

**文件**：`src/app/login/page.tsx`（修改）

- 移除 mock 登录
- 使用 Supabase Auth
- 支持邮箱登录 + OAuth（可选）

### 步骤7：环境变量配置

**文件**：`.env.local`（新建）

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### 步骤8：导入初始数据

- 使用 Supabase Dashboard 的 Table Editor 导入 mock-data.ts 中的数据
- 或编写 seed 脚本

### 步骤9：测试验证

1. 注册/登录流程
2. 预约创建/取消/审核
3. 教练时段管理
4. 管理员后台操作
5. 跨设备数据同步

---

## 四、文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `package.json` | 修改 | 添加 `@supabase/supabase-js` 依赖 |
| `src/lib/supabase.ts` | 新建 | Supabase 客户端 |
| `src/lib/api.ts` | 新建 | 数据访问层（所有 CRUD 封装） |
| `src/context/AppContext.tsx` | 重构 | 本地状态 → Supabase API 调用 |
| `src/app/login/page.tsx` | 修改 | 使用 Supabase Auth |
| `src/app/profile/page.tsx` | 微调 | 适配异步数据加载 |
| `.env.local` | 新建 | Supabase 连接信息 |
| `supabase/schema.sql` | 新建 | 数据库 Schema（在 Dashboard 执行） |

---

## 五、风险与注意事项

| 风险 | 缓解措施 |
|------|----------|
| Supabase 免费额度用尽 | 监控 Dashboard 用量，学生社团使用量通常很小 |
| 网络延迟 | 使用 React Query 缓存 + 加载状态 |
| 数据迁移错误 | 先在测试项目验证，保留 mock 数据作为 fallback |
| RLS 权限配置复杂 | 先用简化版权限，后续逐步完善 |

---

## 六、预计工作量

| 步骤 | 预计时间 |
|------|----------|
| 步骤1-2：环境+Schema | 1-2 小时 |
| 步骤3-4：客户端+API层 | 2-3 小时 |
| 步骤5：重构 AppContext | 3-4 小时 |
| 步骤6-8：认证+数据迁移 | 2-3 小时 |
| 步骤9：测试验证 | 1-2 小时 |
| **总计** | **1-2 天** |

---

## 七、验证清单

- [ ] 新用户注册成功
- [ ] 登录后刷新页面状态保持
- [ ] 创建预约成功写入数据库
- [ ] 取消预约状态正确更新
- [ ] 教练审核预约后状态变更
- [ ] 管理员后台数据正确显示
- [ ] 训练打卡记录持久化
- [ ] 跨设备登录数据同步