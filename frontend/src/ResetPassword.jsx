import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './QuizletStyle.css';

const ResetPassword = ({ setMessage }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localMessage, setLocalMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setLocalMessage('Liên kết không hợp lệ');
      setTimeout(() => navigate('/'), 3000);
    }
  }, [searchParams, navigate]);

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setLocalMessage('Mật khẩu xác nhận không khớp');
      return;
    }
    try {
      const token = searchParams.get('token');
      const res = await axios.post('http://localhost:3001/reset-password', {
        token,
        newPassword
      });
      setLocalMessage(res.data.message);
      setMessage(res.data.message);
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      setLocalMessage(error.response?.data?.message || 'Không thể đặt lại mật khẩu');
    }
  };

  return (
    <div className="content-page">
      <div className="content-section">
        <h2>Đặt lại mật khẩu</h2>
        <div>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mật khẩu mới"
            className="login-input"
          />
        </div>
        <div>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Xác nhận mật khẩu"
            className="login-input"
          />
        </div>
        <button className="login-btn" onClick={handleResetPassword}>
          Cập nhật mật khẩu
        </button>
        {localMessage && <p className="message">{localMessage}</p>}
      </div>
    </div>
  );
};

export default ResetPassword;