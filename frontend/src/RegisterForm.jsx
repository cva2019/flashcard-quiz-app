import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import './QuizletStyle.css';

const RegisterForm = ({ onRegister, email, setEmail, password, setPassword, onGoogleSuccess, message, setMessage, inputClass = 'login-input', btnClass = 'login-btn' }) => (
  <div className="register-section">
    <h2>Sign Up</h2>
    <div className="register-form">
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
      <button className={btnClass} onClick={onRegister}>Sign Up</button>
      <div className="google-login">
        <GoogleLogin
          onSuccess={onGoogleSuccess}
          onError={() => setMessage('Google Sign Up Failed')}
        />
      </div>
      <p>
        Already have an account? <a href="/login" className="auth-link">Log In</a>
      </p>
      {message && <p className="message">{message}</p>}
    </div>
  </div>
);

export default RegisterForm;