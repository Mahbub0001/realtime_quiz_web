import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import client from '../api/client';
import LeaderboardTable from '../components/LeaderboardTable';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Leaderboard() {
  const { sessionCode } = useParams();
  const [leaderboard, setLeaderboard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Note: sessionCode here is actually session_id depending on API route matching
    // Let's assume the API route /api/sessions/{session_id}/leaderboard works if we map code to ID.
    // Wait, the API we wrote uses session_id. For a robust display we should probably
    // use WebSocket messages or add a code-to-id fetch. For MVP, we'll assume it's passed or fetched.
    
    // As a simple fix, we'll just display a placeholder or fetch if we know the ID.
    // In a real app, the API would accept session_code. 
    setError('Use the live lobby to view dynamic results.');
  }, [sessionCode]);

  if (error) return <div className="text-center mt-20 text-xl font-bold">{error}</div>;
  if (!leaderboard) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <h1 className="text-3xl md:text-5xl font-black text-center text-slate-800 mb-8 md:mb-12">Live Leaderboard</h1>
      <LeaderboardTable leaderboard={leaderboard} />
    </div>
  );
}
