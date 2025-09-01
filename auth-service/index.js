const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  googleId: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date
});

const User = mongoose.model('User', userSchema);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Đăng ký
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'Email already registered' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });
  
  const user = new User({
    email,
    password: hashedPassword,
    verificationToken
  });
  
  await user.save();
  
  const verificationLink = `http://localhost:3001/verify?token=${verificationToken}`;
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Account',
      html: `<p>Click <a href="${verificationLink}">here</a> to verify your account</p>`
    });
    res.json({ message: 'Registration successful. Please check your email to verify.' });
  } catch (error) {
    console.error('Failed to send verification email:', error);
    res.status(500).json({ message: 'Failed to send verification email' });
  }
});

// Xác nhận email
app.get('/verify', async (req, res) => {
  try {
    const { token } = req.query;
    console.log('Verification attempt:', { token });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    const user = await User.findOne({ email: decoded.email });
    console.log('User found:', user);
    if (!user) {
      console.log('User not found for email:', decoded.email);
      return res.status(404).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2>User not found</h2>
            <p>The email verification link is invalid or the user does not exist.</p>
            <a href="http://localhost:3000" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Back to Login</a>
          </body>
        </html>
      `);
    }
    if (user.isVerified) {
      console.log('User already verified:', { email: user.email });
      return res.send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2>Account already verified</h2>
            <p>Your account has already been verified. You can now log in.</p>
            <a href="http://localhost:3000" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Go to Login</a>
          </body>
        </html>
      `);
    }
    user.isVerified = true;
    user.verificationToken = null;
    await user.save();
    console.log('User updated:', { email: user.email, isVerified: user.isVerified });

    // Tạo user trong user-service
    const userId = user._id.toString();
    const jwtToken = jwt.sign({ userId, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    try {
      const profileRes = await axios.get('http://user-service:3002/profile', {
        headers: { Authorization: `Bearer ${jwtToken}` }
      });
      console.log('Profile found in user-service:', profileRes.data);
    } catch (error) {
      if (error.response?.status === 404) {
        try {
          await axios.post('http://user-service:3002/profile', { userId, email: user.email, name: '' }, {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          console.log('User created in user-service:', { userId, email: user.email });
        } catch (createError) {
          console.error('Failed to create user in user-service:', createError.response?.data || createError.message);
        }
      } else {
        console.error('Error checking profile in user-service:', error.response?.data || error.message);
      }
    }

    res.send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2>Email verified successfully</h2>
          <p>Your account has been verified. You can now log in.</p>
          <a href="http://localhost:3000" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Go to Login</a>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Verification error:', error);
    res.status(400).send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2>Invalid token</h2>
          <p>The verification link is invalid or has expired.</p>
          <a href="http://localhost:3000" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Back to Login</a>
        </body>
      </html>
    `);
  }
});

// Đăng nhập
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  const user = await User.findOne({ email });
  
  if (!user || !user.isVerified) {
    return res.status(401).json({ message: 'Invalid credentials or unverified email' });
  }
  
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  const userId = user._id.toString();
  const token = jwt.sign({ userId, email }, process.env.JWT_SECRET, { expiresIn: '1h' });

  // Kiểm tra và tạo user trong user-service nếu chưa tồn tại
  try {
    const profileRes = await axios.get('http://user-service:3002/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Profile found in user-service:', profileRes.data);
  } catch (error) {
    if (error.response?.status === 404) {
      try {
        await axios.post('http://user-service:3002/profile', { userId, email, name: '' }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('User created in user-service:', { userId, email });
      } catch (createError) {
        console.error('Failed to create user in user-service:', createError.response?.data || createError.message);
      }
    } else {
      console.error('Error checking profile in user-service:', error.response?.data || error.message);
    }
  }

  res.json({ token });
});

// Đăng nhập Google
app.post('/google-login', async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const { email, sub: googleId } = ticket.getPayload();
    
    let user = await User.findOne({ googleId });
    if (!user) {
      user = new User({ email, googleId, isVerified: true });
      await user.save();
    }
    
    const userId = user._id.toString();
    const jwtToken = jwt.sign({ userId, email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Kiểm tra và tạo user trong user-service nếu chưa tồn tại
    try {
      const profileRes = await axios.get('http://user-service:3002/profile', {
        headers: { Authorization: `Bearer ${jwtToken}` }
      });
      console.log('Profile found in user-service:', profileRes.data);
    } catch (error) {
      if (error.response?.status === 404) {
        try {
          await axios.post('http://user-service:3002/profile', { userId, email, name: '' }, {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          console.log('User created in user-service:', { userId, email });
        } catch (createError) {
          console.error('Failed to create user in user-service:', createError.response?.data || createError.message);
        }
      } else {
        console.error('Error checking profile in user-service:', error.response?.data || error.message);
      }
    }

    res.json({ token: jwtToken });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(400).json({ message: 'Google login failed' });
  }
});

app.listen(3001, () => console.log('Auth service running on port 3001'));
// Quên mật khẩu
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Email not found' });
    }
    const resetToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 giờ
    await user.save();

    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reset Your Password',
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link will expire in 1 hour.</p>`
    });
    res.json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to send password reset email' });
  }
});

// Đặt lại mật khẩu
app.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      email: decoded.email,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(400).json({ message: 'Invalid or expired reset token' });
  }
});
