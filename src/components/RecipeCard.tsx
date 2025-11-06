import { motion } from 'motion/react';
import { Heart } from 'lucide-react';

interface Recipe {
  id: number;
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
  onToggleFavorite: (id: number) => void;
}

export function RecipeCard({ recipe, isFavorite, onToggleFavorite }: RecipeCardProps) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, rotateY: 90 }}
      animate={{ scale: 1, opacity: 1, rotateY: 0 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.6, type: 'spring' }}
      className="w-full max-w-sm relative"
    >
      {/* Favorite Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onToggleFavorite(recipe.id)}
        className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:shadow-xl transition-all"
      >
        <Heart
          className={`w-6 h-6 transition-all ${
            isFavorite 
              ? 'fill-red-500 stroke-red-500' 
              : 'stroke-gray-400 hover:stroke-red-400'
          }`}
        />
      </motion.button>

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
          <p className="text-sm text-gray-600">by {recipe.contributor}</p>
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