import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './FlashcardCreator.css';

const FlashcardCreator = ({ token }) => {
  const { setId } = useParams();
  const navigate = useNavigate();
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [flashcards, setFlashcards] = useState([]);
  const [message, setMessage] = useState('');
  const [flipped, setFlipped] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importData, setImportData] = useState('');
  const [delimiter, setDelimiter] = useState('tab');

  useEffect(() => {
    const fetchFlashcards = async () => {
      if (!token || !setId) {
        setMessage('Thiếu token hoặc ID bộ thẻ');
        setFlashcards([]);
        return;
      }

      try {
        const flashcardRes = await axios.get(`http://localhost:3002/flashcards/${setId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFlashcards(flashcardRes.data || []);
        setFlipped((flashcardRes.data || []).reduce((acc, fc) => ({ ...acc, [fc._id]: false }), {}));
      } catch (error) {
        console.error('Failed to fetch flashcards:', error);
        setMessage(`Không thể tải danh sách thẻ: ${error.response?.data?.message || error.message}`);
        setFlashcards([]);
      }
    };
    fetchFlashcards();
  }, [token, setId]);

  const handleCreateFlashcard = async () => {
    if (!front.trim() || !back.trim()) {
      setMessage('Vui lòng nhập nội dung cho cả mặt trước và mặt sau');
      return;
    }
    try {
      await axios.post('http://localhost:3002/flashcard', { front, back, setId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Thẻ được tạo thành công');
      setFront('');
      setBack('');
      const updatedFlashcards = await axios.get(`http://localhost:3002/flashcards/${setId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFlashcards(updatedFlashcards.data || []);
      setFlipped((updatedFlashcards.data || []).reduce((acc, fc) => ({ ...acc, [fc._id]: false }), {}));
    } catch (error) {
      setMessage(`Không thể tạo thẻ: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleEditFlashcard = async (id) => {
    if (!front.trim() || !back.trim()) {
      setMessage('Vui lòng nhập nội dung cho cả mặt trước và mặt sau');
      return;
    }
    try {
      await axios.put(`http://localhost:3002/flashcard/${id}`, { front, back, setId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Thẻ được cập nhật thành công');
      setEditingId(null);
      setFront('');
      setBack('');
      const updatedFlashcards = await axios.get(`http://localhost:3002/flashcards/${setId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFlashcards(updatedFlashcards.data || []);
      setFlipped((updatedFlashcards.data || []).reduce((acc, fc) => ({ ...acc, [fc._id]: false }), {}));
    } catch (error) {
      setMessage(`Không thể cập nhật thẻ: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDeleteFlashcard = async (id) => {
    try {
      await axios.delete(`http://localhost:3002/flashcard/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Thẻ được xóa thành công');
      setFlashcards(flashcards.filter(fc => fc._id !== id));
    } catch (error) {
      setMessage(`Không thể xóa thẻ: ${error.response?.data?.message || error.message}`);
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

  const handleImport = async () => {
    if (!importData.trim()) {
      setMessage('Không có nội dung để nhập');
      return;
    }

    let delimiterChar;
    switch (delimiter) {
      case 'tab':
        delimiterChar = '\t';
        break;
      case 'comma':
        delimiterChar = ',';
        break;
      case 'semicolon':
        delimiterChar = ';';
        break;
      case 'custom':
        delimiterChar = prompt('Nhập ký tự phân cách tùy chỉnh:', ',') || ',';
        break;
      default:
        delimiterChar = '\t';
    }

    const lines = importData.split('\n').filter(line => line.trim());
    const newFlashcards = [];

    for (const line of lines) {
      const [frontText, backText] = line.split(delimiterChar).map(item => item.trim());
      if (frontText && backText) {
        newFlashcards.push({ front: frontText, back: backText, setId });
      }
    }

    if (newFlashcards.length === 0) {
      setMessage('Không có dữ liệu hợp lệ để nhập');
      return;
    }

    try {
      await axios.post('http://localhost:3002/flashcards/bulk', { flashcards: newFlashcards }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(`${newFlashcards.length} thẻ đã được nhập thành công`);
      setImportData('');
      setIsImportModalOpen(false);
      const updatedFlashcards = await axios.get(`http://localhost:3002/flashcards/${setId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFlashcards(updatedFlashcards.data || []);
      setFlipped((updatedFlashcards.data || []).reduce((acc, fc) => ({ ...acc, [fc._id]: false }), {}));
    } catch (error) {
      setMessage(`Không thể nhập thẻ: ${error.response?.data?.message || error.message}`);
    }
  };

  const openImportModal = () => {
    setIsImportModalOpen(true);
  };

  const closeImportModal = () => {
    setIsImportModalOpen(false);
    setImportData('');
    setMessage('');
  };

  return (
    <div className="creator-container">
      <nav className="creator-navbar">
        <div className="creator-logo">Flashcard Pro</div>
        <div className="creator-nav-links">
          <button className="creator-nav-btn" onClick={() => navigate('/dashboard')}>
            Dashboard
          </button>
          <button className="creator-nav-btn" onClick={() => navigate('/study')}>
            Học
          </button>
          <button className="creator-nav-btn" onClick={() => navigate('/flashcards')}>
            Tạo thẻ
          </button>
          <button className="creator-nav-btn" onClick={() => navigate('/progress')}>
            Thống kê
          </button>
          <button className="creator-nav-btn" onClick={() => navigate('/')}>
            Đăng xuất
          </button>
        </div>
      </nav>

      <section className="creator-features-section">
        <h2>Quản lý thẻ trong thư mục</h2>
        <div className="creator-content-create">
          <input
            type="text"
            value={front}
            onChange={(e) => setFront(e.target.value)}
            placeholder="Mặt trước (Câu hỏi)"
            className="creator-content-input"
          />
          <input
            type="text"
            value={back}
            onChange={(e) => setBack(e.target.value)}
            placeholder="Mặt sau (Trả lời)"
            className="creator-content-input"
          />
          <button
            className="creator-cta-btn"
            onClick={editingId ? () => handleEditFlashcard(editingId) : handleCreateFlashcard}
          >
            {editingId ? 'Cập nhật thẻ' : 'Tạo thẻ mới'}
          </button>
          <button className="creator-cta-btn" onClick={openImportModal}>
            Nhập
          </button>
        </div>
        <div className="creator-flashcard-list">
          {flashcards.length > 0 ? (
            <div className="creator-features-grid">
              {flashcards.map(fc => (
                <div key={fc._id} className="creator-card-item">
                  <div className={`creator-flashcard-inner ${flipped[fc._id] ? 'creator-flipped' : ''}`} onClick={() => handleFlip(fc._id)}>
                    <div className="creator-flashcard-front">
                      <p>{fc.front}</p>
                    </div>
                    <div className="creator-flashcard-back">
                      <p>{fc.back}</p>
                    </div>
                  </div>
                  <div className="creator-flashcard-actions">
                    <button className="creator-content-btn" onClick={() => startEditing(fc)}>Sửa</button>
                    <button className="creator-content-btn" onClick={() => handleDeleteFlashcard(fc._id)}>Xóa</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>Không có thẻ nào trong bộ này.</p>
          )}
        </div>
        {message && <p className="creator-message">{message}</p>}
        <div className="creator-nav-buttons">
          <button className="creator-nav-btn creator-back-btn" onClick={() => navigate('/flashcards')} title="Quay lại">←</button>
        </div>
      </section>

      {isImportModalOpen && (
        <div className="creator-import-modal-overlay" onClick={closeImportModal}>
          <div className="creator-import-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nhập dữ liệu thẻ</h2>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="Nhập dữ liệu"
              className="creator-content-input creator-import-textarea"
            />
            <div className="creator-delimiter-options">
               <p>Giữa thuật ngữ và định nghĩa</p>
              <label>
                <input
                  type="radio"
                  value="tab"
                  checked={delimiter === 'tab'}
                  onChange={(e) => setDelimiter(e.target.value)}
                />
                Tab
              </label>
              <label>
                <input
                  type="radio"
                  value="comma"
                  checked={delimiter === 'comma'}
                  onChange={(e) => setDelimiter(e.target.value)}
                />
                Phảy (,)
              </label>
              <label>
                <input
                  type="radio"
                  value="semicolon"
                  checked={delimiter === 'semicolon'}
                  onChange={(e) => setDelimiter(e.target.value)}
                />
                Chấm phảy (;)
              </label>
              <label>
                <input
                  type="radio"
                  value="custom"
                  checked={delimiter === 'custom'}
                  onChange={(e) => setDelimiter(e.target.value)}
                />
                Tùy chỉnh
              </label>
              {delimiter === 'custom' && (
                <input
                  type="text"
                  placeholder="Nhập ký tự tùy chỉnh"
                  onChange={(e) => setDelimiter(e.target.value)}
                  className="creator-content-input creator-custom-delimiter"
                />
              )}
            </div>
            <button className="creator-cta-btn" onClick={handleImport}>
              Nhập
            </button>
            <button className="creator-cta-btn creator-close-btn" onClick={closeImportModal}>
              Đóng
            </button>
            {message && <p className="creator-message">{message}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashcardCreator;