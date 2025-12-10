
import React, { useState, useEffect } from 'react';
import { Table, TableStatus, GameType, MenuItem, OrderItem, PriceConfig, TimeSlot } from '../types';
import { Play, Square, Clock, Receipt, Users, ArrowRightLeft, Plus, X, Video, Settings, Percent, AlertTriangle, Edit, Wifi, WifiOff, Coffee, MinusCircle, PlusCircle, Trash2, Utensils, Lock, Unlock } from 'lucide-react';
import { MENU_ITEMS, TABLES_STORAGE_KEY, INITIAL_TABLES, PRICING_STORAGE_KEY, DEFAULT_BASE_RATES, DEFAULT_TIME_SLOTS } from '../constants';

const ClubManagerScreen: React.FC = () => {
  // Initialize from storage or default
  const [tables, setTables] = useState<Table[]>(() => {
      const stored = localStorage.getItem(TABLES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : INITIAL_TABLES;
  });

  const [now, setNow] = useState(Date.now());
  
  // Pricing Configuration - Load from storage or use defaults
  const [baseRates, setBaseRates] = useState<PriceConfig>(() => {
      const stored = localStorage.getItem(PRICING_STORAGE_KEY);
      if (stored) {
          const parsed = JSON.parse(stored);
          return parsed.baseRates || DEFAULT_BASE_RATES;
      }
      return DEFAULT_BASE_RATES;
  });
  
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(() => {
      const stored = localStorage.getItem(PRICING_STORAGE_KEY);
      if (stored) {
          const parsed = JSON.parse(stored);
          return parsed.timeSlots || DEFAULT_TIME_SLOTS;
      }
      return DEFAULT_TIME_SLOTS;
  });

  // Save pricing to storage whenever it changes
  useEffect(() => {
      const config = { baseRates, timeSlots };
      localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(config));
  }, [baseRates, timeSlots]);

  // Modal States
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [checkoutDiscount, setCheckoutDiscount] = useState<number>(0); // Percentage

  const [tableToMove, setTableToMove] = useState<Table | null>(null);

  // Unified Add/Edit Table State
  const [showTableModal, setShowTableModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTableId, setCurrentTableId] = useState('');
  const [tableName, setTableName] = useState('');
  const [tableType, setTableType] = useState<GameType>(GameType.CAROM);
  const [tableCamera, setTableCamera] = useState('');
  const [tablePassword, setTablePassword] = useState('');

  const [showPriceConfig, setShowPriceConfig] = useState(false);
  
  // Order Modal State
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [activeOrderTableId, setActiveOrderTableId] = useState<string | null>(null);

  // Update time loop
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Save to storage whenever tables change
  useEffect(() => {
    localStorage.setItem(TABLES_STORAGE_KEY, JSON.stringify(tables));
  }, [tables]);

  // Listen for storage events (if multiple tabs or external updates)
  useEffect(() => {
      const handleStorageChange = () => {
          const stored = localStorage.getItem(TABLES_STORAGE_KEY);
          if (stored) {
              setTables(JSON.parse(stored));
          }
      };
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // --- Logic ---

  const getRateForTime = (type: GameType, timestamp: number): number => {
    const date = new Date(timestamp);
    const hour = date.getHours();
    const base = baseRates[type];
    
    // Find matching time slot
    const slot = timeSlots.find(s => hour >= s.startHour && hour < s.endHour);
    if (slot) {
        return base * slot.multiplier;
    }
    return base;
  };

  const calculateSessionCost = (startTime: number | undefined, endTime: number, type: GameType) => {
    if (!startTime) return 0;
    
    let totalCost = 0;
    let currentTime = startTime;
    
    // Iterate minute by minute for accuracy (simplified for demo)
    while (currentTime < endTime) {
        const nextMinute = Math.min(currentTime + 60000, endTime);
        const durationMinutes = (nextMinute - currentTime) / 60000;
        
        const ratePerHour = getRateForTime(type, currentTime);
        const ratePerMinute = ratePerHour / 60;
        
        totalCost += durationMinutes * ratePerMinute;
        currentTime = nextMinute;
    }
    
    return Math.ceil(totalCost / 1000) * 1000; // Round to nearest 1000
  };

  const calculateServiceTotal = (orders: OrderItem[]) => {
      return orders.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  // --- Handlers ---

  const handleStartSession = (tableId: string) => {
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        return { ...t, status: TableStatus.OCCUPIED, startTime: Date.now() };
      }
      return t;
    }));
  };

  const handleStopClick = (table: Table) => {
    setSelectedTable(table);
    setCheckoutDiscount(0);
    setNow(Date.now());
    setShowCheckout(true);
  };

  const confirmCheckout = () => {
    if (!selectedTable) return;
    
    setTables(prev => prev.map(t => {
      if (t.id === selectedTable.id) {
        const { startTime, ...rest } = t;
        // Lock the table after checkout
        return { ...rest, status: TableStatus.LOCKED, orders: [] }; 
      }
      return t;
    }));
    
    setShowCheckout(false);
    setSelectedTable(null);
  };

  const handleAdminUnlock = (tableId: string) => {
      setTables(prev => prev.map(t => {
          if (t.id === tableId) return { ...t, status: TableStatus.AVAILABLE };
          return t;
      }));
  };

  const handleSwitchTableClick = (table: Table) => {
    setTableToMove(table);
  };

  const confirmSwitchTable = (targetTableId: string) => {
    if (!tableToMove) return;

    setTables(prev => {
        const sourceTable = prev.find(t => t.id === tableToMove.id);
        if (!sourceTable || !sourceTable.startTime) return prev;

        return prev.map(t => {
            if (t.id === tableToMove.id) {
                return { ...t, status: TableStatus.AVAILABLE, startTime: undefined, orders: [] };
            }
            if (t.id === targetTableId) {
                return { 
                    ...t, 
                    status: TableStatus.OCCUPIED, 
                    startTime: sourceTable.startTime,
                    orders: sourceTable.orders // Transfer orders
                };
            }
            return t;
        });
    });
    setTableToMove(null);
  };

  // Order Handlers
  const handleOpenOrder = (tableId: string) => {
      setActiveOrderTableId(tableId);
      setShowOrderModal(true);
  };

  const handleAddItem = (item: MenuItem) => {
      if (!activeOrderTableId) return;

      setTables(prev => prev.map(t => {
          if (t.id === activeOrderTableId) {
              const existingItemIndex = t.orders.findIndex(o => o.menuItemId === item.id);
              const newOrders = [...t.orders];
              
              if (existingItemIndex >= 0) {
                  newOrders[existingItemIndex].quantity += 1;
              } else {
                  newOrders.push({
                      menuItemId: item.id,
                      name: item.name,
                      price: item.price,
                      quantity: 1
                  });
              }
              return { ...t, orders: newOrders };
          }
          return t;
      }));
  };

  const handleRemoveItem = (menuItemId: string) => {
    if (!activeOrderTableId) return;

    setTables(prev => prev.map(t => {
        if (t.id === activeOrderTableId) {
            const existingItemIndex = t.orders.findIndex(o => o.menuItemId === menuItemId);
            if (existingItemIndex === -1) return t;

            const newOrders = [...t.orders];
            if (newOrders[existingItemIndex].quantity > 1) {
                newOrders[existingItemIndex].quantity -= 1;
            } else {
                newOrders.splice(existingItemIndex, 1);
            }
            return { ...t, orders: newOrders };
        }
        return t;
    }));
  };

  // Open Modal for New Table
  const openAddTableModal = () => {
      setIsEditing(false);
      setCurrentTableId('');
      setTableName('');
      setTableType(GameType.CAROM);
      setTableCamera('');
      setTablePassword('');
      setShowTableModal(true);
  };

  // Open Modal for Edit Table
  const openEditTableModal = (table: Table) => {
      setIsEditing(true);
      setCurrentTableId(table.id);
      setTableName(table.name);
      setTableType(table.type);
      setTableCamera(table.cameraUrl || '');
      setTablePassword(table.password || '');
      setShowTableModal(true);
  };

  const handleSaveTable = () => {
      if (!tableName.trim()) return;

      if (isEditing) {
          // Update existing
          setTables(prev => prev.map(t => {
              if (t.id === currentTableId) {
                  return {
                      ...t,
                      name: tableName,
                      type: tableType,
                      cameraUrl: tableCamera,
                      cameraStatus: tableCamera ? 'online' : undefined, // Reset status if url changes
                      password: tablePassword
                  };
              }
              return t;
          }));
      } else {
          // Add new
          const newTable: Table = {
              id: Date.now().toString(),
              name: tableName,
              type: tableType,
              status: TableStatus.AVAILABLE,
              cameraUrl: tableCamera,
              cameraStatus: tableCamera ? 'online' : undefined,
              orders: [],
              password: tablePassword
          };
          setTables(prev => [...prev, newTable]);
      }
      
      setShowTableModal(false);
  };

  // --- Helpers ---

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDuration = (startTime?: number) => {
    if (!startTime) return "00:00";
    const diff = now - startTime;
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${h}h ${m}p`;
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return "--:--";
    return new Date(timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const availableTables = tables.filter(t => t.status === TableStatus.AVAILABLE);

  // --- Render ---

  return (
    <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 lg:p-6 rounded-xl shadow-sm gap-4">
        <div>
           <h2 className="text-xl lg:text-2xl font-bold text-gray-800">Quản Lý Bàn</h2>
           <p className="text-gray-500 text-xs lg:text-sm">Tổng: {tables.length} | Đang chơi: {tables.filter(t => t.status === TableStatus.OCCUPIED).length}</p>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
             <button 
                onClick={() => setShowPriceConfig(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg font-bold hover:bg-gray-200 transition-colors border border-gray-200 text-sm"
            >
                <Settings size={16} /> <span className="hidden sm:inline">Cấu hình</span> Giá
            </button>
            <button 
                onClick={openAddTableModal}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm text-sm"
            >
                <Plus size={16} /> Thêm Bàn
            </button>
        </div>
      </div>

      {/* Tables Grid - 1 Col Mobile, 2 Col Tablet, 3 Col Desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {tables.map(table => {
            const isOccupied = table.status === TableStatus.OCCUPIED;
            const isLocked = table.status === TableStatus.LOCKED;
            const currentCost = isOccupied ? calculateSessionCost(table.startTime, now, table.type) : 0;
            const serviceCost = calculateServiceTotal(table.orders);
            const totalCost = currentCost + serviceCost;
            
            const hasCamera = !!table.cameraUrl;
            const isCameraBroken = table.cameraStatus === 'offline';
            const hasOrders = table.orders.length > 0;
            
            return (
                <div 
                    key={table.id} 
                    className={`relative rounded-xl overflow-hidden shadow-md border-2 transition-all hover:shadow-lg
                    ${isCameraBroken ? 'border-red-500 ring-2 ring-red-200' : 
                      isLocked ? 'border-gray-400 bg-gray-50' :
                      isOccupied ? 'border-orange-500 bg-white' : 'border-green-400 bg-white'}
                    `}
                >
                    {/* Status Banner */}
                    <div className={`px-4 py-2 flex justify-between items-center text-white font-bold
                        ${isCameraBroken ? 'bg-red-600 animate-pulse' : 
                          isLocked ? 'bg-gray-500' :
                          isOccupied ? 'bg-orange-500' : 'bg-green-500'}
                    `}>
                        <div className="flex items-center gap-2">
                            <span>{table.name}</span>
                            <button 
                                onClick={() => openEditTableModal(table)}
                                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <Edit size={14} />
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {/* Camera Status Indicator */}
                            {hasCamera && (
                                <div className="flex items-center" title={isCameraBroken ? "Mất kết nối Camera" : "Camera Online"}>
                                    {isCameraBroken ? <WifiOff size={16} /> : <Video size={16} className="opacity-80" />}
                                    {isCameraBroken && <AlertTriangle size={16} className="ml-1 text-yellow-300" />}
                                </div>
                            )}
                            <span className="text-xs uppercase bg-black/20 px-2 py-1 rounded">
                                {table.type}
                            </span>
                        </div>
                    </div>

                    <div className="p-4 lg:p-6 flex flex-col gap-3 lg:gap-4">
                        {/* Info Section */}
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-500 uppercase font-bold mb-1">Trạng thái</span>
                                {isLocked ? (
                                    <span className="text-gray-600 font-bold flex items-center gap-1 text-sm">
                                        <Lock size={16} /> Đang khóa
                                    </span>
                                ) : isOccupied ? (
                                    <span className="text-orange-600 font-bold flex items-center gap-1 text-sm">
                                        <Users size={16} /> Đang có khách
                                    </span>
                                ) : (
                                    <span className="text-green-600 font-bold flex items-center gap-1 text-sm">
                                        <CheckIcon /> Bàn trống
                                    </span>
                                )}
                            </div>
                            
                            {isOccupied && (
                                <div className="text-right">
                                    <div className="text-xs text-gray-500 uppercase font-bold mb-1">Thời gian</div>
                                    <div className="font-mono text-lg lg:text-xl font-bold text-gray-800 flex items-center justify-end gap-1">
                                        <Clock size={16} className="text-gray-400" />
                                        {formatDuration(table.startTime)}
                                    </div>
                                    <div className="text-xs text-gray-400 font-medium">
                                        {formatTime(table.startTime)} - Hiện tại
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Camera Error Message */}
                        {isCameraBroken && (
                            <div className="bg-red-50 text-red-600 text-xs font-bold p-2 rounded flex items-center gap-2 border border-red-100">
                                <AlertTriangle size={14} />
                                Lỗi tín hiệu Camera!
                            </div>
                        )}

                        {/* Order List Display */}
                        {isOccupied && hasOrders && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 lg:p-3">
                                <div className="flex items-center justify-between text-xs font-bold text-orange-700 uppercase mb-2">
                                    <span className="flex items-center gap-1"><Utensils size={12} /> Gọi món</span>
                                    <span>{formatMoney(serviceCost)}</span>
                                </div>
                                <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                                    {table.orders.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-xs lg:text-sm text-gray-800">
                                            <span>
                                                <span className="font-bold">{item.quantity}x</span> {item.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Cost Display */}
                        {isOccupied ? (
                            <div className="bg-gray-100 p-3 rounded-lg flex justify-between items-center mt-auto">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-600">Tiền giờ: {formatMoney(currentCost)}</span>
                                    <span className="text-xs text-gray-400">Tổng cộng (Tạm tính)</span>
                                </div>
                                <span className="text-lg lg:text-xl font-bold text-orange-600">{formatMoney(totalCost)}</span>
                            </div>
                        ) : !isLocked && (
                            <div className="bg-gray-50 p-3 rounded-lg text-center text-gray-400 text-sm italic mt-auto">
                                {baseRates[table.type].toLocaleString()}đ / giờ
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 mt-2">
                            {isLocked ? (
                                <button 
                                    onClick={() => handleAdminUnlock(table.id)}
                                    className="w-full bg-gray-200 text-gray-700 font-bold py-3 rounded hover:bg-gray-300 flex items-center justify-center gap-2 shadow-sm text-sm"
                                >
                                    <Unlock size={18} /> MỞ KHÓA (ADMIN)
                                </button>
                            ) : isOccupied ? (
                                <>
                                    <button 
                                        onClick={() => handleOpenOrder(table.id)}
                                        className={`bg-orange-100 text-orange-700 font-bold py-2 px-2 lg:px-3 rounded hover:bg-orange-200 flex items-center justify-center gap-1 relative flex-1 text-sm`}
                                        title="Gọi món"
                                    >
                                        <Utensils size={18} />
                                        <span>+ Món</span>
                                    </button>
                                    <button 
                                        onClick={() => handleSwitchTableClick(table)}
                                        className="bg-blue-100 text-blue-700 font-bold py-2 px-2 lg:px-3 rounded hover:bg-blue-200 flex items-center justify-center gap-2"
                                        title="Đổi bàn"
                                    >
                                        <ArrowRightLeft size={18} />
                                    </button>
                                    <button 
                                        onClick={() => handleStopClick(table)}
                                        className="bg-red-500 text-white font-bold py-2 px-4 rounded hover:bg-red-600 flex items-center justify-center gap-2"
                                        title="Thanh toán"
                                    >
                                        <Receipt size={18} />
                                    </button>
                                </>
                            ) : (
                                <button 
                                    onClick={() => handleStartSession(table.id)}
                                    className="w-full bg-green-600 text-white font-bold py-3 rounded hover:bg-green-700 flex items-center justify-center gap-2 shadow-sm text-sm"
                                >
                                    <Play size={18} /> BẮT ĐẦU
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            );
        })}
      </div>

      {/* --- MODALS --- */}

      {/* 1. Add/Edit Table Modal */}
      {showTableModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in">
                <div className="bg-blue-600 p-4 text-white font-bold text-lg flex justify-between items-center">
                    <span>{isEditing ? 'Chỉnh Sửa Bàn' : 'Thêm Bàn Mới'}</span>
                    <button onClick={() => setShowTableModal(false)} className="hover:bg-blue-700 rounded p-1"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên Bàn</label>
                        <input 
                            value={tableName}
                            onChange={(e) => setTableName(e.target.value)}
                            placeholder="VD: Bàn 08"
                            autoFocus
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Loại Bàn</label>
                        <select 
                            value={tableType}
                            onChange={(e) => setTableType(e.target.value as GameType)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        >
                            <option value={GameType.CAROM}>Carom (Phăng)</option>
                            <option value={GameType.POOL}>Pool (Lỗ)</option>
                            <option value={GameType.LIBRE}>Libre (Tự do)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu khóa bàn</label>
                        <div className="relative">
                            <input 
                                type="text"
                                value={tablePassword}
                                onChange={(e) => setTablePassword(e.target.value)}
                                placeholder="Nhập mật khẩu..."
                                className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700"
                            />
                            <div className="absolute right-3 top-3 text-gray-400">
                                <Lock size={20} />
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 italic">Dùng để mở khóa bàn sau khi thanh toán.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Camera Stream URL</label>
                        <div className="relative">
                            <input 
                                value={tableCamera}
                                onChange={(e) => setTableCamera(e.target.value)}
                                placeholder="rtsp://..."
                                className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                            />
                            <div className="absolute right-3 top-3 text-gray-400">
                                <Video size={20} />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 flex gap-3 justify-end">
                    <button onClick={() => setShowTableModal(false)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded-lg">Huỷ</button>
                    <button onClick={handleSaveTable} disabled={!tableName.trim()} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md">
                        {isEditing ? 'Cập nhật' : 'Thêm mới'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* 2. Switch Table Modal */}
      {tableToMove && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
                <div className="bg-blue-500 p-4 text-white text-center font-bold text-lg flex justify-between items-center">
                    <span>Đổi Bàn: {tableToMove.name}</span>
                    <button onClick={() => setTableToMove(null)} className="hover:bg-blue-600 p-1 rounded"><Square size={16} /></button>
                </div>
                <div className="p-6">
                    <p className="text-gray-600 mb-4 text-sm">Chọn bàn mới để chuyển khách sang.</p>
                    {availableTables.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                            {availableTables.map(t => (
                                <button key={t.id} onClick={() => confirmSwitchTable(t.id)} className="p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-500 flex flex-col items-center gap-1 transition-colors">
                                    <span className="font-bold text-gray-800">{t.name}</span>
                                    <span className="text-xs text-gray-400 uppercase">{t.type}</span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 italic py-4">Không còn bàn trống.</div>
                    )}
                </div>
                <div className="p-4 bg-gray-50 text-right">
                    <button onClick={() => setTableToMove(null)} className="px-4 py-2 text-gray-600 font-bold hover:text-gray-900">Huỷ bỏ</button>
                </div>
            </div>
        </div>
      )}

      {/* 3. Price Config Modal */}
      {showPriceConfig && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                <div className="bg-gray-800 p-4 text-white font-bold text-lg flex justify-between items-center">
                    <span>Cấu Hình Giá</span>
                    <button onClick={() => setShowPriceConfig(false)} className="hover:bg-gray-700 rounded p-1"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    
                    {/* Base Rates */}
                    <div>
                        <h3 className="text-sm font-bold text-orange-600 uppercase mb-3 border-b pb-1">Giá cơ bản (VND/Giờ)</h3>
                        <div className="space-y-3">
                            {Object.entries(baseRates).map(([type, rate]) => (
                                <div key={type} className="flex items-center justify-between">
                                    <span className="font-medium text-gray-700">{type}</span>
                                    <input 
                                        type="number"
                                        value={rate}
                                        onChange={(e) => setBaseRates(prev => ({...prev, [type]: Number(e.target.value)}))}
                                        className="w-32 p-2 border rounded text-right font-bold"
                                        step="1000"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Time Slots */}
                    <div>
                        <h3 className="text-sm font-bold text-orange-600 uppercase mb-3 border-b pb-1">Khung giờ đặc biệt</h3>
                        <div className="space-y-3">
                            {timeSlots.map(slot => (
                                <div key={slot.id} className="bg-gray-50 p-3 rounded-lg border">
                                    <div className="flex justify-between font-bold text-sm mb-2">
                                        <span>{slot.name}</span>
                                        <span className={slot.multiplier < 1 ? 'text-green-600' : 'text-red-600'}>
                                            {slot.multiplier < 1 ? `Giảm ${(1 - slot.multiplier) * 100}%` : `Tăng ${(slot.multiplier - 1) * 100}%`}
                                        </span>
                                    </div>
                                    <div className="flex gap-2 text-xs text-gray-500">
                                        <span>Từ: {slot.startHour}h</span>
                                        <span>Đến: {slot.endHour}h</span>
                                    </div>
                                </div>
                            ))}
                            <div className="text-xs text-gray-400 italic text-center">
                                * Liên hệ quản trị viên để thêm khung giờ mới
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 text-right">
                    <button onClick={() => setShowPriceConfig(false)} className="px-6 py-2 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 shadow-md">
                        Đóng
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* 4. Order / Menu Modal */}
      {showOrderModal && activeOrderTableId && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
                <div className="bg-orange-500 p-4 text-white font-bold text-lg flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Utensils size={20} />
                        <span>Gọi Món - {tables.find(t => t.id === activeOrderTableId)?.name}</span>
                    </div>
                    <button onClick={() => setShowOrderModal(false)} className="hover:bg-orange-600 rounded p-1"><X size={20} /></button>
                </div>
                
                <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                    {/* Menu List */}
                    <div className="flex-1 p-4 overflow-y-auto border-r border-gray-200">
                        <h3 className="font-bold text-gray-700 mb-3 uppercase text-sm">Thực đơn</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {MENU_ITEMS.map(item => (
                                <button 
                                    key={item.id}
                                    onClick={() => handleAddItem(item)}
                                    className="p-3 border rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors text-left group flex justify-between items-center"
                                >
                                    <div className="font-bold text-gray-800 group-hover:text-orange-700">{item.name}</div>
                                    <div className="text-orange-600 font-bold text-sm">{formatMoney(item.price)}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Current Order */}
                    <div className="w-full md:w-1/3 p-4 bg-gray-50 flex flex-col border-t md:border-t-0">
                        <h3 className="font-bold text-gray-700 mb-3 uppercase text-sm">Đã chọn</h3>
                        <div className="flex-1 overflow-y-auto space-y-2 max-h-40 md:max-h-full">
                             {tables.find(t => t.id === activeOrderTableId)?.orders.map((item, idx) => (
                                 <div key={`${item.menuItemId}-${idx}`} className="bg-white p-2 rounded border shadow-sm flex flex-col">
                                     <div className="flex justify-between font-bold text-sm">
                                         <span>{item.name}</span>
                                         <span>{formatMoney(item.price * item.quantity)}</span>
                                     </div>
                                     <div className="flex justify-between items-center mt-2">
                                         <div className="flex items-center gap-2">
                                             <button onClick={() => handleRemoveItem(item.menuItemId)} className="text-red-500 hover:bg-red-50 rounded"><MinusCircle size={18} /></button>
                                             <span className="font-bold w-4 text-center">{item.quantity}</span>
                                             <button onClick={() => handleAddItem(MENU_ITEMS.find(m => m.id === item.menuItemId)!)} className="text-green-500 hover:bg-green-50 rounded"><PlusCircle size={18} /></button>
                                         </div>
                                     </div>
                                 </div>
                             ))}
                             {tables.find(t => t.id === activeOrderTableId)?.orders.length === 0 && (
                                 <div className="text-center text-gray-400 italic text-sm py-4">Chưa có món nào</div>
                             )}
                        </div>
                        <div className="border-t pt-3 mt-3">
                            <div className="flex justify-between font-bold text-lg">
                                <span>Tổng:</span>
                                <span className="text-orange-600">
                                    {formatMoney(calculateServiceTotal(tables.find(t => t.id === activeOrderTableId)?.orders || []))}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-100 text-right">
                    <button onClick={() => setShowOrderModal(false)} className="px-6 py-2 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 shadow-md">
                        Xong
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* 5. Checkout Modal */}
      {showCheckout && selectedTable && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
                <div className="bg-orange-500 p-4 text-white text-center font-bold text-lg flex justify-between items-center">
                    <span className="w-8"></span>
                    <span>Thanh Toán: {selectedTable.name}</span>
                    <button onClick={() => setShowCheckout(false)} className="w-8 hover:bg-orange-600 rounded"><Square size={16} className="mx-auto" /></button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    {/* Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm border border-gray-100">
                        <div className="flex justify-between"><span className="text-gray-500">Loại bàn:</span><span className="font-bold">{selectedTable.type}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Bắt đầu:</span><span>{formatTime(selectedTable.startTime)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Kết thúc:</span><span>{formatTime(now)}</span></div>
                        <div className="flex justify-between border-t border-dashed pt-2 mt-2"><span className="text-gray-500">Thời gian:</span><span className="font-bold">{formatDuration(selectedTable.startTime)}</span></div>
                    </div>
                    
                    {/* Service / Menu Items */}
                    {selectedTable.orders.length > 0 && (
                        <div>
                             <h4 className="font-bold text-gray-700 text-sm uppercase mb-2">Dịch vụ</h4>
                             <div className="space-y-1">
                                 {selectedTable.orders.map((item, idx) => (
                                     <div key={idx} className="flex justify-between text-sm">
                                         <span>{item.name} <span className="text-gray-400">x{item.quantity}</span></span>
                                         <span className="font-medium">{formatMoney(item.price * item.quantity)}</span>
                                     </div>
                                 ))}
                             </div>
                             <div className="border-t border-dashed my-2"></div>
                             <div className="flex justify-between font-bold text-sm">
                                 <span>Tổng dịch vụ:</span>
                                 <span>{formatMoney(calculateServiceTotal(selectedTable.orders))}</span>
                             </div>
                        </div>
                    )}

                    {/* Calculation */}
                    <div className="space-y-3 pt-2 border-t">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Tiền giờ</span>
                            <span className="font-bold">{formatMoney(calculateSessionCost(selectedTable.startTime, now, selectedTable.type))}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Tiền dịch vụ</span>
                            <span className="font-bold">{formatMoney(calculateServiceTotal(selectedTable.orders))}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium flex items-center gap-1"><Percent size={14}/> Giảm giá (%)</span>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number" 
                                    min="0" max="100"
                                    value={checkoutDiscount}
                                    onChange={(e) => setCheckoutDiscount(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                    className="w-16 p-1 border rounded text-center font-bold text-red-500"
                                />
                                <span className="text-gray-400">%</span>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 my-2"></div>

                        <div className="flex justify-between items-center bg-orange-50 p-4 rounded-lg border border-orange-100">
                            <span className="text-orange-800 font-bold uppercase text-sm">Tổng cộng</span>
                            <span className="text-3xl font-black text-orange-600">
                                {formatMoney(
                                    (calculateSessionCost(selectedTable.startTime, now, selectedTable.type) + calculateServiceTotal(selectedTable.orders)) * (1 - checkoutDiscount / 100)
                                )}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 flex gap-3">
                    <button onClick={() => setShowCheckout(false)} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-200 rounded-lg border border-gray-200">Quay lại</button>
                    <button onClick={confirmCheckout} className="flex-1 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-md flex items-center justify-center gap-2">
                        <Receipt size={20} /> Thanh toán
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
)

export default ClubManagerScreen;
