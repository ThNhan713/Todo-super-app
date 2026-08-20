-- ============================================================================
-- 1. ENUMS (Custom Data Types)
-- ============================================================================

CREATE TYPE habit_type AS ENUM ('checkmark', 'counter');
CREATE TYPE habit_direction AS ENUM ('at_least', 'at_most');
CREATE TYPE goal_period AS ENUM ('daily', 'weekly');


-- ============================================================================
-- 2. USER PROFILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    xp_total    INTEGER NOT NULL DEFAULT 0,
    coins       INTEGER NOT NULL DEFAULT 0
);[cite: 1]


-- ============================================================================
-- 3. TODOS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.todos (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    status          TEXT NOT NULL DEFAULT 'pending',
    
    -- Gamification Rewards
    xp_reward       INTEGER NOT NULL DEFAULT 10,
    coin_reward     INTEGER NOT NULL DEFAULT 1,
    
    -- Metadata & Attributes
    difficulty      TEXT CHECK (difficulty IN ('trivial', 'easy', 'medium', 'hard', 'very hard')),
    time            TEXT CHECK (time IN ('quick', 'short', 'medium', 'long', 'very long')),
    
    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);[cite: 1]


-- ============================================================================
-- 4. HABITS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.habits (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    description     VARCHAR(1000),
    
    -- Type & Direction Mechanics
    habit_type      habit_type NOT NULL DEFAULT 'checkmark',
    direction       habit_direction NOT NULL DEFAULT 'at_least',
    period          goal_period NOT NULL DEFAULT 'daily',
    
    -- Target Rules
    target_value    NUMERIC NOT NULL DEFAULT 1,
    target_days     SMALLINT,
    unit            VARCHAR(32) DEFAULT NULL,
    
    -- Gamification & Classification
    xp_reward       INTEGER NOT NULL DEFAULT 1,
    coin_reward     INTEGER NOT NULL DEFAULT 1,
    difficulty      TEXT CHECK (difficulty IN ('trivial', 'easy', 'medium', 'hard', 'very hard')),
    time            TEXT CHECK (time IN ('quick', 'short', 'medium', 'long', 'very long')),
    
    -- State & Timestamps
    is_archived     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT uq_habits_id_type UNIQUE (id, habit_type),
    CONSTRAINT chk_target_positive CHECK (target_value > 0),
    CONSTRAINT chk_checkmark_rules CHECK (
        (habit_type = 'checkmark' AND direction = 'at_least' AND target_value = 1) 
        OR habit_type = 'counter'
    ),
    CONSTRAINT chk_period_and_target_days CHECK (
        (period = 'daily' AND target_days IS NULL) 
        OR (period = 'weekly' AND (target_days IS NULL OR target_days BETWEEN 1 AND 7))
    )
);[cite: 1]


-- ============================================================================
-- 5. HABIT LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.habit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id        UUID NOT NULL,
    habit_type      habit_type NOT NULL,
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    log_date        DATE NOT NULL,
    value           NUMERIC NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT uq_habit_date UNIQUE (habit_id, log_date),
    CONSTRAINT chk_value_non_negative CHECK (value >= 0),
    CONSTRAINT chk_checkmark_value_cap CHECK (habit_type != 'checkmark' OR value <= 1),
    
    -- Composite Foreign Key: Enforces habit_type synchronization
    CONSTRAINT fk_habit_logs_parent 
        FOREIGN KEY (habit_id, habit_type) 
        REFERENCES public.habits(id, habit_type) 
        ON DELETE CASCADE
);[cite: 1]


-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles: Users can only read and modify their own profile
CREATE POLICY "users manage own profile" 
    ON public.profiles 
    FOR ALL 
    TO public 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);[cite: 1]

-- 2. Todos: Users can only read and modify their own todos
CREATE POLICY "users manage own todos" 
    ON public.todos 
    FOR ALL 
    TO public 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);[cite: 1]

-- 3. Habits: Users can only read and modify their own habits
CREATE POLICY "users manage own habits" 
    ON public.habits 
    FOR ALL 
    TO public 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);[cite: 1]

-- 4. Habit Logs: Users can only read and modify their own logs
CREATE POLICY "users manage own habit logs" 
    ON public.habit_logs 
    FOR ALL 
    TO public 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);[cite: 1]