
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MatchSettings, GameType, GameMode, MenuItem, OrderItem, Table, PriceConfig, TimeSlot } from '../types';
import { Play, Pause, RefreshCw, XCircle, Settings, Edit2, RotateCcw, Volume2, VolumeX, Trophy, Utensils, Coffee, CheckCircle, X, Plus, Minus, MapPin, Receipt, QrCode } from 'lucide-react';
import { APP_COLORS, MENU_ITEMS, TABLES_STORAGE_KEY, PRICING_STORAGE_KEY, DEFAULT_BASE_RATES, DEFAULT_TIME_SLOTS } from '../constants';

interface ScoreboardScreenProps {
  settings: MatchSettings;
}

const ScoreboardScreen: React.FC<ScoreboardScreenProps> = ({ settings }) => {
  const navigate = useNavigate();
  
  // Player Names State (Editable)
  const [playerNames, setPlayerNames] = useState<string[]>(settings.players.map(p => p.name));
  const [editingPlayer, setEditingPlayer] = useState<number | null>(null);
  const [tempName, setTempName] = useState("");

  // Game State
  const [scores, setScores] = useState<number[]>(settings.players.map(() => 0));
  const [currentTurn, setCurrentTurn] = useState<number>(0); // Index of player
  const [innings, setInnings] = useState<number>(1); // Lượt cơ
  const [highRuns, setHighRuns] = useState<number[]>(settings.players.map(() => 0));
  const [currentRun, setCurrentRun] = useState<number>(0);
  
  // Timer State
  const defaultShotTime = settings.shotSeconds || 40;
  const [shotTimer, setShotTimer] = useState<number>(defaultShotTime);
  const [isPaused, setIsPaused] = useState<boolean>(true);
  const [matchDuration, setMatchDuration] = useState<number>(0); // Total match time in seconds
  
  // UI State
  const [isMuted, setIsMuted] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [winner, setWinner] = useState<{index: number, name: string} | null>(null);

  // Identity State
  const [tableName, setTableName] = useState<string>("");
  const [currentTable, setCurrentTable] = useState<Table | null>(null);

  // Ordering State
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [orderStatus, setOrderStatus] = useState<'idle' | 'success'>('idle');

  // Payment State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [baseRates, setBaseRates] = useState<PriceConfig>(DEFAULT_BASE_RATES);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(DEFAULT_TIME_SLOTS);

  // Load Table Info & Pricing
  useEffect(() => {
    const storedPricing = localStorage.getItem(PRICING_STORAGE_KEY);
    if (storedPricing) {
        const parsed = JSON.parse(storedPricing);
        if (parsed.baseRates) setBaseRates(parsed.baseRates);
        if (parsed.timeSlots) setTimeSlots(parsed.timeSlots);
    }

    if (settings.tableId) {
        const loadTable = () => {
            const stored = localStorage.getItem(TABLES_STORAGE_KEY);
            if (stored) {
                const tables = JSON.parse(stored) as Table[];
                const t = tables.find(t => t.id === settings.tableId);
                if (t) {
                    setTableName(t.name);
                    setCurrentTable(t);
                }
            }
        };
        loadTable();
        // Poll for updates (e.g., if admin changes table or orders)
        const interval = setInterval(loadTable, 5000);
        return () => clearInterval(interval);
    }
  }, [settings.tableId]);

  // Pricing Helpers (Mirrored from ClubManager)
  const getRateForTime = (type: GameType, timestamp: number): number => {
    const date = new Date(timestamp);
    const hour = date.getHours();
    const base = baseRates[type];
    const slot = timeSlots.find(s => hour >= s.startHour && hour < s.endHour);
    return slot ? base * slot.multiplier : base;
  };

  const calculateSessionCost = () => {
    if (!currentTable?.startTime) return 0;
    
    let totalCost = 0;
    let currentTime = currentTable.startTime;
    const endTime = Date.now();
    const type = currentTable.type;

    while (currentTime < endTime) {
        const nextMinute = Math.min(currentTime + 60000, endTime);
        const durationMinutes = (nextMinute - currentTime) / 60000;
        const ratePerHour = getRateForTime(type, currentTime);
        totalCost += durationMinutes * (ratePerHour / 60);
        currentTime = nextMinute;
    }
    
    return Math.ceil(totalCost / 1000) * 1000;
  };

  // Stats Logic
  const updateStats = (playerIdx: number, newRun: number) => {
    if (newRun > highRuns[playerIdx]) {
      const newHrs = [...highRuns];
      newHrs[playerIdx] = newRun;
      setHighRuns(newHrs);
    }
  };

  // Turn Logic
  const switchTurn = () => {
    updateStats(currentTurn, currentRun);
    setCurrentRun(0);
    setShotTimer(defaultShotTime);
    
    let nextTurn = currentTurn + 1;
    if (nextTurn >= settings.numPlayers) {
        nextTurn = 0;
        setInnings(prev => prev + 1);
    }
    setCurrentTurn(nextTurn);
  };

  // Manual Turn Switch
  const handleManualSwitch = (targetIndex: number) => {
    if (currentTurn === targetIndex) return;
    updateStats(currentTurn, currentRun);
    setCurrentRun(0);
    setShotTimer(defaultShotTime);
    if (targetIndex === 0 && currentTurn === settings.numPlayers - 1) {
        setInnings(prev => prev + 1);
    }
    setCurrentTurn(targetIndex);
  };

  const adjustScore = (delta: number) => {
    const newScores = [...scores];
    const newScore = Math.max(0, newScores[currentTurn] + delta);
    newScores[currentTurn] = newScore;
    
    setScores(newScores);
    
    if (delta > 0) {
        setCurrentRun(prev => prev + delta);
        setShotTimer(defaultShotTime);
    } else {
        setCurrentRun(prev => Math.max(0, prev + delta));
    }

    if (settings.targetScore && newScore >= settings.targetScore) {
        setWinner({ index: currentTurn, name: playerNames[currentTurn] });
        setIsPaused(true);
    }
  };

  // Name Editing
  const handleEditStart = (index: number) => {
    setEditingPlayer(index);
    setTempName(playerNames[index]);
    setIsPaused(true);
  };

  const handleEditSave = () => {
    if (editingPlayer !== null) {
        if (tempName.trim()) {
            const newNames = [...playerNames];
            newNames[editingPlayer] = tempName.trim();
            setPlayerNames(newNames);
        }
        setEditingPlayer(null);
    }
  };

  // Order Logic
  const handleOpenOrder = () => {
      setCart([]);
      setOrderStatus('idle');
      setShowOrderModal(true);
  };

  const addToCart = (item: MenuItem) => {
      setCart(prev => {
          const existing = prev.find(i => i.menuItemId === item.id);
          if (existing) {
              return prev.map(i => i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i);
          }
          return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }];
      });
  };

  const removeFromCart = (itemId: string) => {
      setCart(prev => prev.reduce((acc, item) => {
          if (item.menuItemId === itemId) {
              if (item.quantity > 1) acc.push({ ...item, quantity: item.quantity - 1 });
          } else {
              acc.push(item);
          }
          return acc;
      }, [] as OrderItem[]));
  };

  const submitOrder = () => {
      if (cart.length === 0) return;
      if (settings.tableId) {
          const stored = localStorage.getItem(TABLES_STORAGE_KEY);
          if (stored) {
              const tables = JSON.parse(stored) as Table[];
              const updatedTables = tables.map(t => {
                  if (t.id === settings.tableId) {
                      const newOrders = [...t.orders];
                      cart.forEach(cartItem => {
                           const existingIndex = newOrders.findIndex(o => o.menuItemId === cartItem.menuItemId);
                           if (existingIndex >= 0) {
                               newOrders[existingIndex].quantity += cartItem.quantity;
                           } else {
                               newOrders.push(cartItem);
                           }
                      });
                      return { ...t, orders: newOrders };
                  }
                  return t;
              });
              localStorage.setItem(TABLES_STORAGE_KEY, JSON.stringify(updatedTables));
              window.dispatchEvent(new Event('storage')); 
              
              // Local update
              if (currentTable) {
                  setCurrentTable(prev => {
                      if (!prev) return null;
                      // Just re-fetch in effect, but we can optimistically update
                      return prev; 
                  });
              }
          }
      }
      setOrderStatus('success');
      setTimeout(() => {
          setShowOrderModal(false);
          setOrderStatus('idle');
      }, 2000);
  };

  // Timer Effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (!isPaused && !winner) {
        interval = setInterval(() => {
            setMatchDuration(prev => prev + 1);
            setShotTimer(prev => prev <= 0 ? 0 : prev - 1);
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPaused, winner]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getAvg = (score: number) => innings === 0 ? 0 : (score / innings).toFixed(1);

  const getTimerColor = () => {
    const percentage = (shotTimer / defaultShotTime) * 100;
    if (percentage <= 20) return 'bg-red-500';
    if (percentage <= 50) return 'bg-yellow-400';
    return 'bg-green-500';
  };

  const formatMoney = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-900 overflow-hidden font-sans">
      
      {/* Top Bar - Compact on Mobile */}
      <div className="h-10 lg:h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-2 lg:px-4 text-gray-300 text-xs lg:text-sm">
        <div className="flex items-center gap-2 lg:gap-4 truncate">
            <button onClick={() => setShowExitConfirm(true)} className="hover:text-white transition-colors p-1"><ArrowLeftIcon /></button>
            <div className="flex items-center gap-1 lg:gap-2 truncate">
                <span className="font-bold text-orange-500 uppercase truncate">{settings.gameType}</span>
                <span className="text-gray-500 hidden sm:inline">|</span>
                <span className="hidden sm:inline">{settings.gameMode}</span>
            </div>
            {tableName && (
                <div className="flex items-center gap-1 ml-1 pl-2 border-l border-gray-600 text-orange-400 font-bold uppercase whitespace-nowrap">
                     <MapPin size={12} className="lg:w-3.5 lg:h-3.5" /> {tableName}
                </div>
            )}
        </div>
        <div className="font-mono text-lg lg:text-xl text-white font-bold tracking-widest flex-shrink-0 mx-2">
            {formatTime(matchDuration)}
        </div>
        <div className="flex items-center gap-3">
            <button onClick={() => setIsMuted(!isMuted)}>
                {isMuted ? <VolumeX size={16} className="lg:w-[18px] lg:h-[18px]"/> : <Volume2 size={16} className="lg:w-[18px] lg:h-[18px]"/>}
            </button>
            <Settings size={16} className="cursor-pointer hover:text-white lg:w-[18px] lg:h-[18px]" />
        </div>
      </div>

      {/* Main Content - Flex Col on Mobile, Row on Desktop */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* PLAYER 1 (Top/Left) */}
        <div 
            onClick={() => handleManualSwitch(0)}
            className={`flex-1 flex flex-col relative transition-all duration-300 order-1 ${currentTurn === 0 ? 'bg-gray-100' : 'bg-gray-300 cursor-pointer'}`}
        >
            <div className="p-2 lg:p-4 flex justify-between items-center border-b border-gray-300">
                <div className="flex flex-col w-full mr-2">
                    {editingPlayer === 0 ? (
                        <input 
                            autoFocus
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            onBlur={handleEditSave}
                            onKeyDown={(e) => e.key === 'Enter' && handleEditSave()}
                            onClick={(e) => e.stopPropagation()}
                            className="font-bold text-xl lg:text-2xl text-gray-800 bg-white border border-gray-400 rounded px-2 py-1 outline-none w-full"
                        />
                    ) : (
                        <span className="font-bold text-xl lg:text-2xl text-gray-800 truncate">{playerNames[0]}</span>
                    )}
                    <div className="flex gap-2 text-[10px] lg:text-xs font-bold text-gray-600 mt-1">
                        <span className="bg-gray-200 px-2 py-0.5 rounded">AVG: {getAvg(scores[0])}</span>
                        <span className="bg-gray-200 px-2 py-0.5 rounded">HR: {Math.max(highRuns[0], currentTurn === 0 ? currentRun : 0)}</span>
                    </div>
                </div>
                <div className="flex items-center gap-1 lg:gap-2">
                     <button 
                        onClick={(e) => { e.stopPropagation(); handleOpenOrder(); }}
                        className="text-gray-500 hover:text-orange-600 p-1.5 lg:p-2 hover:bg-orange-100 rounded-full transition-colors"
                    >
                        <Utensils size={18} className="lg:w-5 lg:h-5" />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleEditStart(0); }} 
                        className="text-gray-500 hover:text-gray-800 p-1.5 lg:p-2 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <Edit2 size={18} className="lg:w-5 lg:h-5"/>
                    </button>
                </div>
            </div>
            <div className="flex-1 flex items-center justify-center relative">
                <span className="text-9xl lg:text-[14rem] xl:text-[16rem] font-bold leading-none tracking-tighter text-gray-900 select-none">
                    {scores[0]}
                </span>
                {currentTurn === 0 && (
                     <div className="absolute top-2 right-2 lg:top-4 lg:right-4 bg-green-500 text-white font-bold px-2 py-0.5 lg:px-3 lg:py-1 text-xs rounded-full animate-pulse shadow-md z-10">
                        ĐANG ĐÁNH
                     </div>
                )}
            </div>
            {currentTurn === 0 && (
                <div className="grid grid-cols-4 gap-2 p-2 h-16 lg:h-20 bg-gray-200/50 lg:bg-transparent">
                     <ScoreButton label="-1" onClick={() => adjustScore(-1)} color="gray" />
                     <ScoreButton label="+2" onClick={() => adjustScore(2)} color="gray" />
                     <ScoreButton label="+3" onClick={() => adjustScore(3)} color="gray" />
                     <ScoreButton label="+5" onClick={() => adjustScore(5)} color="orange" />
                </div>
            )}
            {/* Invisble click overlay to score +1 */}
            {currentTurn === 0 && (
                <button className="absolute inset-0 top-16 bottom-16 lg:top-24 lg:bottom-24 z-0 opacity-0 cursor-pointer tap-highlight-transparent" onClick={() => adjustScore(1)} />
            )}
        </div>

        {/* CENTER PANEL (Middle on Mobile, Center on Desktop) */}
        <div className="w-full h-auto lg:h-full lg:w-[300px] xl:w-[400px] flex lg:flex-col bg-gray-800 border-y lg:border-y-0 lg:border-l lg:border-r border-gray-700 z-10 shadow-2xl order-2 flex-shrink-0">
            
            {/* Mobile Controls Layout: Row */}
            <div className="flex lg:flex-col w-full h-full">
                
                {/* Control Buttons - Desktop: Top, Mobile: Right */}
                <div className="flex lg:flex-row flex-col p-2 gap-2 bg-gray-700 w-16 lg:w-full lg:order-1 order-3 border-l lg:border-l-0 border-gray-600">
                     <button 
                        onClick={() => setIsPaused(!isPaused)}
                        className={`flex-1 flex flex-col lg:flex-row items-center justify-center gap-1 font-bold rounded text-[10px] lg:text-sm uppercase shadow-sm p-2
                        ${isPaused ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-yellow-500 text-white hover:bg-yellow-600'}`}
                    >
                        {isPaused ? <Play size={20}/> : <Pause size={20}/>} 
                        <span className="hidden lg:inline">{isPaused ? 'Tiếp tục' : 'Tạm dừng'}</span>
                    </button>
                    <button 
                        onClick={switchTurn}
                        className="flex-1 bg-red-600 text-white font-bold py-2 lg:py-3 rounded text-[10px] lg:text-sm uppercase hover:bg-red-700 shadow-sm writing-vertical-lr lg:writing-horizontal-tb flex items-center justify-center"
                    >
                        Kết thúc
                    </button>
                </div>

                {/* Camera View - Hidden on very small screens in portrait or reduced */}
                <div className="hidden lg:block lg:aspect-video bg-black relative border-t border-b border-gray-900 group lg:order-2">
                    <img src="https://picsum.photos/600/400" alt="Camera" className="w-full h-full object-cover opacity-80" />
                </div>

                {/* Stats & Timer - Center */}
                <div className="flex-1 flex flex-row lg:flex-col items-center justify-between lg:justify-start p-2 lg:p-6 bg-gray-800 gap-2 lg:gap-6 lg:order-3">
                    <div className="text-center w-1/3 lg:w-full">
                        <div className="text-gray-400 text-[10px] lg:text-xs uppercase mb-1 tracking-wider">Lượt cơ</div>
                        <div className="text-2xl lg:text-4xl font-bold text-white tracking-widest">#{innings}</div>
                    </div>

                    <div className="w-px h-10 lg:w-full lg:h-px bg-gray-700"></div>

                    <div className="flex-1 w-full flex flex-col justify-center">
                        <div className="flex justify-between items-end mb-1 lg:mb-2">
                            <div className="text-gray-400 text-[10px] lg:text-xs uppercase tracking-wider">Thời gian</div>
                            <div className={`text-2xl lg:text-4xl font-mono font-bold ${shotTimer <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                                {shotTimer}s
                            </div>
                        </div>
                        <div className="w-full h-4 lg:h-6 bg-gray-700 rounded-full overflow-hidden shadow-inner border border-gray-600">
                            <div 
                                className={`h-full transition-all duration-1000 ease-linear ${getTimerColor()}`}
                                style={{ width: `${(shotTimer / defaultShotTime) * 100}%` }}
                            />
                        </div>
                        <div className="hidden lg:flex justify-center mt-4">
                             <button onClick={() => setShotTimer(prev => prev + 10)} className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors uppercase font-bold">
                                + Thêm 10s
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Controls - Desktop: Bottom, Mobile: Left */}
                <div className="grid grid-rows-2 lg:grid-rows-1 lg:grid-cols-2 gap-1 p-2 bg-gray-700 w-16 lg:w-full lg:mt-auto lg:order-4 border-r lg:border-r-0 border-gray-600 order-1">
                    <FooterBtn label="ĐỔI BÊN" />
                    <button 
                        onClick={() => setShowPaymentModal(true)}
                        className="bg-blue-600 text-white font-bold text-[10px] lg:text-xs py-2 rounded uppercase hover:bg-blue-700 flex flex-col lg:flex-row items-center justify-center gap-1"
                    >
                        <Receipt size={14} /> 
                        <span className="hidden lg:inline">Thanh toán</span>
                    </button>
                </div>
            </div>
        </div>

        {/* PLAYER 2 (Bottom/Right) */}
        <div 
            onClick={() => handleManualSwitch(1)}
            className={`flex-1 flex flex-col relative transition-all duration-300 order-3 ${currentTurn === 1 ? 'bg-orange-500' : 'bg-orange-700 cursor-pointer'}`}
        >
             <div className="p-2 lg:p-4 flex justify-between items-center border-b border-orange-400">
                 <div className="flex flex-col w-full mr-2">
                    {editingPlayer === 1 ? (
                        <input 
                            autoFocus
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            onBlur={handleEditSave}
                            onKeyDown={(e) => e.key === 'Enter' && handleEditSave()}
                            onClick={(e) => e.stopPropagation()}
                            className="font-bold text-xl lg:text-2xl text-gray-800 bg-white border border-gray-400 rounded px-2 py-1 outline-none w-full"
                        />
                    ) : (
                        <span className="font-bold text-xl lg:text-2xl text-white truncate">{playerNames[1]}</span>
                    )}
                    <div className="flex gap-2 text-[10px] lg:text-xs font-bold text-orange-100 mt-1">
                        <span className="bg-white/20 px-2 py-0.5 rounded">AVG: {getAvg(scores[1])}</span>
                        <span className="bg-white/20 px-2 py-0.5 rounded">HR: {Math.max(highRuns[1], currentTurn === 1 ? currentRun : 0)}</span>
                    </div>
                </div>
                <div className="flex items-center gap-1 lg:gap-2">
                     <button 
                        onClick={(e) => { e.stopPropagation(); handleOpenOrder(); }}
                        className="text-white/70 hover:text-white p-1.5 lg:p-2 hover:bg-orange-400 rounded-full transition-colors"
                    >
                        <Utensils size={18} className="lg:w-5 lg:h-5" />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleEditStart(1); }} 
                        className="text-white/70 hover:text-white p-1.5 lg:p-2 hover:bg-orange-400 rounded-full transition-colors"
                    >
                        <Edit2 size={18} className="lg:w-5 lg:h-5"/>
                    </button>
                </div>
            </div>
            <div className="flex-1 flex items-center justify-center relative">
                <span className="text-9xl lg:text-[14rem] xl:text-[16rem] font-bold leading-none tracking-tighter text-white select-none shadow-orange-900 drop-shadow-md">
                    {scores[1]}
                </span>
                 {currentTurn === 1 && (
                     <div className="absolute top-2 left-2 lg:top-4 lg:left-4 bg-white text-orange-600 font-bold px-2 py-0.5 lg:px-3 lg:py-1 text-xs rounded-full animate-pulse shadow-md z-10">
                        ĐANG ĐÁNH
                     </div>
                )}
            </div>
             {currentTurn === 1 && (
                <div className="grid grid-cols-4 gap-2 p-2 h-16 lg:h-20 bg-orange-800/20 lg:bg-transparent">
                     <ScoreButton label="-1" onClick={() => adjustScore(-1)} color="dark-orange" />
                     <ScoreButton label="+2" onClick={() => adjustScore(2)} color="dark-orange" />
                     <ScoreButton label="+3" onClick={() => adjustScore(3)} color="dark-orange" />
                     <ScoreButton label="+5" onClick={() => adjustScore(5)} color="white" />
                </div>
            )}
             {/* Invisble click overlay to score +1 */}
             {currentTurn === 1 && (
                <button className="absolute inset-0 top-16 bottom-16 lg:top-24 lg:bottom-24 z-0 opacity-0 cursor-pointer tap-highlight-transparent" onClick={() => adjustScore(1)} />
            )}
        </div>
      </div>
      
      {/* Exit Modal */}
      {showExitConfirm && !winner && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center">
                <h3 className="text-xl font-bold mb-4">Kết thúc trận đấu?</h3>
                <div className="flex gap-3">
                    <button onClick={() => setShowExitConfirm(false)} className="flex-1 py-3 border rounded hover:bg-gray-100 font-bold">Huỷ</button>
                    <button onClick={() => navigate('/')} className="flex-1 py-3 bg-red-500 text-white rounded hover:bg-red-600 font-bold">Kết thúc</button>
                </div>
            </div>
        </div>
      )}

      {/* Payment / Bill Modal */}
      {showPaymentModal && currentTable && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                  <div className="bg-blue-600 p-4 text-white font-bold text-lg flex justify-between items-center">
                      <div className="flex items-center gap-2">
                          <Receipt size={20} />
                          <span className="text-sm lg:text-lg">Hóa Đơn: {currentTable.name}</span>
                      </div>
                      <button onClick={() => setShowPaymentModal(false)} className="hover:bg-blue-700 rounded p-1"><X size={20} /></button>
                  </div>
                  
                  <div className="p-4 lg:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                      {/* Time Cost */}
                      <div className="space-y-2 pb-4 border-b">
                          <h4 className="font-bold text-gray-700 uppercase text-xs">Tiền giờ chơi</h4>
                          <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">Thời gian ({currentTable.startTime ? new Date(currentTable.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'} - Hiện tại)</span>
                              <span className="font-bold">{formatMoney(calculateSessionCost())}</span>
                          </div>
                      </div>

                      {/* Service Cost */}
                      {currentTable.orders.length > 0 && (
                          <div className="space-y-2 pb-4 border-b">
                              <h4 className="font-bold text-gray-700 uppercase text-xs">Dịch vụ đã gọi</h4>
                              <div className="space-y-1">
                                  {currentTable.orders.map((item, i) => (
                                      <div key={i} className="flex justify-between text-sm">
                                          <span>{item.quantity}x {item.name}</span>
                                          <span className="font-medium">{formatMoney(item.price * item.quantity)}</span>
                                      </div>
                                  ))}
                              </div>
                              <div className="flex justify-between text-sm font-bold pt-1">
                                  <span>Tổng dịch vụ:</span>
                                  <span>{formatMoney(currentTable.orders.reduce((sum, i) => sum + i.price*i.quantity, 0))}</span>
                              </div>
                          </div>
                      )}

                      {/* Total */}
                      <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center border border-blue-100">
                          <span className="text-blue-900 font-bold uppercase">Tổng cộng</span>
                          <span className="text-2xl font-black text-blue-700">
                              {formatMoney(calculateSessionCost() + currentTable.orders.reduce((sum, i) => sum + i.price*i.quantity, 0))}
                          </span>
                      </div>

                      {/* QR Code */}
                      <div className="flex flex-col items-center justify-center py-4 space-y-2">
                          <div className="bg-white p-2 border rounded-lg shadow-sm">
                             <QrCode size={100} className="text-gray-800" />
                          </div>
                          <span className="text-xs text-gray-500 font-medium">Quét mã QR để thanh toán</span>
                      </div>
                  </div>

                  <div className="p-4 bg-gray-50 text-center">
                      <button onClick={() => setShowPaymentModal(false)} className="w-full py-3 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300">
                          Đóng
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Order Food Modal */}
      {showOrderModal && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
                   {orderStatus === 'success' ? (
                       <div className="p-12 flex flex-col items-center justify-center text-center">
                           <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
                               <CheckCircle size={48} />
                           </div>
                           <h3 className="text-2xl font-bold text-gray-800">Đã Gửi Thực Đơn!</h3>
                           <p className="text-gray-500 mt-2">Yêu cầu của bạn đã được gửi đến quầy.</p>
                       </div>
                   ) : (
                       <>
                            <div className="bg-orange-500 p-4 text-white font-bold text-lg flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Utensils size={20} />
                                    <span>Gọi Món</span>
                                </div>
                                <button onClick={() => setShowOrderModal(false)} className="hover:bg-orange-600 rounded p-1"><X size={20} /></button>
                            </div>
                            
                            <div className="flex-1 overflow-hidden flex flex-col">
                                <div className="flex-1 overflow-y-auto p-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {MENU_ITEMS.map(item => {
                                            const inCart = cart.find(i => i.menuItemId === item.id);
                                            return (
                                                <div key={item.id} className={`p-3 border rounded-lg transition-all ${inCart ? 'border-orange-500 bg-orange-50' : 'hover:border-gray-300'} flex justify-between items-center`}>
                                                    <div>
                                                        <div className="font-bold text-gray-800 text-sm">{item.name}</div>
                                                        <div className="text-xs text-orange-600 font-bold">{formatMoney(item.price)}</div>
                                                    </div>
                                                    
                                                    {inCart ? (
                                                        <div className="flex items-center justify-between bg-white rounded border p-1 gap-2">
                                                            <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-red-50 text-red-500 rounded"><Minus size={14}/></button>
                                                            <span className="font-bold text-sm">{inCart.quantity}</span>
                                                            <button onClick={() => addToCart(item)} className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-green-50 text-green-500 rounded"><Plus size={14}/></button>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            onClick={() => addToCart(item)}
                                                            className="px-3 py-1.5 bg-gray-100 hover:bg-orange-100 text-gray-600 hover:text-orange-600 rounded font-bold text-xs transition-colors"
                                                        >
                                                            Thêm
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                
                                {cart.length > 0 && (
                                    <div className="p-4 bg-gray-50 border-t">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="font-medium text-gray-600">Tổng cộng ({cart.reduce((a,b)=>a+b.quantity,0)} món)</span>
                                            <span className="font-bold text-xl text-orange-600">
                                                {formatMoney(cart.reduce((sum, item) => sum + item.price * item.quantity, 0))}
                                            </span>
                                        </div>
                                        <button 
                                            onClick={submitOrder}
                                            className="w-full py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 shadow-md flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={20} /> GỬI
                                        </button>
                                    </div>
                                )}
                            </div>
                       </>
                   )}
              </div>
          </div>
      )}

      {/* WINNER Modal */}
      {winner && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl animate-bounce-in">
                <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border-4 border-yellow-200">
                    <Trophy size={40} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 uppercase mb-1">Chiến Thắng!</h2>
                <div className="text-3xl font-black text-orange-600 mb-6">{winner.name}</div>
                
                <div className="bg-gray-100 rounded-lg p-4 mb-6 grid grid-cols-2 gap-4">
                    <div className="text-center">
                        <div className="text-xs text-gray-500 uppercase">Điểm</div>
                        <div className="font-bold text-xl">{scores[winner.index]}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xs text-gray-500 uppercase">AVG</div>
                        <div className="font-bold text-xl">{getAvg(scores[winner.index])}</div>
                    </div>
                </div>

                <button 
                    onClick={() => navigate('/')}
                    className="w-full py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-bold uppercase shadow-lg transform hover:scale-105 transition-all"
                >
                    Về Trang Chủ
                </button>
            </div>
        </div>
      )}

    </div>
  );
};

const ArrowLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
)

const ScoreButton = ({ label, onClick, color }: { label: string, onClick: () => void, color: 'gray' | 'orange' | 'dark-orange' | 'white' }) => {
    let classes = "";
    if (color === 'gray') classes = "bg-gray-200 text-gray-800 hover:bg-gray-300";
    if (color === 'orange') classes = "bg-orange-500 text-white hover:bg-orange-600";
    if (color === 'dark-orange') classes = "bg-orange-800 text-white hover:bg-orange-900";
    if (color === 'white') classes = "bg-white text-orange-600 hover:bg-gray-100";

    return (
        <button 
            onClick={onClick}
            className={`${classes} font-bold text-lg lg:text-xl rounded-lg shadow-sm active:scale-95 transition-transform z-20 flex items-center justify-center`}
        >
            {label}
        </button>
    )
}

const FooterBtn = ({ label }: { label: string }) => (
    <button className="bg-white text-gray-800 font-bold text-[10px] lg:text-xs py-2 rounded uppercase hover:bg-gray-200 flex items-center justify-center">
        {label}
    </button>
)

export default ScoreboardScreen;
