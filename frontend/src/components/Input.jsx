import React from 'react';

export default function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
  className = ''
}) {
  const id = `input-${label.replace(/\s+/g, '-').toLowerCase()}`;
  
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="font-semibold text-slate-700 text-sm">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`px-4 py-3 rounded-xl border-2 transition-colors duration-200 outline-none focus:ring-0 ${
          error 
            ? 'border-danger-500 focus:border-danger-600 bg-danger-50 text-danger-900' 
            : 'border-slate-200 focus:border-primary-500 bg-slate-50 focus:bg-white'
        }`}
      />
      {error && <span className="text-danger-600 text-sm animate-fade-in">{error}</span>}
    </div>
  );
}
