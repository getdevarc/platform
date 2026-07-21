-- Migration: Add session tracking for learn paths
ALTER TABLE user_enrolled_tracks 
ADD COLUMN IF NOT EXISTS last_visited_page_id UUID REFERENCES module_pages(id) ON DELETE SET NULL;
