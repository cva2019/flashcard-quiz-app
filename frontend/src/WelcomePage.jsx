import React from 'react';
import { useNavigate } from 'react-router-dom';
import './QuizletStyle.css';

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="welcome-page">
      <div className="welcome-content">
        <h1>Welcome to Flashcard & Quiz App</h1>
        <p>Create vibrant flashcards and quizzes to make learning fun and effective. Start your journey now!</p>
        <button className="welcome-btn" onClick={() => navigate('/login')}>
          Get Started
        </button>
      </div>
    </div>
  );
};

export default WelcomePage;