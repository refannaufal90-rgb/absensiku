-- ===================================================
-- Skrip Setup Database Supabase untuk HadirKu
-- Aman dijalankan berulang kali (Idempotent)
-- ===================================================

-- 1. Buat Tabel Attendance (Kehadiran)
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Hadir',
    clock_in TIME WITHOUT TIME ZONE,
    clock_out TIME WITHOUT TIME ZONE,
    duration_minutes INTEGER DEFAULT 0,
    notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_date UNIQUE (user_id, date)
);

-- 2. Buat Tabel Daily Tasks (Target Tugas Harian)
CREATE TABLE IF NOT EXISTS public.daily_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    priority TEXT DEFAULT 'Sedang',
    due_date DATE,
    completed BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tambahkan kolom baru jika tabel sudah pernah dibuat sebelumnya
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='daily_tasks' AND column_name='description') THEN
        ALTER TABLE public.daily_tasks ADD COLUMN description TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='daily_tasks' AND column_name='priority') THEN
        ALTER TABLE public.daily_tasks ADD COLUMN priority TEXT DEFAULT 'Sedang';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='daily_tasks' AND column_name='due_date') THEN
        ALTER TABLE public.daily_tasks ADD COLUMN due_date DATE;
    END IF;
END $$;

-- 3. Aktifkan Row Level Security (RLS)
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;

-- 4. Kebijakan Keamanan untuk Tabel Attendance
DROP POLICY IF EXISTS "Users can view own attendance" ON public.attendance;
CREATE POLICY "Users can view own attendance" 
ON public.attendance FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own attendance" ON public.attendance;
CREATE POLICY "Users can insert own attendance" 
ON public.attendance FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own attendance" ON public.attendance;
CREATE POLICY "Users can update own attendance" 
ON public.attendance FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own attendance" ON public.attendance;
CREATE POLICY "Users can delete own attendance" 
ON public.attendance FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- 5. Kebijakan Keamanan untuk Tabel Daily Tasks
DROP POLICY IF EXISTS "Users can view own tasks" ON public.daily_tasks;
CREATE POLICY "Users can view own tasks" 
ON public.daily_tasks FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tasks" ON public.daily_tasks;
CREATE POLICY "Users can insert own tasks" 
ON public.daily_tasks FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tasks" ON public.daily_tasks;
CREATE POLICY "Users can update own tasks" 
ON public.daily_tasks FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tasks" ON public.daily_tasks;
CREATE POLICY "Users can delete own tasks" 
ON public.daily_tasks FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);
