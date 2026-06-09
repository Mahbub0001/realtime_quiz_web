import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import ImageUpload from '../components/ImageUpload';

export default function CreateQuiz() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([
    {
      text: '', shape: 'circle', color: 'blue', 
      option_a: '', option_b: '', option_c: '', option_d: '',
      correct_option: 'A', time_limit_seconds: 20, points: 5, order_index: 0, image_url: null
    }
  ]);
  const [error, setError] = useState('');

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: '', shape: 'square', color: 'red', 
        option_a: '', option_b: '', option_c: '', option_d: '',
        correct_option: 'A', time_limit_seconds: 20, points: 5, order_index: questions.length, image_url: null
      }
    ]);
  };

  const removeQuestion = (index) => {
    if (questions.length <= 1) {
      setError("Quiz must have at least one question.");
      return;
    }
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions.map((q, i) => ({ ...q, order_index: i })));
    setError('');
  };

  const handleSave = async () => {
    if (!title) {
      setError("Title is required.");
      return;
    }
    try {
      await client.post('/quizzes', { title, description, questions });
      navigate('/teacher');
    } catch (err) {
      setError("Failed to save quiz. Please ensure all fields are filled properly.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <Navbar />
      <main className="max-w-4xl mx-auto p-4 md:p-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-800">Create Quiz</h1>
          <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
            <Button variant="ghost" onClick={() => navigate('/teacher')} className="flex-1 sm:flex-none">Cancel</Button>
            <Button onClick={handleSave} className="flex-1 sm:flex-none">Save Quiz</Button>
          </div>
        </div>

        {error && <div className="mb-6 p-4 bg-danger-50 text-danger-600 rounded-xl font-bold border border-danger-200">{error}</div>}

        <Card className="p-4 md:p-8 mb-6 md:mb-8">
          <Input label="Quiz Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="E.g., Midterm Review" className="mb-4" />
          <Input label="Description (Optional)" value={description} onChange={e => setDescription(e.target.value)} placeholder="A short description..." />
        </Card>

        <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-4">Questions</h2>
        {questions.map((q, idx) => (
          <Card key={idx} className="p-4 md:p-8 mb-4 md:mb-6 border-l-8 border-l-primary-500">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-lg md:text-xl text-slate-800 uppercase tracking-wider">Question {idx + 1}</h3>
              <Button variant="danger" onClick={() => removeQuestion(idx)} className="!px-3 !py-1 text-sm">Remove</Button>
            </div>

            <Input label="Question Text" value={q.text} onChange={e => { const n = [...questions]; n[idx].text = e.target.value; setQuestions(n); }} className="mb-6" />
            
            <ImageUpload 
              value={q.image_url} 
              onChange={(url) => { const n = [...questions]; n[idx].image_url = url; setQuestions(n); }}
              label={`Question ${idx + 1} Image`}
              className="mb-6"
            />
            
            <div className="grid grid-cols-1 gap-4 mb-6">
              <Input label="Option A" value={q.option_a} onChange={e => { const n = [...questions]; n[idx].option_a = e.target.value; setQuestions(n); }} />
              <Input label="Option B" value={q.option_b} onChange={e => { const n = [...questions]; n[idx].option_b = e.target.value; setQuestions(n); }} />
              <Input label="Option C" value={q.option_c} onChange={e => { const n = [...questions]; n[idx].option_c = e.target.value; setQuestions(n); }} />
              <Input label="Option D" value={q.option_d} onChange={e => { const n = [...questions]; n[idx].option_d = e.target.value; setQuestions(n); }} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-700 text-sm">Correct Answer</label>
                <select className="px-4 py-3 rounded-xl border-2 border-slate-200 outline-none focus:border-primary-500"
                  value={q.correct_option}
                  onChange={e => { const n = [...questions]; n[idx].correct_option = e.target.value; setQuestions(n); }}
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-700 text-sm">Time Limit (s)</label>
                <input type="number" min="5" max="120" className="px-4 py-3 rounded-xl border-2 border-slate-200 outline-none focus:border-primary-500"
                  value={q.time_limit_seconds}
                  onChange={e => { const n = [...questions]; n[idx].time_limit_seconds = parseInt(e.target.value) || 20; setQuestions(n); }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-700 text-sm">Points</label>
                <input type="number" step="100" className="px-4 py-3 rounded-xl border-2 border-slate-200 outline-none focus:border-primary-500"
                  value={q.points}
                  onChange={e => { const n = [...questions]; n[idx].points = parseInt(e.target.value) || 5; setQuestions(n); }}
                />
              </div>
            </div>
          </Card>
        ))}

        <Button variant="secondary" onClick={addQuestion} className="w-full py-3 md:py-4 text-lg md:text-xl">
          + Add Question
        </Button>
      </main>
    </div>
  );
}
