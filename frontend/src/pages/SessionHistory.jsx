import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import { exportToPDF, exportToExcel } from '../utils/exportLeaderboard';

// Medal colors for top 3
const medalEmoji = { 1: '🥇', 2: '🥈', 3: '🥉' };
const rankBg = {
  1: 'bg-yellow-50 border-yellow-200',
  2: 'bg-slate-50 border-slate-200',
  3: 'bg-orange-50 border-orange-200',
};

function LeaderboardPreview({ leaderboard, sessionCode, quizTitle, expanded }) {
  const shown = expanded ? leaderboard : leaderboard.slice(0, 5);

  if (leaderboard.length === 0) {
    return <p className="text-sm text-slate-400 italic py-4 text-center">No responses recorded.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-slate-100">
            <th className="pb-2 pr-3 font-bold text-slate-500 w-12">Rank</th>
            <th className="pb-2 pr-3 font-bold text-slate-500">Name</th>
            <th className="pb-2 pr-3 font-bold text-slate-500">Univ. ID</th>
            <th className="pb-2 pr-3 font-bold text-slate-500 text-right">Score</th>
            <th className="pb-2 font-bold text-slate-500 text-right">✓</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((entry) => (
            <tr
              key={entry.student_id}
              className={`border-b last:border-0 transition-colors ${rankBg[entry.rank] || ''}`}
            >
              <td className="py-2 pr-3 font-black text-base">
                {medalEmoji[entry.rank] || `#${entry.rank}`}
              </td>
              <td className="py-2 pr-3 font-semibold text-slate-800">{entry.student_name}</td>
              <td className="py-2 pr-3 font-mono text-xs text-slate-500">{entry.university_id}</td>
              <td className="py-2 pr-3 text-right font-black text-indigo-600">{entry.total_score}</td>
              <td className="py-2 text-right text-emerald-600 font-semibold">{entry.correct_answers}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SessionHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    client.get('/sessions/history')
      .then(res => setHistory(res.data))
      .catch(err => {
        if (err.response?.status === 401) navigate('/login');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const filtered = history.filter(s =>
    s.quiz_title.toLowerCase().includes(search.toLowerCase()) ||
    s.session_code.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (dt) => dt
    ? new Date(dt).toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' })
    : '—';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
      <Navbar />

      <main className="max-w-5xl mx-auto p-4 md:p-8 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-800">📋 Session History</h1>
            <p className="text-slate-500 mt-1">All your past quiz sessions and their rankings.</p>
          </div>
          <button
            onClick={() => navigate('/teacher')}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Search by quiz title or session code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
          />
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center text-slate-500">
            <div className="text-6xl mb-4">🗂️</div>
            <h2 className="text-2xl font-bold mb-2">
              {search ? 'No results found' : 'No history yet'}
            </h2>
            <p>{search ? 'Try a different search term.' : 'Complete a quiz session to see history here.'}</p>
          </Card>
        ) : (
          <div className="space-y-5">
            {filtered.map((session) => {
              const isExpanded = expandedId === session.session_id;

              return (
                <div
                  key={session.session_id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Session Header */}
                  <div className="p-5 border-b border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h2 className="text-lg font-black text-slate-800 truncate">
                            {session.quiz_title}
                          </h2>
                          <span className="bg-slate-100 text-slate-600 text-xs font-mono font-bold px-2 py-0.5 rounded-lg">
                            {session.session_code}
                          </span>
                          <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full capitalize">
                            {session.status}
                          </span>
                        </div>

                        {/* Meta */}
                        <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
                          <span>👥 {session.participant_count} participants</span>
                          <span>🏆 {session.leaderboard.length} scored</span>
                          <span>🕒 Started: {fmt(session.started_at)}</span>
                          <span>🏁 Ended: {fmt(session.ended_at)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                        <button
                          onClick={() => exportToPDF(session.leaderboard, session.quiz_title, session.session_code)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-red-500 hover:bg-red-600 active:scale-95 transition-all shadow-sm"
                        >
                          📄 PDF
                        </button>
                        <button
                          onClick={() => exportToExcel(session.leaderboard, session.quiz_title, session.session_code)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all shadow-sm"
                        >
                          📊 Excel
                        </button>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : session.session_id)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-slate-600 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 active:scale-95 transition-all"
                        >
                          {isExpanded ? '▲ Collapse' : '▼ View Rankings'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Leaderboard (collapsible) */}
                  {isExpanded && (
                    <div className="p-5 animate-fade-in">
                      {/* Top 3 podium highlight */}
                      {session.leaderboard.length >= 1 && (
                        <div className="flex flex-wrap gap-3 mb-5">
                          {session.leaderboard.slice(0, 3).map(entry => (
                            <div
                              key={entry.student_id}
                              className={`flex-1 min-w-[140px] rounded-xl border p-3 text-center ${rankBg[entry.rank] || 'bg-white border-slate-200'}`}
                            >
                              <div className="text-2xl">{medalEmoji[entry.rank]}</div>
                              <div className="font-black text-slate-800 text-sm mt-1 truncate">{entry.student_name}</div>
                              <div className="text-xs text-slate-500 font-mono">{entry.university_id}</div>
                              <div className="text-indigo-600 font-black text-lg mt-1">{entry.total_score} pts</div>
                            </div>
                          ))}
                        </div>
                      )}

                      <LeaderboardPreview
                        leaderboard={session.leaderboard}
                        sessionCode={session.session_code}
                        quizTitle={session.quiz_title}
                        expanded={true}
                      />
                    </div>
                  )}

                  {/* Collapsed preview (top 5) */}
                  {!isExpanded && session.leaderboard.length > 0 && (
                    <div className="px-5 pb-4 pt-3 bg-slate-50/60">
                      <LeaderboardPreview
                        leaderboard={session.leaderboard}
                        sessionCode={session.session_code}
                        quizTitle={session.quiz_title}
                        expanded={false}
                      />
                      {session.leaderboard.length > 5 && (
                        <button
                          onClick={() => setExpandedId(session.session_id)}
                          className="mt-2 text-xs text-indigo-500 hover:text-indigo-700 font-semibold"
                        >
                          + {session.leaderboard.length - 5} more students → View all
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
