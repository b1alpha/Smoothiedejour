import { motion } from 'motion/react';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Heart } from 'lucide-react';

interface FilterTogglesProps {
  noFat: boolean;
  noNuts: boolean;
  favoritesOnly: boolean;
  onNoFatChange: (value: boolean) => void;
  onNoNutsChange: (value: boolean) => void;
  onFavoritesOnlyChange: (value: boolean) => void;
  filteredCount: number;
  totalCount: number;
  favoritesCount: number;
}

export function FilterToggles({
  noFat,
  noNuts,
  favoritesOnly,
  onNoFatChange,
  onNoNutsChange,
  onFavoritesOnlyChange,
  filteredCount,
  totalCount,
  favoritesCount,
}: FilterTogglesProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-6 bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-sm"
    >
      <div className="flex items-center justify-center gap-4 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Switch
            id="no-fat"
            checked={noFat}
            onCheckedChange={onNoFatChange}
          />
          <Label htmlFor="no-fat" className="cursor-pointer text-sm text-gray-700">
            No Fat
          </Label>
        </div>
        
        <div className="flex items-center gap-2">
          <Switch
            id="no-nuts"
            checked={noNuts}
            onCheckedChange={onNoNutsChange}
          />
          <Label htmlFor="no-nuts" className="cursor-pointer text-sm text-gray-700">
            No Nuts
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="favorites-only"
            checked={favoritesOnly}
            onCheckedChange={onFavoritesOnlyChange}
          />
          <Label htmlFor="favorites-only" className="cursor-pointer text-sm text-gray-700 flex items-center gap-1">
            <Heart className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-red-500 stroke-red-500' : ''}`} />
            Favorites Only
          </Label>
        </div>
      </div>
      
      <p className="text-xs text-center text-gray-500">
        {filteredCount === 0 ? (
          <span className="text-orange-600">
            {favoritesOnly && favoritesCount === 0 
              ? 'No favorites yet - start liking recipes!' 
              : 'No recipes match your filters'}
          </span>
        ) : (
          <span>
            {filteredCount} of {totalCount} recipes available
            {favoritesCount > 0 && ` • ${favoritesCount} ${favoritesCount === 1 ? 'favorite' : 'favorites'}`}
          </span>
        )}
      </p>
    </motion.div>
  );
}