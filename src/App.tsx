import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus } from 'lucide-react';
import { RecipeCard } from './components/RecipeCard';
import { ShakeInstruction } from './components/ShakeInstruction';
import { FilterToggles } from './components/FilterToggles';
import { ContributeRecipeModal } from './components/ContributeRecipeModal';
import { smoothieRecipes as defaultRecipes } from './data/recipes';

export default function App() {
  const [currentRecipe, setCurrentRecipe] = useState(null);
  const [isShaking, setIsShaking] = useState(false);
  const [shakeCount, setShakeCount] = useState(0);
  const [noFat, setNoFat] = useState(false);
  const [noNuts, setNoNuts] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userRecipes, setUserRecipes] = useState(() => {
    const saved = localStorage.getItem('smoothie-user-recipes');
    return saved ? JSON.parse(saved) : [];
  });
  const [favorites, setFavorites] = useState<Set<number | string>>(() => {
    const saved = localStorage.getItem('smoothie-favorites');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Combine default and user recipes
  const allRecipes = [...defaultRecipes, ...userRecipes];

  // Save user recipes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('smoothie-user-recipes', JSON.stringify(userRecipes));
  }, [userRecipes]);

  useEffect(() => {
    localStorage.setItem('smoothie-favorites', JSON.stringify(Array.from(favorites)));
  }, [favorites]);

  const toggleFavorite = (recipeId: number | string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(recipeId)) {
        newFavorites.delete(recipeId);
      } else {
        newFavorites.add(recipeId);
      }
      return newFavorites;
    });
  };

  const handleSubmitRecipe = async (recipe: any) => {
    try {
      // Generate a unique ID for the recipe
      const newRecipe = {
        ...recipe,
        id: `user-${Date.now()}`,
      };
      
      // Add to user recipes
      setUserRecipes(prev => [...prev, newRecipe]);
      
      // Show the new recipe
      setCurrentRecipe(newRecipe);
      
      return true;
    } catch (error) {
      console.error('Error submitting recipe:', error);
      return false;
    }
  };

  const getFilteredRecipes = () => {
    return allRecipes.filter(recipe => {
      if (noFat && recipe.containsFat) return false;
      if (noNuts && recipe.containsNuts) return false;
      if (favoritesOnly && !favorites.has(recipe.id)) return false;
      return true;
    });
  };

  const getRandomRecipe = () => {
    const filteredRecipes = getFilteredRecipes();
    if (filteredRecipes.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * filteredRecipes.length);
    return filteredRecipes[randomIndex];
  };

  useEffect(() => {
    let lastShakeTime = 0;
    const SHAKE_THRESHOLD = 15;
    const SHAKE_DELAY = 500;

    const handleMotion = (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity;
      if (!acceleration) return;

      const { x, y, z } = acceleration;
      const magnitude = Math.sqrt(x * x + y * y + z * z);

      const currentTime = Date.now();
      if (magnitude > SHAKE_THRESHOLD && currentTime - lastShakeTime > SHAKE_DELAY) {
        lastShakeTime = currentTime;
        setIsShaking(true);
        
        setTimeout(() => {
          const recipe = getRandomRecipe();
          setCurrentRecipe(recipe);
          setShakeCount(prev => prev + 1);
          setIsShaking(false);
        }, 800);
      }
    };

    // Request permission for iOS 13+ devices
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      (DeviceMotionEvent as any).requestPermission()
        .then((permissionState: string) => {
          if (permissionState === 'granted') {
            window.addEventListener('devicemotion', handleMotion);
          }
        })
        .catch(console.error);
    } else {
      window.addEventListener('devicemotion', handleMotion);
    }

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [noFat, noNuts, favoritesOnly, favorites, allRecipes]);

  const handleManualShake = () => {
    setIsShaking(true);
    setTimeout(() => {
      const recipe = getRandomRecipe();
      setCurrentRecipe(recipe);
      setShakeCount(prev => prev + 1);
      setIsShaking(false);
    }, 800);
  };

  const filteredCount = getFilteredRecipes().length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-yellow-100">
      <div className="max-w-md mx-auto min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6 text-center">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-10"></div>
              <h1 className="text-4xl">🥤</h1>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsModalOpen(true)}
                className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg transition-all"
                title="Contribute a recipe"
              >
                <Plus className="w-5 h-5 text-purple-600" />
              </motion.button>
            </div>
            <h2 className="text-purple-600">Smoothie de Jour</h2>
            <p className="text-sm text-gray-600 mt-1">
              Community recipes, served fresh • {allRecipes.length} recipes
            </p>
          </motion.div>
          
          <FilterToggles
            noFat={noFat}
            noNuts={noNuts}
            favoritesOnly={favoritesOnly}
            onNoFatChange={setNoFat}
            onNoNutsChange={setNoNuts}
            onFavoritesOnlyChange={setFavoritesOnly}
            filteredCount={filteredCount}
            totalCount={allRecipes.length}
            favoritesCount={favorites.size}
          />
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-6">
          <AnimatePresence mode="wait">
            {!currentRecipe && !isShaking && (
              <ShakeInstruction 
                key="instruction" 
                onManualShake={handleManualShake} 
                hasFilters={filteredCount === 0}
                favoritesOnly={favoritesOnly}
              />
            )}
            {isShaking && (
              <motion.div
                key="shaking"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [0.8, 1.1, 1], opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="text-6xl"
              >
                🌪️
              </motion.div>
            )}
            {currentRecipe && !isShaking && (
              <RecipeCard 
                key={currentRecipe.id} 
                recipe={currentRecipe}
                isFavorite={favorites.has(currentRecipe.id)}
                onToggleFavorite={toggleFavorite}
              />
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="p-6 text-center">
          {shakeCount > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-gray-600 mb-4"
            >
              {shakeCount} {shakeCount === 1 ? 'recipe' : 'recipes'} discovered 🎉
            </motion.p>
          )}
          <button
            onClick={handleManualShake}
            disabled={filteredCount === 0}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Get Another Recipe
          </button>
        </footer>
      </div>

      {/* Contribution Modal */}
      <ContributeRecipeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitRecipe}
      />
    </div>
  );
}