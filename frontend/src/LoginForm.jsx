import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import './QuizletStyle.css';

const LoginForm = ({ onLogin, email, setEmail, password, setPassword, onGoogleSuccess, showForgotPasswordModal, message, setMessage, inputClass = 'login-input', btnClass = 'login-btn' }) => (
  <div className="login-section">
    <h2>Log In</h2>
    <div className="login-form">
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
        placeholder="Password"
        className={inputClass}
      />
      <button className={btnClass} onClick={onLogin}>Log In</button>
      <a className="auth-link" onClick={showForgotPasswordModal}>
        Forgot Password?
      </a>
      <div className="google-login">
        <GoogleLogin
          onSuccess={onGoogleSuccess}
          onError={() => setMessage('Google Login Failed')}
        />
      </div>
      <p>
        Don't have an account? <a href="/register" className="auth-link">Sign Up</a>
      </p>
      {message && <p className="message">{message}</p>}
    </div>
  </div>
);

export default LoginForm;