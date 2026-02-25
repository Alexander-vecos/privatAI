import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaKey, FaSpinner, FaExclamationCircle } from 'react-icons/fa';
import { useAuthStore } from '../../../stores/authStore';
import { useUIStore } from '../../../stores/uiStore';

/**
 * Modal for user authentication via access key
 */
export const KeyAuthModal: React.FC = () => {
  const [keyInput, setKeyInput] = useState('');
  const { loginWithKey, loginAsGuest, isLoading, error, user, clearError } = useAuthStore();

  // Show modal only when uiStore.activeModal === 'keyAuth'
  const uiActive = useUIStore((s) => s.activeModal);
  const isVisible = !user && uiActive === 'keyAuth';

  useEffect(() => {
    if (keyInput && error) {
      clearError();
    }
  }, [keyInput, error, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;

    try {
      await loginWithKey(keyInput.trim());
      useUIStore.getState().closeModal();
    } catch (err) {
      // Error is already in store
      setKeyInput('');
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="p-8">
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                <FaKey size={28} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white text-center">
                Access System
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-center mt-2 text-sm">
                Enter your personal access key
              </p>
              <div className="mt-3 text-center">
                <button className="text-sm text-blue-600 hover:underline" onClick={() => (useUIStore.getState().openModal('emailAuth'))}>
                  Войти по email
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="KEY-XXXX-XXXX"
                  className={`w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border-2 rounded-xl outline-none transition-all text-center text-lg font-mono tracking-wider
                    ${
                      error
                        ? 'border-red-500 focus:border-red-500 text-red-600 dark:text-red-400'
                        : 'border-gray-200 dark:border-gray-700 focus:border-blue-500 text-gray-900 dark:text-white'
                    }`}
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-center justify-center gap-2 text-red-500 dark:text-red-400 text-sm font-medium"
                >
                  <FaExclamationCircle />
                  <span>{error}</span>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isLoading || !keyInput}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl font-semibold text-lg transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Activating...
                  </>
                ) : (
                  'Activate Key'
                )}
              </button>

              {/* Guest login */}
              <div className="mt-3 flex items-center justify-center">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await loginAsGuest();
                      useUIStore.getState().closeModal();
                    } catch (e) {
                      // error handled in store
                    }
                  }}
                  disabled={isLoading}
                  className="text-sm px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:brightness-95 disabled:opacity-50"
                >
                  Войти как гость
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
