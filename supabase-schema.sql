-- InsureScan Database Schema for Supabase
-- Run this in your Supabase SQL Editor to create all required tables

-- ============================================
-- Claims Table
-- ============================================
CREATE TABLE IF NOT EXISTS claims (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    claim_score DECIMAL(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_created_at ON claims(created_at DESC);

-- ============================================
-- Documents Table
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
    id BIGSERIAL PRIMARY KEY,
    claim_id BIGINT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on claim_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_documents_claim_id ON documents(claim_id);

-- ============================================
-- Images Table
-- ============================================
CREATE TABLE IF NOT EXISTS images (
    id BIGSERIAL PRIMARY KEY,
    claim_id BIGINT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    part TEXT,
    severity TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on claim_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_images_claim_id ON images(claim_id);

-- ============================================
-- Videos Table
-- ============================================
CREATE TABLE IF NOT EXISTS videos (
    id BIGSERIAL PRIMARY KEY,
    claim_id BIGINT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    model_status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on claim_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_videos_claim_id ON videos(claim_id);

-- ============================================
-- Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Create RLS Policies for Public Access
-- Note: Adjust these policies based on your security requirements
-- Current policies allow full access for authenticated users
-- ============================================

-- Claims policies
CREATE POLICY "Allow public read access on claims"
    ON claims FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert on claims"
    ON claims FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update on claims"
    ON claims FOR UPDATE
    USING (true);

CREATE POLICY "Allow public delete on claims"
    ON claims FOR DELETE
    USING (true);

-- Documents policies
CREATE POLICY "Allow public read access on documents"
    ON documents FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert on documents"
    ON documents FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update on documents"
    ON documents FOR UPDATE
    USING (true);

CREATE POLICY "Allow public delete on documents"
    ON documents FOR DELETE
    USING (true);

-- Images policies
CREATE POLICY "Allow public read access on images"
    ON images FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert on images"
    ON images FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update on images"
    ON images FOR UPDATE
    USING (true);

CREATE POLICY "Allow public delete on images"
    ON images FOR DELETE
    USING (true);

-- Videos policies
CREATE POLICY "Allow public read access on videos"
    ON videos FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert on videos"
    ON videos FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update on videos"
    ON videos FOR UPDATE
    USING (true);

CREATE POLICY "Allow public delete on videos"
    ON videos FOR DELETE
    USING (true);

-- ============================================
-- Sample Data (Optional - for testing)
-- ============================================
-- Uncomment below to insert sample data

-- INSERT INTO claims (name, status, claim_score) VALUES
--     ('Sample Claim 1', 'pending', NULL),
--     ('Sample Claim 2', 'processing', 75.5),
--     ('Sample Claim 3', 'completed', 92.3);
