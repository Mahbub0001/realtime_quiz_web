import React from 'react';
import Card from './Card';

export default function QuestionCard({ question, className = '' }) {
  if (!question) return null;
  
  return (
    <Card className={`p-8 md:p-12 text-center flex flex-col items-center justify-center min-h-[300px] ${className}`}>
      <h2 className="text-3xl md:text-5xl font-black text-slate-800 leading-tight mb-4">
        {question.text}
      </h2>
      <div className="flex gap-4 mt-6">
        <span className="bg-primary-100 text-primary-800 px-4 py-2 rounded-full font-bold">
          {question.points} Points
        </span>
        <span className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full font-bold">
          {question.time_limit_seconds}s
        </span>
      </div>
    </Card>
  );
}
