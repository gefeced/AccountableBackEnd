import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShoppingCart, Sparkles, Coins, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SECTOR_CONFIG = {
  chores: { name: 'Chores', icon: '🧹' },
  fitness: { name: 'Fitness', icon: '💪' },
  learning: { name: 'Learning', icon: '📚' },
  mind: { name: 'Mind', icon: '🧠' },
  faith: { name: 'Faith', icon: '🙏' },
  cooking: { name: 'Cooking', icon: '🍳' }
};

export default function GenericSectorShop() {
  const { sector } = useParams();
  const { user, token, refreshUser } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isPlayful = theme === 'playful';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [previewingItem, setPreviewingItem] = useState(null);
  const [previewedItems, setPreviewedItems] = useState(new Set());

  const sectorConfig = SECTOR_CONFIG[sector] || SECTOR_CONFIG.chores;
  const sectorCoinsField = `${sector}_coins`;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchShopItems();
  }, [user, sector]);

  const fetchShopItems = async () => {
    try {
      const response = await axios.get(`${API}/shop/items/${sector}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(response.data);
    } catch (error) {
      toast.error('Failed to load shop items');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (item) => {
    if (previewedItems.has(item.id)) {
      if (user.coins < 10) {
        toast.error('Need 10 coins to preview again!');
        return;
      }
      
      try {
        await axios.patch(
          `${API}/user/profile`,
          { coins: user.coins - 10 },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        await refreshUser();
        toast.success('Preview unlocked! -10 coins');
        setPreviewingItem(item);
      } catch (error) {
        toast.error('Failed to unlock preview');
      }
    } else {
      if (user.coins < 10) {
        toast.error('Need 10 coins to preview!');
        return;
      }
      
      try {
        await axios.patch(
          `${API}/user/profile`,
          { coins: user.coins - 10 },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        await refreshUser();
        toast.success('Preview unlocked! -10 coins');
        setPreviewingItem(item);
        setPreviewedItems(new Set([...previewedItems, item.id]));
      } catch (error) {
        toast.error('Failed to unlock preview');
      }
    }
  };

  const closePreview = () => {
    setPreviewingItem(null);
  };

  const handlePurchase = async (item) => {
    if (user[sectorCoinsField] < item.cost) {
      toast.error(`Insufficient ${sectorConfig.name} coins!`);
      return;
    }

    setPurchasing(item.id);
    try {
      await axios.post(
        `${API}/shop/purchase`,
        { item_id: item.id, sector },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Purchased ${item.name}!`);
      await refreshUser();
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
            onClick={() => navigate(`/sector/${sector}`)}
            variant="ghost"
            className={isPlayful ? 'rounded-full' : 'rounded-md'}
            data-testid="back-button"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{sectorConfig.icon}</span>
            <h1 className="text-3xl font-bold">{sectorConfig.name} Shop</h1>
          </div>
          <div className="w-10"></div>
        </div>

        {/* Balance */}
        <div className={`bg-primary p-6 ${isPlayful ? 'rounded-[1.5rem] playful-shadow' : 'rounded-lg clean-shadow'}`}>
          <div className="flex items-center justify-between text-primary-foreground">
            <div>
              <p className="text-sm opacity-90">Your {sectorConfig.name} Coins</p>
              <p className="text-4xl font-bold">{user[sectorCoinsField]}</p>
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

                <div className="text-center mb-6">
                  {previewingItem.type === 'pet' && <span className="text-9xl block mb-4">🐾</span>}
                  {previewingItem.type === 'powerup' && <Sparkles className="w-24 h-24 text-primary mx-auto mb-4" />}
                  {previewingItem.type === 'theme' && <span className="text-9xl block mb-4">🎨</span>}
                  {previewingItem.type === 'background' && <span className="text-9xl block mb-4">🖼️</span>}
                </div>

                <p className="text-center text-muted-foreground mb-6">
                  {previewingItem.description}
                </p>

                <div className="bg-secondary p-4 rounded-lg mb-6 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Price</p>
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
                  disabled={user[sectorCoinsField] < previewingItem.cost}
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
                const canAfford = user[sectorCoinsField] >= item.cost;
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
                        {type === 'pet' && <span className="text-4xl">🐾</span>}
                        {type === 'powerup' && <Sparkles className="w-10 h-10 text-primary" />}
                        {type === 'theme' && <span className="text-4xl">🎨</span>}
                        {type === 'background' && <span className="text-4xl">🖼️</span>}
                      </div>
                    </div>
                    <Button
                      onClick={() => handlePurchase(item)}
                      disabled={!canAfford || purchasing === item.id}
                      className={`w-full ${isPlayful ? 'rounded-full' : 'rounded-md'} mb-2`}
                      data-testid={`purchase-button-${item.id}`}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {purchasing === item.id
                        ? 'Purchasing...'
                        : canAfford
                        ? 'Purchase'
                        : 'Insufficient Coins'}
                    </Button>
                    <Button
                      onClick={() => handlePreview(item)}
                      variant="outline"
                      disabled={user.coins < 10}
                      className={`w-full ${isPlayful ? 'rounded-full' : 'rounded-md'}`}
                      data-testid={`preview-button-${item.id}`}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {previewedItems.has(item.id) ? 'Preview Again (10 coins)' : 'Preview (10 coins)'}
                    </Button>
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