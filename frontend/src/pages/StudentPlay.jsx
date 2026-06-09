import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { createWebSocket } from '../api/websocket';
import OptionGrid from '../components/OptionGrid';
import LeaderboardTable from '../components/LeaderboardTable';

export default function StudentPlay() {
  const { sessionCode, studentId } = useParams();
  const wsRef = useRef(null);

  const [gameState, setGameState] = useState('waiting');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [options, setOptions] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [correctOption, setCorrectOption] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const socket = createWebSocket(`/ws/session/${sessionCode}/student/${studentId}`);
    wsRef.current = socket;

    socket.onopen = () => console.log('Student WS Connected');

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      switch (msg.type) {
        case 'question_started':
          // If options are immediately available, skip 'question' state and go straight to 'options'
          if (msg.question.options_visible && msg.question.options) {
            setGameState('options');
            setOptions(msg.question.options);
          } else {
            setGameState('question');
            setOptions(null);
          }
          setCurrentQuestion(msg.question);
          setSelectedOption(null);
          setCorrectOption(null);
          setHasAnswered(false);

          // Start visual countdown timer (server is source of truth for scoring)
          if (timerRef.current) clearInterval(timerRef.current);
          setTimeLeft(msg.question.time_limit_seconds);
          timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
              if (prev <= 1) {
                clearInterval(timerRef.current);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
          break;

        case 'options_revealed':
          setGameState('options');
          // options come as a flat dict: { A: "...", B: "...", ... }
          setOptions(msg.options);
          break;

        case 'answer_received':
          // Server confirmed our answer — lock out further submissions
          setHasAnswered(true);
          break;

        case 'results_revealed':
          setGameState('results');
          setCorrectOption(msg.correct_option);
          setLeaderboard(msg.leaderboard || []);
          if (timerRef.current) clearInterval(timerRef.current);
          break;

        case 'leaderboard_update':
          setLeaderboard(msg.leaderboard || []);
          break;

        case 'session_ended':
          setGameState('ended');
          setLeaderboard(msg.leaderboard || []);
          if (timerRef.current) clearInterval(timerRef.current);
          break;

        default:
          break;
      }
    };

    socket.onclose = () => console.log('Student WS Disconnected');

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      socket.close();
    };
  }, [sessionCode, studentId]);

  const handleSelectOption = (key) => {
    // Strict client-side guards — server also validates both conditions
    if (gameState !== 'options' || hasAnswered) return;

    // Optimistically show selection immediately for responsiveness
    setSelectedOption(key);

    const socket = wsRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'submit_answer',
        question_id: currentQuestion.question_id,
        selected_option: key,
      }));
    }
  };

  const isCorrect = correctOption && selectedOption === correctOption;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4 md:p-8" aria-live="polite">

      {/* Waiting */}
      {gameState === 'waiting' && (
        <div className="flex-grow flex flex-col items-center justify-center text-center">
          <div className="text-6xl mb-6 animate-pulse">⏳</div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-300">
            Waiting for teacher to start the next question...
          </h1>
        </div>
      )}

      {/* Question shown, options hidden */}
      {(gameState === 'question' || gameState === 'options' || gameState === 'results') && currentQuestion && (
        <div className="flex-grow flex flex-col max-w-lg mx-auto w-full gap-6 animate-fade-in">

          {/* Question header */}
          <div className="text-center bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 leading-tight">
              {currentQuestion.text}
            </h2>
            
            {currentQuestion.image_url && (
              <div className="mt-4 mb-4">
                <img
                  src={currentQuestion.image_url}
                  alt="Question image"
                  className="max-w-full max-h-48 md:max-h-64 mx-auto object-contain rounded-xl border border-slate-200"
                />
              </div>
            )}
            
            {/* Countdown */}
            <div
              className={`mt-4 inline-flex items-center justify-center w-16 h-16 rounded-full border-4 font-black text-2xl transition-colors ${
                timeLeft <= 5 ? 'border-red-500 text-red-600 animate-pulse' : 'border-indigo-500 text-indigo-600'
              }`}
              aria-label={`${timeLeft} seconds remaining`}
            >
              {timeLeft}
            </div>
          </div>

          {/* Hidden options phase */}
          {gameState === 'question' && (
            <div className="flex-grow flex items-center justify-center">
              <div className="bg-amber-100 text-amber-800 p-6 rounded-2xl font-bold text-xl text-center animate-pulse">
                Loading options...
              </div>
            </div>
          )}

          {/* Options revealed — show buttons */}
          {gameState === 'options' && !hasAnswered && options && (
            <div className="flex-grow animate-slide-up">
              <OptionGrid
                options={options}
                selectedOption={selectedOption}
                correctOption={null} // never show correct before results
                onSelect={handleSelectOption}
                disabled={false}
                showText={true}
              />
            </div>
          )}

          {/* Answered — waiting for results */}
          {gameState === 'options' && hasAnswered && (
            <div className="flex-grow flex flex-col items-center justify-center text-center animate-slide-up">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-3xl font-black text-indigo-600 mb-2">Answer submitted!</h2>
              <p className="text-slate-500 font-bold text-lg">Waiting for the timer to finish...</p>
            </div>
          )}

          {/* Results revealed */}
          {gameState === 'results' && (
            <div className="flex-grow flex flex-col items-center w-full animate-fade-in">
              <div
                className={`w-full p-8 rounded-3xl text-center text-white mb-8 shadow-xl ${
                  isCorrect ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              >
                <div className="text-6xl mb-4">{isCorrect ? '🎉' : '❌'}</div>
                <h2 className="text-4xl font-black mb-2">{isCorrect ? 'Correct!' : 'Incorrect'}</h2>
                <p className="text-xl font-bold opacity-90">
                  The correct answer was <strong>{correctOption}</strong>.
                </p>
              </div>

              <div className="w-full">
                <h3 className="text-xl font-black text-slate-800 mb-4 text-center">Current Standings</h3>
                <LeaderboardTable leaderboard={leaderboard} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Session ended */}
      {gameState === 'ended' && (
        <div className="flex-grow flex flex-col items-center justify-center w-full animate-fade-in">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-800 mb-8 text-center">Final Results</h1>
          <LeaderboardTable leaderboard={leaderboard} />
        </div>
      )}
    </div>
  );
}
