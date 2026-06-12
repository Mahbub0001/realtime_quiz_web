import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import client from '../api/client';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import logo from '../assets/logo1.jpg';

export default function TeacherLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Optimistic UI: show success state before navigation
  const [success, setSuccess] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await client.post('/auth/login', { email, password });
      localStorage.setItem('teacher_token', response.data.access_token);

      // Optimistic UI: show success immediately, then navigate
      setSuccess(true);
      setTimeout(() => navigate('/teacher'), 600);

    } catch (err) {
      setSuccess(false);
      if (err.response) {
        const detail = err.response.data?.detail;
        if (err.response.status === 401) {
          setError('Invalid email or password.');
        } else {
          setError(detail || `Server error (${err.response.status})`);
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
      <div className="flex flex-col items-center gap-6">
        <img src={logo} alt="University Logo" className="w-28 h-28 object-contain drop-shadow-lg" />

        <Card className="w-full max-w-md p-8 animate-slide-up">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">👨‍🏫</div>
            <h1 className="text-3xl font-black text-slate-800">Teacher Login</h1>
            <p className="text-slate-500 mt-2">Manage your interactive classrooms.</p>
          </div>

          {/* Success overlay */}
          {success && (
            <div className="flex flex-col items-center justify-center py-8 gap-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center animate-bounce-in">
                <svg className="w-9 h-9 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-600 font-bold text-lg">Signed in successfully!</p>
              <p className="text-slate-400 text-sm">Redirecting to dashboard...</p>
            </div>
          )}

          {/* Login form — hidden after success */}
          {!success && (
            <form onSubmit={handleLogin} className="space-y-6">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@example.com"
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm font-semibold px-4 py-3 rounded-xl animate-shake">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Animated submit button */}
              <button
                type="submit"
                disabled={loading}
                className={`
                  w-full py-3 px-6 rounded-xl font-bold text-white text-base
                  transition-all duration-200 relative overflow-hidden
                  ${loading
                    ? 'bg-indigo-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] shadow-md hover:shadow-indigo-200 hover:shadow-lg'
                  }
                `}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    {/* Animated spinner */}
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Sign In
                  </span>
                )}
              </button>

              <p className="text-center text-sm text-slate-500 mt-2">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="text-indigo-600 font-semibold hover:underline">
                  Register here
                </Link>
              </p>

              <div className="mt-6 text-center text-sm text-slate-500 bg-slate-100 p-4 rounded-xl border border-slate-200">
                <p className="font-bold mb-1">Demo Credentials:</p>
                <p>Email: <span className="text-slate-800 font-mono">teacher@example.com</span></p>
                <p>Password: <span className="text-slate-800 font-mono">password123</span></p>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
