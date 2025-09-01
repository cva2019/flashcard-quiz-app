import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import './RegisterForm.css';

const RegisterForm = ({ onRegister, email, setEmail, password, setPassword, onGoogleSuccess, message, setMessage, inputClass = 'signup-input', btnClass = 'signup-btn' }) => {
  const navigate = useNavigate();

  return (
    <div className="signup-container">
      <form className="signup-form">
        <div className="nav-buttons">
          <button className="back-btn" onClick={() => navigate('/')} title="Quay lại">←</button>
        </div>
        <h2>Đăng ký</h2>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className={inputClass}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mật khẩu"
          className={inputClass}
        />
        <button type="button" className={btnClass} onClick={onRegister}>Đăng ký</button>
        <div className="google-login">
          <GoogleLogin
            onSuccess={onGoogleSuccess}
            onError={() => setMessage('Đăng ký bằng Google thất bại')}
          />
        </div>
        <p>
          Đã có tài khoản? <a href="/login" className="auth-link">Đăng nhập</a>
        </p>
        {message && <p className="message">{message}</p>}
      </form>
    </div>
  );
};

export default RegisterForm;