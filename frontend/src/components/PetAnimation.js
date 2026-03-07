import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PET_CONFIGS = {
  'Mop Pet': {
    emoji: '🧹',
    message: 'Mop is cleaning up! +5 XP',
    xpBonus: 5,
    animation: 'bounce'
  },
  'Dumbbell Pet': {
    emoji: '🏋️',
    message: 'Dumbbell motivates you! +5 XP',
    xpBonus: 5,
    animation: 'pulse'
  },
  'Book Pet': {
    emoji: '📖',
    message: 'Book shares wisdom! +5 XP',
    xpBonus: 5,
    animation: 'float'
  },
  'Zen Stone Pet': {
    emoji: '🪨',
    message: 'Zen Stone brings peace! +5 XP',
    xpBonus: 5,
    animation: 'spin'
  },
  'Dove Pet': {
    emoji: '🕊️',
    message: 'Dove blesses you! +5 XP',
    xpBonus: 5,
    animation: 'fly'
  },
  'Chef Hat Pet': {
    emoji: '👨‍🍳',
    message: 'Chef inspires you! +5 XP',
    xpBonus: 5,
    animation: 'bounce'
  }
};

export default function PetAnimation() {
  const { user, token, refreshUser } = useAuth();
  const [activePet, setActivePet] = useState(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!user || !user.pets_owned || user.pets_owned.length === 0) return;

    // Show pet randomly every 2-5 minutes
    const showPet = () => {
      const randomDelay = Math.random() * 180000 + 120000; // 2-5 minutes
      setTimeout(() => {
        const randomX = Math.random() * (window.innerWidth - 200);
        const randomY = Math.random() * (window.innerHeight - 200);
        setPosition({ x: randomX, y: randomY });
        
        // Pick a random owned pet
        // For demo, we'll use the first pet config
        const petKey = Object.keys(PET_CONFIGS)[0];
        setActivePet(petKey);
        
        // Hide after 5 seconds
        setTimeout(() => {
          setActivePet(null);
        }, 5000);
        
        showPet(); // Schedule next appearance
      }, randomDelay);
    };

    showPet();
  }, [user]);

  const handlePetClick = async () => {
    if (!activePet || !user) return;

    const config = PET_CONFIGS[activePet];
    toast.success(config.message);
    
    try {
      // Award bonus XP (simplified - just show toast for demo)
      await refreshUser();
    } catch (error) {
      console.error('Failed to award pet bonus:', error);
    }
    
    setActivePet(null);
  };

  const getAnimation = (type) => {
    switch(type) {
      case 'bounce':
        return {
          y: [0, -20, 0],
          transition: { duration: 0.6, repeat: Infinity }
        };
      case 'pulse':
        return {
          scale: [1, 1.2, 1],
          transition: { duration: 0.8, repeat: Infinity }
        };
      case 'float':
        return {
          y: [0, -15, 0],
          x: [0, 10, 0],
          transition: { duration: 3, repeat: Infinity }
        };
      case 'spin':
        return {
          rotate: [0, 360],
          transition: { duration: 3, repeat: Infinity, ease: 'linear' }
        };
      case 'fly':
        return {
          y: [0, -30, 0],
          x: [0, 20, -20, 0],
          transition: { duration: 2, repeat: Infinity }
        };
      default:
        return {};
    }
  };

  if (!activePet) return null;

  const config = PET_CONFIGS[activePet];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        className="fixed z-40 cursor-pointer"
        style={{ left: position.x, top: position.y }}
        onClick={handlePetClick}
        data-testid="pet-animation"
      >
        <motion.div
          animate={getAnimation(config.animation)}
          className="text-8xl filter drop-shadow-lg"
        >
          {config.emoji}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-black/80 text-white px-3 py-1 rounded-full text-sm"
        >
          Click me! ✨
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}