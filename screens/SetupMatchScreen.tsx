import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameType, GameMode, MatchSettings, Player, Table, TableStatus } from '../types';
import { ArrowRight, Check, X, Users, Clock, Trophy, Zap, UserPlus, Target, LayoutGrid, Lock } from 'lucide-react';
import { DEFAULT_PLAYER_1_NAME, DEFAULT_PLAYER_2_NAME, TABLES_STORAGE_KEY, INITIAL_TABLES, DEVICE_TABLE_ID_KEY } from '../constants';

interface SetupMatchScreenProps {
  onStartMatch: (settings: MatchSettings) => void;
  userRole: 'club' | 'player' | null;
}

const SetupMatchScreen: React.FC<SetupMatchScreenProps> = ({ onStartMatch, userRole }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  // State for selections
  const [selectedType, setSelectedType] = useState<GameType | null>(null);
  const [subType, setSubType] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [numPlayers, setNumPlayers] = useState<number>(2);
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: DEFAULT_PLAYER_1_NAME },
    { id: '2', name: DEFAULT_PLAYER_2_NAME }
  ]);
  const [shotSeconds, setShotSeconds] = useState<number>(40); // Default 40s shot clock
  const [targetScore, setTargetScore] = useState<number>(0); // 0 means unlimited
  
  // Table selection
  const [availableTables, setAvailableTables] = useState<Table[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [isTableFixed, setIsTableFixed] = useState(false);
  const [fixedTableName, setFixedTableName] = useState('');

  useEffect(() => {
      // 1. Load available tables
      const stored = localStorage.getItem(TABLES_STORAGE_KEY);
      const tables: Table[] = stored ? JSON.parse(stored) : INITIAL_TABLES;
      setAvailableTables(tables);

      // 2. Check for Device Binding (Auto Recognition)
      const assignedId = localStorage.getItem(DEVICE_TABLE_ID_KEY);
      if (assignedId) {
          const assignedTable = tables.find(t => t.id === assignedId);
          if (assignedTable) {
              setSelectedTableId(assignedId);
              setIsTableFixed(true);
              setFixedTableName(assignedTable.name);
              
              // Auto-select Game Type based on Table Type
              setSelectedType(assignedTable.type);
              
              // Set default subtype for auto-selected type
              if (assignedTable.type === GameType.CAROM) setSubType('3 Băng');
              if (assignedTable.type === GameType.POOL) setSubType('9 Bi');
          }
      }
  }, []);

  // Step 1: Select Game Type
  const handleTypeSelect = (type: GameType) => {
    setSelectedType(type);
    // Set default subtypes
    if (type === GameType.CAROM) setSubType('3 Băng');
    if (type === GameType.POOL) setSubType('9 Bi');
  };

  // Step 2: Select Mode
  const handleModeSelect = (mode: GameMode) => {
    setSelectedMode(mode);
  };

  // Step 3: Configure Players & Start
  const handleStart = () => {
    if (selectedType && selectedMode) {
      
      // Update Table Status ONLY if user is a CLUB ADMIN or the device is bound
      if (selectedTableId && (userRole === 'club' || isTableFixed)) {
          const stored = localStorage.getItem(TABLES_STORAGE_KEY);
          const currentTables = stored ? JSON.parse(stored) : INITIAL_TABLES;
          
          const updatedTables = currentTables.map((t: Table) => {
              if (t.id === selectedTableId) {
                  return { ...t, status: TableStatus.OCCUPIED, startTime: Date.now(), orders: [] };
              }
              return t;
          });
          
          localStorage.setItem(TABLES_STORAGE_KEY, JSON.stringify(updatedTables));
      }

      const settings: MatchSettings = {
        gameType: selectedType,
        subType: subType,
        gameMode: selectedMode,
        numPlayers: numPlayers,
        players: players,
        shotSeconds: shotSeconds > 0 ? shotSeconds : undefined,
        targetScore: targetScore > 0 ? targetScore : undefined,
        tableId: selectedTableId || undefined
      };
      onStartMatch(settings);
      navigate('/match');
    }
  };

  const handleUpdatePlayerName = (idx: number, name: string) => {
    const newPlayers = [...players];
    newPlayers[idx].name = name;
    setPlayers(newPlayers);
  };

  const handleClose = () => navigate('/');

  return (
    <div className="min-h-full flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col min-h-[600px]">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b bg-gray-50">
          <h2 className="text-xl font-bold text-orange-500 uppercase tracking-wide">
            {step === 1 && "Chọn Thể Loại"}
            {step === 2 && "Chọn Chế Độ"}
            {step === 3 && "Chọn Người Chơi"}
          </h2>
          <button onClick={handleClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="text-gray-500" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-8 flex flex-col justify-center items-center bg-white">
          
          {/* STEP 1: Game Type */}
          {step === 1 && (
            <div className="w-full space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <TypeCard 
                  label="CAROM" 
                  icon={<div className="border-2 border-current w-12 h-16 rounded-md"></div>}
                  active={selectedType === GameType.CAROM}
                  onClick={() => handleTypeSelect(GameType.CAROM)}
                />
                <TypeCard 
                  label="LIBRE" 
                  icon={<div className="flex gap-1 justify-center"><div className="w-4 h-4 rounded-full border-2 border-current"></div><div className="w-4 h-4 rounded-full border-2 border-current"></div></div>}
                  active={selectedType === GameType.LIBRE}
                  onClick={() => handleTypeSelect(GameType.LIBRE)}
                />
                <TypeCard 
                  label="POOL" 
                  icon={<div className="w-0 h-0 border-l-[10px] border-l-transparent border-b-[16px] border-b-current border-r-[10px] border-r-transparent"></div>}
                  active={selectedType === GameType.POOL}
                  onClick={() => handleTypeSelect(GameType.POOL)}
                />
              </div>

              {/* Table Selection - Only for Fixed Devices or Club Admins */}
              {(isTableFixed || userRole === 'club') && (
                  <div className="flex justify-center w-full">
                      <div className="w-full max-w-md">
                          <label className="block text-sm font-bold text-gray-500 mb-2 uppercase text-center">Bàn Thi Đấu</label>
                          
                          {isTableFixed ? (
                              // Fixed Table (Read Only)
                              <div className="w-full p-3 border-2 border-green-500 bg-green-50 rounded-lg flex items-center justify-center gap-2 text-green-700 font-bold shadow-sm">
                                  <Lock size={18} />
                                  <span>Đã kết nối: {fixedTableName}</span>
                                  <span className="text-xs bg-green-200 px-2 py-0.5 rounded uppercase">{selectedType}</span>
                              </div>
                          ) : (
                              // Manual Selection (Admins Only)
                              <div className="relative">
                                <select 
                                    value={selectedTableId}
                                    onChange={(e) => setSelectedTableId(e.target.value)}
                                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none appearance-none bg-white font-bold text-gray-700"
                                >
                                    <option value="">-- Chọn bàn (Tính tiền) --</option>
                                    {availableTables.map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.name} - {t.type} {t.status === TableStatus.OCCUPIED ? '(Đang chơi)' : ''}
                                        </option>
                                    ))}
                                </select>
                                <LayoutGrid className="absolute left-3 top-3 text-gray-400" size={20} />
                              </div>
                          )}
                      </div>
                  </div>
              )}

              {/* Subtypes */}
              {selectedType && (
                <div className="flex justify-center gap-4 mt-8 animate-fade-in">
                  {selectedType === GameType.CAROM && (
                    <>
                      <SubTypeButton label="1 Băng" active={subType === '1 Băng'} onClick={() => setSubType('1 Băng')} />
                      <SubTypeButton label="3 Băng" active={subType === '3 Băng'} onClick={() => setSubType('3 Băng')} />
                    </>
                  )}
                  {selectedType === GameType.POOL && (
                    <>
                      <SubTypeButton label="9 Bi" active={subType === '9 Bi'} onClick={() => setSubType('9 Bi')} />
                      <SubTypeButton label="15 Bi" active={subType === '15 Bi'} onClick={() => setSubType('15 Bi')} />
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Mode */}
          {step === 2 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
               <ModeCard 
                 label="Nhanh" 
                 icon={<Zap />} 
                 active={selectedMode === GameMode.QUICK}
                 onClick={() => handleModeSelect(GameMode.QUICK)}
               />
               <ModeCard 
                 label="Thời gian" 
                 icon={<Clock />} 
                 active={selectedMode === GameMode.TIME}
                 onClick={() => handleModeSelect(GameMode.TIME)}
               />
               <ModeCard 
                 label="Loại trừ" 
                 icon={<Users />} 
                 active={selectedMode === GameMode.ELIMINATION}
                 onClick={() => handleModeSelect(GameMode.ELIMINATION)}
               />
               <ModeCard 
                 label="Thi đấu" 
                 icon={<Trophy />} 
                 active={selectedMode === GameMode.TOURNAMENT}
                 onClick={() => handleModeSelect(GameMode.TOURNAMENT)}
               />
            </div>
          )}

          {/* STEP 3: Players */}
          {step === 3 && (
            <div className="w-full max-w-2xl space-y-8">
              {/* Player Count Selection */}
              <div className="flex justify-center gap-4 mb-6">
                {[2, 3, 4, 5].map(n => (
                  <button 
                    key={n}
                    onClick={() => {
                        setNumPlayers(n);
                        // Adjust players array size
                        const newPlayers = [...players];
                        if (n > newPlayers.length) {
                            for(let i = newPlayers.length; i < n; i++) newPlayers.push({ id: String(i+1), name: `Người chơi ${i+1}`});
                        } else {
                            newPlayers.splice(n);
                        }
                        setPlayers(newPlayers);
                    }}
                    className={`flex flex-col items-center justify-center w-20 h-20 rounded-xl border-2 transition-all ${numPlayers === n ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                  >
                    <Users size={24} />
                    <span className="font-bold text-lg">{n} Người</span>
                  </button>
                ))}
              </div>

              {/* Player Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {players.map((p, idx) => (
                    <div key={p.id} className={`flex items-center gap-2 p-3 border rounded-lg ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-orange-50'}`}>
                        <div className="w-10 h-10 rounded-full bg-white border flex items-center justify-center text-gray-500 font-bold">
                            {idx + 1}
                        </div>
                        <input 
                            value={p.name}
                            onChange={(e) => handleUpdatePlayerName(idx, e.target.value)}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 font-medium placeholder-gray-400"
                            placeholder="Tên người chơi..."
                        />
                        <button className="text-gray-400 hover:text-orange-500">
                            <UserPlus size={18} />
                        </button>
                    </div>
                ))}
              </div>

              {/* Game Settings: Shot Clock & Target Score */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Shot Timer */}
                  {selectedType === GameType.CAROM && (
                    <div className="p-4 border rounded-lg bg-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock size={20} className="text-orange-500" />
                          <span className="font-medium text-gray-700 text-sm">Thời gian cơ (s):</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setShotSeconds(Math.max(10, shotSeconds - 5))}
                              className="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold"
                            >
                              -
                            </button>
                            <input 
                                type="number" 
                                min="10"
                                max="300"
                                value={shotSeconds}
                                onChange={(e) => setShotSeconds(parseInt(e.target.value) || 40)}
                                className="w-16 p-2 border rounded text-center font-bold"
                            />
                             <button 
                              onClick={() => setShotSeconds(shotSeconds + 5)}
                              className="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold"
                            >
                              +
                            </button>
                        </div>
                    </div>
                  )}

                  {/* Target Score */}
                  <div className="p-4 border rounded-lg bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target size={20} className="text-red-500" />
                        <span className="font-medium text-gray-700 text-sm">Điểm kết thúc:</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setTargetScore(Math.max(0, targetScore - 1))}
                            className="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold"
                          >
                            -
                          </button>
                          <input 
                              type="number" 
                              min="0"
                              placeholder="0"
                              value={targetScore}
                              onChange={(e) => setTargetScore(parseInt(e.target.value) || 0)}
                              className="w-16 p-2 border rounded text-center font-bold"
                          />
                           <button 
                            onClick={() => setTargetScore(targetScore + 1)}
                            className="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                      </div>
                  </div>
              </div>
              <div className="text-center text-xs text-gray-400 italic">
                *Điểm kết thúc = 0 là không giới hạn
              </div>

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t bg-gray-50 flex justify-end">
          {step > 1 && (
             <button 
                onClick={() => setStep(prev => prev - 1 as 1|2|3)}
                className="mr-auto px-6 py-3 text-gray-600 font-bold hover:text-gray-900"
             >
                QUAY LẠI
             </button>
          )}
          
          <button 
            onClick={() => {
                if (step === 1 && selectedType) setStep(2);
                else if (step === 2 && selectedMode) setStep(3);
                else if (step === 3) handleStart();
            }}
            disabled={(step === 1 && !selectedType) || (step === 2 && !selectedMode)}
            className={`flex items-center gap-2 px-8 py-3 rounded-lg font-bold text-white transition-all shadow-lg
                ${((step === 1 && !selectedType) || (step === 2 && !selectedMode)) 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-orange-500 hover:bg-orange-600 hover:scale-105'}`}
          >
            {step === 3 ? 'HOÀN TẤT' : 'TIẾP TỤC'}
            {step !== 3 && <ArrowRight size={20} />}
            {step === 3 && <Check size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

// Sub-components for styling
const TypeCard = ({ label, icon, active, onClick }: any) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center w-full h-40 rounded-xl border-4 transition-all duration-200
        ${active ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-inner' : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-orange-200 hover:bg-white hover:shadow-lg'}
        `}
    >
        <div className="mb-4 transform scale-150">{icon}</div>
        <span className="text-xl font-bold tracking-wider">{label}</span>
    </button>
);

const SubTypeButton = ({ label, active, onClick }: any) => (
    <button
        onClick={onClick}
        className={`w-24 h-24 rounded-full border-2 flex items-center justify-center font-bold text-lg transition-all
        ${active ? 'bg-orange-500 border-orange-600 text-white shadow-lg scale-110' : 'bg-white border-gray-200 text-gray-500 hover:border-orange-300'}
        `}
    >
        {label}
    </button>
);

const ModeCard = ({ label, icon, active, onClick }: any) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all h-32
        ${active ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-white'}
        `}
    >
        <div className="mb-2">{icon}</div>
        <span className="font-bold">{label}</span>
    </button>
);

export default SetupMatchScreen;