import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './QuizletStyle.css';

const FlashcardSetManager = ({ token }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [sets, setSets] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setMessage('Please log in to manage flashcard sets');
      navigate('/');
      return;
    }
    const fetchSets = async () => {
      try {
        const res = await axios.get('http://localhost:3002/flashcard-sets', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSets(res.data);
      } catch (error) {
        setMessage('Failed to load flashcard sets: ' + (error.response?.data?.message || 'Unknown error'));
      }
    };
    fetchSets();
  }, [token, navigate]);

  const handleCreateSet = async () => {
    if (!title) {
      setMessage('Please enter a title');
      return;
    }
    if (!token) {
      setMessage('Please log in to create a flashcard set');
      navigate('/');
      return;
    }
    try {
      await axios.post('http://localhost:3002/flashcard-set', { title }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Flashcard set created');
      setTitle('');
      const updatedSets = await axios.get('http://localhost:3002/flashcard-sets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSets(updatedSets.data);
    } catch (error) {
      setMessage('Failed to create flashcard set: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  return (
    <div className="content-page">
      <div className="content-section">
        <div className="nav-buttons">
          <button className="back-btn" onClick={() => navigate('/dashboard')} title="Back">←</button>
        </div>
        <h2>Manage Flashcard Sets</h2>
        <div className="content-create">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Flashcard Set Title"
            className="content-input"
          />
          <button className="content-btn" onClick={handleCreateSet}>Create New Set</button>
        </div>
        <h3>Your Flashcard Sets</h3>
        <div className="set-list">
          {sets.length > 0 ? (
            sets.map(set => (
              <div key={set._id} className="set-item">
                <Link to={`/flashcards/${set._id}`} className="auth-link">{set.title}</Link>
                <div className="set-actions">
                  <Link to={`/flashcards/${set._id}`} className="content-btn">Add Flashcards</Link>
                  <Link to={`/quiz/${set._id}`} className="content-btn">Start Quiz</Link>
                </div>
              </div>
            ))
          ) : (
            <p>No flashcard sets available.</p>
          )}
        </div>
        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
};

export default FlashcardSetManager;