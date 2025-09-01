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

// Schema phiên học
const studySessionSchema = new mongoose.Schema({
  setId: { type: mongoose.Schema.Types.ObjectId, ref: 'FlashcardSet' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  mode: { type: String, enum: ['flashcard', 'match', 'quiz', 'test'] },
  score: Number,
  totalQuestions: Number,
  completedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const FlashcardSet = mongoose.model('FlashcardSet', flashcardSetSchema);
const Flashcard = mongoose.model('Flashcard', flashcardSchema);
const StudySession = mongoose.model('StudySession', studySessionSchema);

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
  try {
    let user = await User.findOne({ userId });
    if (user) {
      user.name = name || user.name;
      user.email = email;
      await user.save();
      return res.json(user);
    }
    user = new User({ userId, name, email });
    await user.save();
    res.json(user);
  } catch (error) {
    console.error('Profile creation error:', error.message);
    res.status(500).json({ message: 'Failed to create or update profile' });
  }
});

// Lấy danh sách bộ flashcard
app.get('/flashcard-sets', authenticate, async (req, res) => {
  const sets = await FlashcardSet.find({ createdBy: req.userId });
  res.json(sets);
});

// Tạo bộ flashcard
app.post('/flashcard-set', authenticate, async (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }
  const set = new FlashcardSet({ title, createdBy: req.userId });
  await set.save();
  res.json(set);
});

// Xóa bộ flashcard
app.delete('/flashcard-set/:id', authenticate, async (req, res) => {
  try {
    const set = await FlashcardSet.findOneAndDelete({ _id: req.params.id, createdBy: req.userId });
    if (!set) {
      return res.status(404).json({ message: 'Flashcard set not found' });
    }
    await Flashcard.deleteMany({ setId: req.params.id, createdBy: req.userId });
    await StudySession.deleteMany({ setId: req.params.id, userId: req.userId });
    res.json({ message: 'Flashcard set and related data deleted' });
  } catch (error) {
    console.error('Error deleting flashcard set:', error.message);
    res.status(500).json({ message: 'Failed to delete flashcard set' });
  }
});

// Lấy flashcard theo setId
app.get('/flashcards/:setId', authenticate, async (req, res) => {
  try {
    const flashcards = await Flashcard.find({ setId: req.params.setId, createdBy: req.userId });
    if (flashcards.length === 0) {
      return res.status(404).json({ message: 'No flashcards found for this set' });
    }
    res.json(flashcards);
  } catch (error) {
    console.error('Error fetching flashcards:', error.message);
    res.status(500).json({ message: 'Failed to fetch flashcards' });
  }
});

// Tạo flashcard
app.post('/flashcard', authenticate, async (req, res) => {
  const { front, back, setId } = req.body;
  if (!front || !back || !setId) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    const set = await FlashcardSet.findOne({ _id: setId, createdBy: req.userId });
    if (!set) {
      return res.status(404).json({ message: 'Flashcard set not found' });
    }
    const flashcard = new Flashcard({ front, back, setId, createdBy: req.userId });
    await flashcard.save();
    res.json(flashcard);
  } catch (error) {
    console.error('Error creating flashcard:', error.message);
    res.status(500).json({ message: 'Failed to create flashcard' });
  }
});

// Cập nhật flashcard
app.put('/flashcard/:id', authenticate, async (req, res) => {
  const { front, back, isMemorized } = req.body;
  if (!front || !back) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    const updateData = { front, back };
    if (isMemorized !== undefined) {
      updateData.isMemorized = isMemorized;
    }
    const flashcard = await Flashcard.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.userId },
      updateData,
      { new: true }
    );
    if (!flashcard) {
      return res.status(404).json({ message: 'Flashcard not found' });
    }
    res.json({ message: 'Flashcard updated', flashcard });
  } catch (error) {
    console.error('Error updating flashcard:', error.message);
    res.status(500).json({ message: 'Failed to update flashcard' });
  }
});

// Xóa flashcard
app.delete('/flashcard/:id', authenticate, async (req, res) => {
  try {
    const flashcard = await Flashcard.findOneAndDelete({ _id: req.params.id, createdBy: req.userId });
    if (!flashcard) {
      return res.status(404).json({ message: 'Flashcard not found' });
    }
    res.json({ message: 'Flashcard deleted' });
  } catch (error) {
    console.error('Error deleting flashcard:', error.message);
    res.status(500).json({ message: 'Failed to delete flashcard' });
  }
});
// Nhập khẩu flashcards hàng loạt
app.post('/flashcards/bulk', authenticate, async (req, res) => {
  const { flashcards } = req.body;
  if (!flashcards || !Array.isArray(flashcards) || flashcards.length === 0) {
    return res.status(400).json({ message: 'No flashcards provided' });
  }

  try {
    const newFlashcards = await Promise.all(
      flashcards.map(async (fc) => {
        const flashcard = new Flashcard({
          front: fc.front,
          back: fc.back,
          setId: fc.setId,
          createdBy: req.userId,
          createdAt: new Date(),
          isMemorized: false
        });
        return await flashcard.save();
      })
    );
    res.json({ message: 'Flashcards imported successfully', flashcards: newFlashcards });
  } catch (error) {
    console.error('Error importing flashcards:', error.message);
    res.status(500).json({ message: 'Failed to import flashcards' });
  }
});

