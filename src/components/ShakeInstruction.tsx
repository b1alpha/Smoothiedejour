import { motion } from 'motion/react';
import { Smartphone } from 'lucide-react';

interface ShakeInstructionProps {
  onManualShake: () => void;
  hasFilters: boolean;
  favoritesOnly: boolean;
}

export function ShakeInstruction({ onManualShake, hasFilters, favoritesOnly }: ShakeInstructionProps) {
  if (hasFilters) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="text-center"
      >
        <div className="text-6xl mb-4">{favoritesOnly ? '💔' : '🚫'}</div>
        <h3 className="text-gray-700 mb-2">
          {favoritesOnly ? 'No Favorites Yet' : 'No Recipes Available'}
        </h3>
        <p className="text-sm text-gray-500 px-4">
          {favoritesOnly 
            ? 'Start discovering recipes and tap the ❤️ to save your favorites!'
            : 'Try adjusting your dietary filters to see more recipes'
          }
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className="text-center"
    >
      <motion.div
        animate={{
          rotate: [0, -10, 10, -10, 10, 0],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          repeatDelay: 2,
        }}
        className="mb-6"
      >
        <Smartphone className="w-24 h-24 mx-auto text-purple-400" />
      </motion.div>
      
      <h3 className="text-gray-700 mb-2">Shake Your Phone</h3>
      <p className="text-sm text-gray-500 mb-6 px-4">
        Give your device a good shake to discover<br />a delicious smoothie recipe!
      </p>

      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <button
          onClick={onManualShake}
          className="text-sm text-purple-600 hover:text-purple-700 underline"
        >
          or tap here to get started
        </button>
      </motion.div>
    </motion.div>
  );
}