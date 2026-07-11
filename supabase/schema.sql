-- 复旦健身社互助预约平台 - 数据库 Schema
-- 请在 Supabase Dashboard → SQL Editor 中执行此脚本

-- ===== 1. 用户表（扩展 Supabase auth.users） =====
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id TEXT UNIQUE NOT NULL,
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
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
  reviewed_by UUID,
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES coach_profiles(id) ON DELETE CASCADE,
  venue_id TEXT REFERENCES venues(id),
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  is_available BOOLEAN DEFAULT true,
  UNIQUE(coach_id, venue_id, date, start_time)
);

-- ===== 5. 预约表 =====
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES coach_profiles(id) ON DELETE CASCADE,
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  is_pinned BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'published' CHECK (status IN ('published', 'draft')),
  published_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== 7. 通知表 =====
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  read BOOLEAN DEFAULT false,
  related_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== 8. 训练记录表 =====
CREATE TABLE IF NOT EXISTS training_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
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

-- ===== 10. 行级安全策略 (RLS) =====
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_slots ENABLE ROW LEVEL SECURITY;

-- 用户可以查看和更新自己的资料
CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

-- 用户可以查看自己的预约
CREATE POLICY "Users can view own appointments" ON appointments 
  FOR SELECT USING (auth.uid() = student_id);
-- 教练可以查看分配给自己的预约
CREATE POLICY "Coaches can view their appointments" ON appointments 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_profiles 
      WHERE coach_profiles.user_id = auth.uid() 
      AND coach_profiles.id = appointments.coach_id
    )
  );

-- 用户可以查看自己的通知
CREATE POLICY "Users can view own notifications" ON notifications 
  FOR SELECT USING (auth.uid() = user_id);

-- 用户可以查看自己的训练记录
CREATE POLICY "Users can view own training records" ON training_records 
  FOR SELECT USING (auth.uid() = user_id);

-- 教练可以管理自己的时段
CREATE POLICY "Coaches can manage own slots" ON coach_slots 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM coach_profiles 
      WHERE coach_profiles.user_id = auth.uid() 
      AND coach_profiles.id = coach_slots.coach_id
    )
  );

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