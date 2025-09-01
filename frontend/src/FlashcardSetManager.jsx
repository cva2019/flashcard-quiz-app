import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import './FlashcardSetManager.css';

const FlashcardSetManager = ({ token }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [sets, setSets] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setMessage('Vui lòng đăng nhập để quản lý bộ flashcard');
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
        setMessage(`Không thể tải danh sách thư mục: ${error.response?.data?.message || 'Lỗi không xác định'}`);
      }
    };
    fetchSets();
  }, [token, navigate]);

  const handleCreateSet = async () => {
    if (!token) {
      setMessage('Vui lòng đăng nhập để tạo bộ flashcard');
      navigate('/');
      return;
    }
    if (!title) {
      setMessage('Vui lòng nhập tiêu đề');
      return;
    }
    try {
      await axios.post('http://localhost:3002/flashcard-set', { title }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Tạo bộ flashcard thành công');
      setTitle('');
      const updatedSets = await axios.get('http://localhost:3002/flashcard-sets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSets(updatedSets.data);
    } catch (error) {
      setMessage(`Không thể tạo bộ flashcard: ${error.response?.data?.message || 'Lỗi không xác định'}`);
    }
  };

  const handleDeleteSet = async (id) => {
    try {
      await axios.delete(`http://localhost:3002/flashcard-set/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Xóa bộ flashcard thành công');
      setSets(sets.filter(set => set._id !== id));
    } catch (error) {
      setMessage(`Không thể xóa bộ flashcard: ${error.response?.data?.message || 'Lỗi không xác định'}`);
      console.error('Delete error:', error.response?.data);
    }
  };

  return (
    <div className="setmanager-container">
      <nav className="setmanager-navbar">
        <div className="setmanager-logo">Flashcard Pro</div>
        <div className="setmanager-nav-links">
          <button className="setmanager-nav-btn" onClick={() => navigate('/dashboard')}>
            Dashboard
          </button>
          <button className="setmanager-nav-btn" onClick={() => navigate('/study')}>
            Học
          </button>
          <button className="setmanager-nav-btn" onClick={() => navigate('/flashcards')}>
            Tạo thẻ
          </button>
          <button className="setmanager-nav-btn" onClick={() => navigate('/progress')}>
            Thống kê
          </button>
          <button className="setmanager-nav-btn" onClick={() => navigate('/')}>
            Đăng xuất
          </button>
        </div>
      </nav>

      <section className="setmanager-hero-section">
        <div className="setmanager-hero-content">
          <h2>Tạo Thư mục Học Tập</h2>
          <div className="setmanager-content-create">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tên thư mục"
              className="setmanager-content-input"
            />
            <button className="setmanager-content-btn" onClick={handleCreateSet}>
              Tạo thư mục
            </button>
          </div>
        </div>
      </section>

      <section className="setmanager-features-section">
        <h2>Danh sách Thư mục</h2>
        <div className="setmanager-features-grid">
          {sets.length > 0 ? (
            sets.map(set => (
              <div key={set._id} className="setmanager-folder-card">
                <div className="setmanager-card-item">
                  <h3>{set.title}</h3>
                  <div className="setmanager-flashcard-actions">
                    <button
                      className="setmanager-content-btn"
                      onClick={() => navigate(`/flashcards/${set._id}`)}
                    >
                      Xem thẻ
                    </button>
                    <button
                      className="setmanager-content-btn"
                      onClick={() => handleDeleteSet(set._id)}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>Không có bộ flashcard nào.</p>
          )}
        </div>
        {message && <p className="setmanager-message">{message}</p>}
      </section>
    </div>
  );
};

export default FlashcardSetManager;