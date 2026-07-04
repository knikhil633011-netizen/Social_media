import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = isSupabaseConfigured 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const MOCK_DB_PATH = path.join(process.cwd(), 'lib', 'mockDb.json');

// Helper to hash passwords securely
export function hashPassword(password) {
  return crypto
    .createHmac('sha256', 'auth-salt-key-998877')
    .update(password)
    .digest('hex');
}

// Custom lists for generating funny anonymous aliases
const ADJECTIVES = [
  'Quirky', 'Fuzzy', 'Wonky', 'Sassy', 'Curious', 'Mysterious', 
  'Sneaky', 'Jolly', 'Sleepy', 'Wobbly', 'Dandy', 'Spunky', 
  'Gloomy', 'Crafty', 'Bouncy', 'Zesty', 'Silly', 'Rowdy'
];

const ANIMALS = [
  'Zebra', 'Otter', 'Raccoon', 'Axolotl', 'Ferret', 'Moth', 
  'Badger', 'Koala', 'Panda', 'Hedgehog', 'Fox', 'Owl', 
  'Sloth', 'Penguin', 'Turtle', 'Beaver', 'Rabbit', 'Dolphin'
];

const BG_COLORS = ['pink', 'yellow', 'green', 'cream'];

export function generateAlias() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${adj} ${animal}`;
}

const THREAD_ANIMALS = ['Fox', 'Koala', 'Owl', 'Panda', 'Tiger', 'Lion', 'Bear', 'Rabbit', 'Otter', 'Badger', 'Deer', 'Wolf'];
const THREAD_EMOJIS = ['🦊', '🐨', '🦉', '🐼', '🐯', '🦁', '🐻', '🐰', '🦦', '🦡', '🦌', '🐺'];
const THREAD_ADJECTIVES = ['Gloomy', 'Fuzzy', 'Wonky', 'Quirky', 'Spunky', 'Dapper', 'Crafty', 'Silly', 'Jolly', 'Witty', 'Sassy', 'Sneaky'];

export function generateThreadAlias(userId, postId) {
  if (!userId || !postId) return '💬 Anonymous';
  const hash = crypto.createHash('sha256').update(`${userId}:${postId}`).digest('hex');
  const num = parseInt(hash.substring(0, 8), 16);
  
  const adj = THREAD_ADJECTIVES[num % THREAD_ADJECTIVES.length];
  const idx = num % THREAD_ANIMALS.length;
  const animal = THREAD_ANIMALS[idx];
  const emoji = THREAD_EMOJIS[idx];
  
  return `${emoji} ${adj} ${animal}`;
}

export function generateBgColor() {
  return BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)];
}

const DEFAULT_MOCK_DATA = {
  users: [
    { id: "user-seed-1", username: "nikhil", password_hash: hashPassword("123"), created_at: new Date().toISOString() }
  ],
  groups: [
    { id: "group-seed-1", name: "📚 Education", description: "Share study notes, course links, tutorials, and academic tips. Everything is free to download.", created_at: new Date().toISOString() },
    { id: "group-seed-2", name: "💼 Jobs & Careers", description: "Post job openings, resume tips, interview questions, and career advice. Free access for all.", created_at: new Date().toISOString() },
    { id: "group-seed-3", name: "💡 Tech & Innovation", description: "Discuss programming, web development, AI, gadgets, and tech news. Open market of ideas.", created_at: new Date().toISOString() }
  ],
  posts: [
    {
      id: "post-1",
      user_id: "user-seed-1",
      content: "just tested that everyone can share thoughts here 🎉 no clout, no faces",
      author_alias: "Quirky Zebra",
      bg_color: "cream",
      group_id: null,
      created_at: new Date(Date.now() - 3600000 * 3).toISOString()
    },
    {
      id: "post-2",
      user_id: "user-seed-1",
      content: "today is my good day",
      author_alias: "Fuzzy Otter",
      bg_color: "yellow",
      group_id: null,
      created_at: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: "post-3",
      user_id: "user-seed-1",
      content: "Hello from QA test post",
      author_alias: "Wonky Raccoon",
      bg_color: "green",
      group_id: null,
      created_at: new Date(Date.now() - 3600000 * 1).toISOString()
    },
    {
      id: "post-seed-edu",
      user_id: "user-seed-1",
      content: "Here is a list of free computer science courses from MIT and Stanford. Check their open courseware portals. Keep learning!",
      author_alias: "Curious Axolotl",
      bg_color: "cream",
      group_id: "group-seed-1",
      created_at: new Date(Date.now() - 1800000).toISOString()
    }
  ],
  reactions: [
    { id: "react-1", post_id: "post-1", emoji_char: "😜", user_id: "user-seed-1", created_at: new Date().toISOString() },
    { id: "react-2", post_id: "post-1", emoji_char: "😅", user_id: "user-seed-2", created_at: new Date().toISOString() },
    { id: "react-3", post_id: "post-2", emoji_char: "🥳", user_id: "user-seed-1", created_at: new Date().toISOString() },
    { id: "react-4", post_id: "post-3", emoji_char: "🔥", user_id: "user-seed-3", created_at: new Date().toISOString() }
  ],
  comments: [
    { id: "comment-1", post_id: "post-1", content: "🙌💯", user_id: "user-seed-2", created_at: new Date(Date.now() - 3600000 * 2.8).toISOString() },
    { id: "comment-2", post_id: "post-3", content: "🔥👍", user_id: "user-seed-3", created_at: new Date(Date.now() - 3600000 * 0.8).toISOString() }
  ]
};

function readMockDb() {
  try {
    if (!fs.existsSync(MOCK_DB_PATH)) {
      const dir = path.dirname(MOCK_DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(DEFAULT_MOCK_DATA, null, 2));
      return DEFAULT_MOCK_DATA;
    }
    const data = fs.readFileSync(MOCK_DB_PATH, 'utf8');
    const db = JSON.parse(data);
    
    // Auto-repair schema for Groups
    let repaired = false;
    if (!db.groups) {
      db.groups = DEFAULT_MOCK_DATA.groups;
      repaired = true;
    }

    if (!db.questions) {
      db.questions = [];
      repaired = true;
    }

    if (!db.polls) {
      db.polls = [];
      repaired = true;
    }

    if (!db.poll_votes) {
      db.poll_votes = [];
      repaired = true;
    }

    if (!db.spotlights) {
      db.spotlights = [];
      repaired = true;
    }
    
    // Ensure group_id, vibe, and expires_at are defined on existing posts to prevent crashes
    if (db.posts) {
      db.posts.forEach(p => {
        if (p.group_id === undefined) {
          p.group_id = null;
          repaired = true;
        }
        if (p.vibe === undefined) {
          p.vibe = 'default';
          repaired = true;
        }
        if (p.expires_at === undefined) {
          p.expires_at = null;
          repaired = true;
        }
        if (p.is_secret_drop === undefined) {
          p.is_secret_drop = false;
          repaired = true;
        }
        if (p.download_count === undefined) {
          p.download_count = 0;
          repaired = true;
        }
        if (p.download_limit === undefined) {
          p.download_limit = 0;
          repaired = true;
        }
      });
    }

    if (repaired) {
      fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(db, null, 2));
    }
    
    return db;
  } catch (error) {
    console.error("Failed to read mock db:", error);
    return DEFAULT_MOCK_DATA;
  }
}

function writeMockDb(data) {
  try {
    const dir = path.dirname(MOCK_DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Failed to write mock db:", error);
  }
}

// ==========================================
// User Operations
// ==========================================

export async function getUserByUsername(username) {
  const normUsername = username.toLowerCase().trim();
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', normUsername)
      .maybeSingle();
    if (error) throw error;
    return data;
  } else {
    const db = readMockDb();
    return db.users.find(u => u.username === normUsername) || null;
  }
}

export async function createUser(username, password) {
  const normUsername = username.toLowerCase().trim();
  const passwordHash = hashPassword(password);

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('users')
      .insert([{ username: normUsername, password_hash: passwordHash }])
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const db = readMockDb();
    
    // Check duplication
    const exists = db.users.some(u => u.username === normUsername);
    if (exists) {
      throw new Error("Username already taken");
    }

    const newUser = {
      id: "user-" + Math.random().toString(36).substr(2, 9),
      username: normUsername,
      password_hash: passwordHash,
      created_at: new Date().toISOString()
    };
    db.users.push(newUser);
    writeMockDb(db);
    return newUser;
  }
}

// ==========================================
// Posts and Feed Operations
// ==========================================

export async function getPosts(currentUserId = '', groupId = null) {
  let adminId = 'user-seed-1';
  if (isSupabaseConfigured) {
    const { data: admin } = await supabase.from('users').select('id').eq('username', 'nikhil').maybeSingle();
    if (admin) adminId = admin.id;
  } else {
    const db = readMockDb();
    const admin = db.users.find(u => u.username === 'nikhil');
    if (admin) adminId = admin.id;
  }

  if (isSupabaseConfigured) {
    let query = supabase
      .from('posts')
      .select('*')
      .eq('user_id', adminId)
      .order('created_at', { ascending: false });

    if (groupId) {
      query = query.eq('group_id', groupId);
    } else {
      query = query.is('group_id', null);
    }

    const { data: posts, error: postsError } = await query;

    if (postsError) throw postsError;

    // Filter out expired posts
    const activePosts = (posts || []).filter(p => !p.expires_at || new Date(p.expires_at) > new Date());
    const postIds = activePosts.map(p => p.id);
    if (postIds.length === 0) return [];

    const [reactionsRes, commentsRes] = await Promise.all([
      supabase.from('reactions').select('*').in('post_id', postIds),
      supabase.from('emoji_comments').select('*').in('post_id', postIds).order('created_at', { ascending: true })
    ]);

    if (reactionsRes.error) throw reactionsRes.error;
    if (commentsRes.error) throw commentsRes.error;

    return activePosts.map(post => {
      const postReactions = reactionsRes.data.filter(r => r.post_id === post.id);
      const postComments = commentsRes.data.filter(c => c.post_id === post.id);

      const reactionsCount = {};
      const userReactions = {};

      postReactions.forEach(r => {
        reactionsCount[r.emoji_char] = (reactionsCount[r.emoji_char] || 0) + 1;
        if (currentUserId && r.user_id === currentUserId) {
          userReactions[r.emoji_char] = true;
        }
      });

      return {
        ...post,
        reactions: Object.keys(reactionsCount).map(emoji => ({
          emoji_char: emoji,
          count: reactionsCount[emoji],
          user_reacted: !!userReactions[emoji]
        })),
        comments: postComments.map(c => ({
          id: c.id,
          content: c.content,
          created_at: c.created_at,
          attachment: c.attachment || null,
          author_alias: generateThreadAlias(c.user_id, post.id),
          is_author: currentUserId && c.user_id === currentUserId
        })),
        is_author: currentUserId && post.user_id === currentUserId
      };
    });
  } else {
    const db = readMockDb();
    let filtered = [...db.posts].filter(p => p.user_id === adminId);
    if (groupId) {
      filtered = filtered.filter(p => p.group_id === groupId);
    } else {
      filtered = filtered.filter(p => !p.group_id);
    }
    // Filter out expired posts
    const activePosts = filtered.filter(p => !p.expires_at || new Date(p.expires_at) > new Date());
    const sortedPosts = activePosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return sortedPosts.map(post => {
      const postReactions = db.reactions.filter(r => r.post_id === post.id);
      const postComments = db.comments.filter(c => c.post_id === post.id);

      const reactionsCount = {};
      const userReactions = {};

      postReactions.forEach(r => {
        reactionsCount[r.emoji_char] = (reactionsCount[r.emoji_char] || 0) + 1;
        if (currentUserId && r.user_id === currentUserId) {
          userReactions[r.emoji_char] = true;
        }
      });

      return {
        ...post,
        reactions: Object.keys(reactionsCount).map(emoji => ({
          emoji_char: emoji,
          count: reactionsCount[emoji],
          user_reacted: !!userReactions[emoji]
        })),
        comments: postComments.map(c => ({
          id: c.id,
          content: c.content,
          created_at: c.created_at,
          attachment: c.attachment || null,
          author_alias: generateThreadAlias(c.user_id, post.id),
          is_author: currentUserId && c.user_id === currentUserId
        })),
        is_author: currentUserId && post.user_id === currentUserId
      };
    });
  }
}

export async function createPost(content, userId, groupId = null, attachment = null, vibe = 'default', expiresAt = null, isSecretDrop = false, downloadLimit = 0) {
  const authorAlias = generateAlias();
  const bgColor = generateBgColor();

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('posts')
      .insert([{ 
        content, 
        user_id: userId,
        author_alias: authorAlias,
        bg_color: bgColor,
        group_id: groupId,
        attachment,
        vibe,
        expires_at: expiresAt,
        is_secret_drop: isSecretDrop,
        download_count: 0,
        download_limit: downloadLimit
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    const db = readMockDb();
    const newPost = {
      id: "post-" + Math.random().toString(36).substr(2, 9),
      user_id: userId,
      content,
      author_alias: authorAlias,
      bg_color: bgColor,
      group_id: groupId,
      attachment,
      vibe,
      expires_at: expiresAt,
      is_secret_drop: isSecretDrop,
      download_count: 0,
      download_limit: downloadLimit,
      created_at: new Date().toISOString()
    };
    db.posts.push(newPost);
    writeMockDb(db);
    return newPost;
  }
}

export async function toggleReaction(postId, emojiChar, userId) {
  if (isSupabaseConfigured) {
    const { data: existing, error: checkError } = await supabase
      .from('reactions')
      .select('*')
      .eq('post_id', postId)
      .eq('emoji_char', emojiChar)
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existing) {
      const { error: deleteError } = await supabase
        .from('reactions')
        .delete()
        .eq('id', existing.id);
      if (deleteError) throw deleteError;
      return { action: 'removed', emoji: emojiChar };
    } else {
      const { error: insertError } = await supabase
        .from('reactions')
        .insert([{ post_id: postId, emoji_char: emojiChar, user_id: userId }]);
      if (insertError) throw insertError;
      return { action: 'added', emoji: emojiChar };
    }
  } else {
    const db = readMockDb();
    const index = db.reactions.findIndex(
      r => r.post_id === postId && r.emoji_char === emojiChar && r.user_id === userId
    );

    if (index !== -1) {
      db.reactions.splice(index, 1);
      writeMockDb(db);
      return { action: 'removed', emoji: emojiChar };
    } else {
      const newReaction = {
        id: "react-" + Math.random().toString(36).substr(2, 9),
        post_id: postId,
        emoji_char: emojiChar,
        user_id: userId,
        created_at: new Date().toISOString()
      };
      db.reactions.push(newReaction);
      writeMockDb(db);
      return { action: 'added', emoji: emojiChar };
    }
  }
}

export async function addComment(postId, content, userId, attachment = null) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('emoji_comments')
      .insert([{ post_id: postId, content, user_id: userId, attachment }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    const db = readMockDb();
    const newComment = {
      id: "comment-" + Math.random().toString(36).substr(2, 9),
      post_id: postId,
      content,
      user_id: userId,
      attachment,
      created_at: new Date().toISOString()
    };
    db.comments.push(newComment);
    writeMockDb(db);
    return newComment;
  }
}

export async function deletePost(postId, userId) {
  if (isSupabaseConfigured) {
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!post) throw new Error('Post not found');
    if (post.user_id !== userId) throw new Error('Unauthorized deletion');

    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (deleteError) throw deleteError;
    return { success: true };
  } else {
    const db = readMockDb();
    const index = db.posts.findIndex(p => p.id === postId);
    if (index === -1) throw new Error('Post not found');
    if (db.posts[index].user_id !== userId) throw new Error('Unauthorized deletion');

    db.posts.splice(index, 1);
    db.reactions = db.reactions.filter(r => r.post_id !== postId);
    db.comments = db.comments.filter(c => c.post_id !== postId);
    writeMockDb(db);
    return { success: true };
  }
}

export async function deleteComment(commentId, userId) {
  if (isSupabaseConfigured) {
    const { data: comment, error: fetchError } = await supabase
      .from('emoji_comments')
      .select('*')
      .eq('id', commentId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!comment) throw new Error('Comment not found');
    if (comment.user_id !== userId) throw new Error('Unauthorized deletion');

    const { error: deleteError } = await supabase
      .from('emoji_comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) throw deleteError;
    return { success: true };
  } else {
    const db = readMockDb();
    const index = db.comments.findIndex(c => c.id === commentId);
    if (index === -1) throw new Error('Comment not found');
    if (db.comments[index].user_id !== userId) throw new Error('Unauthorized deletion');

    db.comments.splice(index, 1);
    writeMockDb(db);
    return { success: true };
  }
}

export async function getGroups() {
  if (isSupabaseConfigured) {
    const { data: groups, error } = await supabase
      .from('groups')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('group_id');
      
    if (postsError) throw postsError;
    
    return groups.map(g => {
      const count = posts.filter(p => p.group_id === g.id).length;
      return { ...g, post_count: count };
    });
  } else {
    const db = readMockDb();
    if (!db.groups) db.groups = [];
    return db.groups.map(g => {
      const count = db.posts.filter(p => p.group_id === g.id).length;
      return { ...g, post_count: count };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }
}

export async function createGroup(name, description, userId) {
  const cleanName = name.trim();
  const cleanDesc = description.trim();
  
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('groups')
      .insert([{ name: cleanName, description: cleanDesc, created_by: userId }])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } else {
    const db = readMockDb();
    if (!db.groups) db.groups = [];
    
    const exists = db.groups.some(g => g.name.toLowerCase() === cleanName.toLowerCase());
    if (exists) throw new Error('A community group with this name already exists.');
    
    const newGroup = {
      id: "group-" + Math.random().toString(36).substr(2, 9),
      name: cleanName,
      description: cleanDesc,
      created_by: userId,
      created_at: new Date().toISOString()
    };
    db.groups.push(newGroup);
    writeMockDb(db);
    return newGroup;
  }
}

export async function incrementDownloadCount(postId) {
  if (isSupabaseConfigured) {
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('download_count, download_limit')
      .eq('id', postId)
      .single();

    if (fetchError) throw fetchError;
    if (!post) throw new Error('Post not found');

    const newCount = (post.download_count || 0) + 1;
    if (post.download_limit > 0 && newCount >= post.download_limit) {
      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);
      if (deleteError) throw deleteError;
      return { expired: true };
    } else {
      const { error: updateError } = await supabase
        .from('posts')
        .update({ download_count: newCount })
        .eq('id', postId);
      if (updateError) throw updateError;
      return { expired: false, download_count: newCount, download_limit: post.download_limit };
    }
  } else {
    const db = readMockDb();
    const post = db.posts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found');

    post.download_count = (post.download_count || 0) + 1;
    if (post.download_limit > 0 && post.download_count >= post.download_limit) {
      db.posts = db.posts.filter(p => p.id !== postId);
      // Clean up reactions and comments
      db.reactions = db.reactions.filter(r => r.post_id !== postId);
      db.comments = db.comments.filter(c => c.post_id !== postId);
      writeMockDb(db);
      return { expired: true };
    } else {
      writeMockDb(db);
      return { expired: false, download_count: post.download_count, download_limit: post.download_limit };
    }
  }
}

export async function getPost(postId, currentUserId = '') {
  let adminId = 'user-seed-1';
  if (isSupabaseConfigured) {
    const { data: admin } = await supabase.from('users').select('id').eq('username', 'nikhil').maybeSingle();
    if (admin) adminId = admin.id;
  } else {
    const db = readMockDb();
    const admin = db.users.find(u => u.username === 'nikhil');
    if (admin) adminId = admin.id;
  }

  if (isSupabaseConfigured) {
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .eq('user_id', adminId)
      .maybeSingle();

    if (postError) throw postError;
    if (!post) return null;

    // Filter out expired posts
    if (post.expires_at && new Date(post.expires_at) <= new Date()) {
      return null;
    }

    const [reactionsRes, commentsRes] = await Promise.all([
      supabase.from('reactions').select('*').eq('post_id', postId),
      supabase.from('emoji_comments').select('*').eq('post_id', postId).order('created_at', { ascending: true })
    ]);

    if (reactionsRes.error) throw reactionsRes.error;
    if (commentsRes.error) throw commentsRes.error;

    const reactionsCount = {};
    const userReactions = {};

    reactionsRes.data.forEach(r => {
      reactionsCount[r.emoji_char] = (reactionsCount[r.emoji_char] || 0) + 1;
      if (currentUserId && r.user_id === currentUserId) {
        userReactions[r.emoji_char] = true;
      }
    });

    return {
      ...post,
      reactions: Object.keys(reactionsCount).map(emoji => ({
        emoji_char: emoji,
        count: reactionsCount[emoji],
        user_reacted: !!userReactions[emoji]
      })),
      comments: commentsRes.data.map(c => ({
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        attachment: c.attachment || null,
        author_alias: generateThreadAlias(c.user_id, post.id),
        is_author: currentUserId && c.user_id === currentUserId
      })),
      is_author: currentUserId && post.user_id === currentUserId
    };
  } else {
    const db = readMockDb();
    const post = db.posts.find(p => p.id === postId && p.user_id === adminId);
    if (!post) return null;

    // Filter out expired posts
    if (post.expires_at && new Date(post.expires_at) <= new Date()) {
      return null;
    }

    const postReactions = db.reactions.filter(r => r.post_id === postId);
    const postComments = db.comments.filter(c => c.post_id === postId);

    const reactionsCount = {};
    const userReactions = {};

    postReactions.forEach(r => {
      reactionsCount[r.emoji_char] = (reactionsCount[r.emoji_char] || 0) + 1;
      if (currentUserId && r.user_id === currentUserId) {
        userReactions[r.emoji_char] = true;
      }
    });

    return {
      ...post,
      reactions: Object.keys(reactionsCount).map(emoji => ({
        emoji_char: emoji,
        count: reactionsCount[emoji],
        user_reacted: !!userReactions[emoji]
      })),
      comments: postComments.map(c => ({
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        attachment: c.attachment || null,
        author_alias: generateThreadAlias(c.user_id, post.id),
        is_author: currentUserId && c.user_id === currentUserId
      })),
      is_author: currentUserId && post.user_id === currentUserId
    };
  }
}

export async function addQuestion(content) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('questions')
      .insert({ content })
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const db = readMockDb();
    const newQuestion = {
      id: `question-${Math.random().toString(36).substr(2, 9)}`,
      content,
      created_at: new Date().toISOString()
    };
    db.questions = db.questions || [];
    db.questions.push(newQuestion);
    writeMockDb(db);
    return newQuestion;
  }
}

export async function getQuestions() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } else {
    const db = readMockDb();
    const questions = db.questions || [];
    return [...questions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
}

export async function deleteQuestion(questionId) {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', questionId);
    if (error) throw error;
    return true;
  } else {
    const db = readMockDb();
    db.questions = (db.questions || []).filter(q => q.id !== questionId);
    writeMockDb(db);
    return true;
  }
}

export async function createPoll(question, options) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('polls')
      .insert({ question, options })
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const db = readMockDb();
    const newPoll = {
      id: `poll-${Math.random().toString(36).substr(2, 9)}`,
      question,
      options,
      created_at: new Date().toISOString()
    };
    db.polls = db.polls || [];
    db.polls.push(newPoll);
    writeMockDb(db);
    return newPoll;
  }
}

export async function getActivePoll() {
  if (isSupabaseConfigured) {
    const { data: poll, error: pollErr } = await supabase
      .from('polls')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (pollErr) throw pollErr;
    if (!poll) return null;

    const { data: votes, error: voteErr } = await supabase
      .from('poll_votes')
      .select('option_idx, user_id, ip_hash')
      .eq('poll_id', poll.id);
    if (voteErr) throw voteErr;

    const tally = {};
    poll.options.forEach((_, idx) => { tally[idx] = 0; });
    votes.forEach(v => {
      tally[v.option_idx] = (tally[v.option_idx] || 0) + 1;
    });

    return {
      ...poll,
      votes: tally,
      raw_votes: votes
    };
  } else {
    const db = readMockDb();
    const polls = db.polls || [];
    if (polls.length === 0) return null;
    
    const poll = [...polls].sort((a,b) => new Date(b.created_at) - new Date(a.created_at))[0];
    const votes = (db.poll_votes || []).filter(v => v.poll_id === poll.id);

    const tally = {};
    poll.options.forEach((_, idx) => { tally[idx] = 0; });
    votes.forEach(v => {
      tally[v.option_idx] = (tally[v.option_idx] || 0) + 1;
    });

    return {
      ...poll,
      votes: tally,
      raw_votes: votes
    };
  }
}

export async function voteOnPoll(pollId, optionIdx, userId, ipHash) {
  if (isSupabaseConfigured) {
    const query = supabase
      .from('poll_votes')
      .select('id')
      .eq('poll_id', pollId);
    
    if (userId) {
      const { data } = await query.eq('user_id', userId);
      if (data && data.length > 0) throw new Error("Already voted");
    } else if (ipHash) {
      const { data } = await query.eq('ip_hash', ipHash);
      if (data && data.length > 0) throw new Error("Already voted");
    }

    const { data, error } = await supabase
      .from('poll_votes')
      .insert({ poll_id: pollId, option_idx: optionIdx, user_id: userId || null, ip_hash: ipHash })
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const db = readMockDb();
    db.poll_votes = db.poll_votes || [];

    const exists = db.poll_votes.some(v => 
      v.poll_id === pollId && 
      ((userId && v.user_id === userId) || (ipHash && v.ip_hash === ipHash))
    );
    if (exists) throw new Error("Already voted");

    const newVote = {
      id: `vote-${Math.random().toString(36).substr(2, 9)}`,
      poll_id: pollId,
      option_idx: optionIdx,
      user_id: userId || null,
      ip_hash: ipHash,
      created_at: new Date().toISOString()
    };
    db.poll_votes.push(newVote);
    writeMockDb(db);
    return newVote;
  }
}

export async function submitSpotlight(title, description, link, category, userId) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('spotlights')
      .insert({ title, description, link, category, user_id: userId, status: 'pending' })
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const db = readMockDb();
    const newSpot = {
      id: `spot-${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      link,
      category,
      status: 'pending',
      user_id: userId,
      created_at: new Date().toISOString()
    };
    db.spotlights = db.spotlights || [];
    db.spotlights.push(newSpot);
    writeMockDb(db);
    return newSpot;
  }
}

export async function getApprovedSpotlights() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('spotlights')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } else {
    const db = readMockDb();
    const list = db.spotlights || [];
    return list
      .filter(s => s.status === 'approved')
      .sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  }
}

export async function getPendingSpotlights() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('spotlights')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } else {
    const db = readMockDb();
    const list = db.spotlights || [];
    return list
      .filter(s => s.status === 'pending')
      .sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  }
}

export async function approveSpotlight(spotlightId) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('spotlights')
      .update({ status: 'approved' })
      .eq('id', spotlightId)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const db = readMockDb();
    db.spotlights = (db.spotlights || []).map(s => {
      if (s.id !== spotlightId) return s;
      return { ...s, status: 'approved' };
    });
    writeMockDb(db);
    return db.spotlights.find(s => s.id === spotlightId);
  }
}

export async function deleteSpotlight(spotlightId) {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('spotlights')
      .delete()
      .eq('id', spotlightId);
    if (error) throw error;
    return true;
  } else {
    const db = readMockDb();
    db.spotlights = (db.spotlights || []).filter(s => s.id !== spotlightId);
    writeMockDb(db);
    return true;
  }
}
