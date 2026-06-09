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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await client.post('/auth/login', { email, password });
      localStorage.setItem('teacher_token', response.data.access_token);
      navigate('/teacher');
    } catch (err) {
      if (err.response) {
        // Server responded with an error status
        const detail = err.response.data?.detail;
        if (err.response.status === 401) {
          setError('Invalid email or password.');
        } else {
          setError(detail || `Server error (${err.response.status})`);
        }
      } else if (err.request) {
        // Request was made but no response received (network/CORS issue)
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
          
          {error && <div className="text-danger-600 text-sm text-center font-bold">{error}</div>}
          
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>

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
        </Card>
      </div>
    </div>
  );
}
