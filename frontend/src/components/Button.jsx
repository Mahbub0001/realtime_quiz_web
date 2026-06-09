import React from 'react';

export default function Button({ 
  children, 
  variant = 'primary', 
  disabled = false, 
  onClick, 
  type = 'button',
  className = ''
}) {
  const baseClasses = "px-6 py-3 rounded-full font-bold text-lg transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-opacity-50 active:scale-95 flex justify-center items-center gap-2";
  
  const variants = {
    primary:   "bg-indigo-600 hover:bg-indigo-500 text-white focus:ring-indigo-400",
    secondary: "bg-emerald-600 hover:bg-emerald-500 text-white focus:ring-emerald-400",
    danger:    "bg-rose-600 hover:bg-rose-500 text-white focus:ring-rose-400",
    ghost:     "bg-transparent text-indigo-600 hover:bg-indigo-50 shadow-none hover:shadow-none focus:ring-indigo-200",
  };

  const disabledClasses = "opacity-50 cursor-not-allowed active:scale-100 hover:shadow-md";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${disabled ? disabledClasses : ''} ${className}`}
    >
      {children}
    </button>
  );
}
