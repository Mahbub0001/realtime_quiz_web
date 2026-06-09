import React from 'react';

export default function ParticipantList({ participants = [] }) {
  if (participants.length === 0) {
    return <div className="text-slate-500 text-center py-8">Waiting for students to join...</div>;
  }

  return (
    <div className="flex flex-wrap gap-3 justify-center items-center">
      {participants.map((p) => (
        <div 
          key={p.id} 
          className="bg-white border-2 border-slate-200 px-4 py-2 rounded-full font-bold text-slate-700 shadow-sm animate-slide-up"
        >
          {p.name}
        </div>
      ))}
    </div>
  );
}
