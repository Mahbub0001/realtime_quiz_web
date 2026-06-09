import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await client.get('/quizzes');
        setQuizzes(response.data);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, [navigate]);

  const handleHost = async (quizId) => {
    try {
      const response = await client.post('/sessions', { quiz_id: quizId });
      navigate(`/teacher/session/${response.data.session_code}`, { state: { session_id: response.data.id } });
    } catch (err) {
      alert("Failed to create session.");
    }
  };

  const handleDelete = async (quizId) => {
    if (!window.confirm("Are you sure you want to delete this quiz?")) return;
    
    try {
      await client.delete(`/quizzes/${quizId}`);
      setQuizzes(quizzes.filter(q => q.id !== quizId));
    } catch (err) {
      alert("Failed to delete quiz.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="max-w-6xl mx-auto p-4 md:p-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-800">My Quizzes</h1>
          <Button onClick={() => navigate('/teacher/quizzes/new')} className="w-full sm:w-auto">+ Create New Quiz</Button>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : quizzes.length === 0 ? (
          <Card className="p-12 text-center text-slate-500">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold mb-2">No quizzes yet</h2>
            <p>Create your first quiz to get started.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <div 
                key={quiz.id} 
                className="group relative bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-200 hover:border-indigo-300 cursor-pointer"
                onClick={() => navigate(`/teacher/quizzes/${quiz.id}/edit`)}
              >
                {/* Gradient Header */}
                <div className="h-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
                  <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-white/15 rounded-full blur-xl"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-5xl drop-shadow-lg">📝</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                    {quiz.title}
                  </h3>
                  <p className="text-slate-500 text-sm mb-4 line-clamp-2 h-10">
                    {quiz.description || 'No description'}
                  </p>

                  {/* Stats Row */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full">
                      <span className="text-indigo-600">❓</span>
                      <span className="text-sm font-semibold text-indigo-700">{quiz.questions.length} Questions</span>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full">
                      <span className="text-emerald-600">⚡</span>
                      <span className="text-sm font-semibold text-emerald-700">Active</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t border-slate-100">
                    <Button 
                      variant="ghost" 
                      className="!px-3 !py-2 !text-xs flex-1 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                      onClick={(e) => { e.stopPropagation(); navigate(`/teacher/quizzes/${quiz.id}/edit`); }}
                    >
                      ✏️ Edit
                    </Button>
                    <Button 
                      variant="danger" 
                      className="!px-3 !py-2 !text-xs flex-1 hover:bg-red-50 transition-colors"
                      onClick={(e) => { e.stopPropagation(); handleDelete(quiz.id); }}
                    >
                      🗑️ Delete
                    </Button>
                    <Button 
                      className="!px-3 !py-2 !text-xs flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-md hover:shadow-lg transition-all"
                      onClick={(e) => { e.stopPropagation(); handleHost(quiz.id); }}
                    >
                      🚀 Host
                    </Button>
                  </div>
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
