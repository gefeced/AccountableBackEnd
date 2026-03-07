import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShoppingCart, Coins, Music, Trophy, Award, Eye, X, Clock, Timer } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const PREVIEW_COST = 10;

export default function MainShop() {
  const { user, token, refreshUser } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isPlayful = theme === 'playful';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [previewingItem, setPreviewingItem] = useState(null);
  const [activePreviews, setActivePreviews] = useState({});
  const [previewTimers, setPreviewTimers] = useState({});
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchShopItems();
    fetchActivePreviews();
  }, [user]);

  // Timer countdown effect
  useEffect(() => {
    if (Object.keys(activePreviews).length > 0) {
      timerIntervalRef.current = setInterval(() => {
        setPreviewTimers(prev => {
          const updated = { ...prev };
          let hasChanges = false;
          
          Object.keys(activePreviews).forEach(itemId => {
            const expiresAt = new Date(activePreviews[itemId].expires_at);
            const now = new Date();
            const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
            
            if (remaining !== prev[itemId]) {
              updated[itemId] = remaining;
              hasChanges = true;
            }
            
            // Preview expired
            if (remaining === 0 && prev[itemId] > 0) {
              toast.info('Preview expired!');
              setActivePreviews(current => {
                const newPreviews = { ...current };
                delete newPreviews[itemId];
                return newPreviews;
              });
            }
          });
          
          return hasChanges ? updated : prev;
        });
      }, 1000);
    }
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [activePreviews]);

  const fetchShopItems = async () => {
    try {
      const response = await axios.get(`${API}/shop/items/main`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(response.data);
    } catch (error) {
      toast.error('Failed to load shop items');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivePreviews = async () => {
    try {
      const response = await axios.get(`${API}/shop/previews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const previewsMap = {};
      const timersMap = {};
      response.data.previews.forEach(preview => {
        previewsMap[preview.item.id] = preview;
        timersMap[preview.item.id] = preview.remaining_seconds;
      });
      setActivePreviews(previewsMap);
      setPreviewTimers(timersMap);
    } catch (error) {
      console.error('Failed to fetch active previews:', error);
    }
  };

  const handlePreview = async (item) => {
    // Check if already has active preview
    if (activePreviews[item.id] && previewTimers[item.id] > 0) {
      setPreviewingItem({ ...item, isActivePreview: true, remainingTime: previewTimers[item.id] });
      return;
    }

    // Check if user has enough coins
    if (user.coins < PREVIEW_COST) {
      toast.error(`Insufficient coins! Preview costs ${PREVIEW_COST} coins.`);
      return;
    }

    try {
      const response = await axios.post(
        `${API}/shop/preview`,
        { item_id: item.id, sector: 'main' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        const previewData = {
          item: response.data.item,
          expires_at: response.data.expires_at,
          remaining_seconds: response.data.remaining_seconds
        };
        
        setActivePreviews(prev => ({ ...prev, [item.id]: previewData }));
        setPreviewTimers(prev => ({ ...prev, [item.id]: response.data.remaining_seconds }));
        
        if (!response.data.already_active) {
          toast.success(`Preview started! You have 2.5 minutes to try "${item.name}"`);
        }
        
        setPreviewingItem({ ...item, isActivePreview: true, remainingTime: response.data.remaining_seconds });
        await refreshUser();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to start preview');
    }
  };

  const closePreview = () => {
    setPreviewingItem(null);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePurchase = async (item) => {
    if (user.coins < item.cost) {
      toast.error('Insufficient coins!');
      return;
    }

    if (item.type === 'tool' && item.name === 'Music Player' && user.music_player_owned) {
      toast.error('You already own the Music Player!');
      return;
    }

    setPurchasing(item.id);
    try {
      await axios.post(
        `${API}/shop/purchase`,
        { item_id: item.id, sector: 'main' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Purchased ${item.name}!`);
      await refreshUser();
      
      if (item.type === 'tool' && item.name === 'Music Player') {
        toast.success('Music Player is now available! Look for the music icon.', { duration: 5000 });
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Purchase failed');
    } finally {
      setPurchasing(null);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const itemsByType = items.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            className={isPlayful ? 'rounded-full' : 'rounded-md'}
            data-testid="back-button"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold">🏪 Main Shop</h1>
          <div className="w-10"></div>
        </div>

        {/* Balance */}
        <div className={`bg-primary p-6 ${isPlayful ? 'rounded-[1.5rem] playful-shadow' : 'rounded-lg clean-shadow'}`}>
          <div className="flex items-center justify-between text-primary-foreground">
            <div>
              <p className="text-sm opacity-90">Your Total Coins</p>
              <p className="text-4xl font-bold">{user.coins}</p>
            </div>
            <Coins className="w-12 h-12 opacity-80" />
          </div>
        </div>

        {/* Preview Modal */}
        <AnimatePresence>
          {previewingItem && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={closePreview}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className={`bg-card p-8 max-w-md w-full ${isPlayful ? 'rounded-[1.5rem]' : 'rounded-lg'} border-2 border-primary`}
                data-testid="preview-modal"
              >
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold">{previewingItem.name}</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closePreview}
                    data-testid="close-preview"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Active Preview Timer */}
                {previewingItem.isActivePreview && previewTimers[previewingItem.id] > 0 && (
                  <div className="bg-green-500/20 border border-green-500 rounded-lg p-4 mb-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Timer className="w-5 h-5 text-green-500" />
                      <span className="text-green-500 font-bold">Preview Active!</span>
                    </div>
                    <p className="text-3xl font-bold text-green-500">
                      {formatTime(previewTimers[previewingItem.id])}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Time remaining</p>
                  </div>
                )}

                <div className="text-center mb-6">
                  {previewingItem.type === 'tool' && (
                    <Music className="w-24 h-24 text-primary mx-auto mb-4" />
                  )}
                  {previewingItem.type === 'trophy' && (
                    <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-4" />
                  )}
                  {previewingItem.type === 'badge' && (
                    <Award className="w-24 h-24 text-blue-500 mx-auto mb-4" />
                  )}
                  {previewingItem.type === 'music' && (
                    <span className="text-9xl block mb-4">🎵</span>
                  )}
                </div>

                <p className="text-center text-muted-foreground mb-6">
                  {previewingItem.description}
                </p>

                <div className="bg-secondary p-4 rounded-lg mb-6 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Full Purchase Price</p>
                  <div className="flex items-center justify-center gap-2">
                    <Coins className="w-6 h-6 text-accent" />
                    <span className="text-3xl font-bold">{previewingItem.cost}</span>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    closePreview();
                    handlePurchase(previewingItem);
                  }}
                  className={`w-full ${isPlayful ? 'rounded-full' : 'rounded-md'}`}
                  disabled={user.coins < previewingItem.cost}
                >
                  Purchase Now
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Shop Items */}
        {Object.entries(itemsByType).map(([type, typeItems]) => (
          <div key={type}>
            <h2 className="text-2xl font-bold mb-4 capitalize">{type}s</h2>
            <div className="grid gap-4">
              {typeItems.map((item) => {
                const canAfford = user.coins >= item.cost;
                const isOwned = item.type === 'tool' && item.name === 'Music Player' && user.music_player_owned;
                
                return (
                  <motion.div
                    key={item.id}
                    whileHover={isPlayful ? { scale: 1.02 } : {}}
                    className={`bg-card p-6 border ${isPlayful ? 'playful-border playful-shadow rounded-[1.5rem]' : 'clean-border clean-shadow rounded-lg'}`}
                    data-testid={`shop-item-${item.id}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold mb-1">{item.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                        <div className="flex items-center gap-2">
                          <Coins className="w-5 h-5 text-accent" />
                          <span className="text-xl font-bold">{item.cost}</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        {type === 'tool' && <Music className="w-10 h-10 text-primary" />}
                        {type === 'trophy' && <Trophy className="w-10 h-10 text-yellow-500" />}
                        {type === 'badge' && <Award className="w-10 h-10 text-blue-500" />}
                        {type === 'music' && <span className="text-4xl">🎵</span>}
                      </div>
                    </div>
                    <Button
                      onClick={() => handlePurchase(item)}
                      disabled={!canAfford || purchasing === item.id || isOwned}
                      className={`w-full ${isPlayful ? 'rounded-full' : 'rounded-md'} mb-2`}
                      data-testid={`purchase-button-${item.id}`}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {purchasing === item.id
                        ? 'Purchasing...'
                        : isOwned
                        ? 'Already Owned'
                        : canAfford
                        ? 'Purchase'
                        : 'Insufficient Coins'}
                    </Button>
                    {activePreviews[item.id] && previewTimers[item.id] > 0 ? (
                      <Button
                        onClick={() => handlePreview(item)}
                        variant="outline"
                        className={`w-full ${isPlayful ? 'rounded-full' : 'rounded-md'} border-green-500 text-green-500`}
                        data-testid={`preview-button-${item.id}`}
                      >
                        <Timer className="w-4 h-4 mr-2" />
                        Preview Active: {formatTime(previewTimers[item.id])}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handlePreview(item)}
                        variant="outline"
                        className={`w-full ${isPlayful ? 'rounded-full' : 'rounded-md'}`}
                        data-testid={`preview-button-${item.id}`}
                        disabled={user.coins < PREVIEW_COST}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview ({PREVIEW_COST} coins)
                      </Button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}