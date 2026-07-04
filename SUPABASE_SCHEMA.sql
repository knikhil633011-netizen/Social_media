-- SQL Schema Setup for echo room database on Supabase
-- Paste this script directly into the SQL Editor of your Supabase project (https://supabase.com).

-- 1. Create Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Create Groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Seed default study and work groups
INSERT INTO groups (id, name, description)
VALUES 
  ('8a73b57f-1d4e-4b6a-8b6f-12467d3b1451', '📚 Education', 'Share study notes, course links, tutorials, and academic tips. Everything is free to download.'),
  ('9b73b57f-2e4e-4c6a-9b6f-23467d3b2452', '💼 Jobs & Careers', 'Post job openings, resume tips, interview questions, and career advice. Free access for all.'),
  ('0c73b57f-3f4e-4d6a-0b6f-34567d3b3453', '💡 Tech & Innovation', 'Discuss programming, web development, AI, gadgets, and tech news. Open market of ideas.')
ON CONFLICT (id) DO NOTHING;

-- 4. Create Posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_alias TEXT NOT NULL,
  bg_color TEXT NOT NULL,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  attachment JSONB,
  vibe TEXT DEFAULT 'default' NOT NULL,
  expires_at TIMESTAMPTZ,
  is_secret_drop BOOLEAN DEFAULT FALSE NOT NULL,
  download_count INT DEFAULT 0 NOT NULL,
  download_limit INT DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. Create Comments table (called emoji_comments)
CREATE TABLE IF NOT EXISTS emoji_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachment JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. Create Reactions table
CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  emoji_char TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (post_id, emoji_char, user_id)
);

-- 7. Create Questions table for anonymous Q&A inbox
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 8. Create Polls table
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 9. Create Poll Votes table
CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_idx INT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ip_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (poll_id, user_id),
  UNIQUE (poll_id, ip_hash)
);

-- 10. Create Spotlights table
CREATE TABLE IF NOT EXISTS spotlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  link TEXT,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
