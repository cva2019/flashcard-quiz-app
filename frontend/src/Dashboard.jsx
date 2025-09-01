import React from 'react';
import { useNavigate } from 'react-router-dom';
import './QuizletStyle.css';

const Dashboard = ({ onLogout }) => {
  const navigate = useNavigate();
  

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="logo">Flashcard Pro</div>
        <div className="nav-links">
          <button className="nav-btn" onClick={() => navigate('/study')}>
            Học
          </button>
          <button className="nav-btn" onClick={() => navigate('/flashcards')}>
            Tạo thẻ
          </button>
          <button className="nav-btn" onClick={() => navigate('/progress')}>
            Thống kê
          </button>
          <button className="nav-btn" onClick={() => navigate('/')}>
            Đăng xuất
          </button>
        </div>
      </nav>

      <div className="container">
        <section className="hero-section">
          <h1>Chào mừng trở lại!</h1>
          <p>Bắt đầu học ngay hôm nay để đạt được mục tiêu của bạn.</p>
        </section>

        <section className="features-section">
          <div className="features-grid">
            <div className="feature-card">
              <h3>Tạo thẻ thông minh</h3>
              <p>Dễ dàng tạo thẻ flashcard với văn bản, hình ảnh, và âm thanh.</p>
            </div>
            <div className="feature-card">
              <h3>Chế độ học đa dạng</h3>
              <p>Học bằng các chế độ khác nhau như trắc nghiệm, ghép cặp, và kiểm tra.</p>
            </div>
            <div className="feature-card">
              <h3>Thống kê tiến độ</h3>
              <p>Theo dõi tiến độ học tập và xem những gì bạn đã thành thạo.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;