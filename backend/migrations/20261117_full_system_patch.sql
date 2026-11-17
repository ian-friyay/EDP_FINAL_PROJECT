-- SerbisYou Universal System Schema Patch
-- Run this migration in your Supabase SQL Editor:

-- 1. Ensure 'is_read' column exists on 'messages' table
ALTER TABLE IF EXISTS messages 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- 2. Create 'notifications' table for persistent in-database notifications
CREATE TABLE IF NOT EXISTS notifications (
    notification_id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL DEFAULT 'system', -- 'message', 'booking', 'transaction', 'verification', 'system'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user notification lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- 3. Create 'reviews' table for ratings & feedback
CREATE TABLE IF NOT EXISTS reviews (
    review_id BIGSERIAL PRIMARY KEY,
    transaction_id VARCHAR(50) REFERENCES transactions(transaction_id) ON DELETE SET NULL,
    service_id VARCHAR(50) REFERENCES services(service_id) ON DELETE CASCADE,
    reviewer_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    provider_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    rating NUMERIC(2, 1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_service_id ON reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_reviews_provider_id ON reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);

-- 4. Add Provider Document Verification fields to 'users' table
ALTER TABLE IF EXISTS users 
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'unverified'; -- 'unverified', 'pending', 'verified', 'rejected'

ALTER TABLE IF EXISTS users 
ADD COLUMN IF NOT EXISTS id_document_url TEXT;

ALTER TABLE IF EXISTS users 
ADD COLUMN IF NOT EXISTS verification_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_users_verification_status ON users(verification_status);
