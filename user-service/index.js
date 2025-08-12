const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Schema người dùng
const userSchema = new mongoose.Schema({
  userId: String,
  name: String,
  email: String
});

// Schema bộ flashcard
const flashcardSetSchema = new mongoose.Schema({
  title: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

// Schema flashcard
const flashcardSchema = new mongoose.Schema({
  front: String,
  back: String,
  setId: { type: mongoose.Schema.Types.ObjectId, ref: 'FlashcardSet' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  isMemorized: { type: Boolean, default: false }
});

// Schema quiz
const quizSchema = new mongoose.Schema({
  setId: { type: mongoose.Schema.Types.ObjectId, ref: 'FlashcardSet' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  score: Number,
  totalQuestions: Number,
  completedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const FlashcardSet = mongoose.model('FlashcardSet', flashcardSetSchema);
const Flashcard = mongoose.model('Flashcard', flashcardSchema);
const Quiz = mongoose.model('Quiz', quizSchema);

// Middleware xác thực
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  if (!token) {
    console.log('No token provided for request:', req.url);
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Tạo user
app.post('/profile', async (req, res) => {
  const { userId, name, email } = req.body;
  if (!userId || !email) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  const user = new User({ userId, name, email });
  await user.save();
  res.json(user);
});

// Cập nhật profile
app.put('/profile', authenticate, async (req, res) => {
  const { name } = req.body;
  const user = await User.findOneAndUpdate(
    { userId: req.userId },
    { name },
    { new: true }
  );
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json(user);
});

// Lấy profile
app.get('/profile', authenticate, async (req, res) => {
  const user = await User.findOne({ userId: req.userId });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json(user);
});

// Tạo bộ flashcard
app.post('/flashcard-set', authenticate, async (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }
  const flashcardSet = new FlashcardSet({ title, createdBy: req.userId });
  await flashcardSet.save();
  res.json({ message: 'Flashcard set created' });
});

// Lấy danh sách bộ flashcard
app.get('/flashcard-sets', authenticate, async (req, res) => {
  const sets = await FlashcardSet.find({ createdBy: req.userId });
  res.json(sets);
});

// Tạo flashcard
app.post('/flashcard', authenticate, async (req, res) => {
  const { front, back, setId } = req.body;
  if (!front || !back || !setId) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  const flashcard = new Flashcard({ front, back, setId, createdBy: req.userId, isMemorized: false });
  await flashcard.save();
  res.json({ message: 'Flashcard created' });
});

// Cập nhật flashcard
app.put('/flashcard/:id', authenticate, async (req, res) => {
  const { front, back, isMemorized } = req.body;
  const updateData = {};
  if (front) updateData.front = front;
  if (back) updateData.back = back;
  if (isMemorized !== undefined) updateData.isMemorized = isMemorized;
  const flashcard = await Flashcard.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.userId },
    updateData,
    { new: true }
  );
  if (!flashcard) {
    return res.status(404).json({ message: 'Flashcard not found' });
  }
  res.json({ message: 'Flashcard updated' });
});

// Xóa flashcard
app.delete('/flashcard/:id', authenticate, async (req, res) => {
  const flashcard = await Flashcard.findOneAndDelete({ _id: req.params.id, createdBy: req.userId });
  if (!flashcard) {
    return res.status(404).json({ message: 'Flashcard not found' });
  }
  res.json({ message: 'Flashcard deleted' });
});

// Lấy flashcard theo bộ
app.get('/flashcards/:setId', authenticate, async (req, res) => {
  const flashcards = await Flashcard.find({ setId: req.params.setId, createdBy: req.userId });
  res.json(flashcards);
});

// Tạo quiz từ bộ flashcard
app.get('/quiz/:setId', authenticate, async (req, res) => {
  const flashcards = await Flashcard.find({ setId: req.params.setId, createdBy: req.userId });
  if (flashcards.length === 0) {
    console.log('No flashcards found for setId:', req.params.setId);
    return res.status(404).json({ message: 'No flashcards found' });
  }

  const generateRandomOptions = (correctAnswer, flashcards) => {
    const options = [correctAnswer];
    const otherAnswers = flashcards.filter(fc => fc.back !== correctAnswer).map(fc => fc.back);
    
    // Nếu có dưới 4 flashcard, chỉ sử dụng các đáp án từ flashcard
    if (flashcards.length < 4) {
      return otherAnswers.concat([correctAnswer]).sort(() => Math.random() - 0.5);
    }
    
    // Nếu có 4 hoặc nhiều hơn flashcard, chọn ngẫu nhiên 3 đáp án sai
    while (options.length < 4 && otherAnswers.length > 0) {
      const randomIndex = Math.floor(Math.random() * otherAnswers.length);
      options.push(otherAnswers.splice(randomIndex, 1)[0]);
    }
    
    // Nếu vẫn thiếu đáp án, thêm các tùy chọn giả
    while (options.length < 4) {
      options.push(`Option ${options.length + 1}`);
    }
    
    return options.sort(() => Math.random() - 0.5);
  };

  const quizQuestions = flashcards.map(fc => ({
    question: fc.front,
    answer: fc.back,
    options: generateRandomOptions(fc.back, flashcards)
  }));
  res.json(quizQuestions);
});

// Lưu kết quả quiz
app.post('/quiz', authenticate, async (req, res) => {
  const { setId, score, totalQuestions } = req.body;
  if (!setId || score === undefined || !totalQuestions) {
    console.log('Missing fields for quiz:', { setId, score, totalQuestions });
    return res.status(400).json({ message: 'Missing required fields' });
  }
  const quiz = new Quiz({ setId, userId: req.userId, score, totalQuestions });
  await quiz.save();
  res.json({ message: 'Quiz result saved' });
});

// Lấy lịch sử quiz
app.get('/quiz-history', authenticate, async (req, res) => {
  const quizzes = await Quiz.find({ userId: req.userId }).populate('setId');
  res.json(quizzes);
});

app.listen(3002, () => console.log('User service running on port 3002'));
