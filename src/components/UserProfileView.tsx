import { motion } from 'motion/react';
import { User, LogOut, Edit, Mail, BookOpen, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface UserProfileViewProps {
  onEditNickname: () => void;
  onChangePassword: () => void;
  onSignOut: () => void;
  onViewMyRecipes: () => void;
  recipeCount?: number;
}

export function UserProfileView({ onEditNickname, onChangePassword, onSignOut, onViewMyRecipes, recipeCount = 0 }: UserProfileViewProps) {
  const { user, nickname } = useAuth();

  if (!user) return null;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, rotateY: 90 }}
      animate={{ scale: 1, opacity: 1, rotateY: 0 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.6, type: 'spring' }}
      className="w-full max-w-sm relative"
    >
      <div
        className="bg-white rounded-3xl shadow-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #9333EA20 0%, white 100%)'
        }}
      >
        {/* Profile Header */}
        <div className="p-6 text-center" style={{ backgroundColor: '#9333EA30' }}>
          <div className="text-6xl mb-3">👤</div>
          <h3 className="text-gray-800 mb-1 text-xl font-bold">
            {nickname || 'User Profile'}
          </h3>
          {nickname && (
            <p className="text-sm text-gray-600 mt-1">{user.email}</p>
          )}
          {!nickname && (
            <p className="text-sm text-gray-600 mt-1">{user.email}</p>
          )}
        </div>

        {/* Profile Info */}
        <div className="px-6 py-4 flex justify-around border-b border-gray-100">
          <div className="text-center">
            <p className="text-xs text-gray-500">Account</p>
            <p className="text-gray-800 font-medium">Active</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">My Recipes</p>
            <p className="text-gray-800 font-medium">{recipeCount}</p>
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-6 space-y-4">
          <div>
            <h4 className="text-gray-700 mb-3 font-semibold flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address
            </h4>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              {user.email}
            </p>
          </div>

          <div>
            <h4 className="text-gray-700 mb-3 font-semibold flex items-center gap-2">
              <User className="w-4 h-4" />
              Display Name
            </h4>
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                {nickname || 'Not set'}
              </p>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onEditNickname}
                className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all"
                title={nickname ? 'Edit Nickname' : 'Set Nickname'}
              >
                <Edit className="w-4 h-4 text-purple-600" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onViewMyRecipes}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <BookOpen className="w-5 h-5" />
            My Recipes ({recipeCount})
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onChangePassword}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <Lock className="w-5 h-5" />
            Change Password
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

