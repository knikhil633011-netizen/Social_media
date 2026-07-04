"use client";

import React, { useState, useEffect } from 'react';
import styles from './Scratchpad.module.css';

export default function Scratchpad() {
  const [note, setNote] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    const savedNote = localStorage.getItem('local_scratchpad_notes');
    if (savedNote) {
      setNote(savedNote);
    }
  }, []);

  const handleNoteChange = (e) => {
    const val = e.target.value;
    setNote(val);
    localStorage.setItem('local_scratchpad_notes', val);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([note], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `whisper_scratchpad_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleClear = () => {
    if (window.confirm("Clear all scratchpad notes? This cannot be undone.")) {
      setNote('');
      localStorage.removeItem('local_scratchpad_notes');
    }
  };

  const renderMarkdown = (text) => {
    if (!text.trim()) return '<p style="color:#777777;font-style:italic;">No content to preview yet. Start typing on the left!</p>';
    
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    
    // Italics
    html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
    
    // Code blocks
    html = html.replace(/`(.*?)`/gim, '<code style="background:#f1f0eb;padding:2px 4px;border:1px solid #000;border-radius:3px;font-family:monospace;">$1</code>');
    
    // Bullet points
    html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
    
    // Paragraphs / Linebreaks
    html = html.replace(/\n/g, '<br />');
    
    return html;
  };

  return (
    <div className={`brutal-card ${styles.scratchpadCard}`}>
      <div className={styles.headerRow}>
        <h3 className={styles.title}>📝 Study Scratchpad</h3>
        <div className={styles.actions}>
          <button 
            type="button" 
            className={`brutal-btn ${styles.modeBtn} ${previewMode ? styles.modeActive : ''}`}
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? '✍️ Edit' : '👁️ Preview'}
          </button>
          <button type="button" className={`brutal-btn ${styles.utilBtn}`} onClick={handleDownload} title="Download notes">
            📥 Export
          </button>
          <button type="button" className={`brutal-btn ${styles.utilBtn} ${styles.clearBtn}`} onClick={handleClear} title="Clear scratchpad">
            🗑️ Clear
          </button>
        </div>
      </div>

      <div className={styles.editorArea}>
        {!previewMode ? (
          <textarea
            className={styles.textarea}
            value={note}
            onChange={handleNoteChange}
            placeholder="# Write your study notes here&#10;- Use double asterisks for **bold**&#10;- Use hyphens for - bullets&#10;- Note will auto-save locally..."
          />
        ) : (
          <div 
            className={styles.preview}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(note) }}
          />
        )}
      </div>
      <div className={styles.footer}>
        <span>💾 Auto-saved to browser</span>
        <span>{note.length} characters</span>
      </div>
    </div>
  );
}
