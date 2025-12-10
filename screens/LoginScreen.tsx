
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Phone, UserCircle, Building2, Monitor, AlertCircle } from 'lucide-react';
import { TABLES_STORAGE_KEY, DEVICE_TABLE_ID_KEY } from '../constants';
import { Table } from '../types';

interface LoginScreenProps {
  onLogin: (role: 'club' | 'player', name: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'player' | 'club' | 'table'>('player');
  
  // Table Login State
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTableId, setSelectedTableId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
      const stored = localStorage.getItem(TABLES_STORAGE_KEY);
      if (stored) {
          setTables(JSON.parse(stored));
      }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedRole === 'table') {
        // Handle Table Device Login
        const targetTable = tables.find(t => t.id === selectedTableId);
        if (!targetTable) {
            setError('Vui lòng chọn bàn cần đăng nhập');
            return;
        }

        // Check password (if table has one)
        if (targetTable.password && targetTable.password !== password) {
            setError('Mật khẩu bàn không đúng');
            return;
        }

        // Success: Bind Device and Login
        localStorage.setItem(DEVICE_TABLE_ID_KEY, targetTable.id);
        onLogin('player', targetTable.name); // Log in as player role, but with table name
        navigate('/');
    } else {
        // Handle User/Admin Login
        if (phoneNumber && password) {
            const name = selectedRole === 'club' ? 'Admin CLB Pro' : 'Cơ thủ Nguyễn Văn A';
            // If logging in as user, clear any previous table binding to avoid confusion
            if (selectedRole === 'club') {
                localStorage.removeItem(DEVICE_TABLE_ID_KEY);
            }
            onLogin(selectedRole, name);
            navigate('/');
        }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className={`p-6 text-center transition-colors ${selectedRole === 'table' ? 'bg-gray-800' : 'bg-orange-500'}`}>
          <h2 className="text-2xl font-bold text-white uppercase tracking-wide">
              {selectedRole === 'table' ? 'Kích Hoạt Thiết Bị' : 'Đăng nhập'}
          </h2>
          {selectedRole === 'table' && <p className="text-gray-400 text-xs mt-1">Dành cho máy tính bảng/màn hình tại bàn</p>}
        </div>

        {/* Role Switcher */}
        <div className="flex p-2 m-4 bg-gray-100 rounded-lg">
            <button 
                type="button"
                onClick={() => { setSelectedRole('player'); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-md font-bold text-xs sm:text-sm transition-all
                ${selectedRole === 'player' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <UserCircle size={16} /> CƠ THỦ
            </button>
            <button 
                type="button"
                onClick={() => { setSelectedRole('club'); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-md font-bold text-xs sm:text-sm transition-all
                ${selectedRole === 'club' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <Building2 size={16} /> CHỦ CLB
            </button>
            <button 
                type="button"
                onClick={() => { setSelectedRole('table'); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-md font-bold text-xs sm:text-sm transition-all
                ${selectedRole === 'table' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <Monitor size={16} /> BÀN / DEVICE
            </button>
        </div>

        {/* Error Message */}
        {error && (
            <div className="mx-8 p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2 text-red-600 text-sm font-bold animate-pulse">
                <AlertCircle size={16} /> {error}
            </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="px-8 pb-8 pt-2 space-y-6">
          
          {selectedRole === 'table' ? (
              // --- TABLE LOGIN FORM ---
              <>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 ml-1">Chọn bàn thiết lập</label>
                    <div className="relative">
                        <select
                            value={selectedTableId}
                            onChange={(e) => setSelectedTableId(e.target.value)}
                            className="block w-full pl-3 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-gray-500 focus:border-gray-500 outline-none transition-all bg-white font-bold text-gray-800"
                            required
                        >
                            <option value="">-- Chọn bàn --</option>
                            {tables.map(t => (
                                <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
                            ))}
                        </select>
                    </div>
                </div>
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 ml-1">Mật khẩu bàn (Nếu có)</label>
                    <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Nhập mật khẩu khóa..."
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-gray-500 focus:border-gray-500 outline-none transition-all font-bold tracking-widest"
                    />
                    </div>
                </div>
              </>
          ) : (
              // --- USER LOGIN FORM ---
              <>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 ml-1">Số điện thoại</label>
                    <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Nhập số điện thoại..."
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                        required
                    />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 ml-1">Mật khẩu</label>
                    <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Nhập mật khẩu..."
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                        required
                    />
                    </div>
                </div>
              </>
          )}

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
             <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors uppercase text-sm"
            >
              Quay về
            </button>
            
            {selectedRole !== 'table' && (
                <button
                type="button"
                className="flex-1 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors uppercase text-sm"
                >
                Đăng ký
                </button>
            )}

            <button
              type="submit"
              className={`flex-1 text-white font-bold py-3 px-4 rounded-lg transition-colors uppercase text-sm shadow-md
              ${selectedRole === 'club' ? 'bg-blue-600 hover:bg-blue-700' : 
                selectedRole === 'table' ? 'bg-gray-800 hover:bg-gray-900' : 
                'bg-orange-500 hover:bg-orange-600'}`}
            >
              {selectedRole === 'table' ? 'Kết nối' : 'Đăng nhập'}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 max-w-lg text-gray-600 space-y-2 text-sm bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <p><span className="font-bold text-orange-500">Lưu ý:</span></p>
        <ul className="list-disc pl-5 space-y-1">
            <li>Tài khoản <strong>Cơ thủ</strong>: Chỉ dùng để thi đấu, xem lịch sử và luyện tập.</li>
            <li>Tài khoản <strong>Chủ CLB</strong>: Có quyền quản lý bàn, tính tiền và cấu hình hệ thống.</li>
            <li>Chế độ <strong>Bàn / Device</strong>: Dành cho thiết bị cố định tại bàn.</li>
        </ul>
      </div>
    </div>
  );
};

export default LoginScreen;
