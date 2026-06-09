import React from 'react';
import Card from './Card';

export default function LeaderboardTable({ leaderboard }) {
  if (!leaderboard || leaderboard.length === 0) {
    return <div className="text-center text-slate-500 py-8">Waiting for results...</div>;
  }

  return (
    <Card className="w-full max-w-4xl mx-auto" aria-live="polite">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 uppercase text-sm tracking-wider border-b border-slate-100">
              <th className="p-4 font-bold">Rank</th>
              <th className="p-4 font-bold">Name</th>
              <th className="p-4 font-bold text-center">Score</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, idx) => (
              <tr 
                key={entry.student_id} 
                className={`border-b border-slate-50 transition-colors animate-fade-in`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <td className="p-4 font-bold">
                  {entry.rank === 1 && <span className="text-amber-500 text-2xl mr-2">🥇</span>}
                  {entry.rank === 2 && <span className="text-slate-400 text-2xl mr-2">🥈</span>}
                  {entry.rank === 3 && <span className="text-amber-700 text-2xl mr-2">🥉</span>}
                  {entry.rank > 3 && <span className="text-slate-400 ml-2">{entry.rank}</span>}
                </td>
                <td className="p-4">
                  <div className="font-bold text-lg text-slate-800">{entry.student_name}</div>
                  <div className="text-sm text-slate-500">{entry.university_id}</div>
                </td>
                <td className="p-4 text-center font-black text-2xl text-primary-600">
                  {entry.total_score}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
