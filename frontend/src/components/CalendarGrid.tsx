import React from 'react';

interface Event {
  day: number;
  hour: number;
  minute: number;
  title: string;
  color: string;
}

const CalendarGrid: React.FC<{ events: Event[] }> = ({ events }) => {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const hours = [18, 19, 20, 21, 22];

  return (
    <div className="grid grid-cols-[50px_repeat(7,1fr)] gap-px bg-[#2e3350] border border-[#2e3350] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-[#1a1d27]"></div>
      {days.map((day) => (
        <div key={day} className="bg-[#1a1d27] p-2 text-center text-[10px] uppercase tracking-wider text-[#6b7494] font-bold">
          {day}
        </div>
      ))}

      {/* Rows */}
      {hours.map((h) => (
        <React.Fragment key={h}>
          <div className="bg-[#1a1d27] p-2 text-right text-[10px] text-[#6b7494] flex items-center justify-end h-12">
            {h}:00
          </div>
          {[0, 1, 2, 3, 4, 5, 6].map((d) => {
            const cellEvents = events.filter((e) => e.day === d && e.hour === h);
            return (
              <div key={d} className="bg-[#0f1117] h-12 relative group border-t border-l border-[#2e3350]/30">
                {cellEvents.map((ev, idx) => (
                  <div
                    key={idx}
                    className="absolute inset-1 rounded-md p-1.5 text-[9px] font-bold border-l-2 flex flex-col justify-center leading-tight transition-transform hover:scale-105 cursor-pointer z-10"
                    style={{ backgroundColor: `${ev.color}15`, borderLeftColor: ev.color, color: ev.color }}
                  >
                    <span>{ev.title}</span>
                    <span className="opacity-70 font-normal">{h}:{ev.minute === 0 ? '00' : ev.minute}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
};

export default CalendarGrid;
