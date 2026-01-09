import React from 'react';

const CustomTitleBar: React.FC = () => {
  const handleMinimize = () => {
    (window as any).electronAPI?.windowMinimize?.();
  };

  const handleMaximize = () => {
    (window as any).electronAPI?.windowMaximize?.();
  };

  const handleClose = () => {
    (window as any).electronAPI?.windowClose?.();
  };

  return (
    <div 
      className="h-8 bg-[#1a1d29] border-b border-gray-800 flex items-center justify-between px-4 select-none"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      {/* Left: App Title */}
      <div className="flex items-center gap-2">
        <img src="./icon.png" alt="JS Instagram" className="w-5 h-5" />
        <span className="text-sm font-semibold text-gray-300">JS Instagram</span>
      </div>

      {/* Right: Window Controls */}
      <div 
        className="flex items-center gap-1"
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        {/* Minimize */}
        <button
          onClick={handleMinimize}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-700/50 rounded transition-colors"
          title="Minimize"
        >
          <span className="text-gray-300 text-xl leading-none">−</span>
        </button>

        {/* Maximize */}
        <button
          onClick={handleMaximize}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-700/50 rounded transition-colors"
          title="Maximize"
        >
          <span className="text-gray-300 text-base leading-none">□</span>
        </button>

        {/* Close */}
        <button
          onClick={handleClose}
          className="w-8 h-8 flex items-center justify-center hover:bg-red-600 rounded transition-colors group"
          title="Close"
        >
          <span className="text-gray-300 group-hover:text-white text-xl leading-none">×</span>
        </button>
      </div>
    </div>
  );
};

export default CustomTitleBar;