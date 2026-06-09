import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import logo from '../assets/logo1.jpg';

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('teacher_token');
    navigate('/login');
  };

  return (
    <nav className="bg-[#0f172a] text-white px-4 md:px-6 py-3 md:py-4 shadow-md flex justify-between items-center sticky top-0 z-50">
      <div className="text-lg md:text-2xl font-black tracking-tight text-white flex items-center gap-2 md:gap-3 cursor-pointer" onClick={() => navigate('/teacher')}>
        <img src={logo} alt="UFT Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
        <span className="hidden sm:inline">Real-time Quiz by Math Club</span>
        <span className="sm:hidden">Quiz</span>
      </div>
      <div className="flex gap-2 md:gap-4">
        <Button variant="ghost" className="text-slate-300 hover:text-white !px-3 md:!px-4 !py-2 text-sm md:text-base" onClick={handleLogout}>
          Sign Out
        </Button>
      </div>
    </nav>
  );
}
