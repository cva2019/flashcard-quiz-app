import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import './QuizletStyle.css';
import RegisterForm from './RegisterForm';
import LoginForm from './LoginForm';
import FlashcardSetManager from './FlashcardSetManager';
import FlashcardCreator from './FlashcardCreator';
import QuizPlayer from './QuizPlayer';
import ProgressTracker from './ProgressTracker';
import FlashcardStudy from './FlashcardStudy';
import Dashboard from './Dashboard';
import WelcomePage from './WelcomePage';
import ResetPassword from './ResetPassword';
import './ForgotPassword.css';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function App() {
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [name, setName] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [message, setMessage] = useState('');
  const [isProfileUpdated, setIsProfileUpdated] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const checkProfile = async () => {
      if (token) {
        try {
          const res = await axios.get('http://localhost:3002/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setName(res.data.name || '');
          setUserEmail(res.data.email || '');
          setIsProfileUpdated(!!res.data.name);
        } catch (error) {
          if (error.response?.status === 404) {
            try {
              await axios.post('http://localhost:3002/profile', {
                userId: token.userId,
                email: token.email,
                name: ''
              }, {
                headers: { Authorization: `Bearer ${token}` }
              });
            } catch (createError) {
              console.error('Failed to create profile:', createError);
            }
          } else if (error.response?.status === 401) {
            localStorage.removeItem('token');
            setToken(null);
            navigate('/');
          }
        }
      }
    };
    checkProfile();
  }, [token, navigate]);

  const handleRegister = async () => {
    try {
      const res = await axios.post('http://localhost:3001/register', {
        email: registerEmail,
        password: registerPassword
      });
      setMessage(res.data.message);
      setRegisterEmail('');
      setRegisterPassword('');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Registration failed');
    }
  };

  const handleLogin = async () => {
    try {
      const res = await axios.post('http://localhost:3001/login', {
        email: loginEmail,
        password: loginPassword
      });
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setMessage('Login successful');
      setLoginEmail('');
      setLoginPassword('');
      navigate('/dashboard');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Login failed');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post('http://localhost:3001/google-login', {
        token: credentialResponse.credential
      });
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setMessage('Google login successful');
      navigate('/dashboard');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Google login failed');
    }
  };

  const handleProfileUpdate = async () => {
    try {
      await axios.post('http://localhost:3002/profile', {
        userId: token.userId,
        email: userEmail,
        name
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsProfileUpdated(true);
      setShowProfileModal(false);
      setMessage('Profile updated successfully');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleForgotPassword = async () => {
    try {
      const res = await axios.post('http://localhost:3001/forgot-password', {
        email: loginEmail
      });
      setMessage(res.data.message);
      setShowForgotPasswordModal(false);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to send reset email');
    }
  };

  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route
          path="/login"
          element={
            <div className="login-page">
              <LoginForm
                onLogin={handleLogin}
                email={loginEmail}
                setEmail={setLoginEmail}
                password={loginPassword}
                setPassword={setLoginPassword}
                onGoogleSuccess={handleGoogleSuccess}
                showForgotPasswordModal={() => setShowForgotPasswordModal(true)}
                message={message}
                setMessage={setMessage}
              />
            </div>
          }
        />
        <Route
          path="/register"
          element={
            <div className="register-page">
              <RegisterForm
                onRegister={handleRegister}
                email={registerEmail}
                setEmail={setRegisterEmail}
                password={registerPassword}
                setPassword={setRegisterPassword}
                onGoogleSuccess={handleGoogleSuccess}
                message={message}
                setMessage={setMessage}
              />
            </div>
          }
        />
        <Route path="/reset-password" element={<ResetPassword setMessage={setMessage} />} />
        <Route path="/dashboard" element={<Dashboard token={token} />} />
        <Route path="/flashcards" element={<FlashcardSetManager token={token} />} />
        <Route path="/flashcards/:setId" element={<FlashcardCreator token={token} />} />
        <Route path="/quiz/:setId" element={<QuizPlayer token={token} />} />
        <Route path="/progress" element={<ProgressTracker token={token} />} />
        <Route path="/study" element={<FlashcardStudy token={token} />} />
      </Routes>
      {showProfileModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setShowProfileModal(false)}>&times;</span>
            <h2>View Profile</h2>
            <div>
              <label>Username:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Username"
                className="login-input"
              />
            </div>
            <div>
              <label>Email:</label>
              <input
                type="email"
                value={userEmail}
                disabled
                className="login-input"
              />
            </div>
            <button className="login-btn" onClick={handleProfileUpdate}>
              Update
            </button>
            <button className="login-btn" onClick={() => setShowProfileModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {showForgotPasswordModal && (
        <div className="popup-overlay" role="dialog" aria-labelledby="forgot-password-title">
          <div className="popup-content">
            <span className="close" onClick={() => setShowForgotPasswordModal(false)} aria-label="Close">&times;</span>
            <h2 id="forgot-password-title">Quên mật khẩu</h2>
            <div>
              <label htmlFor="forgot-password-email">Email:</label>
              <input
                id="forgot-password-email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Email"
                className="login-input"
              />
            </div>
            <button className="login-btn" onClick={handleForgotPassword}>
              Gửi yêu cầu
            </button>
            <button className="login-btn" onClick={() => setShowForgotPasswordModal(false)}>
              Hủy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AppWrapper() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}