import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, ArrowLeft, ShoppingBag, Sparkles, Coins, Clock } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ChoresSector() {
  const { user, token, refreshUser } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isPlayful = theme === 'playful';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [recentChores, setRecentChores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logType, setLogType] = useState('timer');
  const [manualHours, setManualHours] = useState('');
  const [manualMinutes, setManualMinutes] = useState('');
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchRecentChores();
  }, [user]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(t => t + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const fetchRecentChores = async () => {
    try {
      const response = await axios.get(`${API}/chores`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecentChores(response.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch chores:', error);
    }
  };

  const handleStartStop = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
  };

  const handleComplete = async () => {
    if (!title.trim()) {
      toast.error('Please enter a chore title');
      return;
    }

    let durationSeconds = 0;
    
    if (logType === 'timer') {
      if (time === 0) {
        toast.error('Timer must be greater than 0');
        return;
      }
      durationSeconds = time;
    } else {
      const hours = parseInt(manualHours) || 0;
      const minutes = parseInt(manualMinutes) || 0;
      if (hours === 0 && minutes === 0) {
        toast.error('Please enter a valid duration');
        return;
      }
      durationSeconds = (hours * 3600) + (minutes * 60);
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API}/chores`,
        { title, description, duration: durationSeconds },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const chore = response.data;
      toast.success(
        `Chore completed! +${chore.xp_earned} XP, +${chore.coins_earned} Coins`,
        { duration: 4000 }
      );

      await refreshUser();
      await fetchRecentChores();

      setTitle('');
      setDescription('');
      setTime(0);
      setManualHours('');
      setManualMinutes('');
      setIsRunning(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to complete chore');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!user) return null;

  const choreXpForNextLevel = Math.pow(user.chore_level, 2) * 100;
  const choreXpProgress = (user.chore_xp % choreXpForNextLevel) / choreXpForNextLevel * 100;

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
          <h1 className="text-3xl font-bold">Chores</h1>
          <Button
            onClick={() => navigate('/shop')}
            className={`${isPlayful ? 'rounded-full' : 'rounded-md'} px-6`}
            data-testid="shop-button"
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            Shop
          </Button>
        </div>

        {/* Chore Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`bg-card p-6 border ${isPlayful ? 'playful-border playful-shadow rounded-[1.5rem]' : 'clean-border clean-shadow rounded-lg'}`} data-testid="chore-xp-card">
            <Sparkles className="w-8 h-8 text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Chore XP</p>
            <p className="text-2xl font-bold text-foreground">{user.chore_xp}</p>
          </div>

          <div className={`bg-card p-6 border ${isPlayful ? 'playful-border playful-shadow rounded-[1.5rem]' : 'clean-border clean-shadow rounded-lg'}`} data-testid="chore-coins-card">
            <Coins className="w-8 h-8 text-accent mb-2" />
            <p className="text-sm text-muted-foreground">Chore Coins</p>
            <p className="text-2xl font-bold text-foreground">{user.chore_coins}</p>
          </div>

          <div className={`col-span-2 bg-card p-6 border ${isPlayful ? 'playful-border playful-shadow rounded-[1.5rem]' : 'clean-border clean-shadow rounded-lg'}`} data-testid="chore-level-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">Chore Level</p>
              <p className="text-2xl font-bold">Level {user.chore_level}</p>
            </div>
            <Progress value={choreXpProgress} className="h-4" />
            <p className="text-xs text-muted-foreground mt-2">
              {Math.floor(choreXpProgress)}% to Level {user.chore_level + 1}
            </p>
          </div>
        </div>

        {/* Chore Form */}
        <div className={`bg-card p-6 border ${isPlayful ? 'playful-border playful-shadow rounded-[1.5rem]' : 'clean-border clean-shadow rounded-lg'}`}>
          <h2 className="text-xl font-bold mb-4">Log a Chore</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Chore Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Cleaned the kitchen"
                data-testid="chore-title-input"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details..."
                data-testid="chore-description-input"
                className="mt-1"
              />
            </div>

            {/* Time Entry Tabs */}
            <Tabs value={logType} onValueChange={setLogType} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="timer" data-testid="timer-tab">
                  <Play className="w-4 h-4 mr-2" />
                  Timer
                </TabsTrigger>
                <TabsTrigger value="manual" data-testid="manual-tab">
                  <Clock className="w-4 h-4 mr-2" />
                  Manual Entry
                </TabsTrigger>
              </TabsList>

              <TabsContent value="timer" className="mt-4">
                <div className="text-center py-6">
                  <motion.div
                    animate={isPlayful && isRunning ? { scale: [1, 1.02, 1] } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-6xl font-bold mb-6"
                    data-testid="timer-display"
                  >
                    {formatTime(time)}
                  </motion.div>

                  <div className="flex gap-4 justify-center">
                    <Button
                      onClick={handleStartStop}
                      className={isPlayful ? 'rounded-full' : 'rounded-md'}
                      data-testid="timer-start-stop-button"
                    >
                      {isRunning ? (
                        <><Pause className="w-4 h-4 mr-2" /> Pause</>
                      ) : (
                        <><Play className="w-4 h-4 mr-2" /> Start</>
                      )}
                    </Button>
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      className={isPlayful ? 'rounded-full' : 'rounded-md'}
                      data-testid="timer-reset-button"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" /> Reset
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="manual" className="mt-4">
                <div className="py-6 space-y-4">
                  <div className="text-center mb-4">
                    <Clock className="w-12 h-12 text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Enter the time you spent</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="manual-hours">Hours</Label>
                      <Input
                        id="manual-hours"
                        type="number"
                        min="0"
                        value={manualHours}
                        onChange={(e) => setManualHours(e.target.value)}
                        placeholder="0"
                        data-testid="manual-hours-input"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="manual-minutes">Minutes</Label>
                      <Input
                        id="manual-minutes"
                        type="number"
                        min="0"
                        max="59"
                        value={manualMinutes}
                        onChange={(e) => setManualMinutes(e.target.value)}
                        placeholder="0"
                        data-testid="manual-minutes-input"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  {(manualHours || manualMinutes) && (
                    <div className="text-center text-sm text-muted-foreground">
                      Total: {manualHours || '0'}h {manualMinutes || '0'}m
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <Button
              onClick={handleComplete}
              className={`w-full ${isPlayful ? 'rounded-full' : 'rounded-md'}`}
              disabled={loading || !title.trim() || (logType === 'timer' && time === 0) || (logType === 'manual' && !manualHours && !manualMinutes)}
              data-testid="complete-chore-button"
            >
              {loading ? 'Completing...' : 'Complete Chore'}
            </Button>
          </div>
        </div>

        {/* Recent Chores */}
        {recentChores.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Recent Chores</h2>
            <div className="space-y-3">
              {recentChores.map((chore) => (
                <div
                  key={chore.id}
                  className={`bg-card p-4 border ${isPlayful ? 'playful-border rounded-[1.5rem]' : 'clean-border rounded-lg'}`}
                  data-testid={`recent-chore-${chore.id}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{chore.title}</p>
                      {chore.description && (
                        <p className="text-sm text-muted-foreground">{chore.description}</p>
                      )}
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-primary font-semibold">+{chore.xp_earned} XP</p>
                      <p className="text-accent font-semibold">+{chore.coins_earned} Coins</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatTime(chore.duration)} • {new Date(chore.completed_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}