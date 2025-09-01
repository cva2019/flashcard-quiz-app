import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';
import './ProgressTracker.css';

ChartJS.register(ArcElement, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

const ProgressTracker = ({ token }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [history, setHistory] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Lấy lịch sử học tập
      const sessionRes = await axios.get('http://localhost:3002/study-history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(sessionRes.data);

      // Lấy danh sách tất cả flashcard từ các bộ đã học
      const setIds = [...new Set(sessionRes.data
        .filter(session => session.setId && session.setId._id)
        .map(session => session.setId._id)
      )];
      let allFlashcards = [];
      for (const setId of setIds) {
        try {
          const flashcardRes = await axios.get(`http://localhost:3002/flashcards/${setId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          allFlashcards = [...allFlashcards, ...flashcardRes.data];
        } catch (error) {
          console.error(`Error fetching flashcards for setId ${setId}:`, error.message);
          setMessage(`Không thể tải flashcard cho bộ ${setId}: ${error.response?.data?.message || error.message}`);
        }
      }
      setFlashcards(allFlashcards);
    } catch (error) {
      console.error('Error fetching data:', error.message);
      setMessage(`Không thể tải dữ liệu: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, location]);

  // Tính toán thống kê (chỉ tính mỗi flashcard một lần)
  const uniqueFlashcardIds = [...new Set(flashcards.map(fc => fc._id))];
  const totalCardsLearned = uniqueFlashcardIds.length;
  const masteredCards = flashcards.filter(fc => fc.isMemorized).length;
  const completionRate = totalCardsLearned > 0 ? ((masteredCards / totalCardsLearned) * 100).toFixed(2) : 0;
  const streakDays = (() => {
    if (history.length === 0) return 0;
    const dates = [...new Set(history
      .filter(session => session.completedAt)
      .map(session => new Date(session.completedAt).toISOString().split('T')[0])
    )];
    dates.sort((a, b) => new Date(b) - new Date(a));
    let streak = 1;
    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i - 1]);
      const currDate = new Date(dates[i]);
      prevDate.setDate(prevDate.getDate() + 1);
      if (prevDate.toISOString().split('T')[0] === currDate.toISOString().split('T')[0]) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  })();

  // Hiệu suất theo chế độ học
  const performanceByMode = ['flashcard', 'match', 'quiz', 'test'].map(mode => {
    const sessions = history.filter(session => session.mode === mode);
    const total = sessions.reduce((sum, session) => sum + (session.totalQuestions || 0), 0);
    const score = sessions.reduce((sum, session) => sum + (session.score || 0), 0);
    return {
      mode,
      percentage: total > 0 ? ((score / total) * 100).toFixed(2) : 0,
      sessions: sessions.length
    };
  });

  // Dữ liệu biểu đồ chế độ học
  const modeChartData = {
    labels: performanceByMode.map(p => p.mode),
    datasets: [{
      label: 'Tỷ lệ đúng (%)',
      data: performanceByMode.map(p => p.percentage),
      backgroundColor: ['#007bff', '#28a745', '#ffc107', '#dc3545']
    }]
  };

  // Hiệu suất theo bộ flashcard
  const setData = [...new Set(history
    .filter(session => session.setId && session.setId._id)
    .map(session => session.setId._id)
  )].map(setId => {
    const sessions = history.filter(session => session.setId?._id === setId);
    const total = sessions.reduce((sum, session) => sum + (session.totalQuestions || 0), 0);
    const score = sessions.reduce((sum, session) => sum + (session.score || 0), 0);
    return {
      title: sessions[0]?.setId?.title || 'Unknown Set',
      percentage: total > 0 ? ((score / total) * 100).toFixed(2) : 0,
      sessions: sessions.length
    };
  }).filter(set => set.title !== 'Unknown Set');

  // Dữ liệu biểu đồ bộ flashcard
  const setChartData = {
    labels: setData.map(set => set.title),
    datasets: [{
      label: 'Tỷ lệ đúng (%)',
      data: setData.map(set => set.percentage),
      backgroundColor: ['#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8']
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Hiệu suất theo chế độ học' }
    }
  };

  const setChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Hiệu suất theo bộ flashcard' }
    }
  };

  return (
    <div className="progress-container">
      <nav className="progress-navbar">
        <div className="progress-logo">Flashcard Pro</div>
        <div className="progress-nav-links">
          <button className="progress-nav-btn" onClick={() => navigate('/dashboard')}>
            Dashboard
          </button>
          <button className="progress-nav-btn" onClick={() => navigate('/study')}>
            Học
          </button>
          <button className="progress-nav-btn" onClick={() => navigate('/flashcards')}>
            Tạo thẻ
          </button>
          <button className="progress-nav-btn" onClick={() => navigate('/')}>
            Đăng xuất
          </button>
        </div>
      </nav>
      <div className="progress-content">
        {isLoading ? (
          <p>Đang tải...</p>
        ) : (
          <>
            <section className="progress-hero-section">
              <h1>Thống kê tiến độ học tập</h1>
              <div className="progress-features-grid">
                <div className="progress-feature-card">
                  <h3>Tổng số thẻ đã học</h3>
                  <p>{totalCardsLearned}</p>
                </div>
                <div className="progress-feature-card">
                  <h3>Thẻ đã thành thạo</h3>
                  <p>{masteredCards}</p>
                </div>
                <div className="progress-feature-card">
                  <h3>Tỷ lệ hoàn thành</h3>
                  <p>{completionRate}%</p>
                </div>
                <div className="progress-feature-card">
                  <h3>Số ngày học liên tiếp</h3>
                  <p>{streakDays}</p>
                </div>
              </div>
            </section>
            <section className="progress-features-section">
              <h2>Chi tiết tiến độ</h2>
              <h3>Hiệu suất theo chế độ học</h3>
              <div className="progress-chart-container">
                <Bar data={modeChartData} options={chartOptions} />
              </div>
              <h3>Hiệu suất theo bộ flashcard</h3>
              <div className="progress-chart-container">
                <Pie data={setChartData} options={setChartOptions} />
              </div>
              <h3>Danh sách bộ flashcard</h3>
              <div className="progress-history-list">
                {setData.length > 0 ? (
                  setData.map(set => (
                    <div key={set.title} className="progress-history-item">
                      <p>
                        Bộ: {set.title} | Tỷ lệ đúng: {set.percentage}% | Số lần học: {set.sessions}
                      </p>
                    </div>
                  ))
                ) : (
                  <p>Chưa có lịch sử học tập hợp lệ.</p>
                )}
              </div>
              {message && <p className="progress-message">{message}</p>}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default ProgressTracker;