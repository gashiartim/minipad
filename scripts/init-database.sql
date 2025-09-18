-- Initialize the database with proper indexes and constraints
-- This script will be run automatically when the app starts

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notes_slug ON Note(slug);
CREATE INDEX IF NOT EXISTS idx_images_note_id ON Image(noteId);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON Note(createdAt);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON Image(createdAt);

-- Ensure data directory exists
-- This will be handled by the application code
