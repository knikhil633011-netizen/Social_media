"use client";

import React, { useState, useEffect } from 'react';
import styles from './Flashcards.module.css';

export default function Flashcards() {
  const [decks, setDecks] = useState([]);
  const [newDeckName, setNewDeckName] = useState('');
  const [activeDeckId, setActiveDeckId] = useState(null);
  
  // Card inputs
  const [cardFront, setCardFront] = useState('');
  const [cardBack, setCardBack] = useState('');
  
  // Study session state
  const [activeCardIdx, setActiveCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionScore, setSessionScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    const saved = localStorage.getItem('local_flashcard_decks');
    if (saved) {
      setDecks(JSON.parse(saved));
    } else {
      // Default sample deck
      const sample = [
        {
          id: 'deck-sample',
          name: '💻 React & Next.js basics',
          cards: [
            { id: 'c1', front: 'What is Next.js?', back: 'A React framework that supports server-side rendering, routing, and static generation.', correct: 0, total: 0 },
            { id: 'c2', front: 'What is LocalStorage?', back: 'A client-side storage database that persists key-value data across page reloads offline.', correct: 0, total: 0 }
          ]
        }
      ];
      setDecks(sample);
      localStorage.setItem('local_flashcard_decks', JSON.stringify(sample));
    }
  }, []);

  const saveDecks = (updated) => {
    setDecks(updated);
    localStorage.setItem('local_flashcard_decks', JSON.stringify(updated));
  };

  const handleCreateDeck = (e) => {
    e.preventDefault();
    if (!newDeckName.trim()) return;

    const newDeck = {
      id: `deck-${Math.random().toString(36).substr(2, 9)}`,
      name: newDeckName.trim(),
      cards: []
    };

    saveDecks([...decks, newDeck]);
    setNewDeckName('');
  };

  const handleDeleteDeck = (id, event) => {
    event.stopPropagation();
    if (window.confirm("Delete this entire deck? All cards inside will be lost.")) {
      saveDecks(decks.filter(d => d.id !== id));
      if (activeDeckId === id) {
        setActiveDeckId(null);
      }
    }
  };

  const handleAddCard = (e) => {
    e.preventDefault();
    if (!cardFront.trim() || !cardBack.trim() || !activeDeckId) return;

    const newCard = {
      id: `card-${Math.random().toString(36).substr(2, 9)}`,
      front: cardFront.trim(),
      back: cardBack.trim(),
      correct: 0,
      total: 0
    };

    const updated = decks.map(d => {
      if (d.id !== activeDeckId) return d;
      return { ...d, cards: [...d.cards, newCard] };
    });

    saveDecks(updated);
    setCardFront('');
    setCardBack('');
  };

  const handleCardRate = (wasCorrect) => {
    const deck = decks.find(d => d.id === activeDeckId);
    if (!deck) return;

    const card = deck.cards[activeCardIdx];
    
    // Update score rates
    const updatedDecks = decks.map(d => {
      if (d.id !== activeDeckId) return d;
      const updatedCards = d.cards.map((c, idx) => {
        if (idx !== activeCardIdx) return c;
        return {
          ...c,
          correct: wasCorrect ? c.correct + 1 : c.correct,
          total: c.total + 1
        };
      });
      return { ...d, cards: updatedCards };
    });

    saveDecks(updatedDecks);
    setSessionScore(prev => ({
      correct: wasCorrect ? prev.correct + 1 : prev.correct,
      total: prev.total + 1
    }));

    // Move to next card
    setIsFlipped(false);
    setTimeout(() => {
      if (activeCardIdx + 1 < deck.cards.length) {
        setActiveCardIdx(activeCardIdx + 1);
      } else {
        // Loop back or reset
        alert(`🎓 Deck study finished! Score: ${sessionScore.correct + (wasCorrect ? 1 : 0)} / ${sessionScore.total + 1} correct.`);
        setActiveCardIdx(0);
        setSessionScore({ correct: 0, total: 0 });
      }
    }, 200);
  };

  const activeDeck = decks.find(d => d.id === activeDeckId);

  return (
    <div className={`brutal-card ${styles.flashcardsCard}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>🎴 CSS 3D Study Flashcards</h3>
        {activeDeckId && (
          <button 
            type="button" 
            className={`brutal-btn ${styles.backBtn}`}
            onClick={() => {
              setActiveDeckId(null);
              setIsFlipped(false);
              setActiveCardIdx(0);
              setSessionScore({ correct: 0, total: 0 });
            }}
          >
            ← Decks
          </button>
        )}
      </div>

      {!activeDeckId ? (
        <div className={styles.deckListMode}>
          <p className={styles.subtitle}>Select a card deck or create a custom deck to study offline.</p>
          
          {/* Create deck form */}
          <form onSubmit={handleCreateDeck} className={styles.createDeckForm}>
            <input
              type="text"
              value={newDeckName}
              onChange={(e) => setNewDeckName(e.target.value)}
              placeholder="Enter new deck name..."
              className="brutal-input"
              maxLength={40}
              required
            />
            <button type="submit" className="brutal-btn">➕ New Deck</button>
          </form>

          {/* Decks Grid */}
          <div className={styles.decksGrid}>
            {decks.map(deck => (
              <div 
                key={deck.id} 
                className={`brutal-card ${styles.deckCard}`}
                onClick={() => setActiveDeckId(deck.id)}
              >
                <div className={styles.deckInfo}>
                  <h4 className={styles.deckName}>{deck.name}</h4>
                  <span className={styles.deckCount}>{deck.cards.length} cards</span>
                </div>
                <button 
                  type="button" 
                  className={styles.deleteDeckBtn}
                  onClick={(e) => handleDeleteDeck(deck.id, e)}
                  title="Delete deck"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.studyMode}>
          <h4 className={styles.activeDeckTitle}>Studying: {activeDeck.name}</h4>

          {activeDeck.cards.length > 0 ? (
            <div className={styles.studyWorkspace}>
              {/* Interactive 3D Card */}
              <div className={styles.cardContainer}>
                <div 
                  className={`${styles.card3d} ${isFlipped ? styles.cardFlipped : ''}`}
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  {/* Front Side */}
                  <div className={`${styles.cardFace} ${styles.cardFront}`}>
                    <span className={styles.faceLabel}>Question</span>
                    <p className={styles.cardText}>{activeDeck.cards[activeCardIdx].front}</p>
                    <span className={styles.flipHint}>(click card to flip)</span>
                  </div>

                  {/* Back Side */}
                  <div className={`${styles.cardFace} ${styles.cardBack}`}>
                    <span className={styles.faceLabel}>Answer</span>
                    <p className={styles.cardText}>{activeDeck.cards[activeCardIdx].back}</p>
                    <span className={styles.flipHint}>(click card to flip back)</span>
                  </div>
                </div>
              </div>

              {/* Progress and controls */}
              <div className={styles.controlsRow}>
                <div className={styles.sessionProgress}>
                  Card {activeCardIdx + 1} of {activeDeck.cards.length} • Score: {sessionScore.correct}/{sessionScore.total}
                </div>
                
                {isFlipped && (
                  <div className={styles.rateButtons}>
                    <button 
                      type="button" 
                      className={`brutal-btn ${styles.incorrectBtn}`}
                      onClick={() => handleCardRate(false)}
                    >
                      ❌ Incorrect
                    </button>
                    <button 
                      type="button" 
                      className={`brutal-btn ${styles.correctBtn}`}
                      onClick={() => handleCardRate(true)}
                    >
                      ✅ Correct
                    </button>
                  </div>
                )}
              </div>

              {/* Add Card Form inside studying view */}
              <form onSubmit={handleAddCard} className={styles.addCardForm}>
                <h5 className={styles.formSectionTitle}>Add new card to deck:</h5>
                <input
                  type="text"
                  value={cardFront}
                  onChange={(e) => setCardFront(e.target.value)}
                  placeholder="Front side (Question)..."
                  className="brutal-input"
                  maxLength={100}
                  required
                />
                <input
                  type="text"
                  value={cardBack}
                  onChange={(e) => setCardBack(e.target.value)}
                  placeholder="Back side (Answer)..."
                  className="brutal-input"
                  maxLength={100}
                  required
                />
                <button type="submit" className="brutal-btn">➕ Add Card</button>
              </form>
            </div>
          ) : (
            <div className={styles.emptyDeck}>
              <p>This deck is currently empty.</p>
              
              <form onSubmit={handleAddCard} className={styles.addCardForm} style={{marginTop: '16px'}}>
                <h5 className={styles.formSectionTitle}>Add the first card to start studying:</h5>
                <input
                  type="text"
                  value={cardFront}
                  onChange={(e) => setCardFront(e.target.value)}
                  placeholder="Front side (Question)..."
                  className="brutal-input"
                  maxLength={100}
                  required
                />
                <input
                  type="text"
                  value={cardBack}
                  onChange={(e) => setCardBack(e.target.value)}
                  placeholder="Back side (Answer)..."
                  className="brutal-input"
                  maxLength={100}
                  required
                />
                <button type="submit" className="brutal-btn">➕ Add Card</button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
