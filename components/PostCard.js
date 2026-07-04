"use client";

import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import EmojiKeyboard from './EmojiKeyboard';
import styles from './PostCard.module.css';

function getRelativeTime(isoString) {
  try {
    const now = new Date();
    const past = new Date(isoString);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 3600000);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  } catch (e) {
    return '1m';
  }
}

const getAvatarBgColor = (color) => {
  if (color === 'pink') return 'var(--brutal-pink)';
  if (color === 'yellow') return 'var(--brutal-yellow)';
  if (color === 'green') return 'var(--brutal-green)';
  if (color === 'blue') return 'var(--brutal-blue)';
  if (color === 'orange') return 'var(--brutal-orange)';
  return 'var(--brutal-cream)';
};

export default function PostCard({ post, onReactUpdate, currentUser }) {
  const [reactions, setReactions] = useState(post.reactions || []);
  const [comments, setComments] = useState(post.comments || []);
  const [showCommentsList, setShowCommentsList] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const [reactingEmoji, setReactingEmoji] = useState(null);
  const [showKeyboard, setShowKeyboard] = useState(false); // only show emoji board on input focus
  const [isDeleted, setIsDeleted] = useState(false);
  const [commentAttachment, setCommentAttachment] = useState(null); // { name, type, data }
  const commentFileInputRef = useRef(null);

  const cardRef = useRef(null);

  useEffect(() => {
    try {
      const localComments = JSON.parse(localStorage.getItem('local_comments') || '{}');
      const localReactions = JSON.parse(localStorage.getItem('local_reactions') || '{}');
      
      let mergedComments = [...(post.comments || [])];
      if (localComments[post.id]) {
        const existingIds = new Set(mergedComments.map(c => c.id));
        localComments[post.id].forEach(c => {
          if (!existingIds.has(c.id)) {
            mergedComments.push(c);
          }
        });
      }
      setComments(mergedComments);

      let mergedReactions = [...(post.reactions || [])];
      if (localReactions[post.id]) {
        localReactions[post.id].forEach(emoji => {
          const existingIndex = mergedReactions.findIndex(r => r.emoji_char === emoji);
          if (existingIndex > -1) {
            if (!mergedReactions[existingIndex].user_reacted) {
              mergedReactions[existingIndex] = {
                ...mergedReactions[existingIndex],
                count: mergedReactions[existingIndex].count + 1,
                user_reacted: true
              };
            }
          } else {
            mergedReactions.push({ emoji_char: emoji, count: 1, user_reacted: true });
          }
        });
      }
      setReactions(mergedReactions);
    } catch (e) {
      console.error("Local sync error inside PostCard:", e);
    }
  }, [post.id, post.comments, post.reactions]);

  const handleCardMouseMove = (e) => {
    if (typeof window === 'undefined') return;
    // Don't apply on mobile/touch screen pointers
    if (window.matchMedia('(pointer: coarse)').matches) return;
    
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Elegant, subtle 6.5 degree rotation limits
    const rotateX = ((centerY - y) / centerY) * 6.5;
    const rotateY = ((x - centerX) / centerX) * 6.5;

    // Shift solid shadow relative to the tilt to simulate physical light depth
    const shadowX = 4 - rotateY * 1.5;
    const shadowY = 4 + rotateX * 1.5;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.025, 1.025, 1.025)`;
    card.style.boxShadow = `${shadowX}px ${shadowY}px 0px #000000`;
  };

  const handleCardMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;

    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    card.style.boxShadow = '4px 4px 0px #000000';
  };

  const [displayContent, setDisplayContent] = useState(post.content);
  const [glitchStrength, setGlitchStrength] = useState(0);
  const [showHologramModal, setShowHologramModal] = useState(false);

  const [dlCount, setDlCount] = useState(post.download_count || 0);
  const [dlLimit, setDlLimit] = useState(post.download_limit || 0);

  const handleAttachmentDownload = async () => {
    if (!post.is_secret_drop) return;
    
    try {
      const res = await fetch(`/api/posts/${post.id}/download`, { method: 'POST' });
      const data = await res.json();
      
      if (res.ok && data.success) {
        if (data.expired) {
          alert("💥 This secret file has reached its download limit and has self-destructed!");
          setIsDeleted(true);
        } else {
          setDlCount(data.download_count);
        }
      }
    } catch (err) {
      console.error("Failed to track download:", err);
    }
  };

  useEffect(() => {
    if (!post.expires_at) {
      setDisplayContent(post.content);
      setGlitchStrength(0);
      return;
    }

    const createdTime = new Date(post.created_at).getTime();
    const expiryTime = new Date(post.expires_at).getTime();

    const checkDecay = () => {
      const now = Date.now();
      const timeLeft = expiryTime - now;

      if (timeLeft <= 0) {
        setDisplayContent('');
        setGlitchStrength(1.0);
        return;
      }

      // Start glitching when less than 10 minutes (600,000 ms) are left
      const decayWindow = 600000; 
      if (timeLeft < decayWindow) {
        const intensity = 1.0 - (timeLeft / decayWindow);
        setGlitchStrength(intensity);

        const glyphs = ['░', '█', '▖', '▞', '▒', '▓', '▄', '▅', '▆', '▇', '?', '*', '@', '&', '%'];
        const scrambled = post.content.split('').map((char) => {
          if (char === ' ' || char === '\n') return char;
          if (Math.random() < intensity * 0.65) {
            return glyphs[Math.floor(Math.random() * glyphs.length)];
          }
          return char;
        }).join('');
        
        setDisplayContent(scrambled);
      } else {
        setDisplayContent(post.content);
        setGlitchStrength(0);
      }
    };

    checkDecay();
    const intervalId = setInterval(checkDecay, 1200);

    return () => clearInterval(intervalId);
  }, [post.content, post.created_at, post.expires_at]);

  const handleCommentFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setCommentError('File is too large (max 2MB)');
      return;
    }

    setCommentError('');
    const reader = new FileReader();
    reader.onloadend = () => {
      setCommentAttachment({
        name: file.name,
        type: file.type,
        data: reader.result
      });
    };
    reader.readAsDataURL(file);
  };

  const renderAttachment = (attachment, isComment = false) => {
    if (!attachment || !attachment.data) return null;
    const isImage = attachment.type && attachment.type.startsWith('image/');
    const isDownloadable = !!post.group_id;
    const isSecret = post.is_secret_drop;
    const remainingDls = isSecret ? Math.max(0, dlLimit - dlCount) : 0;

    if (isImage) {
      if (isDownloadable) {
        return (
          <div className={isComment ? styles.commentAttachment : styles.postAttachment}>
            <a 
              href={attachment.data} 
              target="_blank" 
              rel="noopener noreferrer" 
              onClick={handleAttachmentDownload}
              title={isSecret ? `Secret drop (downloads left: ${remainingDls}/${dlLimit})` : "View full image"}
            >
              <img src={attachment.data} alt={attachment.name} className={styles.attachmentImg} />
            </a>
            {isSecret && (
              <div className={styles.secretBadge}>
                🔒 Secret drop (downloads left: {remainingDls}/{dlLimit})
              </div>
            )}
          </div>
        );
      } else {
        return (
          <div className={isComment ? styles.commentAttachment : styles.postAttachment}>
            <img
              src={attachment.data}
              alt={attachment.name}
              className={styles.attachmentImg}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              title="Downloads disabled for global feed"
            />
          </div>
        );
      }
    } else {
      if (isDownloadable) {
        return (
          <div className={isComment ? styles.commentAttachment : styles.postAttachment}>
            <a
              href={attachment.data}
              download={attachment.name}
              onClick={handleAttachmentDownload}
              className={`brutal-btn ${styles.downloadDocBtn}`}
              title={isSecret ? `Secret drop (downloads left: ${remainingDls}/${dlLimit})` : "Download file"}
            >
              📄 Download {attachment.name}
            </a>
            {isSecret && (
              <div className={styles.secretBadge}>
                🔒 Secret drop (downloads left: {remainingDls}/{dlLimit})
              </div>
            )}
          </div>
        );
      } else {
        return (
          <div className={isComment ? styles.commentAttachment : styles.postAttachment}>
            <div className={styles.restrictedDocCard}>
              📄 {attachment.name} (Download disabled)
            </div>
          </div>
        );
      }
    }
  };

  const handleDeletePost = async () => {
    if (window.confirm("Are you sure you want to delete this whisper?")) {
      try {
        const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok && data.success) {
          setIsDeleted(true);
        }
      } catch (err) {
        console.error("Failed to delete post:", err);
      }
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm("Are you sure you want to delete this reply?")) {
      try {
        const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok && data.success) {
          setComments(prev => prev.filter(c => c.id !== commentId));
        }
      } catch (err) {
        console.error("Failed to delete comment:", err);
      }
    }
  };

  if (isDeleted) return null;

  const getBgClass = (color) => {
    switch (color) {
      case 'pink': return styles.cardPink;
      case 'yellow': return styles.cardYellow;
      case 'green': return styles.cardGreen;
      case 'cream':
      default: return styles.cardCream;
    }
  };

  const getVibeClass = () => {
    switch (post.vibe) {
      case 'chill': return styles.vibeChill;
      case 'chaotic': return styles.vibeChaotic;
      case 'wholesome': return styles.vibeWholesome;
      case 'rant': return styles.vibeRant;
      default: return '';
    }
  };

  const handleReact = async (emojiChar) => {
    if (reactingEmoji) return;
    setReactingEmoji(emojiChar);
    setShowPicker(false);

    const animationId = Math.random().toString(36).substr(2, 9);
    setFloatingEmojis((prev) => [...prev, { id: animationId, char: emojiChar }]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== animationId));
    }, 1000);

    const isAdmin = currentUser?.username === 'nikhil';
    if (!isAdmin) {
      try {
        const localReactions = JSON.parse(localStorage.getItem('local_reactions') || '{}');
        if (!localReactions[post.id]) localReactions[post.id] = [];
        
        const hasReacted = localReactions[post.id].includes(emojiChar);
        let updated;
        if (hasReacted) {
          localReactions[post.id] = localReactions[post.id].filter(e => e !== emojiChar);
          updated = reactions
            .map(r => r.emoji_char === emojiChar ? { ...r, count: Math.max(0, r.count - 1), user_reacted: false } : r)
            .filter(r => r.count > 0);
        } else {
          localReactions[post.id].push(emojiChar);
          const existing = reactions.find(r => r.emoji_char === emojiChar);
          if (existing) {
            updated = reactions.map(r => r.emoji_char === emojiChar ? { ...r, count: r.count + 1, user_reacted: true } : r);
          } else {
            updated = [...reactions, { emoji_char: emojiChar, count: 1, user_reacted: true }];
          }
        }
        localStorage.setItem('local_reactions', JSON.stringify(localReactions));
        setReactions(updated);
        if (onReactUpdate) {
          onReactUpdate(post.id, updated);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setReactingEmoji(null);
      }
      return;
    }

    try {
      const response = await fetch(`/api/posts/${post.id}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji: emojiChar }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setReactions((prev) => {
          let next = [];
          const existing = prev.find((r) => r.emoji_char === emojiChar);
          if (existing) {
            if (data.action === 'removed') {
              next = prev
                .map((r) => (r.emoji_char === emojiChar ? { ...r, count: Math.max(0, r.count - 1), user_reacted: false } : r))
                .filter((r) => r.count > 0);
            } else {
              next = prev.map((r) =>
                r.emoji_char === emojiChar ? { ...r, count: r.count + 1, user_reacted: true } : r
              );
            }
          } else {
            next = [...prev, { emoji_char: emojiChar, count: 1, user_reacted: true }];
          }
          if (onReactUpdate) {
            onReactUpdate(post.id, next);
          }
          return next;
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReactingEmoji(null);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || isCommenting) return;

    setIsCommenting(true);
    setCommentError('');

    const isAdmin = currentUser?.username === 'nikhil';
    if (!isAdmin) {
      try {
        const newLocalComment = {
          id: `local-comment-${Math.random().toString(36).substr(2, 9)}`,
          post_id: post.id,
          content: commentText.trim(),
          attachment: commentAttachment,
          created_at: new Date().toISOString(),
          author_alias: '💬 You (Private)',
          is_author: true,
          is_local: true
        };

        const localComments = JSON.parse(localStorage.getItem('local_comments') || '{}');
        if (!localComments[post.id]) localComments[post.id] = [];
        localComments[post.id].push(newLocalComment);
        localStorage.setItem('local_comments', JSON.stringify(localComments));

        setComments(prev => [...prev, newLocalComment]);
        setCommentText('');
        setCommentAttachment(null);
        setShowKeyboard(false);
        setShowCommentsList(true);
      } catch (err) {
        console.error(err);
        setCommentError('Failed to save reply locally.');
      } finally {
        setIsCommenting(false);
      }
      return;
    }

    try {
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText, attachment: commentAttachment }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        const commentWithAuthor = {
          ...data.comment,
          is_author: true,
          attachment: commentAttachment
        };
        setComments((prev) => [...prev, commentWithAuthor]);
        setCommentText('');
        setCommentAttachment(null);
        setShowKeyboard(false);
        setShowCommentsList(true); // open list automatically to show their reply!
      } else {
        setCommentError(data.error || 'Failed to comment');
      }
    } catch (err) {
      console.error(err);
      setCommentError('Network error. Failed to post comment.');
    } finally {
      setIsCommenting(false);
    }
  };

  const handleKeyboardBackspace = () => {
    const chars = [...commentText];
    if (chars.length > 0) {
      chars.pop();
      setCommentText(chars.join(''));
    }
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleCardMouseMove}
      onMouseLeave={handleCardMouseLeave}
      className={`brutal-card ${styles.card} ${getBgClass(post.bg_color)} ${getVibeClass()}`}
      style={{
        ...(!post.group_id ? { userSelect: 'none', WebkitUserSelect: 'none' } : {}),
        transformStyle: 'preserve-3d'
      }}
    >
      {/* Floating particle effect */}
      <div className={styles.particleContainer}>
        {floatingEmojis.map((emoji) => (
          <span key={emoji.id} className={styles.floatingParticle}>
            {emoji.char}
          </span>
        ))}
      </div>

      {/* Header */}
      <div className={styles.header} style={{ transform: 'translateZ(10px)' }}>
        <div 
          className={styles.aliasBadge} 
          onClick={() => setShowHologramModal(true)}
          style={{ 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: post.avatar ? getAvatarBgColor(post.avatar.bg) : 'var(--brutal-white)'
          }}
          title={post.avatar ? `Role: ${post.avatar.badge} • Click to view 3D Hologram Token` : "Click to view 3D Hologram Token"}
        >
          {post.avatar && <span style={{ fontSize: '1rem', lineHeight: '1' }}>{post.avatar.sticker}</span>}
          <span>{post.author_alias || 'Anonymous User'}</span>
          {post.avatar && <span style={{ fontSize: '0.62rem', background: '#000000', color: '#ffffff', padding: '1px 5px', borderRadius: '3px', marginLeft: '2px', fontWeight: '800' }}>{post.avatar.badge}</span>}
        </div>
        <div className={styles.headerRight}>
          <span className={styles.time}>{getRelativeTime(post.created_at)}</span>
          <button
            type="button"
            className={styles.shareBtn}
            onClick={() => {
              const minimal = {
                id: post.id,
                content: post.content,
                author_alias: post.author_alias,
                bg_color: post.bg_color,
                vibe: post.vibe || 'default',
                avatar: post.avatar || null
              };
              const code = btoa(JSON.stringify(minimal));
              navigator.clipboard.writeText(code);
              alert("📋 Share Code copied to clipboard! Share it with friends to import this post.");
            }}
            title="Copy shareable P2P Whisper Code"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.82rem', marginLeft: '6px' }}
          >
            👥
          </button>
          {post.is_author && (
            <button
              onClick={handleDeletePost}
              className={styles.deletePostBtn}
              title="Delete whisper"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* Post thought body */}
      <p 
        className={styles.content}
        style={{ 
          filter: glitchStrength > 0 ? `blur(${glitchStrength * 2.8}px)` : 'none', 
          transition: 'filter 0.3s ease',
          transform: 'translateZ(15px)'
        }}
      >
        {displayContent}
      </p>
      {renderAttachment(post.attachment)}

      {/* Actions footer */}
      <div className={styles.footer}>
        <div className={styles.reactionsSection}>
          {reactions.map((reaction) => (
            <button
              key={reaction.emoji_char}
              type="button"
              className={`${styles.reactionPill} ${reaction.user_reacted ? styles.userReacted : ''}`}
              onClick={() => handleReact(reaction.emoji_char)}
            >
              <span>{reaction.emoji_char}</span>
              <span className={styles.reactionCount}>{reaction.count}</span>
            </button>
          ))}

          <div className={styles.pickerWrapper}>
            <button
              type="button"
              className={styles.addReactBtn}
              onClick={() => setShowPicker(!showPicker)}
            >
              + react
            </button>

            {showPicker && (
              <div className={styles.pickerPanel}>
                {REACTION_PALETTE.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={styles.pickerEmoji}
                    onClick={() => handleReact(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Collapsible comment reader button - styled as brutalist pill */}
        <button
          type="button"
          className={`${styles.commentToggleBtn} ${showCommentsList ? styles.activeToggle : ''}`}
          onClick={() => setShowCommentsList(!showCommentsList)}
        >
          💬 replies ({comments.length})
        </button>
      </div>

      {/* Comments List Drawer */}
      {showCommentsList && (
        <div className={styles.commentsSection}>
          {comments.length > 0 ? (
            <div className={styles.commentsList}>
              {comments.map((comment) => (
                <div key={comment.id} className={styles.commentItem}>
                  <div className={styles.commentHeader}>
                    <span className={styles.commentAuthor}>💬 {comment.author_alias || 'Anonymous'}</span>
                    <div className={styles.commentHeaderRight}>
                      <span className={styles.commentTime}>{getRelativeTime(comment.created_at)}</span>
                      {comment.is_author && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className={styles.deleteCommentBtn}
                          title="Delete reply"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                  <div className={styles.commentContent}>{comment.content}</div>
                  {renderAttachment(comment.attachment, true)}
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.noComments}>No replies yet. Be the first!</div>
          )}
        </div>
      )}

      {/* Always Visible Comment Composer Box (UI improvement for clarity) */}
      <div className={styles.composerWrapper}>
        <form onSubmit={handleCommentSubmit} className={styles.commentForm}>
          {commentAttachment && (
            <div className={styles.commentAttachPreview}>
              <span className={styles.previewName}>
                {commentAttachment.type.startsWith('image/') ? '🖼️ Image' : '📄 PDF'}: {commentAttachment.name}
              </span>
              <button
                type="button"
                className={styles.commentRemoveAttachBtn}
                onClick={() => setCommentAttachment(null)}
              >
                ✖
              </button>
            </div>
          )}

          <div className={styles.inputContainer}>
            <input
              type="text"
              placeholder="write a reply..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onFocus={() => setShowKeyboard(true)}
              className={styles.commentInput}
            />
            {post.group_id && (
              <>
                <button
                  type="button"
                  className={`brutal-btn ${styles.commentAttachBtn}`}
                  onClick={() => commentFileInputRef.current?.click()}
                  title="Attach an image or PDF"
                >
                  📎
                </button>
                <input
                  type="file"
                  ref={commentFileInputRef}
                  onChange={handleCommentFileChange}
                  accept="image/*,application/pdf"
                  style={{ display: 'none' }}
                />
              </>
            )}
            <button
              type="submit"
              className={`brutal-btn ${styles.replyBtn}`}
              disabled={(!commentText.trim() && !commentAttachment) || isCommenting}
            >
              {isCommenting ? '...' : 'Reply'}
            </button>
          </div>

          {/* Emoji Keyboard toggles on clicking input */}
          {showKeyboard && (
            <div className={styles.keyboardContainer}>
              <EmojiKeyboard
                value={commentText}
                onChange={setCommentText}
                onClear={() => setCommentText('')}
                onBackspace={handleKeyboardBackspace}
              />
            </div>
          )}

          {commentError && <div className={styles.errorMsg}>⚠️ {commentError}</div>}
        </form>
      </div>

      {showHologramModal && (
        <HologramModal alias={post.author_alias} onClose={() => setShowHologramModal(false)} />
      )}
    </div>
  );
}

// 3D Hologram profile popup subcomponent
function HologramModal({ alias, onClose }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Hash alias to generate unique geometries and speeds
    const hashCode = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return Math.abs(hash);
    };
    
    const hash = hashCode(alias);
    
    const colors = [0xec4899, 0x8b5cf6, 0x22c55e, 0x3b82f6, 0xeab308, 0x06b6d4];
    const color = colors[hash % colors.length];
    
    const shapes = ['torus', 'octahedron', 'dodecahedron', 'icosahedron', 'cylinder', 'torusKnot'];
    const shape = shapes[hash % shapes.length];
    
    let geometry;
    switch (shape) {
      case 'torus':
        geometry = new THREE.TorusGeometry(2, 0.5, 12, 36);
        break;
      case 'octahedron':
        geometry = new THREE.OctahedronGeometry(2.4, 0);
        break;
      case 'dodecahedron':
        geometry = new THREE.DodecahedronGeometry(2.3, 0);
        break;
      case 'icosahedron':
        geometry = new THREE.IcosahedronGeometry(2.3, 0);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(1.4, 1.4, 3.4, 12, 1, true);
        break;
      case 'torusKnot':
        geometry = new THREE.TorusKnotGeometry(1.5, 0.45, 64, 8);
        break;
      default:
        geometry = new THREE.IcosahedronGeometry(2.3, 0);
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true
    });
    renderer.setSize(180, 180);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(color, 3, 20);
    pointLight.position.set(2, 3, 5);
    scene.add(pointLight);

    const wireMat = new THREE.MeshBasicMaterial({
      color: color,
      wireframe: true,
      transparent: true,
      opacity: 0.75
    });

    const faceMat = new THREE.MeshPhongMaterial({
      color: color,
      transparent: true,
      opacity: 0.1,
      shininess: 80,
      side: THREE.DoubleSide
    });

    const wireMesh = new THREE.Mesh(geometry, wireMat);
    const faceMesh = new THREE.Mesh(geometry, faceMat);

    const meshGroup = new THREE.Group();
    meshGroup.add(wireMesh);
    meshGroup.add(faceMesh);
    scene.add(meshGroup);

    const rotSpeedX = 0.01 + (hash % 10) * 0.004;
    const rotSpeedY = 0.01 + (hash % 7) * 0.004;

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      meshGroup.rotation.x += rotSpeedX;
      meshGroup.rotation.y += rotSpeedY;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
    };
  }, [alias]);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`brutal-card ${styles.modalCard}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>3D Hologram Token</h3>
          <button className={styles.modalCloseBtn} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.canvasContainer}>
            <canvas ref={canvasRef} width={180} height={180} />
          </div>
          <div className={styles.modalInfo}>
            <h4>{alias}</h4>
            <p className={styles.modalDesc}>
              A unique cryptographic 3D token assigned to this alias. 100% decentralized, private, and browser-rendered.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
