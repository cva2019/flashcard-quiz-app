import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './FlashcardStudy.css';

const FlashcardStudy = ({ token }) => {
  const navigate = useNavigate();
  const [sets, setSets] = useState([]);
  const [selectedSetId, setSelectedSetId] = useState('');
  const [flashcards, setFlashcards] = useState([]);
  const [currentFlashcard, setCurrentFlashcard] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [unmemorizedCards, setUnmemorizedCards] = useState([]);
  const [message, setMessage] = useState('');
  const [studyMode, setStudyMode] = useState('');
  const [matchCards, setMatchCards] = useState([]);
  const [selectedFirst, setSelectedFirst] = useState(null);
  const [selectedSecond, setSelectedSecond] = useState(null);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuizQuestion, setCurrentQuizQuestion] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [testQuestions, setTestQuestions] = useState([]);
  const [currentTestQuestion, setCurrentTestQuestion] = useState(0);
  const [testAnswer, setTestAnswer] = useState('');
  const [testScore, setTestScore] = useState(0);
  const [answerFeedback, setAnswerFeedback] = useState('');

  useEffect(() => {
    const fetchSets = async () => {
      try {
        const res = await axios.get('http://localhost:3002/flashcard-sets', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSets(res.data);
      } catch (error) {
        setMessage(`Failed to load flashcard sets: ${error.response?.data?.message || error.message}`);
      }
    };
    fetchSets();
  }, [token]);

  const fetchFlashcards = async (setId, mode) => {
    try {
      let endpoint;
      switch (mode) {
        case 'flashcard':
          endpoint = `/flashcard-mode/${setId}`;
          break;
        case 'match':
          endpoint = `/match-mode/${setId}`;
          break;
        case 'quiz':
          endpoint = `/quiz/${setId}`;
          break;
        case 'test':
          endpoint = `/test-mode/${setId}`;
          break;
        default:
          return;
      }
      const res = await axios.get(`http://localhost:3002${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (mode === 'flashcard') {
        setFlashcards(res.data);
        setCurrentFlashcard(0);
        setFlipped(false);
      } else if (mode === 'match') {
        const pairs = res.data;
        const cards = [
          ...pairs.map(pair => ({ id: pair.front + pair.back, content: pair.front, back: pair.back, type: 'front' })),
          ...pairs.map(pair => ({ id: pair.front + pair.back, content: pair.back, back: pair.back, type: 'back' }))
        ];
        setMatchCards(cards.sort(() => Math.random() - 0.5));
        setMatchedPairs([]);
        setSelectedFirst(null);
        setSelectedSecond(null);
      } else if (mode === 'quiz') {
        setQuizQuestions(res.data);
        setCurrentQuizQuestion(0);
        setQuizScore(0);
      } else if (mode === 'test') {
        const flashcardRes = await axios.get(`http://localhost:3002/flashcard-mode/${setId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const flashcards = flashcardRes.data;
        const rawQuestions = res.data;
        const modifiedQuestions = rawQuestions.map((q, index) => {
          if (index % 3 === 0) {
            return q.options ? { ...q, type: 'multiple' } : { ...q, type: 'fill' };
          } else if (index % 3 === 1) {
            return { ...q, type: 'fill' };
          } else {
            const currentCard = flashcards.find(card => card.front === q.front) || flashcards[index % flashcards.length];
            const randomCard = flashcards[Math.floor(Math.random() * flashcards.length)];
            const isCorrectPair = Math.random() > 0.5 && randomCard._id !== currentCard._id;
            const questionText = `${currentCard.front} - ${isCorrectPair ? currentCard.back : randomCard.back}`;
            const answer = isCorrectPair ? 'Đúng' : 'Sai';
            return {
              question: questionText,
              answer: answer,
              type: 'truefalse',
              front: currentCard.front,
              back: isCorrectPair ? currentCard.back : randomCard.back
            };
          }
        });
        setTestQuestions(modifiedQuestions);
        setCurrentTestQuestion(0);
        setTestScore(0);
        setTestAnswer('');
      }
      setIsComplete(false);
      setUnmemorizedCards([]);
      setMessage('');
      setAnswerFeedback('');
    } catch (error) {
      setMessage(`Failed to load data for ${mode} mode: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleSelectSet = (setId) => {
    setSelectedSetId(setId);
    if (studyMode) {
      fetchFlashcards(setId, studyMode);
    }
  };

  const handleFlip = () => {
    setFlipped(!flipped);
  };

  const handleMemorized = async () => {
    const current = flashcards[currentFlashcard];
    try {
      await axios.put(`http://localhost:3002/flashcard/${current._id}`, {
        front: current.front,
        back: current.back,
        isMemorized: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updatedFlashcards = flashcards.map((fc, index) =>
        index === currentFlashcard ? { ...fc, isMemorized: true } : fc
      );
      setFlashcards(updatedFlashcards);
      if (currentFlashcard < flashcards.length - 1) {
        setCurrentFlashcard(currentFlashcard + 1);
        setFlipped(false);
      } else {
        setIsComplete(true);
        const unmemorized = updatedFlashcards.filter(fc => !fc.isMemorized);
        setUnmemorizedCards(unmemorized);
        setMessage(`Hoàn thành! Bạn đã học ${flashcards.length - unmemorized.length}/${flashcards.length} thẻ.`);
        await axios.post('http://localhost:3002/study-result', {
          setId: selectedSetId,
          mode: 'flashcard',
          score: flashcards.length - unmemorized.length,
          totalQuestions: flashcards.length
        }, { headers: { Authorization: `Bearer ${token}` } });
      }
    } catch (error) {
      setMessage('Failed to update flashcard');
    }
  };

  const handleNotMemorized = () => {
    const current = flashcards[currentFlashcard];
    const updatedFlashcards = flashcards.map((fc, index) =>
      index === currentFlashcard ? { ...fc, isMemorized: false } : fc
    );
    setFlashcards(updatedFlashcards);
    if (currentFlashcard < flashcards.length - 1) {
      setUnmemorizedCards([...unmemorizedCards, flashcards[currentFlashcard]]);
      setCurrentFlashcard(currentFlashcard + 1);
      setFlipped(false);
    } else {
      setUnmemorizedCards([...unmemorizedCards, flashcards[currentFlashcard]]);
      setIsComplete(true);
      const unmemorized = updatedFlashcards.filter(fc => !fc.isMemorized);
      setMessage(`Hoàn thành! Bạn đã học ${flashcards.length - unmemorized.length}/${flashcards.length} thẻ.`);
      axios.post('http://localhost:3002/study-result', {
        setId: selectedSetId,
        mode: 'flashcard',
        score: flashcards.length - unmemorized.length,
        totalQuestions: flashcards.length
      }, { headers: { Authorization: `Bearer ${token}` } });
    }
  };

  const handleMatchSelect = (card) => {
    if (selectedFirst === null) {
      setSelectedFirst(card);
    } else if (selectedSecond === null && card !== selectedFirst) {
      setSelectedSecond(card);
      if (card.id === selectedFirst.id) {
        setMatchedPairs([...matchedPairs, card.id]);
        setSelectedFirst(null);
        setSelectedSecond(null);
        if (matchedPairs.length + 1 === matchCards.length / 2) {
          setIsComplete(true);
          setMessage(`Hoàn thành ghép cặp! Điểm: ${matchCards.length / 2}/${matchCards.length / 2}`);
          axios.post('http://localhost:3002/study-result', {
            setId: selectedSetId,
            mode: 'match',
            score: matchCards.length / 2,
            totalQuestions: matchCards.length / 2
          }, { headers: { Authorization: `Bearer ${token}` } });
        }
      } else {
        setTimeout(() => {
          setSelectedFirst(null);
          setSelectedSecond(null);
        }, 500);
      }
    }
  };

  const handleQuizAnswer = async (selectedOption, isTestMode = false, setScore = setQuizScore, currentQuestionIndex = currentQuizQuestion, setCurrentQuestionIndex = setCurrentQuizQuestion, questions = quizQuestions) => {
    const current = questions[currentQuestionIndex];
    const isCorrect = selectedOption === current.answer;
    const newScore = (isTestMode ? testScore : quizScore) + (isCorrect ? 1 : 0);
    setScore(newScore);
    setAnswerFeedback(isCorrect ? 'Đúng!' : `Sai! Đáp án đúng là: ${current.answer}`);

    if (!isCorrect) {
      setUnmemorizedCards([...unmemorizedCards, {
        _id: `${isTestMode ? 'test' : 'quiz'}-${currentQuestionIndex}`,
        front: current.question || current.front
      }]);
    }

    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setAnswerFeedback('');
        if (isTestMode) setTestAnswer('');
      } else {
        setIsComplete(true);
        setMessage(`Hoàn thành bài ${isTestMode ? 'kiểm tra' : 'quiz'}! Điểm: ${newScore}/${questions.length}`);
        try {
            axios.post('http://localhost:3002/study-result', {
            setId: selectedSetId,
            mode: isTestMode ? 'test' : 'quiz',
            score: newScore,
            totalQuestions: questions.length
          }, { headers: { Authorization: `Bearer ${token}` } });
        } catch (error) {
          setMessage(`Failed to save ${isTestMode ? 'test' : 'quiz'} result`);
        }
      }
    }, 1000); // Show feedback for 1 second
  };

  const handleTestAnswer = async (selectedOption = testAnswer) => {
    const current = testQuestions[currentTestQuestion];
    let isCorrect = false;

    if (current.type === 'truefalse') {
      isCorrect = String(selectedOption).toLowerCase() === String(current.answer).toLowerCase();
      const newScore = testScore + (isCorrect ? 1 : 0);
      setTestScore(newScore);
      setAnswerFeedback(isCorrect ? 'Đúng!' : `Sai! Đáp án đúng là: ${current.answer}`);

      if (!isCorrect && current.front) {
        setUnmemorizedCards([...unmemorizedCards, {
          _id: `test-${currentTestQuestion}`,
          front: current.front
        }]);
      }

      setTimeout(() => {
        if (currentTestQuestion < testQuestions.length - 1) {
          setCurrentTestQuestion(currentTestQuestion + 1);
          setTestAnswer('');
          setAnswerFeedback('');
        } else {
          setIsComplete(true);
          setMessage(`Hoàn thành bài kiểm tra! Điểm: ${newScore}/${testQuestions.length}`);
          try {
            axios.post('http://localhost:3002/study-result', {
              setId: selectedSetId,
              mode: 'test',
              score: newScore,
              totalQuestions: testQuestions.length
            }, { headers: { Authorization: `Bearer ${token}` } });
          } catch (error) {
            setMessage('Failed to save test result');
          }
        }
      }, 1000); // Show feedback for 1 second
    } else if (current.type === 'multiple') {
      return await handleQuizAnswer(selectedOption, true, setTestScore, currentTestQuestion, setCurrentTestQuestion, testQuestions);
    } else if (current.type === 'fill') {
      isCorrect = selectedOption.toLowerCase().trim() === current.answer.toLowerCase().trim();
      const newScore = testScore + (isCorrect ? 1 : 0);
      setTestScore(newScore);
      setAnswerFeedback(isCorrect ? 'Đúng!' : `Sai! Đáp án đúng là: ${current.answer}`);

      if (!isCorrect && current.front) {
        setUnmemorizedCards([...unmemorizedCards, {
          _id: `test-${currentTestQuestion}`,
          front: current.front
        }]);
      }

      setTimeout(() => {
        if (currentTestQuestion < testQuestions.length - 1) {
          setCurrentTestQuestion(currentTestQuestion + 1);
          setTestAnswer('');
          setAnswerFeedback('');
        } else {
          setIsComplete(true);
          setMessage(`Hoàn thành bài kiểm tra! Điểm: ${newScore}/${testQuestions.length}`);
          try {
            axios.post('http://localhost:3002/study-result', {
              setId: selectedSetId,
              mode: 'test',
              score: newScore,
              totalQuestions: testQuestions.length
            }, { headers: { Authorization: `Bearer ${token}` } });
          } catch (error) {
            setMessage('Failed to save test result');
          }
        }
      }, 1000); // Show feedback for 1 second
    }
  };

  const handleRetry = () => {
    setIsComplete(false);
    setUnmemorizedCards([]);
    setMessage('');
    setAnswerFeedback('');
    if (studyMode === 'quiz') {
      setCurrentQuizQuestion(0);
      setQuizScore(0);
      fetchFlashcards(selectedSetId, 'quiz');
    } else if (studyMode === 'test') {
      setCurrentTestQuestion(0);
      setTestScore(0);
      setTestAnswer('');
      fetchFlashcards(selectedSetId, 'test');
    } else if (studyMode === 'match') {
      setMatchedPairs([]);
      setSelectedFirst(null);
      setSelectedSecond(null);
      fetchFlashcards(selectedSetId, 'match');
    }
  };

  const handleBackToSelect = () => {
    setSelectedSetId('');
    setStudyMode('');
    setFlashcards([]);
    setMatchCards([]);
    setQuizQuestions([]);
    setTestQuestions([]);
    setIsComplete(false);
    setUnmemorizedCards([]);
    setMessage('');
    setAnswerFeedback('');
  };

  const handleReviewUnmemorized = () => {
    setFlashcards(unmemorizedCards);
    setCurrentFlashcard(0);
    setFlipped(false);
    setIsComplete(false);
    setUnmemorizedCards([]);
    setMessage('');
    setAnswerFeedback('');
    setStudyMode('flashcard');
  };

  const handleBackToSets = () => {
    setStudyMode('');
    setFlashcards([]);
    setMatchCards([]);
    setQuizQuestions([]);
    setTestQuestions([]);
    setIsComplete(false);
    setUnmemorizedCards([]);
    setMessage('');
    setAnswerFeedback('');
  };

  const renderStudyMode = () => {
    if (studyMode === 'flashcard' && flashcards.length > 0) {
      return (
        <div className="study-flashcard-container">
          <div className={`study-flashcard-inner ${flipped ? 'study-flipped' : ''}`} onClick={handleFlip}>
            <div className="study-flashcard-front">
              <p>{flashcards[currentFlashcard].front}</p>
            </div>
            <div className="study-flashcard-back">
              <p>{flashcards[currentFlashcard].back}</p>
            </div>
          </div>
          <div className="study-flashcard-actions">
            <button className="setmanager-nav-btn memorized" onClick={handleMemorized}>✓</button>
            <button className="setmanager-nav-btn not-memorized" onClick={handleNotMemorized}>✗</button>
          </div>
        </div>
      );
    } else if (studyMode === 'match' && matchCards.length > 0) {
      return (
        <div className="study-flashcard-container">
          <div className="study-match-grid">
            {matchCards.map((card, index) => (
              !matchedPairs.includes(card.id) && (
                <div
                  key={index}
                  className={`study-match-card ${selectedFirst === card || selectedSecond === card ? 'study-selected' : ''}`}
                  onClick={() => handleMatchSelect(card)}
                >
                  {card.content}
                </div>
              )
            ))}
          </div>
        </div>
      );
    } else if (studyMode === 'quiz' && quizQuestions.length > 0) {
      return (
        <div className="study-flashcard-container">
          <p>{quizQuestions[currentQuizQuestion].question}</p>
          <div className="study-quiz-options">
            {quizQuestions[currentQuizQuestion].options.map((option, index) => (
              <button key={index} className="setmanager-nav-btn" onClick={() => handleQuizAnswer(option)}>
                {option}
              </button>
            ))}
          </div>
          {answerFeedback && <p className="study-message">{answerFeedback}</p>}
        </div>
      );
    } else if (studyMode === 'test' && testQuestions.length > 0) {
      return (
        <div className="study-flashcard-container">
          <p>{testQuestions[currentTestQuestion].question}</p>
          {testQuestions[currentTestQuestion].type === 'truefalse' ? (
            <div className="study-quiz-options">
              <button className="setmanager-nav-btn" onClick={() => handleTestAnswer('Đúng')}>
                Đúng
              </button>
              <button className="setmanager-nav-btn" onClick={() => handleTestAnswer('Sai')}>
                Sai
              </button>
            </div>
          ) : testQuestions[currentTestQuestion].type === 'multiple' ? (
            <div className="study-quiz-options">
              {testQuestions[currentTestQuestion].options.map((option, index) => (
                <button key={index} className="setmanager-nav-btn" onClick={() => handleTestAnswer(option)}>
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <div>
              <input
                type="text"
                value={testAnswer}
                onChange={(e) => setTestAnswer(e.target.value)}
                placeholder="Nhập câu trả lời"
                className="study-content-input"
              />
              <button className="setmanager-nav-btn" onClick={() => handleTestAnswer(testAnswer)}>Gửi</button>
            </div>
          )}
          {answerFeedback && <p className="study-message">{answerFeedback}</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="study-page">
      <nav className="study-navbar">
        <div className="study-logo">Flashcard Pro</div>
        <div className="study-nav-links">
          <button className="setmanager-nav-btn" onClick={() => navigate('/dashboard')}>
            Dashboard
          </button>
          <button className="setmanager-nav-btn" onClick={() => navigate('/study')}>
            Học
          </button>
          <button className="setmanager-nav-btn" onClick={() => navigate('/flashcards')}>
            Tạo thẻ
          </button>
          <button className="setmanager-nav-btn" onClick={() => navigate('/progress')}>
            Thống kê
          </button>
          <button className="setmanager-nav-btn" onClick={() => navigate('/')}>
            Đăng xuất
          </button>
        </div>
      </nav>
      <div className="study-container">
        {(selectedSetId || studyMode) && (
          <button className="setmanager-nav-btn back-btn" onClick={handleBackToSets}>
            ←
          </button>
        )}
        <section className="study-features-section">
          {!selectedSetId ? (
            <div className="study-features-grid">
              {sets.length > 0 ? (
                sets.map(set => (
                  <div key={set._id} className="study-feature-card">
                    <h3>{set.title}</h3>
                    <button
                      className="setmanager-nav-btn"
                      onClick={() => handleSelectSet(set._id)}
                    >
                      Chọn bộ
                    </button>
                  </div>
                ))
              ) : (
                <p>Không có bộ flashcard nào.</p>
              )}
            </div>
          ) : !studyMode ? (
            <div className="study-features-grid">
              <div className="study-feature-card" onClick={() => { setStudyMode('flashcard'); fetchFlashcards(selectedSetId, 'flashcard'); }}>
                <h3>Chế độ Flashcard</h3>
                <p>Lật thẻ để học và đánh dấu thẻ.</p>
              </div>
              <div className="study-feature-card" onClick={() => { setStudyMode('match'); fetchFlashcards(selectedSetId, 'match'); }}>
                <h3>Chế độ Ghép cặp</h3>
                <p>Ghép cặp câu hỏi với câu trả lời.</p>
              </div>
              <div className="study-feature-card" onClick={() => { setStudyMode('quiz'); fetchFlashcards(selectedSetId, 'quiz'); }}>
                <h3>Câu hỏi trắc nghiệm</h3>
                <p>Chọn đáp án đúng từ các lựa chọn.</p>
              </div>
              <div className="study-feature-card" onClick={() => { setStudyMode('test'); fetchFlashcards(selectedSetId, 'test'); }}>
                <h3>Chế độ Kiểm tra</h3>
                <p>Kết hợp trắc nghiệm, đúng/sai và điền đáp án.</p>
              </div>
            </div>
          ) : !isComplete ? (
            renderStudyMode()
          ) : (
            <div className="study-summary">
              <h2>Kết quả</h2>
              <p>{message}</p>
              <div className="study-flashcard-actions">
                <button className="setmanager-nav-btn" onClick={handleBackToSelect}>
                  Quay lại danh sách
                </button>
                {(studyMode === 'quiz' || studyMode === 'test' || studyMode === 'match') && (
                  <button className="setmanager-nav-btn" onClick={handleRetry}>
                    Làm lại
                  </button>
                )}
                {studyMode === 'flashcard' && unmemorizedCards.length > 0 && (
                  <button className="setmanager-nav-btn" onClick={handleReviewUnmemorized}>
                    Học lại các thẻ chưa nhớ
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
        {message && !isComplete && !answerFeedback && <p className="study-message">{message}</p>}
      </div>
    </div>
  );
};

export default FlashcardStudy;