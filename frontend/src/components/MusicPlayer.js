import { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipForward, SkipBack, X, Minus, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MUSIC_TRACKS = [
  { id: 1, name: 'Chill Beats', file: 'chill-beats', duration: '3:45' },
  { id: 2, name: 'Focus Flow', file: 'focus-flow', duration: '4:20' },
  { id: 3, name: 'Motivational Rise', file: 'motivational', duration: '3:10' },
];

export default function MusicPlayer() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isPlayful = theme === 'playful';
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [volume, setVolume] = useState(70);
  
  // Don't show if user doesn't own music player
  if (!user?.music_player_owned) {
    return null;
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    setCurrentTrack((prev) => (prev + 1) % MUSIC_TRACKS.length);
  };

  const handlePrevious = () => {
    setCurrentTrack((prev) => (prev - 1 + MUSIC_TRACKS.length) % MUSIC_TRACKS.length);
  };

  const handleClose = () => {
    setIsVisible(false);
    setIsPlaying(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <Draggable
        handle=".drag-handle"
        bounds="parent"
        defaultPosition={{ x: window.innerWidth - 370, y: window.innerHeight - 250 }}
      >
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className={`fixed z-50 ${
            isMinimized ? 'w-16 h-16' : 'w-80'
          } ${isPlayful ? 'rounded-[1.5rem]' : 'rounded-lg'} bg-card border-2 border-primary shadow-2xl`}
          data-testid="music-player"
          style={{ touchAction: 'none' }}
        >
          {isMinimized ? (
            // Minimized View
            <div
              className="drag-handle w-full h-full flex items-center justify-center cursor-move hover:bg-secondary transition-colors"
              onClick={() => setIsMinimized(false)}
            >
              <Music className="w-6 h-6 text-primary" />
            </div>
          ) : (
            // Full View
            <div className="p-4">
              {/* Header */}
              <div className="drag-handle flex items-center justify-between mb-4 cursor-move">
                <div className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-primary" />
                  <span className="font-bold">Music Player</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsMinimized(true)}
                    className="h-6 w-6 p-0"
                    data-testid="minimize-player"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleClose}
                    className="h-6 w-6 p-0"
                    data-testid="close-player"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Track Info */}
              <div className="mb-4 text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Music className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-lg">{MUSIC_TRACKS[currentTrack].name}</h3>
                <p className="text-sm text-muted-foreground">{MUSIC_TRACKS[currentTrack].duration}</p>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    animate={isPlaying ? { width: ['0%', '100%'] } : {}}
                    transition={isPlaying ? { duration: 200, repeat: Infinity } : {}}
                    style={{ width: '0%' }}
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePrevious}
                  className={isPlayful ? 'rounded-full' : 'rounded-md'}
                  data-testid="previous-track"
                >
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button
                  size="lg"
                  onClick={handlePlayPause}
                  className={`${isPlayful ? 'rounded-full' : 'rounded-md'} w-12 h-12`}
                  data-testid="play-pause"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleNext}
                  className={isPlayful ? 'rounded-full' : 'rounded-md'}
                  data-testid="next-track"
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
              </div>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">🔊</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                  className="flex-1 h-2"
                  data-testid="volume-slider"
                />
                <span className="text-xs text-muted-foreground w-8">{volume}%</span>
              </div>
            </div>
          )}
        </motion.div>
      </Draggable>
    </AnimatePresence>
  );
}