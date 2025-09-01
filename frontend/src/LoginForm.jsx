import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import './LoginForm.css';

const LoginForm = ({ onLogin, email, setEmail, password, setPassword, onGoogleSuccess, showForgotPasswordModal, message, setMessage, inputClass = 'login-input', btnClass = 'login-btn' }) => {
  const navigate = useNavigate();

  return (
    <div className="login-container">
      <form className="login-form">
        <div className="nav-buttons">
          <button className="back-btn" onClick={() => navigate('/')} title="Quay lại">←</button>
        </div>
        <h2>Đăng nhập</h2>
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
        <button type="button" className={btnClass} onClick={onLogin}>Đăng nhập</button>
        <a className="auth-link" onClick={showForgotPasswordModal}>
          Quên mật khẩu?
        </a>
        <div className="google-login">
          <GoogleLogin
            onSuccess={onGoogleSuccess}
            onError={() => setMessage('Đăng nhập bằng Google thất bại')}
          />
        </div>
        <p>
          Chưa có tài khoản? <a href="/register" className="auth-link">Đăng ký ngay</a>
        </p>
        {message && <p className="message">{message}</p>}
      </form>
    </div>
  );
};

export default LoginForm;