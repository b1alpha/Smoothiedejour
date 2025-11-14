import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { useAuth } from '../contexts/AuthContext';
import type { CommunityRecipe } from '../utils/supabase/community';

interface ContributeRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (recipe: Omit<CommunityRecipe, 'id' | 'createdAt'>) => Promise<boolean>;
}

const emojiOptions = ['🥤', '🥭', '🫐', '🍓', '🍌', '🍊', '🥬', '🍑', '🍉', '🥥', '🍍', '🥝'];
const colorOptions = ['#FF6B6B', '#FFA500', '#FFD700', '#32CD32', '#9333EA', '#FF1493', '#4B0082', '#FF6347'];

export function ContributeRecipeModal({ isOpen, onClose, onSubmit }: ContributeRecipeModalProps) {
  const { user, nickname } = useAuth();
  const [name, setName] = useState('');
  // Use user email as initial value, will be updated when modal opens if user changes
  const [contributor, setContributor] = useState('');
  const [emoji, setEmoji] = useState('🥤');
  const [color, setColor] = useState('#9333EA');
  const [ingredients, setIngredients] = useState(['']);
  const [instructions, setInstructions] = useState('');
  const [servings, setServings] = useState('1');
  const [prepTime, setPrepTime] = useState('5 min');
  const [containsFat, setContainsFat] = useState(false);
  const [containsNuts, setContainsNuts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Reset form when modal opens/closes
  // Note: This is a valid use case for syncing external state (user) to form state
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isOpen) {
      // Set contributor from user nickname or email when modal opens
      setContributor(nickname || user?.email || '');
    } else {
      // Reset form when modal closes
      setName('');
      setContributor('');
      setEmoji('🥤');
      setColor('#9333EA');
      setIngredients(['']);
      setInstructions('');
      setServings('1');
      setPrepTime('5 min');
      setContainsFat(false);
      setContainsNuts(false);
      setShowSuccess(false);
    }
  }, [isOpen, user?.email, nickname]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleAddIngredient = () => {
    setIngredients([...ingredients, '']);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const filteredIngredients = ingredients.filter(i => i.trim() !== '');
    
    if (filteredIngredients.length === 0) {
      setIsSubmitting(false);
      return;
    }

    const recipe = {
      name,
      contributor,
      emoji,
      color,
      ingredients: filteredIngredients,
      instructions,
      servings: parseInt(servings),
      prepTime,
      containsFat,
      containsNuts,
    };

    const success = await onSubmit(recipe);
    
    if (success) {
      setShowSuccess(true);
      
      // Wait 1.5 seconds then close and reset
      setTimeout(() => {
        setShowSuccess(false);
        setIsSubmitting(false);
        
        // Reset form
        setName('');
        setContributor('');
        setEmoji('🥤');
        setColor('#9333EA');
        setIngredients(['']);
        setInstructions('');
        setServings('1');
        setPrepTime('5 min');
        setContainsFat(false);
        setContainsNuts(false);
        
        onClose();
      }, 1500);
    } else {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl bg-white rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50">
              <div>
                <h2 className="text-gray-800">Contribute a Recipe</h2>
                <p className="text-sm text-gray-600 mt-1">Share your favorite smoothie with the community</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/50 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className={`flex-1 overflow-y-auto p-6 space-y-6 relative ${showSuccess ? 'opacity-30 pointer-events-none' : ''}`}>
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Recipe Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Tropical Paradise"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="contributor">
                    {user ? 'Your Nickname' : 'Your Name *'}
                  </Label>
                  <Input
                    id="contributor"
                    value={contributor}
                    onChange={(e) => setContributor(e.target.value)}
                    placeholder={user ? (nickname || user.email) : 'e.g., Sarah M.'}
                    required
                    disabled={!!user}
                    className="mt-1"
                  />
                  {user && (
                    <p className="mt-1 text-xs text-gray-500">
                      {nickname ? 'This will appear on your recipes' : 'Set a nickname in your profile to hide your email'}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="servings">Servings</Label>
                    <Input
                      id="servings"
                      type="number"
                      min="1"
                      value={servings}
                      onChange={(e) => setServings(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="prepTime">Prep Time</Label>
                    <Input
                      id="prepTime"
                      value={prepTime}
                      onChange={(e) => setPrepTime(e.target.value)}
                      placeholder="e.g., 5 min"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Visual Customization */}
              <div className="space-y-4">
                <div>
                  <Label>Choose an Emoji</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {emojiOptions.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setEmoji(e)}
                        className={`text-2xl p-2 rounded-lg border-2 transition-all ${
                          emoji === e ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Choose a Color</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {colorOptions.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          color === c ? 'border-gray-800 scale-110' : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Ingredients *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddIngredient}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {ingredients.map((ingredient, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={ingredient}
                        onChange={(e) => handleIngredientChange(index, e.target.value)}
                        placeholder="e.g., 1 cup frozen mango"
                        required={index === 0}
                      />
                      {ingredients.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveIngredient(index)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <Label htmlFor="instructions">Instructions *</Label>
                <Textarea
                  id="instructions"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Describe how to make this smoothie..."
                  required
                  rows={4}
                  className="mt-1"
                />
              </div>

              {/* Dietary Info */}
              <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                <Label>Dietary Information</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    id="containsFat"
                    checked={containsFat}
                    onCheckedChange={setContainsFat}
                  />
                  <Label htmlFor="containsFat" className="cursor-pointer text-sm">
                    Contains fat (dairy, avocado, coconut milk, etc.)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="containsNuts"
                    checked={containsNuts}
                    onCheckedChange={setContainsNuts}
                  />
                  <Label htmlFor="containsNuts" className="cursor-pointer text-sm">
                    Contains nuts or nut products
                  </Label>
                </div>
              </div>
            </form>

            {/* Success Message Overlay */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
                >
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white px-8 py-6 rounded-2xl shadow-2xl text-center">
                    <div className="text-5xl mb-3">✓</div>
                    <h3 className="text-white mb-1">Success!</h3>
                    <p className="text-sm text-white/90">Your recipe has been added</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Recipe'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}