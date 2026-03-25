import React, { useState, useEffect } from 'react';
import { Timer, Play, Pause, RefreshCw, Coffee, Brain } from 'lucide-react';
import { api, SubjectOut } from '../api';

const FOCUS_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;

export const PomodoroTimer: React.FC<{ subjects: SubjectOut[] }> = ({ subjects }) => {
  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | ''>('');

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleComplete = async () => {
    setIsActive(false);
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(() => {});

    if ((window as any).electronAPI?.sendNotification) {
      (window as any).electronAPI.sendNotification(
        mode === 'focus' ? '¡Tiempo de Enfoque Terminado!' : '¡Descanso Terminado!',
        mode === 'focus' ? 'Buen trabajo. Tómate un respiro.' : '¿Listo para volver a estudiar?'
      );
    }

    if (mode === 'focus' && selectedSubjectId !== '') {
      await api.createStudyLog({
        subject_id: Number(selectedSubjectId),
        duration_minutes: 25,
        notes: "Sesión Pomodoro completada"
      });
    }

    // Toggle mode
    if (mode === 'focus') {
      setMode('break');
      setTimeLeft(BREAK_TIME);
    } else {
      setMode('focus');
      setTimeLeft(FOCUS_TIME);
    }
  };

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'focus' ? FOCUS_TIME : BREAK_TIME);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {mode === 'focus' ? <Brain className="w-5 h-5 text-indigo-400" /> : <Coffee className="w-5 h-5 text-emerald-400" />}
          <h3 className="font-semibold text-slate-100 uppercase tracking-wider text-sm">
            {mode === 'focus' ? 'Modo Enfoque' : 'Descanso Corto'}
          </h3>
        </div>
        <div className="text-xs text-slate-400 font-mono bg-slate-900/50 px-2 py-1 rounded">
          {mode === 'focus' ? '25:00' : '05:00'}
        </div>
      </div>

      <div className="text-center mb-6">
        <div className="text-6xl font-bold font-mono text-white mb-2 tabular-nums">
          {formatTime(timeLeft)}
        </div>
        <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${mode === 'focus' ? 'bg-indigo-500' : 'bg-emerald-500'}`}
            style={{ width: `${(1 - timeLeft / (mode === 'focus' ? FOCUS_TIME : BREAK_TIME)) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {mode === 'focus' && (
          <select 
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value ? Number(e.target.value) : '')}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="">Seleccionar materia...</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}

        <div className="flex gap-2">
          <button 
            onClick={toggleTimer}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all ${
              isActive 
                ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' 
                : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-900/20'
            }`}
          >
            {isActive ? <Pause size={18} /> : <Play size={18} />}
            {isActive ? 'Pausar' : 'Iniciar'}
          </button>
          
          <button 
            onClick={resetTimer}
            className="p-2.5 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
            title="Reiniciar"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
