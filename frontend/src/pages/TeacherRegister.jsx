import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import client from '../api/client';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import logo from '../assets/logo1.jpg';

export default function TeacherRegister() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await client.post('/auth/register', { name, email, password });
      // Auto-login after successful registration
      const loginRes = await client.post('/auth/login', { email, password });
      localStorage.setItem('teacher_token', loginRes.data.access_token);
      navigate('/teacher');
    } catch (err) {
      if (err.response) {
        const detail = err?.response?.data?.detail;
        if (detail === 'Email already registered') {
          setError('This email is already registered. Please log in instead.');
        } else {
          setError(detail || 'Registration failed. Please try again.');
        }
      } else if (err.request) {
        const targetUrl = err.config ? `${err.config.baseURL || ''}${err.config.url || ''}` : 'unknown URL';
        setError(`Cannot reach the server at: ${targetUrl}. Please check your Vercel environment variables and redeploy.`);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-6 w-full max-w-md">
        <img src={logo} alt="University Logo" className="w-24 h-24 object-contain drop-shadow-lg" />
        <Card className="w-full p-8">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🧑‍🏫</div>
            <h1 className="text-3xl font-black text-slate-800">Create Account</h1>
            <p className="text-slate-500 mt-2">Register as a teacher to get started.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <Input
              label="Full Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
            />
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@university.edu"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              required
            />
            <Input
              label="Confirm Password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your password"
              required
            />

            {error && (
              <div className="text-red-600 text-sm text-center font-semibold bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>

            <p className="text-center text-sm text-slate-500 mt-4">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}
