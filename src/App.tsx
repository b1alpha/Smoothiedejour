import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, ArrowLeft, User } from 'lucide-react';
import { RecipeCard } from './components/RecipeCard';
import { ShakeInstruction } from './components/ShakeInstruction';
import { FilterToggles } from './components/FilterToggles';
import { ContributeRecipeModal } from './components/ContributeRecipeModal';
import { ContributorRecipesView } from './components/ContributorRecipesView';
import { AuthModal } from './components/AuthModal';
import { NicknameEditModal } from './components/NicknameEditModal';
import { UserProfileView } from './components/UserProfileView';
import { useAuth } from './contexts/AuthContext';
import { smoothieRecipes as defaultRecipes } from './data/recipes';
import { fetchCommunityRecipes, submitCommunityRecipe, updateCommunityRecipe, type CommunityRecipe } from './utils/supabase/community';
import type { Recipe } from './data/recipes';

export default function App() {
  const { user, signOut, nickname } = useAuth();
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [shakeCount, setShakeCount] = useState(0);
  const [noFat, setNoFat] = useState(false);
  const [noNuts, setNoNuts] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);
  const [selectedContributor, setSelectedContributor] = useState<string | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<CommunityRecipe | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [userRecipes, setUserRecipes] = useState(() => {
    const saved = localStorage.getItem('smoothie-user-recipes');
    return saved ? JSON.parse(saved) : [];
  });
  const [favorites, setFavorites] = useState<Set<number | string>>(() => {
    const saved = localStorage.getItem('smoothie-favorites');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [communityRecipes, setCommunityRecipes] = useState<CommunityRecipe[]>([]);
  const [communityRecipesLoadFailed, setCommunityRecipesLoadFailed] = useState(false);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(true);

  // Combine recipes: only include defaults if community recipes failed to load (no network)
  // Otherwise, show community recipes + user recipes
  const allRecipes = useMemo(() => {
    if (communityRecipesLoadFailed) {
      // Community recipes failed to load - show defaults + user recipes as fallback
      return [...defaultRecipes, ...userRecipes];
    }
    // Community recipes loaded successfully (even if empty) - only show community + user recipes
    return [...communityRecipes, ...userRecipes];
  }, [communityRecipes, userRecipes, communityRecipesLoadFailed]);

  // Save user recipes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('smoothie-user-recipes', JSON.stringify(userRecipes));
  }, [userRecipes]);

  useEffect(() => {
    localStorage.setItem('smoothie-favorites', JSON.stringify(Array.from(favorites)));
  }, [favorites]);

  // Load community recipes from Supabase function
  useEffect(() => {
    setIsLoadingRecipes(true);
    fetchCommunityRecipes()
      .then((recipes) => {
        setCommunityRecipes(recipes);
        setCommunityRecipesLoadFailed(false);
        setIsLoadingRecipes(false);
      })
      .catch((err) => {
        console.error('Failed to load community recipes:', err);
        // Mark as failed so we show defaults as fallback
        setCommunityRecipesLoadFailed(true);
        setIsLoadingRecipes(false);
      });
  }, []);

  // Sync local recipes to Supabase every 10 minutes
  useEffect(() => {
    const syncLocalRecipes = async () => {
      if (userRecipes.length === 0) return;

      // Try to submit each local recipe to Supabase
      const recipesToRemove: (number | string)[] = [];
      
      for (const localRecipe of userRecipes) {
        try {
          // Remove id and createdAt - Supabase will generate new ones
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, createdAt, ...recipeToSubmit } = localRecipe;
          const created = await submitCommunityRecipe(recipeToSubmit);
          
          // Successfully submitted - mark for removal from local and add to community
          recipesToRemove.push(localRecipe.id);
          setCommunityRecipes((prev) => {
            // Check if it's already in community recipes (avoid duplicates)
            if (prev.some(r => r.id === created.id)) {
              return prev;
            }
            return [...prev, created];
          });
        } catch (error) {
          // Still failed - keep it local, will retry next time
          console.debug('Failed to sync local recipe to Supabase, will retry:', error);
        }
      }

      // Remove successfully synced recipes from local storage
      if (recipesToRemove.length > 0) {
        setUserRecipes((prev) => prev.filter(r => !recipesToRemove.includes(r.id)));
      }
    };

    // Run immediately on mount, then every 10 minutes
    syncLocalRecipes();
    const interval = setInterval(syncLocalRecipes, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [userRecipes]);

  // Load recipe or contributor from URL parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const recipeId = params.get('recipe');
    const contributorParam = params.get('contributor');
    
    if (recipeId && allRecipes.length > 0) {
      // URLSearchParams.get() automatically decodes the value
      const decodedRecipeId = decodeURIComponent(recipeId);
      const recipe = allRecipes.find(r => String(r.id) === decodedRecipeId);
      if (recipe) {
        setCurrentRecipe(recipe);
        // Clean up URL without reloading
        window.history.replaceState({}, '', window.location.pathname);
      }
    } else if (contributorParam && allRecipes.length > 0) {
      // URLSearchParams.get() automatically decodes the value
      const decodedContributor = decodeURIComponent(contributorParam);
      // Check if this contributor has any recipes
      const hasRecipes = allRecipes.some(r => r.contributor === decodedContributor);
      if (hasRecipes) {
        setSelectedContributor(decodedContributor);
        setCurrentRecipe(null);
        // Clean up URL without reloading
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [allRecipes]);

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

  const handleSubmitRecipe = async (recipe: Omit<CommunityRecipe, 'id' | 'createdAt'>) => {
    // Use authenticated user's nickname if available, otherwise fall back to email or provided contributor
    const contributorName = nickname || user?.email || recipe.contributor;
    const recipeWithContributor = { ...recipe, contributor: contributorName };

    try {
      const created = await submitCommunityRecipe(recipeWithContributor);
      setCommunityRecipes((prev) => [...prev, created]);
      setCurrentRecipe(created);
      return true;
    } catch (error) {
      console.error('Error submitting recipe to Supabase, falling back to local:', error);
      const fallbackRecipe = { ...recipeWithContributor, id: `user-${Date.now()}` };
      setUserRecipes((prev) => [...prev, fallbackRecipe]);
      setCurrentRecipe(fallbackRecipe);
      return true;
    }
  };

  const handleUpdateRecipe = async (recipeId: string, recipe: Omit<CommunityRecipe, 'id' | 'createdAt'>) => {
    // Use authenticated user's nickname if available, otherwise fall back to email or provided contributor
    const contributorName = nickname || user?.email || recipe.contributor;
    const recipeWithContributor = { ...recipe, contributor: contributorName };

    try {
      const updated = await updateCommunityRecipe(recipeId, recipeWithContributor);
      // Update in community recipes
      setCommunityRecipes((prev) => prev.map(r => r.id === recipeId ? updated : r));
      // Update current recipe if it's the one being edited
      if (currentRecipe && String(currentRecipe.id) === recipeId) {
        setCurrentRecipe(updated);
      }
      return true;
    } catch (error) {
      console.error('Error updating recipe:', error);
      // For local recipes, update in place
      if (recipeId.startsWith('user-')) {
        setUserRecipes((prev) => prev.map(r => r.id === recipeId ? { ...r, ...recipeWithContributor } : r));
        if (currentRecipe && String(currentRecipe.id) === recipeId) {
          setCurrentRecipe({ ...currentRecipe, ...recipeWithContributor });
        }
        return true;
      }
      return false;
    }
  };

  const handleContributeClick = () => {
    if (!user) {
      setIsAuthModalOpen(true);
    } else {
      setEditingRecipe(null);
      setIsModalOpen(true);
    }
  };

  const handleEditRecipe = (recipe: Recipe | CommunityRecipe) => {
    // Only allow editing community recipes (not default recipes)
    if (typeof recipe.id === 'string' && recipe.id.startsWith('recipe:')) {
      setEditingRecipe(recipe as CommunityRecipe);
      setIsModalOpen(true);
    }
  };

  // Check if current user can edit a recipe
  const canEditRecipe = (recipe: Recipe | CommunityRecipe): boolean => {
    if (!user) return false;
    // Only community recipes can be edited
    if (typeof recipe.id !== 'string' || !recipe.id.startsWith('recipe:')) {
      return false;
    }
    // Check if recipe contributor matches current user's nickname or email
    const userIdentifier = nickname || user.email;
    return recipe.contributor === userIdentifier;
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Get recipes by selected contributor
  const contributorRecipes = useMemo(() => {
    if (!selectedContributor) return [];
    return allRecipes.filter(r => r.contributor === selectedContributor);
  }, [selectedContributor, allRecipes]);

  const handleContributorClick = (contributor: string) => {
    setSelectedContributor(contributor);
    setCurrentRecipe(null);
    setShowUserProfile(false);
  };

  const handleViewMyRecipes = () => {
    const userIdentifier = nickname || user?.email;
    if (userIdentifier) {
      setSelectedContributor(userIdentifier);
      setCurrentRecipe(null);
      setShowUserProfile(false);
    }
  };

  // Get count of user's recipes
  const myRecipesCount = useMemo(() => {
    if (!user) return 0;
    const userIdentifier = nickname || user.email;
    return allRecipes.filter(recipe => recipe.contributor === userIdentifier).length;
  }, [allRecipes, user, nickname]);

  const handleBackToMain = () => {
    if (showUserProfile) {
      setShowUserProfile(false);
      return;
    }
    // If viewing a recipe from contributor list, go back to contributor list
    if (currentRecipe && selectedContributor) {
      setCurrentRecipe(null);
    } else {
      // Otherwise, go back to main view
      setSelectedContributor(null);
      setCurrentRecipe(null);
    }
  };

  const handleSelectRecipe = (recipe: Recipe | CommunityRecipe) => {
    setCurrentRecipe(recipe);
  };

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
              {selectedContributor || showUserProfile ? (
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleBackToMain}
                  className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg transition-all"
                  title={showUserProfile ? "Back to main" : currentRecipe ? "Back to contributor recipes" : "Back to all recipes"}
                >
                  <ArrowLeft className="w-5 h-5 text-purple-600" />
                </motion.button>
              ) : (
                <div className="w-10"></div>
              )}
              <h1 className="text-4xl">🥤</h1>
              {!selectedContributor && !showUserProfile ? (
                <div className="flex items-center gap-2">
                  {user ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2"
                    >
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleContributeClick}
                        className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg transition-all"
                        title="Contribute a recipe"
                      >
                        <Plus className="w-5 h-5 text-purple-600" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowUserProfile(true)}
                        className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg transition-all"
                        title="User profile"
                      >
                        <User className="w-5 h-5 text-purple-600" />
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsAuthModalOpen(true)}
                      className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg transition-all"
                      title="Sign in"
                    >
                      <User className="w-5 h-5 text-purple-600" />
                    </motion.button>
                  )}
                </div>
              ) : (
                <div className="w-10"></div>
              )}
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
            {showUserProfile && (
              <UserProfileView
                key="user-profile"
                onEditNickname={() => setIsNicknameModalOpen(true)}
                onSignOut={async () => {
                  await signOut();
                  setShowUserProfile(false);
                }}
                onViewMyRecipes={handleViewMyRecipes}
                recipeCount={myRecipesCount}
              />
            )}
            {selectedContributor && !currentRecipe && !showUserProfile && (
              <ContributorRecipesView
                key="contributor-view"
                contributor={selectedContributor}
                recipes={contributorRecipes}
                onSelectRecipe={handleSelectRecipe}
              />
            )}
            {!selectedContributor && !currentRecipe && !isShaking && !isLoadingRecipes && !showUserProfile && (
              <ShakeInstruction 
                key="instruction" 
                onManualShake={handleManualShake} 
                hasFilters={filteredCount === 0}
                favoritesOnly={favoritesOnly}
              />
            )}
            {isLoadingRecipes && !selectedContributor && !currentRecipe && !showUserProfile && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <div className="text-6xl mb-4 animate-pulse">🥤</div>
                <p className="text-gray-600">Loading recipes...</p>
              </motion.div>
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
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-purple-600"
                  aria-label="Blender"
                >
                  <rect x="7" y="3" width="10" height="9" rx="2" />
                  <path d="M9 3v2m6-2v2" />
                  <path d="M8 12h8l-1 5H9l-1-5z" />
                  <circle cx="12" cy="16" r="1.5" />
                  <path d="M9 21h6" />
                </svg>
              </motion.div>
            )}
            {currentRecipe && !isShaking && !showUserProfile && (
              <RecipeCard 
                key={currentRecipe.id} 
                recipe={currentRecipe}
                isFavorite={favorites.has(currentRecipe.id)}
                onToggleFavorite={toggleFavorite}
                onContributorClick={handleContributorClick}
                onEdit={handleEditRecipe}
                canEdit={canEditRecipe(currentRecipe)}
              />
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        {!selectedContributor && !showUserProfile && (
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
        )}
      </div>

      {/* Auth Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
      <NicknameEditModal
        isOpen={isNicknameModalOpen}
        onClose={() => setIsNicknameModalOpen(false)}
      />
      <ContributeRecipeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRecipe(null);
        }}
        onSubmit={handleSubmitRecipe}
        editingRecipe={editingRecipe}
        onUpdate={handleUpdateRecipe}
      />
    </div>
  );
}