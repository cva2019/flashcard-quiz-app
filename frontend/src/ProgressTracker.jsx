import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import './QuizletStyle.css';

ChartJS.register(ArcElement, Title, Tooltip, Legend);

const ProgressTracker = ({ token }) => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get('http://localhost:3002/quiz-history', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHistory(res.data);
      } catch (error) {
        setMessage('Failed to load quiz history');
      }
    };
    fetchHistory();
  }, [token]);

  const chartData = {
    labels: history.map((quiz, index) => `Quiz ${index + 1} (${quiz.setId.title})`),
    datasets: [
      {
        label: 'Score Percentage',
        data: history.map(quiz => ((quiz.score / quiz.totalQuestions) * 100).toFixed(2)),
        backgroundColor: [
          '#007bff',
          '#28a745',
          '#dc3545',
          '#ffc107',
          '#17a2b8',
          '#6610f2',
        ],
        borderColor: '#fff',
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    plugins: {
      title: { display: true, text: 'Quiz Score Percentage', font: { size: 18 } },
      legend: { display: true, position: 'bottom' },
      tooltip: {
        callbacks: {
          label: (context) => {
            const quiz = history[context.dataIndex];
            const percentage = ((quiz.score / quiz.totalQuestions) * 100).toFixed(2);
            return `Score: ${quiz.score}/${quiz.totalQuestions} (${percentage}%)`;
          },
        },
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="content-page">
      <div className="content-section">
        <div className="nav-buttons">
          <button className="back-btn" onClick={() => navigate('/dashboard')} title="Back">←</button>
        </div>
        <h2>Quiz History</h2>
        <div className="history-list">
          {history.length > 0 ? (
            history.map(quiz => (
              <div key={quiz._id} className="history-item">
                <p>
                  Set: {quiz.setId.title} | Score: {quiz.score}/{quiz.totalQuestions} | 
                  Date: {new Date(quiz.completedAt).toLocaleDateString()}
                </p>
              </div>
            ))
          ) : (
            <p>No quiz history available.</p>
          )}
        </div>
        <h3>Score Chart</h3>
        <div className="chart-container">
          <Pie data={chartData} options={chartOptions} height={400} />
        </div>
        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
};

export default ProgressTracker;