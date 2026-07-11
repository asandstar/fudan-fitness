-- 复旦健身社互助预约平台 - 数据库 Schema V2（不依赖 Supabase Auth）
-- 认证方式：学号直查 profiles 表
-- 请在 Supabase Dashboard → SQL Editor 中执行此脚本

-- ===== 1. 用户表（独立，不依赖 auth.users） =====
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  student_id TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  department TEXT,
  grade TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'coach', 'admin')),
  avatar_url TEXT,
  violation_count INT DEFAULT 0,
  banned_until TIMESTAMPTZ,
  favorite_coaches TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== 2. 教练资料表 =====
CREATE TABLE IF NOT EXISTS coach_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  department TEXT,
  grade TEXT,
  specialties TEXT[] NOT NULL DEFAULT '{}',
  style_desc TEXT,
  is_beginner_friendly BOOLEAN DEFAULT false,
  is_female_friendly BOOLEAN DEFAULT false,
  total_sessions INT DEFAULT 0,
  total_students INT DEFAULT 0,
  cert_status TEXT DEFAULT 'none' CHECK (cert_status IN ('none', 'pending', 'approved', 'rejected')),
  cert_applied_at TIMESTAMPTZ,
  cert_reviewed_at TIMESTAMPTZ,
  cert_review_note TEXT,
  reviewed_by TEXT,
  venues TEXT[] NOT NULL DEFAULT '{}',
  training_philosophy TEXT,
  rating NUMERIC(2,1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== 3. 场馆表 =====
CREATE TABLE IF NOT EXISTS venues (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  campus TEXT NOT NULL,
  address TEXT,
  open_time TEXT DEFAULT '08:00',
  close_time TEXT DEFAULT '22:00',
  capacity INT DEFAULT 20,
  facilities TEXT[] DEFAULT '{}',
  description TEXT,
  bookable BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  features TEXT[] DEFAULT '{}',
  layout_info TEXT,
  peak_hours TEXT,
  transportation TEXT
);

-- ===== 4. 教练时段表 =====
CREATE TABLE IF NOT EXISTS coach_slots (
  id TEXT PRIMARY KEY,
  coach_id TEXT REFERENCES coach_profiles(id) ON DELETE CASCADE,
  venue_id TEXT REFERENCES venues(id),
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  is_available BOOLEAN DEFAULT true,
  UNIQUE(coach_id, venue_id, date, start_time)
);

-- ===== 5. 预约表 =====
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  student_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  coach_id TEXT REFERENCES coach_profiles(id) ON DELETE CASCADE,
  venue_id TEXT REFERENCES venues(id),
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'cancelled', 'rejected', 'expired', 'no_show')),
  training_note TEXT,
  cancel_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== 6. 公告表 =====
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  is_pinned BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'published' CHECK (status IN ('published', 'draft')),
  published_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== 7. 通知表 =====
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  read BOOLEAN DEFAULT false,
  related_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== 8. 训练记录表 =====
CREATE TABLE IF NOT EXISTS training_records (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  appointment_id TEXT REFERENCES appointments(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  duration INT,
  workout_type TEXT,
  intensity TEXT CHECK (intensity IN ('low', 'medium', 'high')),
  calories INT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== 9. 索引 =====
CREATE INDEX IF NOT EXISTS idx_appointments_student ON appointments(student_id);
CREATE INDEX IF NOT EXISTS idx_appointments_coach ON appointments(coach_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_slots_coach_date ON coach_slots(coach_id, date);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_training_user ON training_records(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON profiles(student_id);

-- ===== 10. 禁用 RLS（demo 阶段简化） =====
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE coach_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE venues DISABLE ROW LEVEL SECURITY;
ALTER TABLE coach_slots DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE training_records DISABLE ROW LEVEL SECURITY;

-- ===== 11. 更新时间触发器 =====
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();