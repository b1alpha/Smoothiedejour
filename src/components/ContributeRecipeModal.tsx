import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { useAuth } from '../contexts/AuthContext';
import type { CommunityRecipe } from '../utils/supabase/community';
import { recipeSchema, type RecipeFormData } from '../utils/validation/recipeSchema';

interface ContributeRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (recipe: Omit<CommunityRecipe, 'id' | 'createdAt'>) => Promise<boolean>;
  editingRecipe?: CommunityRecipe | null;
  onUpdate?: (recipeId: string, recipe: Omit<CommunityRecipe, 'id' | 'createdAt'>) => Promise<boolean>;
}

const emojiOptions = ['🥤', '🥭', '🫐', '🍓', '🍌', '🍊', '🥬', '🍑', '🍉', '🥥', '🍍', '🥝'];
const colorOptions = ['#FF6B6B', '#FFA500', '#FFD700', '#32CD32', '#9333EA', '#FF1493', '#4B0082', '#FF6347'];

export function ContributeRecipeModal({ isOpen, onClose, onSubmit, editingRecipe, onUpdate }: ContributeRecipeModalProps) {
  const { user, nickname } = useAuth();
  const isEditing = !!editingRecipe;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitted, submitCount },
    reset,
    watch,
    setValue,
    trigger,
  } = useForm<RecipeFormData>({
    resolver: zodResolver(recipeSchema),
    mode: 'onBlur', // Validate on blur for better UX
    reValidateMode: 'onBlur', // Re-validate on blur
    defaultValues: {
      name: '',
      contributor: '',
      emoji: '🥤',
      color: '#9333EA',
      ingredients: [''],
      instructions: '',
      servings: '1',
      prepTime: '5 min',
      containsFat: false,
      containsNuts: false,
    },
  });

  const watchedIngredients = watch('ingredients');
  const watchedEmoji = watch('emoji');
  const watchedColor = watch('color');

  // Reset form when modal opens/closes or editing recipe changes
  useEffect(() => {
    if (isOpen) {
      setSubmitAttempted(false);
      if (editingRecipe) {
        reset({
          name: editingRecipe.name,
          contributor: editingRecipe.contributor,
          emoji: editingRecipe.emoji,
          color: editingRecipe.color,
          ingredients: editingRecipe.ingredients.length > 0 ? editingRecipe.ingredients : [''],
          instructions: editingRecipe.instructions,
          servings: String(editingRecipe.servings),
          prepTime: editingRecipe.prepTime,
          containsFat: editingRecipe.containsFat,
          containsNuts: editingRecipe.containsNuts,
        });
      } else {
        reset({
          name: '',
          contributor: nickname || user?.email || '',
          emoji: '🥤',
          color: '#9333EA',
          ingredients: [''],
          instructions: '',
          servings: '1',
          prepTime: '5 min',
          containsFat: false,
          containsNuts: false,
        });
      }
    } else {
      setSubmitAttempted(false);
      reset();
    }
  }, [isOpen, user?.email, nickname, editingRecipe, reset]);

  const handleAddIngredient = () => {
    const current = watchedIngredients || [''];
    setValue('ingredients', [...current, ''], { shouldValidate: false });
  };

  const handleRemoveIngredient = (index: number) => {
    const current = watchedIngredients || [''];
    if (current.length > 1) {
      setValue('ingredients', current.filter((_, i) => i !== index), { shouldValidate: true });
    }
  };

  const [showSuccess, setShowSuccess] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const onFormSubmit = async (data: RecipeFormData) => {
    // Don't set submitAttempted here - only set it in handleFormError
    const recipe = {
      name: data.name,
      contributor: data.contributor,
      emoji: data.emoji,
      color: data.color,
      ingredients: data.ingredients.filter(i => i.trim() !== ''),
      instructions: data.instructions,
      servings: parseInt(data.servings, 10),
      prepTime: data.prepTime,
      containsFat: data.containsFat,
      containsNuts: data.containsNuts,
    };

    let success = false;
    if (isEditing && editingRecipe && onUpdate) {
      success = await onUpdate(editingRecipe.id, recipe);
    } else {
      success = await onSubmit(recipe);
    }

    if (success) {
      setShowSuccess(true);
      // Wait 1.5 seconds then close and reset
      setTimeout(() => {
        setShowSuccess(false);
        reset();
        onClose();
      }, 1500);
    } else {
      // Reset success state if submission failed
      setShowSuccess(false);
    }
  };

  const handleFormError = async (errors: any) => {
    // Set submitAttempted to show error summary
    setSubmitAttempted(true);
    // Trigger validation on all fields to ensure errors are populated
    await trigger();
    // Small delay to ensure React state updates
    await new Promise(resolve => setTimeout(resolve, 50));
    // Scroll to first error field
    setTimeout(() => {
      const firstErrorField = document.querySelector('[aria-invalid="true"]');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (firstErrorField instanceof HTMLElement) {
          firstErrorField.focus();
        }
      }
    }, 100);
  };

  // Show error summary if there are errors and form has been submitted/attempted
  // Use submitAttempted state to ensure summary shows even if submitCount doesn't increment immediately
  const hasAnyErrors = Object.values(errors).some(err => err != null);
  const hasErrors = hasAnyErrors && (submitAttempted || submitCount > 0);

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
                <h2 className="text-gray-800">{isEditing ? 'Edit Recipe' : 'Contribute a Recipe'}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {isEditing ? 'Update your smoothie recipe' : 'Share your favorite smoothie with the community'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/50 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Form */}
            <form id="recipe-form" onSubmit={handleSubmit(onFormSubmit, handleFormError)} className={`flex-1 overflow-y-auto p-6 space-y-6 relative ${showSuccess ? 'opacity-30 pointer-events-none' : ''}`}>
              {/* Validation Error Summary */}
              {hasErrors && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"
                  data-testid="error-summary"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 text-lg">⚠️</span>
                    <div className="flex-1">
                      <h3 className="text-red-800 font-semibold text-base mb-1">Please fix the following errors:</h3>
                      <ul className="list-disc list-inside text-base text-red-700 space-y-1 font-medium">
                        {errors.name && (
                          <li data-testid="error-name">Recipe Name: {errors.name.message || 'Recipe name is required'}</li>
                        )}
                        {errors.contributor && (
                          <li data-testid="error-contributor">Contributor: {errors.contributor.message}</li>
                        )}
                        {errors.ingredients && (
                          <li data-testid="error-ingredients">Ingredients: {errors.ingredients.message}</li>
                        )}
                        {errors.instructions && (
                          <li data-testid="error-instructions">Instructions: {errors.instructions.message}</li>
                        )}
                        {errors.servings && (
                          <li data-testid="error-servings">Servings: {errors.servings.message}</li>
                        )}
                        {errors.prepTime && (
                          <li data-testid="error-prepTime">Prep Time: {errors.prepTime.message}</li>
                        )}
                        {errors.emoji && (
                          <li data-testid="error-emoji">Emoji: {errors.emoji.message}</li>
                        )}
                        {errors.color && (
                          <li data-testid="error-color">Color: {errors.color.message}</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Recipe Name *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="e.g., Tropical Paradise"
                    aria-invalid={errors.name ? 'true' : 'false'}
                    className={`mt-1 ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-base text-red-600 font-medium">{errors.name.message || 'Recipe name is required'}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="contributor">
                    {user ? 'Your Nickname' : 'Your Name *'}
                  </Label>
                  <Input
                    id="contributor"
                    {...register('contributor')}
                    placeholder={user ? (nickname || user.email) : 'e.g., Sarah M.'}
                    disabled={!!user}
                    aria-invalid={errors.contributor ? 'true' : 'false'}
                    className={`mt-1 ${errors.contributor ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {errors.contributor && (
                    <p className="mt-1 text-base text-red-600 font-medium">{errors.contributor.message || 'Contributor name is required'}</p>
                  )}
                  {user && !errors.contributor && (
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
                      max="100"
                      defaultValue="1"
                      {...register('servings')}
                      aria-invalid={errors.servings ? 'true' : 'false'}
                      className={`mt-1 ${errors.servings ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {errors.servings && (
                      <p className="mt-1 text-base text-red-600 font-medium">{errors.servings.message || 'Servings must be a number between 1 and 100'}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="prepTime">Prep Time</Label>
                    <Input
                      id="prepTime"
                      {...register('prepTime')}
                      placeholder="e.g., 5 min"
                      aria-invalid={errors.prepTime ? 'true' : 'false'}
                      className={`mt-1 ${errors.prepTime ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {errors.prepTime && (
                      <p className="mt-1 text-base text-red-600 font-medium">{errors.prepTime.message || 'Prep time is required'}</p>
                    )}
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
                        onClick={() => {
                          setValue('emoji', e, { shouldValidate: true });
                          trigger('emoji');
                        }}
                        className={`text-2xl p-2 rounded-lg border-2 transition-all ${
                          watchedEmoji === e ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                  {errors.emoji && (
                    <p className="mt-1 text-base text-red-600 font-medium">{errors.emoji.message || 'Please select an emoji'}</p>
                  )}
                </div>

                <div>
                  <Label>Choose a Color</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {colorOptions.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setValue('color', c, { shouldValidate: true });
                          trigger('color');
                        }}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          watchedColor === c ? 'border-gray-800 scale-110' : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  {errors.color && (
                    <p className="mt-1 text-base text-red-600 font-medium">{errors.color.message || 'Please select a valid color'}</p>
                  )}
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
                  {watchedIngredients?.map((ingredient, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          {...register(`ingredients.${index}` as const)}
                          placeholder="e.g., 1 cup frozen mango"
                          aria-invalid={errors.ingredients ? 'true' : 'false'}
                          className={errors.ingredients && index === 0 ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                        />
                      </div>
                      {watchedIngredients.length > 1 && (
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
                  {errors.ingredients && (
                    <p className="text-base text-red-600 font-medium">{errors.ingredients.message || 'At least one ingredient is required'}</p>
                  )}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <Label htmlFor="instructions">Instructions *</Label>
                <Textarea
                  id="instructions"
                  {...register('instructions')}
                  placeholder="Describe how to make this smoothie..."
                  rows={4}
                  aria-invalid={errors.instructions ? 'true' : 'false'}
                  className={`mt-1 ${errors.instructions ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {errors.instructions && (
                  <p className="mt-1 text-base text-red-600 font-medium">{errors.instructions.message || 'Instructions are required'}</p>
                )}
              </div>

              {/* Dietary Info */}
              <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                <Label>Dietary Information</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    id="containsFat"
                    {...register('containsFat')}
                  />
                  <Label htmlFor="containsFat" className="cursor-pointer text-sm">
                    Contains fat (dairy, avocado, coconut milk, etc.)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="containsNuts"
                    {...register('containsNuts')}
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
                  className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none bg-white/90"
                >
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white px-8 py-6 rounded-2xl shadow-2xl text-center">
                    <div className="text-5xl mb-3">✓</div>
                    <h3 className="text-white mb-1">Success!</h3>
                    <p className="text-sm text-white/90">{isEditing ? 'Your recipe has been updated' : 'Your recipe has been added'}</p>
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
                type="submit"
                form="recipe-form"
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                disabled={isSubmitting || showSuccess}
              >
                {isSubmitting ? (isEditing ? 'Updating...' : 'Submitting...') : (isEditing ? 'Update Recipe' : 'Submit Recipe')}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

