"use client";

import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import PostComposer from '@/components/PostComposer';
import PostCard from '@/components/PostCard';
import ThreeDVoid from '@/components/ThreeDVoid';
import CursorTrail from '@/components/CursorTrail';
import FocusTimer from '@/components/FocusTimer';
import Scratchpad from '@/components/Scratchpad';
import Soundboard from '@/components/Soundboard';
import StudyAnalytics from '@/components/StudyAnalytics';
import KanbanBoard from '@/components/KanbanBoard';
import Flashcards from '@/components/Flashcards';
import SpotlightCarousel from '@/components/SpotlightCarousel';
import PollWidget from '@/components/PollWidget';
import AvatarEditor from '@/components/AvatarEditor';
import styles from './page.module.css';

export default function Home() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('landing'); // 'landing', 'login', 'register', 'feed', 'groups', 'group-detail'
  
  // Feed state
  const [posts, setPosts] = useState([]);
  const [feedSort, setFeedSort] = useState('latest'); 
  const [feedError, setFeedError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Groups/Communities state
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupPosts, setGroupPosts] = useState([]);
  const [isGroupsLoading, setIsGroupsLoading] = useState(false);
  const [isGroupPostsLoading, setIsGroupPostsLoading] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [createGroupError, setCreateGroupError] = useState('');
  const [isGroupSubmitting, setIsGroupSubmitting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Custom utility configurations
  const [searchQuery, setSearchQuery] = useState('');
  const [groupActiveTab, setGroupActiveTab] = useState('feed');
  const [lobbyComments, setLobbyComments] = useState([]);
  const [lobbyInput, setLobbyInput] = useState('');
  const chatStreamRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  const [activeTheme, setActiveTheme] = useState('default');
  const [unlockedThemes, setUnlockedThemes] = useState({ matrix: false, sunset: false });

  const handleThemeUnlock = React.useCallback((achievementId) => {
    setUnlockedThemes(prev => {
      let next = { ...prev };
      if (achievementId === 'deep_focus') next.matrix = true;
      if (achievementId === 'scholar') next.sunset = true;
      if (next.matrix !== prev.matrix || next.sunset !== prev.sunset) {
        return next;
      }
      return prev;
    });
  }, []);

  // Q&A Inbox & Box states
  const [questions, setQuestions] = useState([]);
  const [showQAInbox, setShowQAInbox] = useState(false);
  const [qaAnswers, setQaAnswers] = useState({});
  const [qaInput, setQaInput] = useState('');
  const [qaError, setQaError] = useState('');
  const [qaSuccess, setQaSuccess] = useState(false);

  // Data Vault Backup and Restore
  const handleExportVault = () => {
    const keys = ['local_posts', 'local_comments', 'local_reactions', 'local_scratchpad_notes', 'local_kanban_tasks', 'local_flashcard_decks', 'local_focus_sessions'];
    const dump = {};
    keys.forEach(k => {
      dump[k] = localStorage.getItem(k) || '[]';
    });
    
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(dump, null, 2)], {type: 'application/json'});
    element.href = URL.createObjectURL(file);
    element.download = `echo_room_vault_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleImportVault = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const dump = JSON.parse(event.target.result);
        Object.keys(dump).forEach(k => {
          localStorage.setItem(k, dump[k]);
        });
        alert("🔮 Data Vault restored successfully! Reloading page to apply changes...");
        window.location.reload();
      } catch (err) {
        alert("❌ Failed to restore vault. Invalid backup JSON file.");
      }
    };
    reader.readAsText(file);
  };

  // Fetch Questions for Admin
  const fetchQuestionsInbox = React.useCallback(async () => {
    try {
      const res = await fetch('/api/questions');
      const data = await res.json();
      if (res.ok && data.success) {
        setQuestions(data.questions || []);
      }
    } catch (err) {
      console.error("Failed to load questions:", err);
    }
  }, []);

  const handlePublishAnswer = async (questionId) => {
    const answerText = qaAnswers[questionId];
    if (!answerText || !answerText.trim()) return;

    try {
      const res = await fetch(`/api/questions/${questionId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: answerText })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setQuestions(prev => prev.filter(q => q.id !== questionId));
        setQaAnswers(prev => {
          const copy = { ...prev };
          delete copy[questionId];
          return copy;
        });
        // Re-fetch the main feed to show the newly published broadcast post!
        fetchFeed();
      } else {
        alert(data.error || 'Failed to publish response.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Failed to publish.');
    }
  };

  const handleQAInputSubmit = async (e) => {
    e.preventDefault();
    if (!qaInput.trim()) return;
    setQaError('');
    setQaSuccess(false);

    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: qaInput })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setQaSuccess(true);
        setQaInput('');
      } else {
        setQaError(data.error || 'Failed to submit question.');
      }
    } catch (err) {
      console.error(err);
      setQaError('Failed to connect.');
    }
  };
  
  // Poll states
  const [activePoll, setActivePoll] = useState(null);
  
  // Spotlight states
  const [spotlights, setSpotlights] = useState([]);
  const [pendingSpotlights, setPendingSpotlights] = useState([]);
  const [showSpotlightQueue, setShowSpotlightQueue] = useState(false);
  const [spotTitle, setSpotTitle] = useState('');
  const [spotDesc, setSpotDesc] = useState('');
  const [spotLink, setSpotLink] = useState('');
  const [spotCat, setSpotCat] = useState('business');
  const [spotSuccess, setSpotSuccess] = useState(false);
  const [spotError, setSpotError] = useState('');

  // User Avatar state
  const [userAvatar, setUserAvatar] = useState(null);

  // Whisper code import state
  const [whisperCodeInput, setWhisperCodeInput] = useState('');

  // Fetch active poll
  const fetchActivePoll = React.useCallback(async () => {
    try {
      const res = await fetch('/api/polls');
      const data = await res.json();
      if (res.ok && data.success) {
        setActivePoll(data.poll);
      }
    } catch (err) {
      console.error("Failed to load poll:", err);
    }
  }, []);

  // Fetch approved spotlights
  const fetchApprovedSpotlights = React.useCallback(async () => {
    try {
      const res = await fetch('/api/spotlights');
      const data = await res.json();
      if (res.ok && data.success) {
        setSpotlights(data.spotlights || []);
      }
    } catch (err) {
      console.error("Failed to load spotlights:", err);
    }
  }, []);

  // Fetch pending spotlights for admin
  const fetchPendingSpotlights = React.useCallback(async () => {
    try {
      const res = await fetch('/api/spotlights?mode=pending');
      const data = await res.json();
      if (res.ok && data.success) {
        setPendingSpotlights(data.spotlights || []);
      }
    } catch (err) {
      console.error("Failed to load pending spotlights:", err);
    }
  }, []);

  // Approve spotlight request
  const handleApproveSpotlight = async (spotId) => {
    try {
      const res = await fetch(`/api/spotlights/${spotId}/approve`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPendingSpotlights(prev => prev.filter(s => s.id !== spotId));
        fetchApprovedSpotlights();
      }
    } catch (err) {
      console.error("Failed to approve:", err);
    }
  };

  // Reject/Delete spotlight request
  const handleRejectSpotlight = async (spotId) => {
    if (!window.confirm("Reject and delete this spotlight pitch?")) return;
    try {
      const res = await fetch(`/api/spotlights/${spotId}/approve`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPendingSpotlights(prev => prev.filter(s => s.id !== spotId));
        fetchApprovedSpotlights();
      }
    } catch (err) {
      console.error("Failed to reject:", err);
    }
  };

  // Submit spotlight pitch
  const handleSpotlightSubmit = async (e) => {
    e.preventDefault();
    setSpotSuccess(false);
    setSpotError('');

    if (!spotTitle.trim() || !spotDesc.trim()) {
      setSpotError('Title and description are required.');
      return;
    }

    try {
      const res = await fetch('/api/spotlights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: spotTitle.trim(),
          description: spotDesc.trim(),
          link: spotLink.trim(),
          category: spotCat
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSpotSuccess(true);
        setSpotTitle('');
        setSpotDesc('');
        setSpotLink('');
      } else {
        setSpotError(data.error || 'Failed to submit pitch.');
      }
    } catch (err) {
      console.error(err);
      setSpotError('Failed to connect.');
    }
  };

  // Whisper Code Decoders
  const handleImportWhisperCode = () => {
    if (!whisperCodeInput.trim()) return;
    try {
      const decoded = JSON.parse(atob(whisperCodeInput.trim()));
      if (!decoded.id || !decoded.content) {
        throw new Error("Invalid format");
      }

      const localPosts = JSON.parse(localStorage.getItem('local_posts') || '[]');
      if (localPosts.some(p => p.id === decoded.id || p.id === `imported-${decoded.id}`)) {
        alert("📌 This whisper is already imported in your feed!");
        setWhisperCodeInput('');
        return;
      }

      const importedPost = {
        ...decoded,
        id: `imported-${decoded.id}`,
        created_at: new Date().toISOString()
      };

      const nextPosts = [importedPost, ...localPosts];
      localStorage.setItem('local_posts', JSON.stringify(nextPosts));
      alert("👥 Whisper Code imported successfully! Feed updated.");
      setWhisperCodeInput('');
      window.location.reload();
    } catch (err) {
      alert("❌ Invalid Whisper Code. Make sure the code is copied exactly.");
    }
  };

  // Profile Avatar Saved Callback
  const handleAvatarSaved = (avatarData) => {
    setUserAvatar(avatarData);
  };
  
  // Auth Form Inputs
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  // 1. Calculate Daily Echo (hottest whisper in last 24h)
  const getDailyEcho = () => {
    const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000);
    const recentPosts = posts.filter(p => new Date(p.created_at) > oneDayAgo);
    if (recentPosts.length === 0) return null;
    
    const sorted = [...recentPosts].sort((a, b) => {
      const aCount = (a.reactions || []).reduce((acc, r) => acc + r.count, 0);
      const bCount = (b.reactions || []).reduce((acc, r) => acc + r.count, 0);
      return bCount - aCount;
    });
    
    const topPost = sorted[0];
    const topCount = (topPost.reactions || []).reduce((acc, r) => acc + r.count, 0);
    if (topCount > 0) {
      return topPost;
    }
    return null;
  };
  
  const dailyEcho = getDailyEcho();

  // 2. Calculate Collective Aura
  const getCollectiveAura = () => {
    const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000);
    const recentPosts = posts.filter(p => new Date(p.created_at) > oneDayAgo);
    
    const countMap = {
      '👍': { count: 0, label: 'Standard', color: '#fbcfe8' },
      '❤️': { count: 0, label: 'Wholesome', color: '#fed7aa' },
      '😂': { count: 0, label: 'Chaotic', color: '#22c55e' },
      '😮': { count: 0, label: 'Surprised', color: '#fef08a' },
      '😢': { count: 0, label: 'Chill', color: '#c084fc' }
    };
    
    let totalCount = 0;
    recentPosts.forEach(p => {
      (p.reactions || []).forEach(r => {
        if (countMap[r.emoji_char]) {
          countMap[r.emoji_char].count += r.count;
          totalCount += r.count;
        }
      });
    });
    
    return { countMap, totalCount };
  };
  
  const { countMap, totalCount } = getCollectiveAura();

  // 3. Dynamic sorting of feeds
  const getSortedPosts = (postList) => {
    // Hide group live chat lobby parent threads from normal feeds
    let sorted = [...postList].filter(p => !p.content.startsWith('=== GROUP LOBBY ==='));

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      sorted = sorted.filter(p => 
        p.content.toLowerCase().includes(q) || 
        (p.author_alias && p.author_alias.toLowerCase().includes(q))
      );
    }

    if (feedSort === 'trending') {
      return sorted.sort((a, b) => {
        const countA = (a.reactions || []).reduce((acc, r) => acc + r.count, 0);
        const countB = (b.reactions || []).reduce((acc, r) => acc + r.count, 0);
        return countB - countA;
      });
    } else {
      return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  };

  const handleReactUpdate = (postId, newReactions) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, reactions: newReactions } : p))
    );
    setGroupPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, reactions: newReactions } : p))
    );
  };

  const getWeeklyVibeLogs = () => {
    const logs = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(now.getTime() - i * 24 * 3600 * 1000);
      const dateStr = targetDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const dayStart = new Date(targetDate.setHours(0, 0, 0, 0));
      const dayEnd = new Date(targetDate.setHours(23, 59, 59, 999));
      
      const dayPosts = posts.filter(p => {
        const pDate = new Date(p.created_at);
        return pDate >= dayStart && pDate <= dayEnd;
      });

      const vibeCounts = { default: 0, chill: 0, chaotic: 0, wholesome: 0, rant: 0 };
      let totalReactionsOnDay = 0;
      
      dayPosts.forEach(p => {
        const v = p.vibe || 'default';
        if (vibeCounts[v] !== undefined) {
          vibeCounts[v] += 1;
        }
        (p.reactions || []).forEach(r => {
          totalReactionsOnDay += r.count;
        });
      });

      let dominantVibe = 'default';
      let maxCount = -1;
      Object.keys(vibeCounts).forEach(k => {
        if (vibeCounts[k] > maxCount) {
          maxCount = vibeCounts[k];
          dominantVibe = k;
        }
      });

      logs.push({
        dateLabel: dateStr,
        postCount: dayPosts.length,
        reactionCount: totalReactionsOnDay,
        vibe: dayPosts.length > 0 ? dominantVibe : 'empty'
      });
    }
    return logs;
  };

  // Check login session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (res.ok && data.success && data.user) {
          setCurrentUser(data.user);
          setCurrentView('feed');
        } else {
          setCurrentView('landing');
        }
      } catch (err) {
        console.error("Session check error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  // Fetch feed when view changes to 'feed' or sort order changes
  useEffect(() => {
    if (currentView === 'feed') {
      fetchFeed();
    }
  }, [currentView, feedSort]);

  // Fetch active poll, approved spotlights, and profile avatar
  useEffect(() => {
    if (currentView === 'feed' || currentView === 'study-void') {
      fetchActivePoll();
      fetchApprovedSpotlights();
      
      const savedAvatar = localStorage.getItem('local_user_avatar');
      if (savedAvatar) {
        try {
          setUserAvatar(JSON.parse(savedAvatar));
        } catch (e) {}
      }
    }
  }, [currentView, fetchActivePoll, fetchApprovedSpotlights]);

  // Fetch pending spotlights for admin review
  useEffect(() => {
    if (currentUser?.username === 'nikhil' && showSpotlightQueue) {
      fetchPendingSpotlights();
    }
  }, [currentUser, showSpotlightQueue, fetchPendingSpotlights]);

  // Fetch groups list when view changes to 'groups'
  useEffect(() => {
    if (currentView === 'groups') {
      fetchGroups();
    }
  }, [currentView]);

  // Fetch group posts when entering group detail view
  useEffect(() => {
    if (currentView === 'group-detail' && selectedGroup) {
      fetchGroupPosts(selectedGroup.id);
    }
  }, [currentView, selectedGroup]);

  // 4b. Live Chat Lobby Polling & Messages helper
  const getOrCreateLobbyPost = async (group) => {
    let lobby = groupPosts.find(p => p.content.startsWith('=== GROUP LOBBY ==='));
    if (lobby) return lobby;

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `=== GROUP LOBBY === Live chat room for ${group.name}. Whispers here are live.`,
          group_id: group.id,
          vibe: 'chaotic',
          expire_option: 'never'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGroupPosts(prev => [data.post, ...prev]);
        return data.post;
      }
    } catch (e) {
      console.error("Failed to initialize lobby thread:", e);
    }
    return null;
  };

  const handleLobbySendMessage = async (e) => {
    e.preventDefault();
    if (!lobbyInput.trim() || !selectedGroup) return;

    const lobby = groupPosts.find(p => p.content.startsWith('=== GROUP LOBBY ==='));
    if (!lobby) return;

    const msg = lobbyInput;
    setLobbyInput('');

    try {
      const res = await fetch(`/api/posts/${lobby.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: msg, attachment: null })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const commentWithAuthor = {
          ...data.comment,
          is_author: true,
          author_alias: '💬 You'
        };
        setLobbyComments(prev => [...prev, commentWithAuthor]);
        setTimeout(() => {
          if (chatStreamRef.current) {
            chatStreamRef.current.scrollTop = chatStreamRef.current.scrollHeight;
          }
        }, 80);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (currentView !== 'group-detail' || !selectedGroup || groupActiveTab !== 'lobby') {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    let isSubscribed = true;

    const loadLobby = async () => {
      const lobby = await getOrCreateLobbyPost(selectedGroup);
      if (!lobby || !isSubscribed) return;

      const fetchLobbyMessages = async () => {
        try {
          const res = await fetch(`/api/posts/${lobby.id}`);
          const data = await res.json();
          if (res.ok && data.success && isSubscribed) {
            setLobbyComments(data.post.comments || []);
            setTimeout(() => {
              if (chatStreamRef.current) {
                chatStreamRef.current.scrollTop = chatStreamRef.current.scrollHeight;
              }
            }, 100);
          }
        } catch (e) {
          console.error("Lobby sync error:", e);
        }
      };

      fetchLobbyMessages();

      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      pollingIntervalRef.current = setInterval(fetchLobbyMessages, 3500);
    };

    loadLobby();

    return () => {
      isSubscribed = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [currentView, selectedGroup, groupActiveTab, groupPosts]);

  // API Call: Fetch Global Feed
  const fetchFeed = async (showRefresher = false) => {
    if (showRefresher) setIsRefreshing(true);
    setFeedError('');

    try {
      const response = await fetch('/api/posts');
      const data = await response.json();

      if (response.ok && data.success) {
        const fetched = data.posts || [];
        const localPosts = JSON.parse(localStorage.getItem('local_posts') || '[]');
        const activeLocal = localPosts.filter(p => (!p.expires_at || new Date(p.expires_at) > new Date()) && !p.group_id);
        setPosts([...activeLocal, ...fetched]);
      } else {
        setFeedError(data.error || 'Failed to fetch the feed.');
      }
    } catch (err) {
      console.error(err);
      setFeedError('Network error. Failed to connect.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // API Call: Fetch All Groups
  const fetchGroups = async () => {
    setIsGroupsLoading(true);
    try {
      const response = await fetch('/api/groups');
      const data = await response.json();
      if (response.ok && data.success) {
        setGroups(data.groups || []);
      }
    } catch (err) {
      console.error("Failed to fetch groups:", err);
    } finally {
      setIsGroupsLoading(false);
    }
  };

  // API Call: Fetch Posts for a specific Group
  const fetchGroupPosts = async (groupId) => {
    setIsGroupPostsLoading(true);
    setFeedError('');
    try {
      const response = await fetch(`/api/posts?group_id=${groupId}`);
      const data = await response.json();
      if (response.ok && data.success) {
        const fetched = data.posts || [];
        const localPosts = JSON.parse(localStorage.getItem('local_posts') || '[]');
        const activeLocal = localPosts.filter(p => (!p.expires_at || new Date(p.expires_at) > new Date()) && p.group_id === groupId);
        setGroupPosts([...activeLocal, ...fetched]);
      } else {
        setFeedError(data.error || 'Failed to load community feed.');
      }
    } catch (err) {
      console.error(err);
      setFeedError('Failed to load community feed.');
    } finally {
      setIsGroupPostsLoading(false);
    }
  };

  // API Call: Create Community Group
  const handleCreateGroupSubmit = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim() || !newGroupDesc.trim() || isGroupSubmitting) return;

    setIsGroupSubmitting(true);
    setCreateGroupError('');

    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName, description: newGroupDesc }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setNewGroupName('');
        setNewGroupDesc('');
        setShowCreateGroupModal(false);
        fetchGroups(); // refresh directory
      } else {
        setCreateGroupError(data.error || 'Failed to create group');
      }
    } catch (err) {
      console.error(err);
      setCreateGroupError('Network error. Please try again.');
    } finally {
      setIsGroupSubmitting(false);
    }
  };

  // Free Data Export Handler (Downloads as TXT file)
  const handleExportGroupData = (group) => {
    try {
      const headerText = `echo room Community Export: ${group.name}\nDescription: ${group.description}\nExport Date: ${new Date().toLocaleString()}\n==========================================\n\n`;
      
      const postsText = groupPosts.map((post, idx) => {
        const reactionsStr = post.reactions && post.reactions.length > 0
          ? `Reactions: ${post.reactions.map(r => `${r.emoji_char} (${r.count})`).join(', ')}`
          : 'Reactions: None';
          
        const commentsStr = post.comments && post.comments.length > 0
          ? `Replies:\n${post.comments.map(c => `  - [${new Date(c.created_at).toLocaleString()}] Anonymous: ${c.content}`).join('\n')}`
          : 'Replies: None';
          
        return `[Thought #${idx + 1}] [${new Date(post.created_at).toLocaleString()}] By: ${post.author_alias}\nWhisper: ${post.content}\n${reactionsStr}\n${commentsStr}\n------------------------------------------\n`;
      }).join('\n');

      const fullText = headerText + postsText;
      const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      const safeName = group.name.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
      link.download = `${safeName}_thoughts.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export data.");
    }
  };

  // Free Canvas Image Export (Generates and downloads a PNG card)
  const handleExportGroupImage = (group) => {
    try {
      const exportPosts = groupPosts.slice(0, 4); // Limit to top 4 posts for clean layout
      const cardHeight = 160;
      const cardGap = 20;
      const headerHeight = 170;
      const canvasHeight = headerHeight + exportPosts.length * (cardHeight + cardGap) + 40;

      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d');

      // 1. Draw Cream Background
      ctx.fillStyle = '#fcfbf7';
      ctx.fillRect(0, 0, 800, canvasHeight);

      // 2. Draw Dotted Grid
      ctx.fillStyle = '#e8e6df';
      for (let x = 10; x < 800; x += 20) {
        for (let y = 10; y < canvasHeight; y += 20) {
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, 2 * Math.PI);
          ctx.fill();
        }
      }

      // 3. Draw Community Info Header Card
      // Shadow
      ctx.fillStyle = '#000000';
      ctx.fillRect(40 + 5, 30 + 5, 720, 110);
      // Border Box
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.fillRect(40, 30, 720, 110);
      ctx.strokeRect(40, 30, 720, 110);

      // Title & Desc text
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(group.name, 60, 70);
      ctx.font = '14px sans-serif';
      ctx.fillText(group.description, 60, 105);
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#777777';
      ctx.fillText(`ECHO ROOM COMMUNITY ARCHIVE • EXPORTED ${new Date().toLocaleDateString()}`, 60, 126);

      // 4. Draw Group Posts
      const colors = ['#ff8787', '#ffe066', '#63e6be', '#ffffff']; // Pink, Yellow, Green, White

      exportPosts.forEach((post, i) => {
        const yStart = headerHeight + i * (cardHeight + cardGap);
        const cardBg = colors[i % colors.length];

        // Post Card Shadow
        ctx.fillStyle = '#000000';
        ctx.fillRect(40 + 4, yStart + 4, 720, cardHeight);

        // Post Card Box
        ctx.fillStyle = cardBg;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.fillRect(40, yStart, 720, cardHeight);
        ctx.strokeRect(40, yStart, 720, cardHeight);

        // Author pill shadow
        ctx.fillStyle = '#000000';
        ctx.fillRect(60 + 2, yStart + 15 + 2, 110, 24);
        // Author pill box
        ctx.fillStyle = '#ffffff';
        ctx.strokeRect(60, yStart + 15, 110, 24);
        ctx.fillRect(60, yStart + 15, 110, 24);

        // Author pill text
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(post.author_alias || 'Anonymous User', 115, yStart + 31);
        ctx.textAlign = 'left';

        // Created time
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#444444';
        const dateStr = new Date(post.created_at).toLocaleDateString();
        ctx.fillText(dateStr, 185, yStart + 31);

        // Post Content
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 15px sans-serif';
        
        // Wrap text function inside
        const wrapText = (context, text, x, y, maxWidth, lineHeight) => {
          const words = text.split(' ');
          let line = '';
          for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = context.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
              context.fillText(line, x, y);
              line = words[n] + ' ';
              y += lineHeight;
            } else {
              line = testLine;
            }
          }
          context.fillText(line, x, y);
        };
        wrapText(ctx, post.content, 60, yStart + 65, 680, 20);

        // Reactions and comments footer
        ctx.font = 'bold 12px sans-serif';
        const totalReacts = (post.reactions || []).reduce((acc, r) => acc + r.count, 0);
        ctx.fillText(`💬 ${post.comments ? post.comments.length : 0} replies   🔥 ${totalReacts} reacts`, 60, yStart + 138);
      });

      // 5. Download Trigger
      const safeName = group.name.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${safeName}_archive.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Image export failed:", err);
      alert("Failed to export image.");
    }
  };

  // Auth Submit
  const handleAuthSubmit = async (e, type) => {
    e.preventDefault();
    if (!usernameInput.trim() || !passwordInput || isAuthSubmitting) return;

    setIsAuthSubmitting(true);
    setAuthError('');

    const endpoint = type === 'login' ? '/api/auth/login' : '/api/auth/register';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCurrentUser(data.user);
        setUsernameInput('');
        setPasswordInput('');
        setCurrentView('feed');
      } else {
        setAuthError(data.error || 'Authentication failed');
      }
    } catch (err) {
      console.error(err);
      setAuthError('Connection error. Please try again.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setCurrentUser(null);
        setCurrentView('landing');
        setPosts([]);
        setSelectedGroup(null);
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handlePostCreated = (newPost) => {
    const postWithAuthor = {
      ...newPost,
      reactions: [],
      comments: [],
      is_author: true
    };
    setPosts((prev) => [postWithAuthor, ...prev]);
  };

  const handleGroupPostCreated = (newPost) => {
    const postWithAuthor = {
      ...newPost,
      reactions: [],
      comments: [],
      is_author: true
    };
    setGroupPosts((prev) => [postWithAuthor, ...prev]);
  };

  const handleViewChange = (newView) => {
    setAuthError('');
    setUsernameInput('');
    setPasswordInput('');
    setCreateGroupError('');
    setNewGroupName('');
    setNewGroupDesc('');
    setShowCreateGroupModal(false);
    
    if (newView !== 'group-detail') {
      setSelectedGroup(null);
    }
    setCurrentView(newView);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}>☯️</div>
        <h3>loading echo room...</h3>
      </div>
    );
  }

  const displayedPosts = getSortedPosts(posts);
  const weeklyVibeLogs = getWeeklyVibeLogs();

  const getActiveVibe = () => {
    if (totalCount === 0) return 'default';
    const sortedVibes = Object.keys(countMap)
      .sort((a, b) => countMap[b].count - countMap[a].count);
    const topEmoji = sortedVibes[0];
    if (countMap[topEmoji].count === 0) return 'default';
    
    const emojiToVibe = {
      '👍': 'default',
      '❤️': 'wholesome',
      '😂': 'chaotic',
      '😮': 'default',
      '😢': 'chill'
    };
    return emojiToVibe[topEmoji] || 'default';
  };
  const activeVibe = getActiveVibe();

  return (
    <div className={`${styles.appContainer} ${activeTheme === 'matrix' ? 'theme-matrix' : activeTheme === 'sunset' ? 'theme-sunset' : ''}`}>
      <ThreeDVoid vibe={activeVibe} />
      <CursorTrail vibe={activeVibe} />
      <Header
        currentUser={currentUser}
        currentView={currentView}
        onViewChange={handleViewChange}
        onLogout={handleLogout}
      />

      {/* 1. LANDING VIEW */}
      {currentView === 'landing' && (
        <div className={`fade-in ${styles.landingWrapper}`}>
          <div className={styles.heroSection}>
            <div className={styles.badgeLine}>
              <span className={styles.heroBadge}>no clout • no followers • no faces</span>
            </div>
            
            <h2 className={styles.heroTitle}>
              speak your mind.<br />
              <div className={styles.highlightBlock}>just vibes.</div>
            </h2>

            <p className={styles.heroSlogan}>
              Post a thought under a random alias. Everyone is equal — react with any emoji, comment with just emoji. That's it.
            </p>

            <div className={styles.heroActions}>
              <button
                onClick={() => handleViewChange('register')}
                className={`brutal-btn ${styles.btnPrimaryHero}`}
              >
                start whispering →
              </button>
              <button
                onClick={() => handleViewChange('login')}
                className={`brutal-btn ${styles.btnSecondaryHero}`}
              >
                I've been here before
              </button>
            </div>
          </div>

          <div className="marquee-container">
            <div className="marquee-content">
              🔥 😂 🌈 ✨ 🫠 👀 💯 🎉 🥳 🥺 🤩 💔 💩 🚀 🤔 😎 🔥 😂 🌈 ✨ 🫠 👀 💯 🎉 🥳 🥺 🤩 💔 💩 🚀 🤔 😎
            </div>
          </div>

          <div className={styles.featuresSection}>
            <div className={`brutal-card ${styles.featureCard}`}>
              <h3>random alias</h3>
              <p>every post gets a fresh identity. no history, no clout.</p>
            </div>
            <div className={`brutal-card ${styles.featureCard}`}>
              <h3>any emoji</h3>
              <p>react and comment with the full emoji universe.</p>
            </div>
            <div className={`brutal-card ${styles.featureCard}`}>
              <h3>trending only</h3>
              <p>no algorithm favorites. hottest 24h reactions win.</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. LOGIN VIEW */}
      {currentView === 'login' && (
        <div className={`fade-in ${styles.authWrapper}`}>
          <form
            onSubmit={(e) => handleAuthSubmit(e, 'login')}
            className={`brutal-card ${styles.authCard}`}
          >
            <h2 className={styles.authTitle}>welcome back.</h2>
            <p className={styles.authSubtitle}>we don't recognize you — but that's kinda the point.</p>

            <div className={styles.inputGroup}>
              <label>username</label>
              <input
                type="text"
                className={`brutal-input ${styles.formInput}`}
                placeholder="curious_ferret"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                disabled={isAuthSubmitting}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label>password</label>
              <input
                type="password"
                className={`brutal-input ${styles.formInput}`}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                disabled={isAuthSubmitting}
                required
              />
            </div>

            {authError && (
              <div className={styles.authErrorContainer}>
                {authError}
              </div>
            )}

            <button
              type="submit"
              className={`brutal-btn ${styles.authSubmitBtn} ${styles.bgPink}`}
              disabled={isAuthSubmitting}
            >
              {isAuthSubmitting ? 'letting you in...' : 'let me in'}
            </button>

            <div className={styles.authFooterLink}>
              new here? <span onClick={() => handleViewChange('register')}>make an alias</span>
            </div>
          </form>
        </div>
      )}

      {/* 3. SIGN-UP VIEW */}
      {currentView === 'register' && (
        <div className={`fade-in ${styles.authWrapper}`}>
          <form
            onSubmit={(e) => handleAuthSubmit(e, 'register')}
            className={`brutal-card ${styles.authCard}`}
          >
            <h2 className={styles.authTitle}>pick a handle.</h2>
            <p className={styles.authSubtitle}>nobody will ever see it. every post you make gets a fresh random alias.</p>

            <div className={styles.inputGroup}>
              <label>username (private)</label>
              <input
                type="text"
                className={`brutal-input ${styles.formInput}`}
                placeholder="mystery_moth"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                disabled={isAuthSubmitting}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label>password</label>
              <input
                type="password"
                className={`brutal-input ${styles.formInput}`}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                disabled={isAuthSubmitting}
                required
              />
            </div>

            {authError && (
              <div className={styles.authErrorContainer}>
                {authError}
              </div>
            )}

            <button
              type="submit"
              className={`brutal-btn ${styles.authSubmitBtn} ${styles.bgGreen}`}
              disabled={isAuthSubmitting}
            >
              {isAuthSubmitting ? 'entering...' : 'enter the void'}
            </button>

            <div className={styles.authFooterLink}>
              already whispering? <span onClick={() => handleViewChange('login')}>login</span>
            </div>
          </form>
        </div>
      )}

      {/* 4. FEED VIEW (LOGGED IN) */}
      {currentView === 'feed' && (
        <div className={`fade-in ${styles.feedWrapper}`}>
          <SpotlightCarousel spotlights={spotlights} />
          <PostComposer onPostCreated={handlePostCreated} currentUser={currentUser} />

          {/* Search bar & Pomodoro Timer container */}
          <div className={styles.widgetsLayout}>
            <div className={`brutal-card ${styles.searchCard}`}>
              <div className={styles.searchBar}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search whispers or hashtags..."
                  className={styles.searchInput}
                />
                {searchQuery && (
                  <button type="button" className={styles.clearSearchBtn} onClick={() => setSearchQuery('')}>✕</button>
                )}
              </div>
              <div className={styles.hotTags}>
                <span className={styles.tagLabel}>Trending:</span>
                {['#study', '#jobs', '#ai', '#reactjs', '#memes'].map((tag) => (
                  <button 
                    key={tag}
                    type="button" 
                    className={`${styles.tagBtn} ${searchQuery === tag ? styles.activeTagBtn : ''}`}
                    onClick={() => setSearchQuery(searchQuery === tag ? '' : tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <FocusTimer />

            {/* Anonymous Q&A to Admin Box */}
            <div className={`brutal-card ${styles.qaCard}`}>
              <h4 className={styles.qaTitle}>💡 Ask Admin Anonymously</h4>
              <p className={styles.qaCardSubtitle}>Only admin nikhil can read and reply to your whispers. Answering publishes it globally.</p>
              
              <form onSubmit={handleQAInputSubmit} className={styles.qaForm}>
                <textarea
                  value={qaInput}
                  onChange={(e) => setQaInput(e.target.value)}
                  placeholder="Ask a question or make a request..."
                  maxLength={280}
                  className={`brutal-input ${styles.qaTextarea}`}
                  required
                />
                
                <div className={styles.qaActionsRow}>
                  {qaSuccess && <span className={styles.qaSuccessText}>Sent successfully!</span>}
                  {qaError && <span className={styles.qaErrorText}>{qaError}</span>}
                  <button type="submit" className={`brutal-btn ${styles.qaSubmitBtn}`}>
                    Send Question
                  </button>
                </div>
              </form>
            </div>

            <PollWidget 
              activePoll={activePoll} 
              onVote={fetchActivePoll} 
              adminMode={currentUser?.username === 'nikhil'} 
            />

            {/* Import Peer Whisper Card */}
            <div className={`brutal-card ${styles.qaCard}`}>
              <h4 className={styles.qaTitle}>👥 Import Peer Whisper</h4>
              <p className={styles.qaCardSubtitle}>Paste a P2P Whisper Code shared by your friend to view their post locally.</p>
              
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <input
                  type="text"
                  value={whisperCodeInput}
                  onChange={(e) => setWhisperCodeInput(e.target.value)}
                  placeholder="Paste code (Base64)..."
                  className="brutal-input"
                  style={{ flex: 1, fontSize: '0.78rem', padding: '4px 8px', borderWidth: '1.5px' }}
                />
                <button 
                  type="button" 
                  onClick={handleImportWhisperCode} 
                  className="brutal-btn"
                  style={{ fontSize: '0.75rem', padding: '4px 10px', borderWidth: '1.5px' }}
                  disabled={!whisperCodeInput.trim()}
                >
                  Import
                </button>
              </div>
            </div>
          </div>

          {/* Collective Room Aura Heatmap Dashboard */}
          {totalCount > 0 ? (
            <div className={`brutal-card ${styles.auraWidget}`}>
              <div className={styles.auraHeader}>
                <span className={styles.auraLabel}>Collective Room Vibe:</span>
                <span className={styles.auraVibeText}>
                  {Object.keys(countMap)
                    .sort((a, b) => countMap[b].count - countMap[a].count)
                    .slice(0, 2)
                    .filter(emoji => countMap[emoji].count > 0)
                    .map(emoji => `${emoji} ${countMap[emoji].label}`)
                    .join(' & ') || '🕊️ Quiet & Standard'}
                </span>
              </div>
              <div className={styles.auraProgressWrapper}>
                {Object.keys(countMap).map(emoji => {
                  const share = Math.round((countMap[emoji].count / totalCount) * 100);
                  if (share === 0) return null;
                  return (
                    <div
                      key={emoji}
                      className={styles.auraProgressBar}
                      style={{
                        width: `${share}%`,
                        backgroundColor: countMap[emoji].color
                      }}
                      title={`${share}% ${emoji} ${countMap[emoji].label}`}
                    >
                      {share > 8 && `${emoji} ${share}%`}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className={`brutal-card ${styles.auraWidgetEmpty}`}>
              🕊️ Today's room vibe is quiet. Add some emoji reactions to shape the aura!
            </div>
          )}

          <div className={styles.feedControls}>
            <div className={styles.sortToggle}>
              <button
                className={`brutal-btn ${styles.sortBtn} ${feedSort === 'trending' ? styles.sortBtnActivePink : styles.sortBtnInactive}`}
                onClick={() => setFeedSort('trending')}
              >
                🔥 trending
              </button>
              <button
                className={`brutal-btn ${styles.sortBtn} ${feedSort === 'latest' ? styles.sortBtnActiveWhite : styles.sortBtnInactive}`}
                onClick={() => setFeedSort('latest')}
              >
                ✨ latest
              </button>
              {currentUser?.username === 'nikhil' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setShowQAInbox(!showQAInbox);
                      if (!showQAInbox) {
                        fetchQuestionsInbox();
                      }
                      setShowSpotlightQueue(false);
                    }}
                    className={`brutal-btn ${styles.sortBtn} ${showQAInbox ? styles.sortBtnActivePink : styles.sortBtnInactive}`}
                    title="View incoming anonymous user questions"
                  >
                    📩 Q&A Inbox ({questions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSpotlightQueue(!showSpotlightQueue);
                      if (!showSpotlightQueue) {
                        fetchPendingSpotlights();
                      }
                      setShowQAInbox(false);
                    }}
                    className={`brutal-btn ${styles.sortBtn} ${showSpotlightQueue ? styles.sortBtnActivePink : styles.sortBtnInactive}`}
                    title="Review pending community spotlight pitches"
                  >
                    🌟 Spotlights Queue ({pendingSpotlights.length})
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => fetchFeed(true)}
              className={`brutal-btn ${styles.feedRefreshBtn} ${isRefreshing ? styles.spinning : ''}`}
              disabled={isRefreshing}
            >
              🔄 refresh
            </button>
          </div>

          {currentUser?.username === 'nikhil' && showQAInbox && (
            <div className={`brutal-card ${styles.qaInboxWrapper}`}>
              <h4 className={styles.qaInboxTitle}>📩 Anonymous User Questions ({questions.length})</h4>
              {questions.length > 0 ? (
                <div className={styles.qaInboxList}>
                  {questions.map(q => (
                    <div key={q.id} className={styles.qaInboxRow}>
                      <div className={styles.qaInboxQuestion}>
                        <span className={styles.qaInboxDate}>{new Date(q.created_at).toLocaleString()}</span>
                        <p className={styles.qaInboxText}>"{q.content}"</p>
                      </div>
                      
                      <div className={styles.qaInboxReplyForm}>
                        <textarea
                          placeholder="Type response to answer anonymously and publish to the global feed..."
                          value={qaAnswers[q.id] || ''}
                          onChange={(e) => setQaAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                          className="brutal-input"
                          maxLength={500}
                        />
                        <button
                          type="button"
                          className="brutal-btn"
                          onClick={() => handlePublishAnswer(q.id)}
                          disabled={!qaAnswers[q.id]?.trim()}
                        >
                          📢 Answer & Publish
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.qaInboxEmpty}>Questions inbox is empty.</p>
              )}
            </div>
          )}

          {currentUser?.username === 'nikhil' && showSpotlightQueue && (
            <div className={`brutal-card ${styles.qaInboxWrapper}`}>
              <h4 className={styles.qaInboxTitle}>🌟 Pending Spotlight Pitches ({pendingSpotlights.length})</h4>
              {pendingSpotlights.length > 0 ? (
                <div className={styles.qaInboxList}>
                  {pendingSpotlights.map(s => (
                    <div key={s.id} className={styles.qaInboxRow}>
                      <div className={styles.qaInboxQuestion}>
                        <span className={styles.qaInboxDate}>{new Date(s.created_at).toLocaleString()} • Category: {s.category}</span>
                        <h5 style={{ margin: '4px 0', fontSize: '0.95rem', fontWeight: '900' }}>{s.title}</h5>
                        <p className={styles.qaInboxText}>"{s.description}"</p>
                        {s.link && (
                          <a href={s.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.78rem', color: 'var(--brutal-blue)' }}>
                            🔗 Pitch link: {s.link}
                          </a>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end', marginTop: '6px' }}>
                        <button
                          type="button"
                          className="brutal-btn"
                          onClick={() => handleRejectSpotlight(s.id)}
                          style={{ background: '#f87171', padding: '4px 10px', fontSize: '0.75rem', fontWeight: '800' }}
                        >
                          ❌ Reject / Delete
                        </button>
                        <button
                          type="button"
                          className="brutal-btn"
                          onClick={() => handleApproveSpotlight(s.id)}
                          style={{ background: 'var(--brutal-green)', padding: '4px 10px', fontSize: '0.75rem', fontWeight: '800' }}
                        >
                          ✅ Approve Spotlight
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.qaInboxEmpty}>No pending spotlight pitches.</p>
              )}
            </div>
          )}

          {feedError && <div className={styles.feedErrorBanner}><span>⚠️</span> {feedError}</div>}

          <div className={styles.postsList}>
            {/* Daily Echo Pin */}
            {dailyEcho && (
              <div className={styles.dailyEchoPinWrapper}>
                <div className={styles.dailyEchoPinHeader}>
                  🏆 The Daily Echo (hottest whisper in last 24h)
                </div>
                <PostCard post={dailyEcho} onReactUpdate={handleReactUpdate} currentUser={currentUser} />
              </div>
            )}

            {displayedPosts.length > 0 ? (
              displayedPosts.filter(p => !dailyEcho || p.id !== dailyEcho.id).map((post) => (
                <PostCard key={post.id} post={post} onReactUpdate={handleReactUpdate} currentUser={currentUser} />
              ))
            ) : (
              <div className={`brutal-card ${styles.emptyFeed}`}>
                <div className={styles.emptyIcon}>🕊️</div>
                <h3>the void is silent</h3>
                <p>No thoughts have been shared yet. Write yours and whisper it to the echo room.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. GROUPS / COMMUNITIES DIRECTORY VIEW */}
      {currentView === 'groups' && (
        <div className={`fade-in ${styles.feedWrapper}`}>
          {/* Header Controls for Groups list */}
          <div className={styles.groupsHeaderRow}>
            <h2 className={styles.sectionHeaderTitle}>Communities Directory</h2>
            <button
              onClick={() => setShowCreateGroupModal(!showCreateGroupModal)}
              className={`brutal-btn ${styles.createGroupBtn}`}
            >
              + Create Group
            </button>
          </div>

          {/* Create Group Form Card (Collapsible Card Modal) */}
          {showCreateGroupModal && (
            <form onSubmit={handleCreateGroupSubmit} className={`brutal-card ${styles.createGroupCard}`}>
              <h3>Create a Public Group</h3>
              <p className={styles.groupModalSubtitle}>Set up a topic (e.g. jobs, coding tips, education) for people to exchange info. It cannot be locked or require approval to read.</p>
              
              <div className={styles.inputGroup}>
                <label>group name</label>
                <input
                  type="text"
                  placeholder="e.g. 💼 Jobs & Opportunities"
                  className={`brutal-input`}
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  disabled={isGroupSubmitting}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label>description</label>
                <textarea
                  placeholder="e.g. Share job openings, placement reports, coding references, and resume advice."
                  className={`brutal-input ${styles.groupTextArea}`}
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  disabled={isGroupSubmitting}
                  maxLength={200}
                  required
                />
              </div>

              {createGroupError && (
                <div className={styles.authErrorContainer}>
                  {createGroupError}
                </div>
              )}

              <div className={styles.groupFormActions}>
                <button
                  type="button"
                  className={`brutal-btn ${styles.btnCancel}`}
                  onClick={() => setShowCreateGroupModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`brutal-btn ${styles.bgGreen}`}
                  disabled={isGroupSubmitting}
                >
                  {isGroupSubmitting ? 'Creating...' : 'Create Community'}
                </button>
              </div>
            </form>
          )}

          {/* List of groups in neo-brutalist grid */}
          <div className={styles.groupsGrid}>
            {isGroupsLoading ? (
              <div className={styles.skeletonContainer}>
                <div className={`brutal-card ${styles.skeletonCard}`}></div>
                <div className={`brutal-card ${styles.skeletonCard}`}></div>
              </div>
            ) : groups.length > 0 ? (
              groups.map((group) => (
                <div key={group.id} className={`brutal-card ${styles.groupCard}`}>
                  <div className={styles.groupCardBranding}>📁</div>
                  <div className={styles.groupCardBody}>
                    <h3 className={styles.groupCardName}>{group.name}</h3>
                    <p className={styles.groupCardDesc}>{group.description}</p>
                    <span className={styles.groupCardCount}>⚡ {group.post_count || 0} whispers</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedGroup(group);
                      setCurrentView('group-detail');
                    }}
                    className={`brutal-btn ${styles.enterGroupBtn}`}
                  >
                    Enter Group →
                  </button>
                </div>
              ))
            ) : (
              <div className={`brutal-card ${styles.emptyFeed}`}>
                <div className={styles.emptyIcon}>🌎</div>
                <h3>No groups created yet</h3>
                <p>Be the first to establish a public community space!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. GROUP DETAIL VIEW (SPECIFIC COMMUNITY FEED) */}
      {currentView === 'group-detail' && selectedGroup && (
        <div className={`fade-in ${styles.feedWrapper}`}>
          {/* Back Navigation & Info Card */}
          <div className={`brutal-card ${styles.groupDetailCard}`}>
            <div className={styles.groupDetailRow}>
              <button
                onClick={() => handleViewChange('groups')}
                className={`brutal-btn ${styles.btnBack}`}
              >
                ← Groups
              </button>
              
              {/* Multi-option Export Dropdown */}
              <div className={styles.exportWrapper}>
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className={`brutal-btn ${styles.btnExport}`}
                >
                  📥 Export / Download
                </button>
                {showExportMenu && (
                  <div className={styles.exportMenu}>
                    <button
                      type="button"
                      onClick={() => { handleExportGroupData(selectedGroup); setShowExportMenu(false); }}
                      className={styles.exportOption}
                    >
                      📝 Text Log (.txt)
                    </button>
                    <button
                      type="button"
                      onClick={() => { window.print(); setShowExportMenu(false); }}
                      className={styles.exportOption}
                    >
                      📄 Save as PDF (Print)
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleExportGroupImage(selectedGroup); setShowExportMenu(false); }}
                      className={styles.exportOption}
                    >
                      🖼️ Download Image (.png)
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className={styles.groupDetailInfo}>
              <span className={styles.groupDetailIcon}>📁</span>
              <div>
                <h2 className={styles.groupDetailName}>{selectedGroup.name}</h2>
                <p className={styles.groupDetailDesc}>{selectedGroup.description}</p>
              </div>
            </div>
          </div>

          {/* Group Detail Tab Selector */}
          <div className={styles.groupTabSelector}>
            <button 
              type="button"
              className={`${styles.groupTabBtn} ${groupActiveTab === 'feed' ? styles.activeTab : ''}`}
              onClick={() => setGroupActiveTab('feed')}
            >
              💬 Feed
            </button>
            <button 
              type="button"
              className={`${styles.groupTabBtn} ${groupActiveTab === 'cabinet' ? styles.activeTab : ''}`}
              onClick={() => setGroupActiveTab('cabinet')}
            >
              📁 Cabinet ({groupPosts.filter(p => p.attachment).length})
            </button>
            <button 
              type="button"
              className={`${styles.groupTabBtn} ${groupActiveTab === 'lobby' ? styles.activeTab : ''}`}
              onClick={() => setGroupActiveTab('lobby')}
            >
              ⚡ Live Lobby
            </button>
          </div>

          {/* Tab Render: 1. FEED */}
          {groupActiveTab === 'feed' && (
            <>
              <PostComposer onPostCreated={handleGroupPostCreated} groupId={selectedGroup.id} currentUser={currentUser} />
              {feedError && <div className={styles.feedErrorBanner}><span>⚠️</span> {feedError}</div>}
              
              <div className={styles.postsList}>
                {isGroupPostsLoading ? (
                  <div className={styles.skeletonContainer}>
                    <div className={`brutal-card ${styles.skeletonCard}`}></div>
                    <div className={`brutal-card ${styles.skeletonCard}`}></div>
                  </div>
                ) : getSortedPosts(groupPosts).length > 0 ? (
                  getSortedPosts(groupPosts).map((post) => (
                    <PostCard key={post.id} post={post} onReactUpdate={handleReactUpdate} currentUser={currentUser} />
                  ))
                ) : (
                  <div className={`brutal-card ${styles.emptyFeed}`}>
                    <div className={styles.emptyIcon}>🕊️</div>
                    <h3>this community is quiet</h3>
                    <p>No messages have been posted inside {selectedGroup.name} yet. Start the conversation!</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Tab Render: 2. CABINET */}
          {groupActiveTab === 'cabinet' && (
            <div className={styles.cabinetGrid}>
              {groupPosts.filter(p => p.attachment).length > 0 ? (
                groupPosts.filter(p => p.attachment).map((post) => (
                  <div key={post.id} className={`brutal-card ${styles.cabinetFileCard}`}>
                    <div className={styles.cabinetFileHeader}>
                      <span className={styles.fileIcon}>
                        {post.attachment.type && post.attachment.type.startsWith('image/') ? '🖼️' : '📄'}
                      </span>
                      <div className={styles.fileDetails}>
                        <h4 className={styles.fileName}>{post.attachment.name}</h4>
                        <span className={styles.fileAuthor}>shared by {post.author_alias}</span>
                      </div>
                    </div>
                    {/* Reuse PostCard component to show full reactions, replies and download triggers */}
                    <div className={styles.cabinetCardWrapper}>
                      <PostCard post={post} onReactUpdate={handleReactUpdate} currentUser={currentUser} />
                    </div>
                  </div>
                ))
              ) : (
                <div className={`brutal-card ${styles.emptyCabinet}`}>
                  <span className={styles.emptyCabinetIcon}>📁</span>
                  <h3>Cabinet is empty</h3>
                  <p>No study guides, resumes, or PDFs have been uploaded to this community yet. Post one in the Feed to share it!</p>
                </div>
              )}
            </div>
          )}

          {/* Tab Render: 3. LIVE LOBBY */}
          {groupActiveTab === 'lobby' && (
            <div className={`brutal-card ${styles.lobbyChatBox}`}>
              <div className={styles.lobbyChatHeader}>
                <h4>⚡ Live Lobby Chat</h4>
                <span className={styles.lobbyHint}>Messages are live-polled. Refresh rate: 3.5s.</span>
              </div>
              
              <div className={styles.chatStream} ref={chatStreamRef}>
                {lobbyComments.length > 0 ? (
                  lobbyComments.map((c) => (
                    <div key={c.id} className={`${styles.chatMsg} ${c.author_alias === '💬 You' ? styles.chatMsgSelf : ''}`}>
                      <div className={styles.chatMsgHeader}>
                        <span className={styles.chatAuthor}>{c.author_alias}</span>
                        <span className={styles.chatTime}>
                          {c.created_at ? new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'just now'}
                        </span>
                      </div>
                      <p className={styles.chatText}>{c.content}</p>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyLobbyChat}>
                    💬 Start typing below to begin a live anonymous thread in the room...
                  </div>
                )}
              </div>
              
              <form onSubmit={handleLobbySendMessage} className={styles.lobbyChatForm}>
                <input
                  type="text"
                  value={lobbyInput}
                  onChange={(e) => setLobbyInput(e.target.value)}
                  placeholder="Type a live whisper in the room..."
                  maxLength={180}
                  className={`brutal-input ${styles.lobbyInput}`}
                />
                <button type="submit" className={`brutal-btn ${styles.lobbySendBtn}`}>Send</button>
              </form>
            </div>
          )}
        </div>
      )}
      {/* 6. ECHO PORTAL VIEW */}
      {currentView === 'portal' && (
        <div className={`fade-in ${styles.feedWrapper}`}>
          <div className={`brutal-card ${styles.portalHeroCard}`}>
            <h2>🌀 The Echo Portal</h2>
            <p>Dive into the collective subconscious logs of the room. View the weekly vibe logs and trace when the void was chill, chaotic, or burning with rant whispers.</p>
          </div>

          <div className={`brutal-card ${styles.heatmapCard}`}>
            <h3>Weekly Vibe Heatmap</h3>
            <p className={styles.heatmapSubtitle}>The dominant mood shifts of the void over the last 7 days:</p>
            
            <div className={styles.heatmapGrid}>
              {weeklyVibeLogs.map((log, index) => {
                const vibeMeta = {
                  empty: { emoji: '💤', label: 'Silent', color: '#f1f0eb', text: '#555555' },
                  default: { emoji: '👍', label: 'Standard', color: '#fbcfe8', text: '#000000' },
                  chill: { emoji: '🌌', label: 'Chill', color: '#c084fc', text: '#ffffff' },
                  chaotic: { emoji: '⚡', label: 'Chaotic', color: '#22c55e', text: '#000000' },
                  wholesome: { emoji: '🌱', label: 'Wholesome', color: '#fed7aa', text: '#000000' },
                  rant: { emoji: '🔥', label: 'Rant', color: '#ef4444', text: '#ffffff' }
                };
                const meta = vibeMeta[log.vibe] || vibeMeta.default;
                
                return (
                  <div 
                    key={index} 
                    className={styles.heatmapDayCard}
                    style={{ backgroundColor: meta.color, color: meta.text }}
                  >
                    <div className={styles.heatmapDate}>{log.dateLabel}</div>
                    <div className={styles.heatmapEmoji}>{meta.emoji}</div>
                    <div className={styles.heatmapVibeLabel}>{meta.label}</div>
                    <div className={styles.heatmapStats}>
                      <span>⚡ {log.postCount} posts</span>
                      <span>💬 {log.reactionCount} reactions</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Vibe description guide */}
          <div className={styles.vibeGuideGrid}>
            <div className={`brutal-card`} style={{ backgroundColor: '#c084fc', color: '#ffffff', border: '3.5px solid #000000', boxShadow: '4px 4px 0px #000000' }}>
              <h4>🌌 Chill</h4>
              <p>Cosmic, slow atmospheric music with floaty shapes. Room is relaxing.</p>
            </div>
            <div className={`brutal-card`} style={{ backgroundColor: '#22c55e', color: '#000000', border: '3.5px solid #000000', boxShadow: '4px 4px 0px #000000' }}>
              <h4>⚡ Chaotic</h4>
              <p>Upbeat, hyper-active pluck notes with complex geometries. Room is chaotic.</p>
            </div>
            <div className={`brutal-card`} style={{ backgroundColor: '#fed7aa', color: '#000000', border: '3.5px solid #000000', boxShadow: '4px 4px 0px #000000' }}>
              <h4>🌱 Wholesome</h4>
              <p>Warm ambient chord organ with smooth spherical meshes. Room is friendly.</p>
            </div>
            <div className={`brutal-card`} style={{ backgroundColor: '#ef4444', color: '#ffffff', border: '3.5px solid #000000', boxShadow: '4px 4px 0px #000000' }}>
              <h4>🔥 Rant</h4>
              <p>Deep vibrating bass waves with solid box shapes. Room is tense.</p>
            </div>
          </div>
        </div>
      )}

      {/* 7. STUDY VOID WORKSPACE VIEW */}
      {currentView === 'study-void' && (
        <div className={`fade-in ${styles.workspaceWrapper}`}>
          <div className={`brutal-card ${styles.workspaceHero}`}>
            <h2 className={styles.workspaceTitle}>✏️ Private Space</h2>
            <p className={styles.workspaceSubtitle}>Your ultimate offline sanctuary. All notes, analytics, and ambient sound synthesizers are contained inside your browser.</p>
            
            {/* Theme Selectors */}
            <div className={styles.themeSelectorRow}>
              <span className={styles.themeLabel}>Select theme skin:</span>
              <button 
                type="button" 
                className={`brutal-btn ${styles.themeBtn} ${activeTheme === 'default' ? styles.themeBtnActive : ''}`}
                onClick={() => setActiveTheme('default')}
              >
                🎨 Brutalist (Default)
              </button>
              <button 
                type="button" 
                className={`brutal-btn ${styles.themeBtn} ${activeTheme === 'matrix' ? styles.themeBtnActive : ''}`}
                onClick={() => {
                  if (unlockedThemes.matrix || currentUser?.username === 'nikhil') {
                    setActiveTheme('matrix');
                  } else {
                    alert("🔒 Locked! Complete the 'Deep Focus Maker' milestone (50 focus minutes) to unlock the Cyberpunk Matrix theme.");
                  }
                }}
                title={(unlockedThemes.matrix || currentUser?.username === 'nikhil') ? "Select Matrix theme" : "Locked: Requires 50 focus mins"}
              >
                {(unlockedThemes.matrix || currentUser?.username === 'nikhil') ? '🟢 Cyberpunk Matrix' : '🔒 Matrix (50m focus)'}
              </button>
              <button 
                type="button" 
                className={`brutal-btn ${styles.themeBtn} ${activeTheme === 'sunset' ? styles.themeBtnActive : ''}`}
                onClick={() => {
                  if (unlockedThemes.sunset || currentUser?.username === 'nikhil') {
                    setActiveTheme('sunset');
                  } else {
                    alert("🔒 Locked! Complete the 'Super Scholar' milestone (150 focus minutes) to unlock the Sunset Glow theme.");
                  }
                }}
                title={(unlockedThemes.sunset || currentUser?.username === 'nikhil') ? "Select Sunset theme" : "Locked: Requires 150 focus mins"}
              >
                {(unlockedThemes.sunset || currentUser?.username === 'nikhil') ? '🌅 Sunset Glow' : '🔒 Sunset (150m focus)'}
              </button>
            </div>
          </div>

          <div className={styles.workspaceGrid}>
            <div className={styles.workspaceLeft}>
              <FocusTimer />
              <Soundboard />
            </div>
            
            <div className={styles.workspaceMiddle}>
              <Scratchpad />
            </div>
            
            <div className={styles.workspaceRight}>
              <StudyAnalytics onThemeUnlock={handleThemeUnlock} />

              {/* Data Vault Offline Settings */}
              <div className={`brutal-card ${styles.vaultCard}`}>
                <h4 className={styles.vaultTitle}>🔒 Offline Data Vault</h4>
                <p className={styles.vaultSubtitle}>Export all your notes, tasks, flashcards, settings, and stats to a backup file, or restore them here.</p>
                
                <div className={styles.vaultButtons}>
                  <button 
                    type="button" 
                    className={`brutal-btn ${styles.vaultBtn}`}
                    onClick={handleExportVault}
                  >
                    📥 Export Backup
                  </button>
                  
                  <label className={`brutal-btn ${styles.vaultLabelBtn}`}>
                    📤 Restore Backup
                    <input 
                      type="file" 
                      accept=".json" 
                      onChange={handleImportVault} 
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.workspaceBottomGrid}>
            <div className={styles.workspaceBottomLeft}>
              <KanbanBoard />
            </div>
            <div className={styles.workspaceBottomRight}>
              <Flashcards />
            </div>
          </div>

          <div className={styles.workspaceFooterGrid}>
            <div className={styles.workspaceFooterLeft}>
              <AvatarEditor onAvatarSaved={handleAvatarSaved} />
            </div>
            
            <div className={styles.workspaceFooterRight}>
              {/* Spotlight Pitch Form */}
              <div className={`brutal-card ${styles.spotlightPitchCard}`}>
                <h3 className={styles.spotlightPitchTitle}>📢 Request Community Spotlight</h3>
                <p className={styles.spotlightPitchSubtitle}>Advertise your local shop, study server, or project. Pitches are approved by the Admin before going live.</p>
                
                <form onSubmit={handleSpotlightSubmit} className={styles.spotlightForm}>
                  <div className={styles.inputGroup} style={{ marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase' }}>Spotlight Title</label>
                    <input 
                      type="text" 
                      value={spotTitle} 
                      onChange={(e) => setSpotTitle(e.target.value)} 
                      placeholder="e.g. Green Bakery 10% Off" 
                      className="brutal-input"
                      maxLength={40}
                      style={{ fontSize: '0.8rem', padding: '4px 8px', borderWidth: '1.5px' }}
                      required 
                    />
                  </div>
                  
                  <div className={styles.inputGroup} style={{ marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase' }}>Description Pitch</label>
                    <textarea 
                      value={spotDesc} 
                      onChange={(e) => setSpotDesc(e.target.value)} 
                      placeholder="Explain your business, community, or project..." 
                      className="brutal-input"
                      maxLength={180}
                      style={{ fontSize: '0.8rem', padding: '6px 8px', height: '60px', borderWidth: '1.5px' }}
                      required 
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <div className={styles.inputGroup} style={{ flex: 2 }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase' }}>Link (optional)</label>
                      <input 
                        type="text" 
                        value={spotLink} 
                        onChange={(e) => setSpotLink(e.target.value)} 
                        placeholder="green-bakery.com" 
                        className="brutal-input"
                        style={{ fontSize: '0.8rem', padding: '4px 8px', borderWidth: '1.5px' }}
                      />
                    </div>
                    <div className={styles.inputGroup} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase' }}>Category</label>
                      <select 
                        value={spotCat} 
                        onChange={(e) => setSpotCat(e.target.value)} 
                        className="brutal-input"
                        style={{ padding: '3.5px 6px', fontSize: '0.78rem', borderWidth: '1.5px', height: '31px', background: 'var(--brutal-white)' }}
                      >
                        <option value="business">💼 Business</option>
                        <option value="community">👥 Group</option>
                        <option value="project">🚀 Project</option>
                      </select>
                    </div>
                  </div>

                  {spotSuccess && <p style={{ color: '#16a34a', fontSize: '0.68rem', fontWeight: '800', margin: '0 0 8px 0' }}>Pitch submitted successfully! Awaiting review.</p>}
                  {spotError && <p style={{ color: '#ef4444', fontSize: '0.68rem', fontWeight: '800', margin: '0 0 8px 0' }}>{spotError}</p>}
                  
                  <button 
                    type="submit" 
                    className={`brutal-btn ${styles.pitchSubmitBtn}`}
                    style={{ fontSize: '0.72rem', padding: '4px 12px', background: 'var(--brutal-yellow)', borderWidth: '1.5px', alignSelf: 'flex-end' }}
                  >
                    📢 Submit Request
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Site footer */}
      <footer className={styles.footerSection}>
        <p>© {new Date().getFullYear()} echo room. all rights reserved.</p>
      </footer>
    </div>
  );
}
