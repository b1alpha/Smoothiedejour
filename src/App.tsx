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
import { PasswordChangeModal } from './components/PasswordChangeModal';
import { UserProfileView } from './components/UserProfileView';
import { useAuth } from './contexts/AuthContext';
import { smoothieRecipes as defaultRecipes } from './data/recipes';
import { fetchCommunityRecipes, submitCommunityRecipe, updateCommunityRecipe, deleteCommunityRecipe, type CommunityRecipe } from './utils/supabase/community';
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
  const [isPasswordChangeModalOpen, setIsPasswordChangeModalOpen] = useState(false);
  const [selectedContributor, setSelectedContributor] = useState<string | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<CommunityRecipe | null>(null);
  const [deletingRecipe, setDeletingRecipe] = useState<Recipe | CommunityRecipe | null>(null);
  const [justDeleted, setJustDeleted] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [userRecipes, setUserRecipes] = useState(() => {
    const saved = localStorage.getItem('smoothie-user-recipes');
    const recipes = saved ? JSON.parse(saved) : [];
    
    // Auto-fix incomplete recipes on load (missing only instructions/ingredients)
    const fixedRecipes = recipes.map((recipe: any) => {
      if (!recipe.name || !recipe.contributor) {
        // Can't auto-fix - return as-is (will be removed during sync)
        return recipe;
      }
      // Auto-fix missing ingredients or instructions
      return {
        ...recipe,
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || 'Blend all ingredients together.',
      };
    });
    
    // Save fixed recipes back to localStorage
    if (fixedRecipes.length > 0 && JSON.stringify(fixedRecipes) !== JSON.stringify(recipes)) {
      localStorage.setItem('smoothie-user-recipes', JSON.stringify(fixedRecipes));
    }
    
    return fixedRecipes;
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
        // Only log error details if it's not a connection refused (expected when localhost not running)
        // and not in test environment (tests intentionally trigger this error)
        const isConnectionRefused = err instanceof TypeError && err.message === 'Failed to fetch';
        const isTestEnv = import.meta.env.MODE === 'test' || typeof vi !== 'undefined';
        if (!isConnectionRefused && !isTestEnv) {
          console.error('Failed to load community recipes:', err);
        }
        // Mark as failed so we show defaults as fallback
        setCommunityRecipesLoadFailed(true);
        setIsLoadingRecipes(false);
      });
  }, []);

  // Sync local recipes to Supabase every 10 minutes
  useEffect(() => {
    const syncLocalRecipes = async () => {
      if (userRecipes.length === 0) return;
      
      // Only sync if user is logged in
      if (!user) {
        return;
      }

      // Try to submit each local recipe to Supabase
      const recipesToRemove: (number | string)[] = [];
      const recipesToFix: Array<{ id: number | string; missingFields: string[] }> = [];
      
      for (const localRecipe of userRecipes) {
        try {
          // Remove id and createdAt - Supabase will generate new ones
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, createdAt, ...recipeToSubmit } = localRecipe;
          
          // Validate required fields before submitting
          if (!recipeToSubmit.name || !recipeToSubmit.contributor || 
              !recipeToSubmit.ingredients || !recipeToSubmit.instructions) {
            const missingFields: string[] = [];
            if (!recipeToSubmit.name) missingFields.push('name');
            if (!recipeToSubmit.contributor) missingFields.push('contributor');
            if (!recipeToSubmit.ingredients) missingFields.push('ingredients');
            if (!recipeToSubmit.instructions) missingFields.push('instructions');
            
            // Track incomplete recipes but don't show error immediately
            recipesToFix.push({ id: localRecipe.id, missingFields });
            continue;
          }
          
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
          // Don't show error immediately on page load
        }
      }

      // Remove successfully synced recipes from local storage
      if (recipesToRemove.length > 0) {
        setUserRecipes((prev) => prev.filter(r => !recipesToRemove.includes(r.id)));
      }

      // Remove recipes missing critical fields (can't be auto-fixed)
      // Recipes missing only ingredients/instructions were already auto-fixed on load
      if (recipesToFix.length > 0) {
        const recipesToDelete: (number | string)[] = [];
        
        for (const { id, missingFields } of recipesToFix) {
          // If recipe is missing critical fields (name or contributor), remove it silently
          if (missingFields.includes('name') || missingFields.includes('contributor')) {
            recipesToDelete.push(id);
          }
        }
        
        // Remove recipes that can't be fixed (silently)
        if (recipesToDelete.length > 0) {
          setUserRecipes((prev) => prev.filter(r => !recipesToDelete.includes(r.id)));
        }
      }
    };

    // Delay sync slightly to avoid showing errors immediately on page load
    // Only sync if user is logged in
    if (user) {
      const timeoutId = setTimeout(() => {
        syncLocalRecipes();
      }, 3000); // Wait 3 seconds after page load to avoid showing errors immediately
      
      const interval = setInterval(syncLocalRecipes, 10 * 60 * 1000); // 10 minutes

      return () => {
        clearTimeout(timeoutId);
        clearInterval(interval);
      };
    }
  }, [userRecipes, user]);

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
    setEditingRecipe(null);
    setIsModalOpen(true);
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

  // Check if current user can delete a recipe
  const canDeleteRecipe = (recipe: Recipe | CommunityRecipe): boolean => {
    if (!user) return false;
    const userIdentifier = nickname || user.email;
    // Can delete community recipes (synced to Supabase) that belong to user
    if (typeof recipe.id === 'string' && recipe.id.startsWith('recipe:')) {
      return recipe.contributor === userIdentifier;
    }
    // Can delete local user recipes that belong to user
    if (typeof recipe.id === 'string' && recipe.id.startsWith('user-')) {
      return recipe.contributor === userIdentifier;
    }
    return false;
  };

  // Handle delete recipe
  const handleDeleteRecipe = async (recipe: Recipe | CommunityRecipe) => {
    const recipeId = String(recipe.id);
    const wasCurrentRecipe = currentRecipe && String(currentRecipe.id) === recipeId;
    
    console.log('Deleting recipe:', recipe.name, 'wasCurrentRecipe:', wasCurrentRecipe);
    
    // Always remove from local state first (optimistic update)
    // This ensures UI updates immediately even if API call fails
    setCommunityRecipes((prev) => prev.filter(r => String(r.id) !== recipeId));
    setUserRecipes((prev) => prev.filter(r => String(r.id) !== recipeId));

    // Remove from favorites if it was favorited
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      newFavorites.delete(recipe.id);
      return newFavorites;
    });

    // Close the delete confirmation dialog first
    setDeletingRecipe(null);

    // Show "deleted" message if we deleted the current recipe
    if (wasCurrentRecipe) {
      // Clear currentRecipe first
      setCurrentRecipe(null);
      
      // Set animation state after a brief delay to ensure currentRecipe is cleared first
      setTimeout(() => {
        setJustDeleted(true);
        
        // Hide animation after 3 seconds
        setTimeout(() => {
          setJustDeleted(false);
        }, 3000);
      }, 0);
    } else {
      // Clear currentRecipe immediately if it's not the current recipe
      setCurrentRecipe((prev) => {
        if (prev && String(prev.id) === recipeId) {
          return null;
        }
        return prev;
      });
    }

    // Try to delete from Supabase in the background (don't block UI)
    if (recipeId.startsWith('recipe:')) {
      try {
        await deleteCommunityRecipe(recipeId);
        console.log('Successfully deleted from Supabase');
      } catch (error) {
        console.error('Error deleting recipe from Supabase:', error);
        // Recipe already removed from local state, so UI is correct
        // If deletion failed, it will still exist on server but won't show in UI
      }
    }
  };

  // Safeguard: Clear currentRecipe if it's no longer in allRecipes
  useEffect(() => {
    if (currentRecipe) {
      const recipeExists = allRecipes.some(r => String(r.id) === String(currentRecipe.id));
      if (!recipeExists) {
        setCurrentRecipe(null);
      }
    }
  }, [allRecipes, currentRecipe]);

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
    <>
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
                <div className="flex items-center gap-2" style={{ transform: 'translateX(-7px)' }}>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleContributeClick}
                    className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg transition-all"
                    title="Contribute a recipe"
                  >
                    <Plus className="w-5 h-5 text-purple-600" />
                  </motion.button>
                  {user ? (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowUserProfile(true)}
                      className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg transition-all"
                      title="User profile"
                    >
                      <User className="w-5 h-5 text-purple-600" />
                    </motion.button>
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
          
          {/* Sync Error Toast */}
          <AnimatePresence>
            {syncError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-4 py-2 rounded-lg text-sm shadow-lg max-w-md"
              >
                <div className="flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{syncError}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
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
          {/* Deleted animation - rendered outside AnimatePresence to ensure it shows immediately */}
          <AnimatePresence>
            {justDeleted && !currentRecipe && !isShaking && !selectedContributor && !showUserProfile && (
              <motion.div
                key="deleted"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-center"
                data-testid="delete-animation"
                style={{ position: 'absolute', zIndex: 1000 }}
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 10, duration: 0.5 }}
                  className="text-6xl mb-4"
                  data-testid="trash-icon"
                >
                  🗑️
                </motion.div>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="text-gray-600 text-lg font-medium"
                  data-testid="deleted-message"
                >
                  Recipe deleted
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
          
          <AnimatePresence mode="wait">
            {showUserProfile && (
              <UserProfileView
                key="user-profile"
                onEditNickname={() => setIsNicknameModalOpen(true)}
                onChangePassword={() => setIsPasswordChangeModalOpen(true)}
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
            {!selectedContributor && !currentRecipe && !isShaking && !isLoadingRecipes && !showUserProfile && !justDeleted && (
              <ShakeInstruction 
                key="instruction" 
                onManualShake={handleManualShake} 
                hasFilters={filteredCount === 0}
                favoritesOnly={favoritesOnly}
              />
            )}
            {isLoadingRecipes && !selectedContributor && !currentRecipe && !showUserProfile && !justDeleted && (
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
            {isShaking && !justDeleted && (
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
            {currentRecipe && !isShaking && !showUserProfile && !justDeleted && (
              <RecipeCard 
                key={currentRecipe.id} 
                recipe={currentRecipe}
                isFavorite={favorites.has(currentRecipe.id)}
                onToggleFavorite={toggleFavorite}
                onContributorClick={handleContributorClick}
                onEdit={handleEditRecipe}
                onDelete={(recipe) => setDeletingRecipe(recipe)}
                canEdit={canEditRecipe(currentRecipe)}
                canDelete={canDeleteRecipe(currentRecipe)}
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
      <PasswordChangeModal
        isOpen={isPasswordChangeModalOpen}
        onClose={() => setIsPasswordChangeModalOpen(false)}
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

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deletingRecipe && (
          <>
            {/* Dialog */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed inset-0 flex items-center justify-center p-4"
              style={{ zIndex: 9999, pointerEvents: 'auto' }}
            >
              <div 
                className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full border border-gray-200 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete Recipe?</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Are you sure you want to delete "{deletingRecipe.name}"? This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeletingRecipe(null);
                    }}
                    className="px-4 py-2 rounded-lg transition-colors border"
                    style={{
                      backgroundColor: 'white',
                      borderColor: '#d1d5db',
                      color: '#374151',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (deletingRecipe) {
                        handleDeleteRecipe(deletingRecipe).catch((error) => {
                          console.error('Error deleting recipe:', error);
                        });
                      }
                    }}
                    className="px-4 py-2 rounded-lg transition-colors"
                    style={{
                      backgroundColor: '#dc2626', // red-600
                      color: 'white',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#b91c1c'; // red-700
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#dc2626'; // red-600
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                // Only close if clicking directly on backdrop
                if (e.target === e.currentTarget) {
                  setDeletingRecipe(null);
                }
              }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              style={{ zIndex: 9998 }}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}