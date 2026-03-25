import React, { useState, useEffect } from 'react';

const TitleBar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const checkMaximized = async () => {
      if (window.electronAPI?.windowControls) {
        const maximized = await window.electronAPI.windowControls.isMaximized();
        setIsMaximized(maximized);
      }
    };
    checkMaximized();

    const handleMaximizeChange = (e: CustomEvent) => {
      setIsMaximized(e.detail);
    };
    window.addEventListener('window-maximized-change', handleMaximizeChange as EventListener);
    return () => {
      window.removeEventListener('window-maximized-change', handleMaximizeChange as EventListener);
    };
  }, []);

  const handleMinimize = () => {
    window.electronAPI?.windowControls?.minimize();
  };

  const handleMaximize = () => {
    window.electronAPI?.windowControls?.maximize();
    setIsMaximized(!isMaximized);
  };

  const handleClose = () => {
    window.electronAPI?.windowControls?.close();
  };

  return (
    <div
      className="h-9 bg-[#1a1d27] flex items-center justify-between select-none border-b border-[#2e3350]"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 px-3">
        <span className="text-[#4f8ef7] font-bold text-sm">📚</span>
        <span className="text-[#e4e7f0] text-xs font-semibold">Calendario Ibero</span>
      </div>

      <div
        className="flex h-full"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={handleMinimize}
          className="h-full px-4 hover:bg-[#2e3350] transition-colors text-[#6b7494] hover:text-[#e4e7f0]"
          title="Minimizar"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
        
        <button
          onClick={handleMaximize}
          className="h-full px-4 hover:bg-[#2e3350] transition-colors text-[#6b7494] hover:text-[#e4e7f0]"
          title={isMaximized ? "Restaurar" : "Maximizar"}
        >
          {isMaximized ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="2" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M4 4V3a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H9" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="2" y="2" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          )}
        </button>
        
        <button
          onClick={handleClose}
          className="h-full px-4 hover:bg-[#ef4444] transition-colors text-[#6b7494] hover:text-white"
          title="Cerrar"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
