import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
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
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
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
          }
        }
      }
    };
    checkProfile();
  }, [token]);

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
      setMessage('Google login failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setName('');
    setUserEmail('');
    setIsProfileUpdated(false);
    setMessage('Logged out successfully');
    navigate('/');
  };

  const handleProfileUpdate = async () => {
    try {
      await axios.put('http://localhost:3002/profile', { name }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsProfileUpdated(true);
      setShowProfileModal(false);
      setMessage('Profile updated successfully');
    } catch (error) {
      setMessage('Failed to update profile');
    }
  };

  const handleForgotPassword = async () => {
    try {
      await axios.post('http://localhost:3001/forgot-password', { email: loginEmail });
      setMessage('Password reset email sent');
      setShowForgotPasswordModal(false);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to send reset email');
    }
  };

  return (
    <div className="main-interface">
      {token && (
        <div className="navbar">
          <div className="nav-buttons-right">
            <button className="nav-btn" onClick={() => navigate('/dashboard')}>
              Home
            </button>
            <div className="account-dropdown">
              <button
                className="nav-btn"
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
              >
                Account
              </button>
              {showAccountDropdown && (
                <div className="dropdown-menu">
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setShowProfileModal(true);
                      setShowAccountDropdown(false);
                    }}
                  >
                    View Profile
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={handleLogout}
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
          </div>
        </div>
      )}
      {showForgotPasswordModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setShowForgotPasswordModal(false)}>&times;</span>
            <h2>Forgot Password</h2>
            <div>
              <label>Email:</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Email"
                className="login-input"
              />
            </div>
            <button className="login-btn" onClick={handleForgotPassword}>
              Send Request
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