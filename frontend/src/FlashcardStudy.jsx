import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './QuizletStyle.css';

const FlashcardStudy = ({ token }) => {
  const navigate = useNavigate();
  const [sets, setSets] = useState([]);
  const [selectedSetId, setSelectedSetId] = useState('');
  const [flashcards, setFlashcards] = useState([]);
  const [currentFlashcard, setCurrentFlashcard] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [unmemorizedCards, setUnmemorizedCards] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchSets = async () => {
      try {
        const res = await axios.get('http://localhost:3002/flashcard-sets', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSets(res.data);
      } catch (error) {
        setMessage('Failed to load flashcard sets');
      }
    };
    fetchSets();
  }, [token]);

  const fetchFlashcards = async (setId) => {
    try {
      const res = await axios.get(`http://localhost:3002/flashcards/${setId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFlashcards(res.data);
      setCurrentFlashcard(0);
      setFlipped(false);
      setIsComplete(false);
      setUnmemorizedCards([]);
      setMessage('');
    } catch (error) {
      setMessage('Failed to load flashcards');
    }
  };

  const handleSelectSet = (setId) => {
    setSelectedSetId(setId);
    fetchFlashcards(setId);
  };

  const handleMemorized = async (id, isMemorized) => {
    try {
      await axios.put(`http://localhost:3002/flashcard/${id}`, {
        isMemorized
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!isMemorized) {
        setUnmemorizedCards(prev => [...prev, flashcards[currentFlashcard]]);
      }

      if (currentFlashcard < flashcards.length - 1) {
        setCurrentFlashcard(currentFlashcard + 1);
        setFlipped(false);
      } else {
        setIsComplete(true);
        const memorizedCount = flashcards.length - unmemorizedCards.length - (isMemorized ? 0 : 1);
        setMessage(`Study session completed! Memorized: ${memorizedCount}/${flashcards.length}`);
      }
    } catch (error) {
      setMessage('Failed to update flashcard');
    }
  };

  const handleReviewUnmemorized = () => {
    setFlashcards(unmemorizedCards);
    setCurrentFlashcard(0);
    setFlipped(false);
    setIsComplete(false);
    setUnmemorizedCards([]);
    setMessage('');
  };

  const handleBackToSelect = () => {
    setSelectedSetId('');
    setFlashcards([]);
    setCurrentFlashcard(0);
    setFlipped(false);
    setIsComplete(false);
    setUnmemorizedCards([]);
    setMessage('');
  };

  return (
    <div className="content-page">
      <div className="content-section">
        <div className="nav-buttons">
          <button className="back-btn" onClick={() => navigate('/dashboard')} title="Back">←</button>
        </div>
        {!selectedSetId ? (
          <>
            <h2>Select a Flashcard Set</h2>
            <div className="set-list">
              {sets.length > 0 ? (
                sets.map(set => (
                  <div key={set._id} className="set-item">
                    <span onClick={() => handleSelectSet(set._id)} className="auth-link">{set.title}</span>
                  </div>
                ))
              ) : (
                <p>No flashcard sets available.</p>
              )}
            </div>
          </>
        ) : !isComplete ? (
          flashcards.length > 0 && currentFlashcard < flashcards.length ? (
            <div className="flashcard-study">
              <h2>Study Flashcards</h2>
              <div className="flashcard" onClick={() => setFlipped(!flipped)}>
                <div className={`flashcard-inner ${flipped ? 'flipped' : ''}`}>
                  <div className="flashcard-front">
                    <p>{flashcards[currentFlashcard].front}</p>
                  </div>
                  <div className="flashcard-back">
                    <p>{flashcards[currentFlashcard].back}</p>
                  </div>
                </div>
              </div>
              <div className="flashcard-actions">
                <button
                  className="content-btn memorized-btn"
                  onClick={() => handleMemorized(flashcards[currentFlashcard]._id, true)}
                >
                  ✓ Memorized
                </button>
                <button
                  className="content-btn unmemorized-btn"
                  onClick={() => handleMemorized(flashcards[currentFlashcard]._id, false)}
                >
                  ✗ Not Memorized
                </button>
              </div>
            </div>
          ) : (
            <p>No flashcards in this set.</p>
          )
        ) : (
          <div className="study-summary">
            <h2>Study Summary</h2>
            <p>{message}</p>
            {unmemorizedCards.length > 0 && (
              <button className="content-btn" onClick={handleReviewUnmemorized}>
                Review Unmemorized Cards
              </button>
            )}
            <button className="content-btn" onClick={handleBackToSelect}>
              Back to Select Set
            </button>
          </div>
        )}
        {message && !isComplete && <p className="message">{message}</p>}
      </div>
    </div>
  );
};

export default FlashcardStudy;