// Chế độ flashcard
app.get('/flashcard-mode/:setId', authenticate, async (req, res) => {
  try {
    const flashcards = await Flashcard.find({ setId: req.params.setId, createdBy: req.userId });
    if (flashcards.length === 0) {
      console.log('No flashcards found for setId:', req.params.setId);
      return res.status(404).json({ message: 'No flashcards found' });
    }
    res.json(flashcards);
  } catch (error) {
    console.error('Error fetching flashcards:', error.message);
    res.status(500).json({ message: 'Failed to fetch flashcards' });
  }
});

// Chế độ ghép cặp
app.get('/match-mode/:setId', authenticate, async (req, res) => {
  try {
    const flashcards = await Flashcard.find({ setId: req.params.setId, createdBy: req.userId });
    if (flashcards.length === 0) {
      console.log('No flashcards found for setId:', req.params.setId);
      return res.status(404).json({ message: 'No flashcards found' });
    }
    const pairs = flashcards.map(fc => ({ front: fc.front, back: fc.back }));
    res.json(pairs.sort(() => Math.random() - 0.5));
  } catch (error) {
    console.error('Error fetching match mode:', error.message);
    res.status(500).json({ message: 'Failed to fetch match mode data' });
  }
});

// Chế độ quiz
app.get('/quiz/:setId', authenticate, async (req, res) => {
  try {
    const flashcards = await Flashcard.find({ setId: req.params.setId, createdBy: req.userId });
    if (flashcards.length === 0) {
      console.log('No flashcards found for setId:', req.params.setId);
      return res.status(404).json({ message: 'No flashcards found' });
    }

    const generateRandomOptions = (correctAnswer, flashcards) => {
      const options = [correctAnswer];
      const otherAnswers = flashcards.filter(fc => fc.back !== correctAnswer).map(fc => fc.back);
      
      if (flashcards.length < 4) {
        return otherAnswers.concat([correctAnswer]).sort(() => Math.random() - 0.5);
      }
      
      while (options.length < 4 && otherAnswers.length > 0) {
        const randomIndex = Math.floor(Math.random() * otherAnswers.length);
        options.push(otherAnswers.splice(randomIndex, 1)[0]);
      }
      
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
  } catch (error) {
    console.error('Error fetching quiz:', error.message);
    res.status(500).json({ message: 'Failed to fetch quiz data' });
  }
});

// Chế độ kiểm tra
app.get('/test-mode/:setId', authenticate, async (req, res) => {
  try {
    const flashcards = await Flashcard.find({ setId: req.params.setId, createdBy: req.userId });
    if (flashcards.length === 0) {
      console.log('No flashcards found for setId:', req.params.setId);
      return res.status(404).json({ message: 'No flashcards found' });
    }
    
    const generateRandomOptions = (correctAnswer, flashcards) => {
      const options = [correctAnswer];
      const otherAnswers = flashcards.filter(fc => fc.back !== correctAnswer).map(fc => fc.back);
      
      if (flashcards.length < 4) {
        return otherAnswers.concat([correctAnswer]).sort(() => Math.random() - 0.5);
      }
      
      while (options.length < 4 && otherAnswers.length > 0) {
        const randomIndex = Math.floor(Math.random() * otherAnswers.length);
        options.push(otherAnswers.splice(randomIndex, 1)[0]);
      }
      
      while (options.length < 4) {
        options.push(`Option ${options.length + 1}`);
      }
      
      return options.sort(() => Math.random() - 0.5);
    };

    const testQuestions = flashcards.map(fc => ({
      question: fc.front,
      answer: fc.back,
      options: Math.random() > 0.5 ? generateRandomOptions(fc.back, flashcards) : null
    }));
    res.json(testQuestions);
  } catch (error) {
    console.error('Error fetching test mode:', error.message);
    res.status(500).json({ message: 'Failed to fetch test mode data' });
  }
});

// Lưu kết quả học tập
app.post('/study-result', authenticate, async (req, res) => {
  const { setId, mode, score, totalQuestions } = req.body;
  if (!setId || !mode || score === undefined || !totalQuestions) {
    console.log('Missing fields for study session:', { setId, mode, score, totalQuestions });
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    const set = await FlashcardSet.findOne({ _id: setId, createdBy: req.userId });
    if (!set) {
      return res.status(404).json({ message: 'Flashcard set not found' });
    }
    const session = new StudySession({ setId, userId: req.userId, mode, score, totalQuestions, completedAt: new Date() });
    await session.save();
    res.json({ message: 'Study result saved', session });
  } catch (error) {
    console.error('Error saving study result:', error.message);
    res.status(500).json({ message: 'Failed to save study result' });
  }
});

// Lấy lịch sử học tập
app.get('/study-history', authenticate, async (req, res) => {
  try {
    const sessions = await StudySession.find({ 
      userId: req.userId,
      setId: { $exists: true, $ne: null }
    }).populate({
      path: 'setId',
      select: 'title',
      match: { _id: { $exists: true } }
    });
    const validSessions = sessions.filter(session => session.setId && session.setId._id);
    if (validSessions.length === 0) {
      return res.json([]);
    }
    res.json(validSessions);
  } catch (error) {
    console.error('Error fetching study history:', error.message);
    res.status(500).json({ message: 'Không thể tải lịch sử học tập' });
  }
});

app.listen(3002, () => console.log('User service running on port 3002'));