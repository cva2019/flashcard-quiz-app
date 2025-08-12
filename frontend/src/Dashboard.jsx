import React from 'react';
import { useNavigate } from 'react-router-dom';
import './QuizletStyle.css';

const Dashboard = ({ token }) => {
  const navigate = useNavigate();

  return (
    <div className="welcome-page">
      <div className="welcome-content">
        <h1>Welcome to Flashcard & Quiz App</h1>
        <p className="dashboard-subtitle">Learn easily, efficiently, and enjoyably!</p>
        <div className="dashboard-buttons">
          <button className="login-btn" onClick={() => navigate('/flashcards')}>
            Manage Flashcard Sets
          </button>
          <button className="login-btn" onClick={() => navigate('/study')}>
            Study Flashcards
          </button>
          <button className="login-btn" onClick={() => navigate('/progress')}>
            Track Progress
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;