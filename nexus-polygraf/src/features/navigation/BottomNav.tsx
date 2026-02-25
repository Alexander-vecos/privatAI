import React from 'react';
import { FiGrid, FiCalendar, FiPlus, FiUsers, FiMoreHorizontal } from 'react-icons/fi';

interface BottomNavProps {
  current: string;
  onChange: (view: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ current, onChange }) => {
  const items = [
    { id: 'feed', icon: FiGrid, label: 'Feed' },
    { id: 'calendar', icon: FiCalendar, label: 'Calendar' },
    { id: 'upload', icon: FiPlus, label: 'Upload' },
    { id: 'team', icon: FiUsers, label: 'Team' },
    { id: 'more', icon: FiMoreHorizontal, label: 'More' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none pb-6 px-4">
      <nav className="pointer-events-auto bg-black/80 backdrop-blur-2xl border border-emerald-500/20 rounded-3xl w-full max-w-md h-12 flex justify-between items-stretch overflow-hidden p-1 shadow-2xl shadow-emerald-900/50">
        {items.map((item) => {
          const isActive = current === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`flex-1 flex flex-col items-center justify-center relative transition-all duration-300 ${
                isActive ? 'text-white' : 'text-white/40 hover:text-white/60'
              }`}
            >
              <Icon
                size={22}
                className={isActive ? 'drop-shadow-[0_0_8px_rgba(16,185,129,0.8)] text-emerald-400' : ''}
              />

              {/* Indicator line */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded shadow-lg shadow-emerald-500/50" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
