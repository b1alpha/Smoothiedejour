import { motion, AnimatePresence } from 'motion/react';
import { Heart, Share2, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { shareRecipe } from '../utils/share';

interface Recipe {
  id: number | string;
  name: string;
  contributor: string;
  emoji: string;
  color: string;
  ingredients: string[];
  instructions: string;
  servings: number;
  prepTime: string;
}

interface RecipeCardProps {
  recipe: Recipe;
  isFavorite: boolean;
  onToggleFavorite: (id: number | string) => void;
  onContributorClick?: (contributor: string) => void;
  onEdit?: (recipe: Recipe) => void;
  onDelete?: (recipe: Recipe) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function RecipeCard({ recipe, isFavorite, onToggleFavorite, onContributorClick, onEdit, onDelete, canEdit, canDelete }: RecipeCardProps) {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleShare = async () => {
    const success = await shareRecipe(recipe);
    if (success) {
      // Check if we used Web Share API (which shows its own UI)
      if (navigator.share) {
        // Web Share API was used, no need to show toast
        return;
      }
      // Otherwise, show toast for clipboard copy
      setToastMessage('Link copied to clipboard!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } else {
      setToastMessage('Failed to share. Please try again.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, rotateY: 90 }}
      animate={{ scale: 1, opacity: 1, rotateY: 0 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.6, type: 'spring' }}
      className="w-full max-w-sm relative"
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20 bg-gray-900 text-white px-4 py-2 rounded-full text-sm shadow-lg"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit and Delete Buttons - Left Side */}
      <div style={{ position: 'absolute', top: '1rem', left: '16px', zIndex: 10 }} className="flex gap-2">
        {canEdit && onEdit && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onEdit(recipe)}
            className="bg-white/90 backdrop-blur-sm rounded-full p-4 shadow-lg hover:shadow-xl transition-all"
            title="Edit recipe"
          >
            <Edit className="w-6 h-6 stroke-gray-600 hover:stroke-purple-600 transition-colors" />
          </motion.button>
        )}
        {canDelete && onDelete && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDelete(recipe)}
            className="bg-white/90 backdrop-blur-sm rounded-full p-4 shadow-lg hover:shadow-xl transition-all"
            title="Delete recipe"
          >
            <Trash2 className="w-6 h-6 stroke-gray-600 hover:stroke-red-600 transition-colors" />
          </motion.button>
        )}
      </div>

      {/* Action Buttons - Right Side */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleShare}
          className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:shadow-xl transition-all"
          title="Share recipe"
        >
          <Share2 className="w-6 h-6 stroke-gray-600 hover:stroke-purple-600 transition-colors" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onToggleFavorite(recipe.id)}
          className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:shadow-xl transition-all"
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className={`w-6 h-6 transition-all ${
              isFavorite 
                ? 'fill-red-500 stroke-red-500' 
                : 'stroke-gray-400 hover:stroke-red-400'
            }`}
          />
        </motion.button>
      </div>

      <div
        className="bg-white rounded-3xl shadow-2xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${recipe.color}20 0%, white 100%)`
        }}
      >
        {/* Recipe Header */}
        <div className="p-6 text-center" style={{ backgroundColor: `${recipe.color}30` }}>
          <div className="text-6xl mb-3">{recipe.emoji}</div>
          <h3 className="text-gray-800 mb-1">{recipe.name}</h3>
          {onContributorClick ? (
            <button
              onClick={() => onContributorClick(recipe.contributor)}
              className="text-sm text-gray-600 hover:text-purple-600 transition-colors underline decoration-dotted"
            >
              by {recipe.contributor}
            </button>
          ) : (
            <p className="text-sm text-gray-600">by {recipe.contributor}</p>
          )}
        </div>

        {/* Recipe Info */}
        <div className="px-6 py-4 flex justify-around border-b border-gray-100">
          <div className="text-center">
            <p className="text-xs text-gray-500">Servings</p>
            <p className="text-gray-800">{recipe.servings}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Prep Time</p>
            <p className="text-gray-800">{recipe.prepTime}</p>
          </div>
        </div>

        {/* Ingredients */}
        <div className="p-6">
          <h4 className="text-gray-700 mb-3">Ingredients</h4>
          <ul className="space-y-2">
            {recipe.ingredients.map((ingredient, index) => (
              <motion.li
                key={index}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-start text-sm text-gray-600"
              >
                <span className="mr-2" style={{ color: recipe.color }}>•</span>
                <span>{ingredient}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Instructions */}
        <div className="px-6 pb-6">
          <h4 className="text-gray-700 mb-3">Instructions</h4>
          <p className="text-sm text-gray-600 leading-relaxed">{recipe.instructions}</p>
        </div>
      </div>
    </motion.div>
  );
}