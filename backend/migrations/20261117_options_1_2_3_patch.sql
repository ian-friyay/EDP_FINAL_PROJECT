-- SerbisYou Options 1, 2, and 3 Universal Database Patch
-- 1. Weather & Map Rendezvous enhancements on transactions
ALTER TABLE IF EXISTS public.transactions
ADD COLUMN IF NOT EXISTS rendezvous_location TEXT DEFAULT 'Main Campus - Student Center';

ALTER TABLE IF EXISTS public.transactions
ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMPTZ;

ALTER TABLE IF EXISTS public.transactions
ADD COLUMN IF NOT EXISTS paypal_order_id TEXT;

ALTER TABLE IF EXISTS public.transactions
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

ALTER TABLE IF EXISTS public.transactions
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash';

ALTER TABLE IF EXISTS public.transactions
ADD COLUMN IF NOT EXISTS service_completion TIMESTAMPTZ;

-- 2. System Settings table for Platform configurations (e.g. ad daily rate)
CREATE TABLE IF NOT EXISTS public.system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.system_settings (key, value, description)
VALUES ('ad_daily_rate', '2.00', 'Daily advertisement rate in PHP')
ON CONFLICT (key) DO NOTHING;

-- 3. Advertisements table for Campus Ads System
CREATE TABLE IF NOT EXISTS public.advertisements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES public.users(user_id) ON DELETE SET NULL,
    advertiser_name VARCHAR(150),
    advertiser_type VARCHAR(50) DEFAULT 'student',
    title VARCHAR(150) NOT NULL,
    description TEXT,
    banner_url TEXT,
    target_url TEXT,
    placement VARCHAR(50) DEFAULT 'homepage_and_dashboard',
    duration_type VARCHAR(20) DEFAULT 'week',
    duration_days INTEGER DEFAULT 7,
    daily_rate NUMERIC(10, 2) DEFAULT 2.00,
    computed_cost NUMERIC(10, 2) DEFAULT 14.00,
    amount_paid NUMERIC(10, 2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active', -- 'pending', 'active', 'rejected', 'inactive'
    payment_status VARCHAR(20) DEFAULT 'unpaid', -- 'unpaid', 'paid'
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE DEFAULT (CURRENT_DATE + INTERVAL '7 days'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_advertisements_status ON public.advertisements(status);
CREATE INDEX IF NOT EXISTS idx_advertisements_dates ON public.advertisements(start_date, end_date);
