import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import logo from '../assets/logo1.jpg';

export default function StudentJoin() {
  const { joinToken } = useParams();
  const navigate = useNavigate();
  const [sessionInfo, setSessionInfo] = useState(null);
  const [pageError, setPageError] = useState(''); // fatal link errors
  const [formError, setFormError] = useState(''); // inline form errors
  const [name, setName] = useState('');
  const [universityId, setUniversityId] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await client.get(`/sessions/join/${joinToken}`);
        setSessionInfo(response.data);
      } catch (err) {
        const detail = err.response?.data?.detail || 'Invalid or expired join link.';
        setPageError(detail);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchSession();
  }, [joinToken]);

  const handleJoin = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Your name is required.');
      return;
    }
    if (!universityId.trim()) {
      setFormError('University ID is required.');
      return;
    }

    setLoading(true);
    try {
      const response = await client.post(`/sessions/join/${joinToken}`, {
        name: name.trim(),
        university_id: universityId.trim(),
      });
      const { session_code, student_id } = response.data;
      navigate(`/play/${session_code}/${student_id}`);
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to join. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );

  if (pageError) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center animate-slide-up">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">Link Invalid</h1>
        <p className="text-red-600 font-bold">{pageError}</p>
        <p className="text-slate-500 mt-4 text-sm">Ask your teacher for the correct join link.</p>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-6">
        <img src={logo} alt="University Logo" className="w-28 h-28 object-contain drop-shadow-lg" />
        <Card className="w-full max-w-md p-8 animate-slide-up">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🎮</div>
            <h1 className="text-3xl font-black text-slate-800 mb-2">{sessionInfo.quiz_title}</h1>
            <span className="inline-block bg-indigo-100 text-indigo-800 px-4 py-1 rounded-full text-sm font-bold">
              {sessionInfo.participant_count} {sessionInfo.participant_count === 1 ? 'student' : 'students'} joined
            </span>
          </div>

        <form onSubmit={handleJoin} className="space-y-5" noValidate>
          <Input
            label="Your Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex-Fazle Shahrin Prime"
          />
          <Input
            label="University ID"
            value={universityId}
            onChange={(e) => setUniversityId(e.target.value)}
            placeholder="Ex- 2202047"
          />

          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 font-bold rounded-xl px-4 py-3 text-sm animate-fade-in">
              {formError}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full py-4 text-xl">
            {loading ? 'Joining...' : 'Join Game 🚀'}
          </Button>
        </form>
      </Card>
      </div>
    </div>
  );
}
