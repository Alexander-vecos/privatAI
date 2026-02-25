import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEnvelope } from 'react-icons/fa';
import { useAuthStore } from '../../../stores/authStore';
import { useUIStore } from '../../../stores/uiStore';

export const EmailAuthModal: React.FC = () => {
  const { loginWithEmail, registerWithEmail, isLoading, error, user, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [localMsg, setLocalMsg] = useState<string | null>(null);

  const uiActive = useUIStore((s) => s.activeModal);
  if (user || uiActive !== 'emailAuth') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalMsg(null);
    clearError();
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
      }
      useUIStore.getState().closeModal();
    } catch (err: any) {
      // error is in store
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setLocalMsg(null);
    clearError();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />

        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FaEnvelope size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold dark:text-white">
                {mode === 'login' ? 'Вход' : 'Регистрация'}
              </h3>
              <p className="text-sm text-gray-500">
                {mode === 'login' ? 'Введите email и пароль' : 'Создайте аккаунт'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full p-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-blue-500 text-gray-900 dark:text-white"
              autoFocus
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль (мин. 6 символов)"
              className="w-full p-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-blue-500 text-gray-900 dark:text-white"
              required
              minLength={6}
            />

            {error && (
              <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                {error}
              </div>
            )}
            {localMsg && (
              <div className="text-sm text-green-600 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                {localMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !email.trim() || password.length < 6}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Подождите...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </form>

          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-blue-600 hover:underline"
            >
              {mode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => useUIStore.getState().openModal('keyAuth')}
            className="mt-2 w-full text-sm text-gray-400 hover:text-gray-600"
          >
            ← Назад к входу по ключу
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
