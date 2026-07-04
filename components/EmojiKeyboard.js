"use client";

import React from 'react';
import styles from './EmojiKeyboard.module.css';

const POPULAR_EMOJIS = [
  '👍', '❤️', '😂', '😮', '😢', 
  '🔥', '🙌', '💯', '🎉', '👏', 
  '👀', '✨', '💔', '🤔', '😎', 
  '🥺', '🤩', '🥳', '🚀', '💡',
  '🎨', '👑', '😴', '💩'
];

export default function EmojiKeyboard({ value, onChange, onClear, onBackspace }) {
  const addEmoji = (emoji) => {
    // Limit to 20 emojis in a comment
    if (value.length < 20) {
      onChange(value + emoji);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {POPULAR_EMOJIS.map((emoji, index) => (
          <button
            key={index}
            type="button"
            className={styles.emojiBtn}
            onClick={() => addEmoji(emoji)}
            title="Click to add"
          >
            {emoji}
          </button>
        ))}
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={onBackspace}
          disabled={value.length === 0}
          title="Delete last emoji"
        >
          ⌫ Delete
        </button>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={onClear}
          disabled={value.length === 0}
          title="Clear all"
        >
          Clear All
        </button>
      </div>
    </div>
  );
}
