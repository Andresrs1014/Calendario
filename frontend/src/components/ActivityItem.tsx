import React from 'react';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';

interface ActivityProps {
  name: string;
  type: string;
  deadline: string;
  status: 'completed' | 'pending' | 'urgent' | 'past';
  color: string;
}

const ActivityItem: React.FC<ActivityProps> = ({ name, type, deadline, status, color }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed': return <CheckCircle2 size={18} className="text-emerald-500" />;
      case 'urgent': return <AlertCircle size={18} className="text-rose-500 animate-pulse" />;
      default: return <Circle size={18} className="text-[#6b7494]" />;
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-[#1a1d27] border border-[#2e3350] rounded-xl hover:border-[#4f8ef7]/30 transition-colors group">
      <div className="flex-shrink-0">{getStatusIcon()}</div>
      <div className="flex-1 min-width-0">
        <h4 className={`text-sm font-semibold truncate ${status === 'completed' ? 'line-through opacity-50' : ''}`}>
          {name}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-[#6b7494] bg-[#22263a] px-2 py-0.5 rounded uppercase font-bold">
            {type}
          </span>
          <span className="text-[10px] text-[#6b7494]">{deadline}</span>
        </div>
      </div>
      <div className="text-right">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></div>
      </div>
    </div>
  );
};

export default ActivityItem;
