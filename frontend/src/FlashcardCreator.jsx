import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './QuizletStyle.css';

const FlashcardCreator = ({ token }) => {
  const { setId } = useParams();
  const navigate = useNavigate();
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [flashcards, setFlashcards] = useState([]);
  const [message, setMessage] = useState('');
  const [flipped, setFlipped] = useState({});
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const fetchFlashcards = async () => {
      try {
        const res = await axios.get(`http://localhost:3002/flashcards/${setId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFlashcards(res.data);
        setFlipped(res.data.reduce((acc, fc) => ({ ...acc, [fc._id]: false }), {}));
      } catch (error) {
        setMessage('Failed to load flashcards');
      }
    };
    fetchFlashcards();
  }, [token, setId]);

  const handleCreateFlashcard = async () => {
    try {
      await axios.post('http://localhost:3002/flashcard', { front, back, setId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Flashcard created');
      setFront('');
      setBack('');
      const updatedFlashcards = await axios.get(`http://localhost:3002/flashcards/${setId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFlashcards(updatedFlashcards.data);
      setFlipped(updatedFlashcards.data.reduce((acc, fc) => ({ ...acc, [fc._id]: false }), {}));
    } catch (error) {
      setMessage('Failed to create flashcard');
    }
  };

  const handleEditFlashcard = async (id) => {
    try {
      await axios.put(`http://localhost:3002/flashcard/${id}`, { front, back }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Flashcard updated');
      setEditingId(null);
      setFront('');
      setBack('');
      const updatedFlashcards = await axios.get(`http://localhost:3002/flashcards/${setId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFlashcards(updatedFlashcards.data);
      setFlipped(updatedFlashcards.data.reduce((acc, fc) => ({ ...acc, [fc._id]: false }), {}));
    } catch (error) {
      setMessage('Failed to update flashcard');
    }
  };

  const handleDeleteFlashcard = async (id) => {
    try {
      await axios.delete(`http://localhost:3002/flashcard/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Flashcard deleted');
      const updatedFlashcards = await axios.get(`http://localhost:3002/flashcards/${setId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFlashcards(updatedFlashcards.data);
      setFlipped(updatedFlashcards.data.reduce((acc, fc) => ({ ...acc, [fc._id]: false }), {}));
    } catch (error) {
      setMessage('Failed to delete flashcard');
    }
  };

  const handleFlip = (id) => {
    setFlipped(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const startEditing = (flashcard) => {
    setEditingId(flashcard._id);
    setFront(flashcard.front);
    setBack(flashcard.back);
  };

  return (
    <div className="content-page">
      <div className="content-section">
        <div className="nav-buttons">
          <button className="back-btn" onClick={() => navigate('/flashcards')} title="Back">←</button>
        </div>
        <h2>{editingId ? 'Edit Flashcard' : 'Create Flashcard'}</h2>
        <div className="content-create">
          <input
            type="text"
            value={front}
            onChange={(e) => setFront(e.target.value)}
            placeholder="Front (Question)"
            className="content-input"
          />
          <input
            type="text"
            value={back}
            onChange={(e) => setBack(e.target.value)}
            placeholder="Back (Answer)"
            className="content-input"
          />
          <button
            className="content-btn"
            onClick={editingId ? () => handleEditFlashcard(editingId) : handleCreateFlashcard}
          >
            {editingId ? 'Update Flashcard' : 'Add Flashcard'}
          </button>
        </div>
        <h3>Flashcards in This Set</h3>
        <div className="flashcard-list">
          {flashcards.length > 0 ? (
            flashcards.map(fc => (
              <div key={fc._id} className="flashcard">
                <div className={`flashcard-inner ${flipped[fc._id] ? 'flipped' : ''}`} onClick={() => handleFlip(fc._id)}>
                  <div className="flashcard-front">
                    <p>{fc.front}</p>
                  </div>
                  <div className="flashcard-back">
                    <p>{fc.back}</p>
                  </div>
                </div>
                <div className="flashcard-actions">
                  <button className="content-btn" onClick={() => startEditing(fc)}>Edit</button>
                  <button className="content-btn" onClick={() => handleDeleteFlashcard(fc._id)}>Delete</button>
                </div>
              </div>
            ))
          ) : (
            <p>No flashcards in this set.</p>
          )}
        </div>
        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
};

export default FlashcardCreator;