import React from 'react';
import { FiCalendar, FiUsers, FiLogOut, FiUser, FiShield } from 'react-icons/fi';
import { useAuthStore } from '../../stores/authStore';
import { AddOrderForm } from '../orders/AddOrderForm';

interface ViewPlaceholderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const ViewPlaceholder: React.FC<ViewPlaceholderProps> = ({ icon, title, description }) => (
  <div className="flex flex-col items-center justify-center h-full text-white/50 p-6 text-center">
    <div className="mb-4 text-6xl text-emerald-500/50 animate-pulse">{icon}</div>
    <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
    <p className="text-sm max-w-xs">{description}</p>
  </div>
);

export const CalendarView: React.FC = () => (
  <ViewPlaceholder
    icon={<FiCalendar />}
    title="Calendar View"
    description="Calendar scheduling and timeline view will be available here"
  />
);

export const UploadView: React.FC = () => (
  <div className="h-full overflow-auto p-4">
    <AddOrderForm />
  </div>
);

export const TeamView: React.FC = () => (
  <ViewPlaceholder
    icon={<FiUsers />}
    title="Team Workspace"
    description="Collaborate with team members and manage projects"
  />
);

export const MoreView: React.FC = () => {
  const { user, logout } = useAuthStore();

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold text-white mb-4">Настройки</h2>

      {/* User info */}
      <div className="bg-white/10 rounded-xl p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-emerald-600/30 flex items-center justify-center">
          <FiUser className="text-emerald-400 text-xl" />
        </div>
        <div>
          <p className="text-white font-medium">{user?.phoneNumber || user?.uid?.slice(0, 8) || 'Пользователь'}</p>
          <div className="flex items-center gap-1 text-white/50 text-sm">
            <FiShield className="text-xs" />
            <span className="capitalize">{user?.role || 'guest'}</span>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={() => logout()}
        className="w-full flex items-center gap-3 p-4 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-red-400 transition-colors"
      >
        <FiLogOut className="text-xl" />
        <span>Выйти из аккаунта</span>
      </button>
    </div>
  );
};
