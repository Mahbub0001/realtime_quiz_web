import React from 'react';

// Reusable SVG shapes mapped to option letters
const Shapes = {
  A: (props) => <polygon points="50,10 90,90 10,90" fill="currentColor" {...props} />, // Triangle
  B: (props) => <polygon points="50,10 90,50 50,90 10,50" fill="currentColor" {...props} />, // Diamond
  C: (props) => <circle cx="50" cy="50" r="40" fill="currentColor" {...props} />, // Circle
  D: (props) => <rect x="15" y="15" width="70" height="70" fill="currentColor" {...props} />, // Square
};

export default function OptionGrid({ options, selectedOption, correctOption, onSelect, disabled, showText = true }) {
  // We expect options to be an object: { A: "...", B: "...", C: "...", D: "..." }
  const optionKeys = ['A', 'B', 'C', 'D'];
  
  // Mapping standard colors (you can adjust as needed based on the question shape/color if provided)
  const colorMap = {
    A: 'bg-danger-500 hover:bg-danger-400',
    B: 'bg-primary-500 hover:bg-primary-400',
    C: 'bg-amber-500 hover:bg-amber-400',
    D: 'bg-secondary-500 hover:bg-secondary-400',
  };

  const activeColorMap = {
    A: 'bg-danger-600 ring-4 ring-danger-300',
    B: 'bg-primary-600 ring-4 ring-primary-300',
    C: 'bg-amber-600 ring-4 ring-amber-300',
    D: 'bg-secondary-600 ring-4 ring-secondary-300',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {optionKeys.map((key) => {
        const text = options ? options[key] : null;
        const ShapeObj = Shapes[key];
        
        let bgClass = colorMap[key];
        let opacityClass = '';
        
        if (selectedOption === key) {
          bgClass = activeColorMap[key];
        } else if (selectedOption && !correctOption) {
          // A selection is made, dim others
          opacityClass = 'opacity-50 grayscale hover:grayscale-0';
        }
        
        if (correctOption) {
          // Reveal phase
          if (correctOption === key) {
             bgClass = activeColorMap[key];
             opacityClass = 'scale-105 shadow-2xl z-10 animate-pulse-fast';
          } else {
             opacityClass = 'opacity-25 grayscale';
          }
        }

        return (
          <button
            key={key}
            disabled={disabled}
            onClick={() => onSelect && onSelect(key)}
            aria-label={`Option ${key}: ${text || 'Shape'}`}
            className={`
              relative flex items-center justify-start p-6 rounded-2xl text-white shadow-lg
              transition-all duration-300 ease-in-out transform hover:-translate-y-1 active:translate-y-1
              min-h-[120px] overflow-hidden
              ${bgClass} ${opacityClass} ${disabled ? 'cursor-not-allowed hover:transform-none' : 'cursor-pointer'}
            `}
          >
            <div className="w-16 h-16 mr-6 flex-shrink-0 drop-shadow-md">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <ShapeObj />
              </svg>
            </div>
            {showText && text && (
              <div className="flex-1 text-left pr-2">
                <span className="text-xl md:text-2xl font-bold drop-shadow-sm leading-snug">
                  {text}
                </span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
