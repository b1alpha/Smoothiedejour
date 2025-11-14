import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NicknameEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NicknameEditModal({ isOpen, onClose }: NicknameEditModalProps) {
  const { nickname, updateNickname } = useAuth();
  const [newNickname, setNewNickname] = useState(nickname || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Update local state when modal opens
  useEffect(() => {
    if (isOpen) {
      setNewNickname(nickname || '');
      setError(null);
    }
  }, [isOpen, nickname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!newNickname.trim()) {
      setError('Nickname cannot be empty');
      return;
    }

    if (newNickname.trim().length < 2) {
      setError('Nickname must be at least 2 characters');
      return;
    }

    if (newNickname.trim().length > 30) {
      setError('Nickname must be 30 characters or less');
      return;
    }

    setLoading(true);
    try {
      const { error } = await updateNickname(newNickname.trim());
      if (error) {
        setError(error.message);
      } else {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Edit Nickname
            </h2>
            <p className="text-sm text-gray-600">
              This name will be shown on your recipes instead of your email
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
                Nickname
              </label>
              <input
                id="nickname"
                type="text"
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                required
                minLength={2}
                maxLength={30}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                placeholder="e.g., SmoothieMaster"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Nickname'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

