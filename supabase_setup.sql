-- =====================================================
-- SUPABASE SETUP - Ứng dụng Quản Lý Nhiệm Vụ
-- Chạy script này trong Supabase Dashboard > SQL Editor
-- =====================================================

-- Tạo bảng todos
CREATE TABLE IF NOT EXISTS public.todos (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done')),
  priority    TEXT NOT NULL DEFAULT 'TRUNG BÌNH' CHECK (priority IN ('CAO', 'TRUNG BÌNH', 'THẤP')),
  category    TEXT NOT NULL DEFAULT 'Công việc',
  deadline    TIME,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tự động cập nhật updated_at khi có thay đổi
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER todos_updated_at
  BEFORE UPDATE ON public.todos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index để tăng tốc truy vấn theo user_id
CREATE INDEX IF NOT EXISTS todos_user_id_idx ON public.todos(user_id);
CREATE INDEX IF NOT EXISTS todos_created_at_idx ON public.todos(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) - Mỗi user chỉ thấy dữ liệu của mình
-- =====================================================

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Xem: chỉ được xem todos của chính mình
CREATE POLICY "users_select_own_todos" ON public.todos
  FOR SELECT USING (auth.uid() = user_id);

-- Thêm: chỉ được thêm todos cho chính mình
CREATE POLICY "users_insert_own_todos" ON public.todos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Sửa: chỉ được sửa todos của chính mình
CREATE POLICY "users_update_own_todos" ON public.todos
  FOR UPDATE USING (auth.uid() = user_id);

-- Xóa: chỉ được xóa todos của chính mình
CREATE POLICY "users_delete_own_todos" ON public.todos
  FOR DELETE USING (auth.uid() = user_id);
