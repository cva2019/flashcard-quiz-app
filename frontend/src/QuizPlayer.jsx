import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './QuizletStyle.css';

const QuizPlayer = ({ token }) => {
  const { setId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await axios.get(`http://localhost:3002/quiz/${setId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setQuestions(res.data);
      } catch (error) {
        setMessage('Failed to load quiz');
      }
    };
    fetchQuiz();
  }, [token, setId]);

  const handleAnswer = async (selectedOption) => {
    const isCorrect = selectedOption === questions[currentQuestion].answer;
    const newScore = score + (isCorrect ? 1 : 0);
    setScore(newScore);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      try {
        await axios.post('http://localhost:3002/quiz', {
          setId,
          score: newScore,
          totalQuestions: questions.length
        }, { headers: { Authorization: `Bearer ${token}` } });
        setMessage(`Quiz completed! Your score: ${newScore}/${questions.length}`);
      } catch (error) {
        setMessage('Failed to save quiz result');
      }
    }
  };

  return (
    <div className="content-page">
      <div className="content-section">
        <div className="nav-buttons">
          <button className="back-btn" onClick={() => navigate('/flashcards')} title="Back">←</button>
        </div>
        <h2>Quiz</h2>
        {questions.length > 0 && currentQuestion < questions.length ? (
          <div className="quiz-question">
            <p>{questions[currentQuestion].question}</p>
            <div className="quiz-options">
              {questions[currentQuestion].options.map((option, index) => (
                <button key={index} className="content-btn" onClick={() => handleAnswer(option)}>
                  {option}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p>{message || 'Loading quiz...'}</p>
        )}
        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
};

export default QuizPlayer;