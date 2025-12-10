import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameType, Table } from '../types';
import { ArrowLeft, Save, CheckCircle, Monitor, LayoutGrid, Camera, TabletSmartphone } from 'lucide-react';
import { TABLES_STORAGE_KEY, INITIAL_TABLES, DEVICE_TABLE_ID_KEY } from '../constants';

const ConfigScreen: React.FC = () => {
  const navigate = useNavigate();

  // State for configuration
  const [tableCount, setTableCount] = useState<number>(10);
  const [tableNamePattern, setTableNamePattern] = useState<string>('Bàn');
  const [defaultGameType, setDefaultGameType] = useState<GameType>(GameType.CAROM);
  const [cameraUrl, setCameraUrl] = useState<string>('');
  
  // Device Binding State
  const [tables, setTables] = useState<Table[]>([]);
  const [assignedTableId, setAssignedTableId] = useState<string>('');

  // UI State
  const [isSaved, setIsSaved] = useState(false);

  // Load configuration
  useEffect(() => {
    // 1. Load Tables for binding dropdown
    const storedTables = localStorage.getItem(TABLES_STORAGE_KEY);
    setTables(storedTables ? JSON.parse(storedTables) : INITIAL_TABLES);

    // 2. Load Assigned Table ID
    const savedDeviceId = localStorage.getItem(DEVICE_TABLE_ID_KEY);
    if (savedDeviceId) setAssignedTableId(savedDeviceId);

    // 3. Load other mock settings
    const savedConfig = localStorage.getItem('appConfig');
    if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        setTableCount(parsed.tableCount || 10);
        setTableNamePattern(parsed.tableNamePattern || 'Bàn');
        setDefaultGameType(parsed.defaultGameType || GameType.CAROM);
        setCameraUrl(parsed.cameraUrl || '');
    }
  }, []);

  const handleSave = () => {
    // Save device binding
    if (assignedTableId) {
        localStorage.setItem(DEVICE_TABLE_ID_KEY, assignedTableId);
    } else {
        localStorage.removeItem(DEVICE_TABLE_ID_KEY);
    }

    // Save other config
    const config = {
        tableCount,
        tableNamePattern,
        defaultGameType,
        cameraUrl
    };
    localStorage.setItem('appConfig', JSON.stringify(config));
    
    // Show success feedback
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 mt-6 mb-10">
        {/* Header */}
        <div className="bg-gray-800 text-white p-6 flex items-center gap-4">
            <button onClick={handleBack} className="p-2 hover:bg-gray-700 rounded-full transition-colors">
                <ArrowLeft size={24} />
            </button>
            <h2 className="text-xl font-bold uppercase tracking-wide flex-1 text-center pr-10">Chỉnh Sửa Cấu Hình</h2>
        </div>
        
        <div className="p-8 space-y-8">
            
            {/* Device Binding (New Feature) */}
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                <div className="flex items-center gap-2 text-orange-700 font-bold uppercase text-sm border-b border-orange-200 pb-2 mb-4">
                    <TabletSmartphone size={18} /> Định Danh Thiết Bị (Device Identity)
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Thiết bị này là bàn nào?</label>
                    <select 
                        value={assignedTableId}
                        onChange={(e) => setAssignedTableId(e.target.value)}
                        className="w-full p-3 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white font-bold text-gray-800"
                    >
                        <option value="">-- Chưa gán bàn --</option>
                        {tables.map(t => (
                            <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 italic mt-2">
                        Khi chọn, màn hình "Tạo trận đấu" sẽ tự động nhận diện bàn này và ẩn phần chọn bàn.
                    </p>
                </div>
            </div>

            {/* Table Settings */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-600 font-bold uppercase text-sm border-b pb-2">
                    <LayoutGrid size={18} /> Cài đặt chung
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Số lượng bàn (Mặc định)</label>
                        <input 
                            type="number" 
                            min="1"
                            max="100"
                            value={tableCount}
                            onChange={(e) => setTableCount(parseInt(e.target.value) || 0)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all font-bold text-gray-800"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Tên hiển thị (Tiền tố)</label>
                        <input 
                            type="text" 
                            value={tableNamePattern}
                            onChange={(e) => setTableNamePattern(e.target.value)}
                            placeholder="Ví dụ: Bàn" 
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all" 
                        />
                    </div>
                </div>
            </div>

            {/* Game Settings */}
            <div className="space-y-4">
                 <div className="flex items-center gap-2 text-gray-600 font-bold uppercase text-sm border-b pb-2">
                    <Monitor size={18} /> Mặc định trận đấu
                </div>
                
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Thể loại mặc định</label>
                    <select 
                        value={defaultGameType}
                        onChange={(e) => setDefaultGameType(e.target.value as GameType)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white font-medium text-gray-800"
                    >
                        <option value={GameType.CAROM}>Carom (Phăng)</option>
                        <option value={GameType.POOL}>Pool (Lỗ)</option>
                        <option value={GameType.LIBRE}>Libre (Tự do)</option>
                    </select>
                </div>
            </div>

            {/* Hardware Settings */}
            <div className="space-y-4">
                 <div className="flex items-center gap-2 text-gray-600 font-bold uppercase text-sm border-b pb-2">
                    <Camera size={18} /> Phần cứng
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Camera Stream URL (Mặc định)</label>
                    <input 
                        type="text" 
                        value={cameraUrl}
                        onChange={(e) => setCameraUrl(e.target.value)}
                        placeholder="rtsp://admin:password@192.168.1.10..." 
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none font-mono text-sm text-gray-600" 
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="pt-6 flex gap-4">
                 <button 
                    onClick={handleBack}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-lg font-bold hover:bg-gray-200 transition-colors uppercase"
                >
                    Quay về
                 </button>
                 <button 
                    onClick={handleSave}
                    className={`flex-1 py-3 rounded-lg font-bold shadow-md transition-all uppercase flex items-center justify-center gap-2
                    ${isSaved ? 'bg-green-500 text-white' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
                 >
                    {isSaved ? (
                        <>
                            <CheckCircle size={20} /> Đã Lưu
                        </>
                    ) : (
                        <>
                            <Save size={20} /> Áp dụng
                        </>
                    )}
                 </button>
            </div>
        </div>
    </div>
  );
};

export default ConfigScreen;