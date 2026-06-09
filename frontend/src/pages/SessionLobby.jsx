import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import client from '../api/client';
import { createWebSocket } from '../api/websocket';
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import Button from '../components/Button';
import LeaderboardTable from '../components/LeaderboardTable';
import OptionGrid from '../components/OptionGrid';

export default function SessionLobby() {
  const { sessionCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Use a ref to hold the WS so cleanup always has the latest instance
  const wsRef = useRef(null);

  const [sessionInfo, setSessionInfo] = useState(null);
  const [participantsCount, setParticipantsCount] = useState(0);
  const [gameState, setGameState] = useState('waiting');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [hasNext, setHasNext] = useState(true);
  
  const timerRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('teacher_token');
    const socket = createWebSocket(`/ws/session/${sessionCode}/teacher?token=${token}`);
    wsRef.current = socket;

    socket.onopen = () => console.log('Teacher WS Connected');

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === 'participant_update') {
        setParticipantsCount(msg.participant_count);
      } else if (msg.type === 'teacher_question_started') {
        setGameState('active');
        setCurrentQuestion(msg.question);
        
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeLeft(msg.question.time_limit_seconds);
        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              sendCommand('show_results');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
      } else if (msg.type === 'leaderboard_update') {
        setLeaderboard(msg.leaderboard);
      } else if (msg.type === 'results_revealed') {
        setGameState('results');
        setLeaderboard(msg.leaderboard);
        setHasNext(msg.has_next);
        if (timerRef.current) clearInterval(timerRef.current);
        
        // Auto transition to next question or end session
        setTimeout(() => {
          if (msg.has_next) {
            sendCommand('next_question');
          } else {
            sendCommand('end_session');
          }
        }, 5000);
      } else if (msg.type === 'session_ended') {
        setGameState('ended');
        if (msg.leaderboard) setLeaderboard(msg.leaderboard);
      }
    };

    socket.onclose = () => console.log('Teacher WS Disconnected');

    // Fetch REST info for join link display
    const sessionId = location.state?.session_id;
    if (sessionId) {
      client.get(`/sessions/${sessionId}`)
        .then(res => setSessionInfo(res.data))
        .catch(err => console.error('Session fetch error', err));
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      socket.close();
    };
  }, [sessionCode]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendCommand = (type) => {
    const socket = wsRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type }));
    }
  };

  const handleStart = () => {
    if (sessionInfo) {
      client.post(`/sessions/${sessionInfo.id}/start`).catch(() => {});
    }
    sendCommand('next_question');
  };

  const handleRotate = async () => {
    if (!sessionInfo) return;
    try {
      const res = await client.post(`/sessions/${sessionInfo.id}/rotate-link`);
      setSessionInfo(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const copyLink = () => {
    if (sessionInfo?.join_url) {
      navigator.clipboard.writeText(sessionInfo.join_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden md:flex w-56 bg-[#0f172a] text-white p-6 flex-col shrink-0">
          <h2 className="text-lg font-bold mb-8 text-indigo-400">Controls</h2>
          <nav className="space-y-3 flex-1">
            <div className="px-4 py-3 bg-white/10 rounded-xl font-bold text-sm">Session Dashboard</div>
          </nav>
          <Button variant="danger" className="w-full" onClick={() => sendCommand('end_session')}>
            End Session
          </Button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-y-auto p-3 md:p-8">

          {/* Top Info Bar */}
          <div className="flex flex-col gap-4 md:gap-6 justify-between items-start bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 mb-4 md:mb-6 w-full">
            <div className="w-full md:w-auto">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Session Code</div>
              <div className="text-4xl md:text-5xl font-black text-slate-800 tracking-widest">{sessionCode}</div>
            </div>

            {sessionInfo && (
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full">
                <div className="bg-slate-100 px-3 py-2 md:px-4 md:py-3 rounded-xl font-mono text-xs md:text-sm text-slate-600 break-all w-full">
                  {sessionInfo.join_url}
                </div>
                <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                  <Button variant="ghost" onClick={copyLink} className="!py-2 flex-1 sm:flex-none">
                    {copied ? '✓ Copied!' : 'Copy'}
                  </Button>
                  <Button variant="secondary" onClick={handleRotate} className="!py-2 flex-1 sm:flex-none">
                    Rotate Link
                  </Button>
                </div>
              </div>
            )}

            <div className="text-center bg-indigo-50 px-4 py-3 md:px-8 md:py-4 rounded-2xl border border-indigo-100 shrink-0 w-full flex flex-row justify-between items-center gap-4">
              <div className="text-xs font-bold text-indigo-800 uppercase tracking-widest">Joined</div>
              <div className="text-3xl md:text-4xl font-black text-indigo-600">{participantsCount}</div>
            </div>
          </div>

          {/* Debug URLs Removed */}

          <div className="flex flex-col xl:flex-row gap-4 md:gap-6 flex-1">
            {/* Center Panel */}
            <Card className="flex-1 p-4 md:p-8 flex flex-col justify-center min-h-[300px] md:min-h-[400px]">

              {gameState === 'waiting' && (
                <div className="text-center">
                  <div className="text-5xl md:text-7xl mb-4 md:mb-6">👨‍🎓</div>
                  <h1 className="text-2xl md:text-4xl font-black text-slate-800 mb-2 md:mb-4">Waiting for students...</h1>
                  <p className="text-base md:text-lg text-slate-500 mb-6 md:mb-10">Share the join link or session code with your class.</p>
                  <Button onClick={handleStart} className="px-8 md:px-16 py-3 md:py-4 text-lg md:text-2xl mx-auto">
                    Start Quiz
                  </Button>
                </div>
              )}

              {gameState === 'active' && currentQuestion && (
                <div className="flex flex-col h-full animate-fade-in">
                  <div className="flex-1 text-center mb-8">
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Current Question</div>
                      <div className={`text-2xl font-black ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-slate-600'}`}>
                        ⏱️ {timeLeft}s
                      </div>
                    </div>
                    <h2 className="text-2xl md:text-3xl lg:text-5xl font-black text-slate-800 leading-tight mb-4 md:mb-8">
                      {currentQuestion.text}
                    </h2>

                    {currentQuestion.image_url && (
                      <div className="mb-6 md:mb-8">
                        <img
                          src={currentQuestion.image_url}
                          alt="Question image"
                          className="max-w-full max-h-64 md:max-h-96 mx-auto object-contain rounded-xl border border-slate-200"
                        />
                      </div>
                    )}

                    <div className="mt-4">
                      <OptionGrid 
                        options={{
                          A: currentQuestion.option_a,
                          B: currentQuestion.option_b,
                          C: currentQuestion.option_c,
                          D: currentQuestion.option_d
                        }}
                        disabled={true}
                        showText={true}
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 md:pt-6 flex justify-center">
                    <Button
                      onClick={() => sendCommand('show_results')}
                      className="px-6 md:px-12 py-2 md:py-3 text-base md:text-xl"
                    >
                      Close Responses & Show Results
                    </Button>
                  </div>
                </div>
              )}

              {gameState === 'results' && currentQuestion && (
                <div className="text-center flex flex-col h-full animate-fade-in">
                  <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-4 md:mb-6">Results</h2>
                  <div className="text-lg md:text-2xl mb-6 md:mb-10 px-2">
                    Correct Answer:{' '}
                    <span className="font-black text-indigo-600 bg-indigo-50 px-3 py-1 md:px-4 md:py-2 rounded-xl inline-block">
                      {currentQuestion.correct_option}: {currentQuestion[`option_${currentQuestion.correct_option.toLowerCase()}`]}
                    </span>
                  </div>
                  <div className="flex gap-4 justify-center mt-auto">
                    <div className="text-slate-500 text-lg animate-pulse">
                      {hasNext ? 'Loading next question...' : 'Finishing quiz...'}
                    </div>
                  </div>
                </div>
              )}

              {gameState === 'ended' && (
                <div className="text-center animate-fade-in">
                  <div className="text-6xl md:text-8xl mb-4 md:mb-6">🏁</div>
                  <h1 className="text-3xl md:text-5xl font-black text-slate-800 mb-6 md:mb-8">Quiz Complete!</h1>
                  <Button onClick={() => navigate('/teacher')} variant="secondary" className="px-8 md:px-12 py-3 md:py-4 text-lg md:text-xl">
                    Return to Dashboard
                  </Button>
                </div>
              )}
            </Card>

            {/* Right Panel: Leaderboard */}
            <aside className="w-full xl:w-[380px] shrink-0">
              <Card className="p-4 md:p-6 flex flex-col h-full max-h-[400px] md:max-h-[600px] xl:max-h-full bg-slate-50">
                <h3 className="text-base md:text-lg font-black text-slate-800 mb-3 md:mb-4 uppercase tracking-wider">Live Leaderboard</h3>
                <div className="flex-1 overflow-y-auto">
                  <LeaderboardTable leaderboard={leaderboard} />
                </div>
              </Card>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
