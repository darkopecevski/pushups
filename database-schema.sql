-- Profiles Table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Challenges Table
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  exercise_type TEXT NOT NULL,
  goal_type TEXT NOT NULL,
  goal_value INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Challenge Participants Table (Junction Table)
CREATE TABLE public.challenge_participants (
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (challenge_id, user_id)
);

-- Exercise Logs Table
CREATE TABLE public.exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  exercise_count INTEGER NOT NULL,
  log_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Water Intake Settings Table
CREATE TABLE public.water_intake_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  daily_goal INTEGER NOT NULL DEFAULT 2000, -- Default goal of 2000ml or ~64oz
  unit_preference TEXT NOT NULL DEFAULT 'ml', -- 'ml' or 'oz'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Water Intake Logs Table
CREATE TABLE public.water_intake_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Amount in ml
  beverage_type TEXT NOT NULL DEFAULT 'water', -- Type of beverage (water, tea, coffee, etc)
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  log_time TIME NOT NULL DEFAULT CURRENT_TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quick Log Presets Table
CREATE TABLE public.water_intake_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Amount in ml
  beverage_type TEXT NOT NULL DEFAULT 'water',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_challenge_participants_user_id ON public.challenge_participants(user_id);
CREATE INDEX idx_challenge_participants_challenge_id ON public.challenge_participants(challenge_id);
CREATE INDEX idx_exercise_logs_user_id ON public.exercise_logs(user_id);
CREATE INDEX idx_exercise_logs_challenge_id ON public.exercise_logs(challenge_id);
CREATE INDEX idx_exercise_logs_log_date ON public.exercise_logs(log_date);
CREATE INDEX idx_water_intake_settings_user_id ON public.water_intake_settings(user_id);
CREATE INDEX idx_water_intake_logs_user_id ON public.water_intake_logs(user_id);
CREATE INDEX idx_water_intake_logs_log_date ON public.water_intake_logs(log_date);
CREATE INDEX idx_water_intake_presets_user_id ON public.water_intake_presets(user_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_intake_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_intake_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_intake_presets ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Challenges policies
CREATE POLICY "Challenges are viewable by everyone"
  ON public.challenges FOR SELECT
  USING (true);

CREATE POLICY "Only admins can create challenges"
  ON public.challenges FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Only admins can update challenges"
  ON public.challenges FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Only admins can delete challenges"
  ON public.challenges FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Challenge participants policies
CREATE POLICY "Challenge participants are viewable by everyone"
  ON public.challenge_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can join challenges"
  ON public.challenge_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave challenges they joined"
  ON public.challenge_participants FOR DELETE
  USING (auth.uid() = user_id);

-- Exercise logs policies
CREATE POLICY "Exercise logs are viewable by everyone"
  ON public.exercise_logs FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own exercise logs"
  ON public.exercise_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exercise logs"
  ON public.exercise_logs FOR UPDATE
  USING (auth.uid() = user_id);

-- Water intake settings policies
CREATE POLICY "Users can view their own water intake settings"
  ON public.water_intake_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own water intake settings"
  ON public.water_intake_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own water intake settings"
  ON public.water_intake_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Water intake logs policies
CREATE POLICY "Users can view their own water intake logs"
  ON public.water_intake_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own water intake logs"
  ON public.water_intake_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own water intake logs"
  ON public.water_intake_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own water intake logs"
  ON public.water_intake_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Water intake presets policies
CREATE POLICY "Users can view their own water intake presets"
  ON public.water_intake_presets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own water intake presets"
  ON public.water_intake_presets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own water intake presets"
  ON public.water_intake_presets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own water intake presets"
  ON public.water_intake_presets FOR DELETE
  USING (auth.uid() = user_id);

-- Get current streak function
CREATE OR REPLACE FUNCTION public.get_current_streak(p_user_id UUID, p_challenge_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_streak INTEGER := 0;
  v_current_date DATE := CURRENT_DATE;
  v_check_date DATE := CURRENT_DATE;
  v_has_activity BOOLEAN;
BEGIN
  -- Start from today and go backwards
  LOOP
    -- Check if there's an exercise log for this date
    SELECT EXISTS (
      SELECT 1
      FROM public.exercise_logs
      WHERE user_id = p_user_id
        AND challenge_id = p_challenge_id
        AND log_date = v_check_date
        AND exercise_count > 0
    ) INTO v_has_activity;
    
    -- Break if no activity on this day
    EXIT WHEN NOT v_has_activity;
    
    -- Increment streak and go to previous day
    v_streak := v_streak + 1;
    v_check_date := v_check_date - INTERVAL '1 day';
  END LOOP;
  
  RETURN v_streak;
END;
$$;

-- RLS policies for challenge_invites table
ALTER TABLE public.challenge_invites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own invitations" ON public.challenge_invites;
DROP POLICY IF EXISTS "Challenge creators can view all invitations for their challenges" ON public.challenge_invites;
DROP POLICY IF EXISTS "Challenge creators can insert invitations" ON public.challenge_invites;
DROP POLICY IF EXISTS "Challenge creators can update invitations" ON public.challenge_invites;
DROP POLICY IF EXISTS "Users can update their own invitations" ON public.challenge_invites;
DROP POLICY IF EXISTS "Challenge creators can delete invitations" ON public.challenge_invites;

-- Create a policy for public access to the challenge_invites table (temporary for debugging)
CREATE POLICY "Allow all access to challenge_invites" 
  ON public.challenge_invites FOR ALL 
  USING (true)
  WITH CHECK (true);

-- More restrictive policies can be added after confirming the issue is resolved
-- For example:
/*
-- Everyone can view challenge invites for themselves (using user's auth email)
CREATE POLICY "Users can view their own invitations"
  ON public.challenge_invites FOR SELECT
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Challenge creators can view all invitations for their challenges
CREATE POLICY "Challenge creators can view all invitations for their challenges"
  ON public.challenge_invites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.challenges
      WHERE id = challenge_id
      AND created_by = auth.uid()
    )
  );

-- Allow challenge creators to insert invitations
CREATE POLICY "Challenge creators can insert invitations"
  ON public.challenge_invites FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.challenges
      WHERE id = challenge_id
      AND created_by = auth.uid()
    )
  );
*/

-- Update foreign key constraints to include ON DELETE CASCADE
-- Note: These commands should be run after dropping the existing constraints

-- 1. First, drop the existing constraints (might need to be run separately)
-- ALTER TABLE public.challenge_participants DROP CONSTRAINT challenge_participants_challenge_id_fkey;
-- ALTER TABLE public.exercise_logs DROP CONSTRAINT exercise_logs_challenge_id_fkey;
-- ALTER TABLE public.challenge_invites DROP CONSTRAINT challenge_invites_challenge_id_fkey;

-- 2. Then, recreate them with ON DELETE CASCADE
-- ALTER TABLE public.challenge_participants 
--   ADD CONSTRAINT challenge_participants_challenge_id_fkey 
--   FOREIGN KEY (challenge_id) 
--   REFERENCES public.challenges(id) 
--   ON DELETE CASCADE;

-- ALTER TABLE public.exercise_logs 
--   ADD CONSTRAINT exercise_logs_challenge_id_fkey 
--   FOREIGN KEY (challenge_id) 
--   REFERENCES public.challenges(id) 
--   ON DELETE CASCADE;

-- ALTER TABLE public.challenge_invites 
--   ADD CONSTRAINT challenge_invites_challenge_id_fkey 
--   FOREIGN KEY (challenge_id) 
--   REFERENCES public.challenges(id) 
--   ON DELETE CASCADE;

-- Function to get total water intake for a specific day
CREATE OR REPLACE FUNCTION public.get_daily_water_intake(p_user_id UUID, p_date DATE)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_total INTEGER := 0;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total
  FROM public.water_intake_logs
  WHERE user_id = p_user_id
    AND log_date = p_date;
  
  RETURN v_total;
END;
$$;