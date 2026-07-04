"use client";

import React, { useState, useEffect } from 'react';
import styles from './PollWidget.module.css';

export default function PollWidget({ activePoll, onVote, adminMode = false }) {
  const [hasVoted, setHasVoted] = useState(false);
  const [voteChoice, setVoteChoice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voteError, setVoteError] = useState('');

  // Admin Poll Creation Form States
  const [newQuestion, setNewQuestion] = useState('');
  const [opt0, setOpt0] = useState('');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [opt3, setOpt3] = useState('');
  const [adminSuccess, setAdminSuccess] = useState(false);
  const [adminError, setAdminError] = useState('');

  useEffect(() => {
    if (activePoll) {
      const savedVoted = localStorage.getItem(`local_poll_voted_${activePoll.id}`);
      if (savedVoted) {
        setHasVoted(true);
        setVoteChoice(parseInt(savedVoted, 10));
      } else {
        setHasVoted(false);
        setVoteChoice(null);
      }
    }
  }, [activePoll]);

  if (!activePoll && !adminMode) {
    return (
      <div className={`brutal-card ${styles.pollCard}`}>
        <h4>📊 Daily Poll</h4>
        <p className={styles.emptyPollText}>No active poll today. Check back later!</p>
      </div>
    );
  }

  // Calculate vote tallies
  const votesTally = activePoll?.votes || {};
  const totalVotes = Object.values(votesTally).reduce((acc, count) => acc + count, 0);

  const handleVoteSubmit = async (e) => {
    e.preventDefault();
    if (voteChoice === null || !activePoll || isSubmitting) return;

    setIsSubmitting(true);
    setVoteError('');

    try {
      const res = await fetch('/api/polls/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId: activePoll.id, optionIdx: voteChoice })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem(`local_poll_voted_${activePoll.id}`, String(voteChoice));
        setHasVoted(true);
        if (onVote) {
          onVote();
        }
      } else {
        setVoteError(data.error || 'Failed to register vote.');
      }
    } catch (err) {
      console.error(err);
      setVoteError('Failed to cast vote. Network error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    setAdminSuccess(false);
    setAdminError('');

    const options = [opt0, opt1, opt2, opt3].map(o => o.trim()).filter(o => o.length > 0);
    if (!newQuestion.trim()) {
      setAdminError("Question is required.");
      return;
    }
    if (options.length < 2) {
      setAdminError("Please provide at least 2 options.");
      return;
    }

    try {
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: newQuestion.trim(), options })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminSuccess(true);
        setNewQuestion('');
        setOpt0('');
        setOpt1('');
        setOpt2('');
        setOpt3('');
        if (onVote) {
          onVote(); // Re-trigger feed poll reload
        }
      } else {
        setAdminError(data.error || 'Failed to deploy poll.');
      }
    } catch (err) {
      console.error(err);
      setAdminError('Network error. Failed to create.');
    }
  };

  return (
    <div className={`brutal-card ${styles.pollCard}`}>
      <div className={styles.headerRow}>
        <h4>📊 Daily Vibe Poll</h4>
        {activePoll && <span className={styles.votesCount}>{totalVotes} votes cast</span>}
      </div>

      {activePoll && (
        <div className={styles.pollSection}>
          <p className={styles.questionText}>"{activePoll.question}"</p>

          {!hasVoted ? (
            <form onSubmit={handleVoteSubmit} className={styles.voteForm}>
              <div className={styles.optionsList}>
                {activePoll.options.map((opt, idx) => (
                  <label key={idx} className={`${styles.optionLabel} ${voteChoice === idx ? styles.activeChoice : ''}`}>
                    <input
                      type="radio"
                      name="poll-choice"
                      value={idx}
                      checked={voteChoice === idx}
                      onChange={() => setVoteChoice(idx)}
                      style={{ marginRight: '8px' }}
                    />
                    {opt}
                  </label>
                ))}
              </div>
              {voteError && <p className={styles.errorText}>{voteError}</p>}
              <button 
                type="submit" 
                className={`brutal-btn ${styles.voteBtn}`}
                disabled={voteChoice === null || isSubmitting}
              >
                🗳️ Cast Vote
              </button>
            </form>
          ) : (
            <div className={styles.resultsList}>
              {activePoll.options.map((opt, idx) => {
                const count = votesTally[idx] || 0;
                const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                const barColors = ['var(--brutal-pink)', 'var(--brutal-yellow)', 'var(--brutal-green)', 'var(--brutal-blue)'];
                const activeColor = barColors[idx % barColors.length];

                return (
                  <div key={idx} className={styles.resultItem}>
                    <div className={styles.resultLabelRow}>
                      <span className={styles.resultText}>{opt}</span>
                      <span className={styles.resultPct}>{percentage}% ({count})</span>
                    </div>
                    <div className={styles.progressTrack}>
                      <div 
                        className={styles.progressBar} 
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: activeColor
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className={styles.voteStatusHint}>✅ Your vote has been registered anonymously.</div>
            </div>
          )}
        </div>
      )}

      {/* Admin Panel to create polls */}
      {adminMode && (
        <div className={styles.adminSection}>
          <h5 className={styles.adminTitle}>🚀 Deploy New Public Poll</h5>
          <form onSubmit={handleCreatePoll} className={styles.adminForm}>
            <input
              type="text"
              placeholder="What is your question? (e.g. Do you like remote work?)"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              className="brutal-input"
              required
            />
            <input
              type="text"
              placeholder="Option 1..."
              value={opt0}
              onChange={(e) => setOpt0(e.target.value)}
              className="brutal-input"
              required
            />
            <input
              type="text"
              placeholder="Option 2..."
              value={opt1}
              onChange={(e) => setOpt1(e.target.value)}
              className="brutal-input"
              required
            />
            <input
              type="text"
              placeholder="Option 3 (optional)..."
              value={opt2}
              onChange={(e) => setOpt2(e.target.value)}
              className="brutal-input"
            />
            <input
              type="text"
              placeholder="Option 4 (optional)..."
              value={opt3}
              onChange={(e) => setOpt3(e.target.value)}
              className="brutal-input"
            />
            {adminError && <p className={styles.errorText}>{adminError}</p>}
            {adminSuccess && <p className={styles.successText}>New poll deployed successfully!</p>}
            <button type="submit" className={`brutal-btn ${styles.deployBtn}`}>
              📢 Deploy Public Poll
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
