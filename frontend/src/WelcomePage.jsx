import React from 'react';
import { useNavigate } from 'react-router-dom';
import './QuizletStyle.css';

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="welcome-container">
      <nav className="navbar">
        <div className="logo">Flashcard Pro</div>
        <div className="nav-links">
          <button className="nav-btn" onClick={() => navigate('/login')}>
            Đăng nhập
          </button>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-content">
          <h1>Học thông minh hơn, nhớ lâu hơn</h1>
          <p>
            Flashcard Pro giúp bạn tạo, tổ chức và ôn tập kiến thức một cách hiệu quả với các chế độ học đa dạng.
          </p>
          <button className="hero-btn" onClick={() => navigate('/register')}>
            Bắt đầu ngay
          </button>
        </div>
      </section>

      <section className="features-section">
        <h2>Các tính năng nổi bật</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Tạo thẻ dễ dàng</h3>
            <p>Nhanh chóng tạo flashcard cho mọi môn học chỉ với vài cú nhấp chuột.</p>
          </div>
          <div className="feature-card">
            <h3>Chế độ học đa dạng</h3>
            <p>Học bằng Flashcard, Trắc nghiệm, Ghép cặp và Kiểm tra.</p>
          </div>
          <div className="feature-card">
            <h3>Theo dõi tiến độ</h3>
            <p>Xem thống kê chi tiết về quá trình học tập của bạn.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WelcomePage;