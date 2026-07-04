"use client";

import React, { useState, useRef } from 'react';
import styles from './PostComposer.module.css';

const ADJECTIVES = ['Sleek', 'Mystic', 'Curious', 'Chaotic', 'Silent', 'Glowing', 'Astral', 'Sneaky', 'Swift', 'Chill', 'Vibrant', 'Ghostly', 'Prismatic', 'Wandering'];
const ANIMALS = ['Badger', 'Otter', 'Ferret', 'Fox', 'Owl', 'Panda', 'Koala', 'Falcon', 'Lynx', 'Raven', 'Dolphin', 'Panther', 'Gecko', 'Octopus'];

export default function PostComposer({ onPostCreated, groupId, currentUser }) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [attachment, setAttachment] = useState(null); // { name, type, data }
  const [vibe, setVibe] = useState('default');
  const [expireOption, setExpireOption] = useState('never');
  const [isSecretDrop, setIsSecretDrop] = useState(false);
  const [downloadLimit, setDownloadLimit] = useState(3);
  const fileInputRef = useRef(null);

  const MAX_CHARS = 280;
  const charsLeft = MAX_CHARS - content.length;
  const isValid = (content.trim().length > 0 || attachment !== null) && charsLeft >= 0;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('File is too large (max 2MB)');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachment({
        name: file.name,
        type: file.type,
        data: reader.result
      });
    };
    reader.readAsDataURL(file);
  };

  const getRandomAlias = () => {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const anim = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    return `${adj} ${anim}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    const isAdmin = currentUser?.username === 'nikhil';
    if (!isAdmin) {
      try {
        let expiresAt = null;
        if (expireOption === '1h') {
          expiresAt = new Date(Date.now() + 3600000).toISOString();
        } else if (expireOption === '6h') {
          expiresAt = new Date(Date.now() + 3600000 * 6).toISOString();
        } else if (expireOption === '24h') {
          expiresAt = new Date(Date.now() + 3600000 * 24).toISOString();
        }

        const savedAvatar = localStorage.getItem('local_user_avatar');
        let avatarObj = null;
        if (savedAvatar) {
          try { avatarObj = JSON.parse(savedAvatar); } catch(e){}
        }

        const localPost = {
          id: `local-post-${Math.random().toString(36).substr(2, 9)}`,
          content,
          group_id: groupId || null,
          attachment,
          vibe,
          expire_option: expireOption,
          expires_at: expiresAt,
          is_secret_drop: isSecretDrop,
          download_limit: isSecretDrop ? downloadLimit : 0,
          download_count: 0,
          created_at: new Date().toISOString(),
          author_alias: getRandomAlias(),
          is_author: true,
          reactions: [],
          comments: [],
          is_local: true,
          avatar: avatarObj
        };

        const localPosts = JSON.parse(localStorage.getItem('local_posts') || '[]');
        localPosts.unshift(localPost);
        localStorage.setItem('local_posts', JSON.stringify(localPosts));

        setContent('');
        setAttachment(null);
        setVibe('default');
        setExpireOption('never');
        setIsSecretDrop(false);
        setDownloadLimit(3);

        if (onPostCreated) {
          onPostCreated(localPost);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to save whisper locally.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content, 
          group_id: groupId || null,
          attachment,
          vibe,
          expire_option: expireOption,
          is_secret_drop: isSecretDrop,
          download_limit: isSecretDrop ? downloadLimit : 0
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setContent('');
        setAttachment(null);
        setVibe('default');
        setExpireOption('never');
        setIsSecretDrop(false);
        setDownloadLimit(3);
        if (onPostCreated) {
          onPostCreated(data.post);
        }
      } else {
        setError(data.error || 'Failed to share thought.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`brutal-card ${styles.composer}`}>
      {/* Header alias status badge */}
      <div className={styles.composerHeader}>
        <span className={styles.aliasBadge}>💡 fresh alias</span>
        <span className={styles.aliasHint}>everyone will see a random name — not you.</span>
      </div>

      <div className={styles.textareaWrapper}>
        <textarea
          className={styles.textarea}
          placeholder="what's the thought you can't tell anyone?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={MAX_CHARS + 20} // small buffer to let validation show
          disabled={isSubmitting}
        />

        {/* Attachment preview panel */}
        {attachment && (
          <div className={styles.attachmentPreview}>
            {attachment.type.startsWith('image/') ? (
              <img src={attachment.data} alt="Attachment preview" className={styles.previewImage} />
            ) : (
              <div className={styles.previewDoc}>
                <span>📄</span>
                <span className={styles.previewDocName}>{attachment.name}</span>
              </div>
            )}
            <button
              type="button"
              className={styles.removeAttachBtn}
              onClick={() => setAttachment(null)}
              title="Remove attachment"
            >
              ✖
            </button>
          </div>
        )}
        
        {/* Controls: Vibe Aura Picker & Ephemeral Decay Timer */}
        <div className={styles.controlsRow}>
          <div className={styles.vibeSelector}>
            <span className={styles.controlLabel}>card vibe:</span>
            <div className={styles.vibeButtons}>
              {[
                { id: 'default', label: '🕊️ standard' },
                { id: 'chill', label: '🌌 chill' },
                { id: 'chaotic', label: '⚡ chaotic' },
                { id: 'wholesome', label: '🌱 wholesome' },
                { id: 'rant', label: '🔥 rant' }
              ].map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVibe(v.id)}
                  className={`${styles.vibeBtn} ${vibe === v.id ? styles.activeVibe : ''} ${styles['vibeBtn_' + v.id]}`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.decaySelector}>
            <span className={styles.controlLabel}>self-destruct:</span>
            <select
              value={expireOption}
              onChange={(e) => setExpireOption(e.target.value)}
              className={`brutal-btn ${styles.decayDropdown}`}
            >
              <option value="never">♾️ keep forever</option>
              <option value="1h">⏱️ 1 hour</option>
              <option value="6h">⏱️ 6 hours</option>
              <option value="24h">⏱️ 24 hours</option>
            </select>
          </div>
        </div>

        {attachment && (
          <div className={styles.secretDropControl}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={isSecretDrop}
                onChange={(e) => setIsSecretDrop(e.target.checked)}
              />
              🔒 Secret File Drop (destructs after downloads)
            </label>
            
            {isSecretDrop && (
              <div className={styles.downloadLimitSelector}>
                <span className={styles.controlLabel}>download limit:</span>
                <select
                  value={downloadLimit}
                  onChange={(e) => setDownloadLimit(Number(e.target.value))}
                  className={`brutal-btn ${styles.downloadDropdown}`}
                >
                  <option value={1}>1 download</option>
                  <option value={3}>3 downloads</option>
                  <option value={5}>5 downloads</option>
                  <option value={10}>10 downloads</option>
                </select>
              </div>
            )}
          </div>
        )}

        <div className={styles.footer}>
          <div className={styles.footerLeft}>
            {groupId && (
              <>
                <button
                  type="button"
                  className={`brutal-btn ${styles.attachBtn}`}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                >
                  📎 attach
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,application/pdf"
                  style={{ display: 'none' }}
                />
              </>
            )}
            <span className={`${styles.counter} ${charsLeft < 0 ? styles.errorText : ''}`}>
              {charsLeft} left
            </span>
          </div>
          <button
            type="submit"
            className={`${styles.submitBtn}`}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? 'whispering...' : 'whisper it'}
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <span>⚠️</span> {error}
        </div>
      )}
    </form>
  );
}
