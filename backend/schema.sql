CREATE SEQUENCE IF NOT EXISTS public.users_user_id_seq
    AS integer
    MINVALUE 1
    MAXVALUE 9999
    START WITH 1
    NO CYCLE;

CREATE TABLE IF NOT EXISTS public.users (
    user_id text PRIMARY KEY DEFAULT (
        'MMC-' || lpad(nextval('public.users_user_id_seq')::text, 4, '0')
    ) CHECK (user_id ~ '^MMC-[0-9]{4}$'),
    first_name text,
    last_name text,
    username text,
    contact_number text,
    email text NOT NULL,
    region text,
    province text,
    city text,
    barangay text,
    user_type text NOT NULL CHECK (user_type IN ('Provider', 'Requestor')),
    department text,
    designation text,
    password text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    CHECK ((department IS NULL) = (designation IS NULL))
);

ALTER TABLE public.users
    ALTER COLUMN user_id SET DEFAULT (
        'MMC-' || lpad(nextval('public.users_user_id_seq')::text, 4, '0')
    );

SELECT setval(
    'public.users_user_id_seq',
    GREATEST(
        COALESCE(MAX(
            CASE
                WHEN user_id ~ '^MMC-[0-9]{4}$' THEN substring(user_id FROM 5)::integer
            END
        ), 0),
        1
    ),
    COALESCE(MAX(
        CASE
            WHEN user_id ~ '^MMC-[0-9]{4}$' THEN substring(user_id FROM 5)::integer
        END
    ), 0) > 0
)
FROM public.users;

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique
    ON public.users (lower(email));

CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_unique
    ON public.users (lower(username))
    WHERE username IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.services (
    service_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL REFERENCES public.users(user_id),
    service_category text NOT NULL,
    subcategory text,
    service_description text NOT NULL,
    amount_topay numeric(12, 2) NOT NULL CHECK (amount_topay >= 0),
    service_status text NOT NULL DEFAULT 'active'
        CHECK (service_status IN ('active', 'inactive')),
    picture_proof jsonb NOT NULL DEFAULT '[]'::jsonb
        CHECK (jsonb_typeof(picture_proof) = 'array'),
    is_deleted boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.transactions (
    transaction_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id text NOT NULL REFERENCES public.users(user_id),
    requestor_id text NOT NULL REFERENCES public.users(user_id),
    service_id uuid NOT NULL REFERENCES public.services(service_id),
    amount_topay numeric(12, 2) NOT NULL CHECK (amount_topay >= 0),
    booking_fee numeric(12, 2) NOT NULL DEFAULT 5.00 CHECK (booking_fee = 5.00),
    total_topay numeric(12, 2)
        GENERATED ALWAYS AS (amount_topay + booking_fee) STORED,
    commission_fee numeric(12, 2)
        GENERATED ALWAYS AS (round(amount_topay * 0.05, 2)) STORED,
    service_status text NOT NULL DEFAULT 'pending'
        CHECK (service_status IN ('pending', 'accepted', 'cancelled', 'completed')),
    qr_code text
);

CREATE TABLE IF NOT EXISTS public.messages (
    message_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id text NOT NULL REFERENCES public.users(user_id),
    receiver_id text NOT NULL REFERENCES public.users(user_id),
    content text NOT NULL,
    "timestamp" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_verifications (
    user_id text PRIMARY KEY REFERENCES public.users(user_id) ON DELETE CASCADE,
    otp_hash text,
    expires_at timestamptz,
    verified_at timestamptz,
    failed_attempts smallint NOT NULL DEFAULT 0
        CHECK (failed_attempts BETWEEN 0 AND 5),
    CHECK (
        (verified_at IS NOT NULL AND otp_hash IS NULL AND expires_at IS NULL)
        OR
        (verified_at IS NULL AND otp_hash IS NOT NULL AND expires_at IS NOT NULL)
    )
);

ALTER TABLE public.email_verifications
    ADD COLUMN IF NOT EXISTS failed_attempts smallint NOT NULL DEFAULT 0
    CHECK (failed_attempts BETWEEN 0 AND 5);
