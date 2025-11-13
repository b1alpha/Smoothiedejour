import { motion } from 'motion/react';

interface Recipe {
  id: number | string;
  name: string;
  contributor: string;
  emoji: string;
  color: string;
}

interface ContributorRecipesViewProps {
  contributor: string;
  recipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
}

export function ContributorRecipesView({ contributor, recipes, onSelectRecipe }: ContributorRecipesViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Recipes by {contributor}
        </h2>
        <p className="text-sm text-gray-600">
          {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
        </p>
      </div>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto px-2">
        {recipes.map((recipe, index) => (
          <motion.button
            key={recipe.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelectRecipe(recipe)}
            className="w-full text-left bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-4 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${recipe.color}15 0%, white 100%)`,
            }}
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl">{recipe.emoji}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{recipe.name}</h3>
              </div>
              <div className="text-purple-600">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

