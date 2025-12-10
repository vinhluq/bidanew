
import React, { useState, useEffect } from 'react';
import { Menu, X, Home, Settings, LogOut, User, Video, History, LogIn, LayoutGrid, UserCircle, Building2, MapPin, Lock, Unlock } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DEVICE_TABLE_ID_KEY, TABLES_STORAGE_KEY } from '../constants';
import { Table, TableStatus } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
  userRole: 'club' | 'player' | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, isAuthenticated, userRole, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [boundTableName, setBoundTableName] = useState<string | null>(null);
  const [isDeviceLocked, setIsDeviceLocked] = useState(false);
  const [lockedTableData, setLockedTableData] = useState<Table | null>(null);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  const isFullScreen = location.pathname === '/match';
  const isLoginPage = location.pathname === '/login';

  // Check for Table Identity and Lock Status
  useEffect(() => {
    const checkStatus = () => {
        const tableId = localStorage.getItem(DEVICE_TABLE_ID_KEY);
        if (tableId) {
             const storedTables = localStorage.getItem(TABLES_STORAGE_KEY);
             if (storedTables) {
                 const tables: Table[] = JSON.parse(storedTables);
                 const t = tables.find((tbl) => tbl.id === tableId);
                 if (t) {
                     setBoundTableName(t.name);
                     setLockedTableData(t);
                     setIsDeviceLocked(t.status === TableStatus.LOCKED);
                 } else {
                     setBoundTableName(null);
                     setIsDeviceLocked(false);
                 }
             }
        } else {
            setBoundTableName(null);
            setIsDeviceLocked(false);
        }
    }
    
    checkStatus();
    // Listen for storage events (if status changes from Club Manager)
    window.addEventListener('storage', checkStatus);
    
    // Polling is useful for single-device updates if storage event doesn't trigger across same-origin
    const interval = setInterval(checkStatus, 2000); 
    
    return () => {
        window.removeEventListener('storage', checkStatus);
        clearInterval(interval);
    };
  }, [location.pathname]);

  const handleUnlock = (e: React.FormEvent) => {
      e.preventDefault();
      if (lockedTableData) {
          if (unlockPassword === lockedTableData.password) {
              // Unlock successful
              const storedTables = localStorage.getItem(TABLES_STORAGE_KEY);
              if (storedTables) {
                  const tables: Table[] = JSON.parse(storedTables);
                  const updatedTables = tables.map(t => {
                      if (t.id === lockedTableData.id) {
                          return { ...t, status: TableStatus.AVAILABLE };
                      }
                      return t;
                  });
                  localStorage.setItem(TABLES_STORAGE_KEY, JSON.stringify(updatedTables));
                  // Force local update immediately
                  setIsDeviceLocked(false);
                  setUnlockPassword('');
                  setUnlockError(false);
                  // Trigger event for other tabs
                  window.dispatchEvent(new Event('storage'));
              }
          } else {
              setUnlockError(true);
              setUnlockPassword('');
          }
      }
  };

  if (isDeviceLocked) {
      return (
          <div className="h-screen w-screen bg-gray-900 flex items-center justify-center p-4">
              <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden p-8 text-center animate-fade-in">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Lock size={48} className="text-gray-600" />
                  </div>
                  <h2 className="text-3xl font-black text-gray-800 uppercase mb-2">Bàn Đang Khóa</h2>
                  <p className="text-gray-500 mb-8 font-medium">{boundTableName} - Vui lòng nhập mật khẩu để mở khóa.</p>
                  
                  <form onSubmit={handleUnlock} className="space-y-4">
                      <input 
                          type="password" 
                          autoFocus
                          placeholder="Mật khẩu bàn..."
                          value={unlockPassword}
                          onChange={(e) => { setUnlockPassword(e.target.value); setUnlockError(false); }}
                          className={`w-full text-center text-2xl font-bold py-4 border-2 rounded-xl outline-none focus:ring-4 transition-all
                          ${unlockError ? 'border-red-500 focus:ring-red-200 bg-red-50 text-red-600 placeholder-red-300' : 'border-gray-200 focus:border-orange-500 focus:ring-orange-100 text-gray-800'}`}
                      />
                      {unlockError && <p className="text-red-500 font-bold text-sm">Mật khẩu không đúng!</p>}
                      
                      <button 
                          type="submit"
                          className="w-full py-4 bg-orange-500 text-white font-black uppercase text-lg rounded-xl hover:bg-orange-600 shadow-lg transform hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                      >
                          <Unlock size={24} /> Mở Khóa
                      </button>
                  </form>
                  <p className="mt-6 text-xs text-gray-400">Liên hệ quầy thu ngân để được hỗ trợ.</p>
              </div>
          </div>
      );
  }

  if (isFullScreen) {
    return <div className="h-screen w-screen bg-gray-900 text-white overflow-hidden">{children}</div>;
  }

  const handleNav = (path: string) => {
    navigate(path);
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      {!isLoginPage && (
        <header className="bg-white shadow-md h-16 flex items-center justify-between px-4 z-20 sticky top-0">
          <div className="flex items-center gap-3 md:gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-700"
            >
              <Menu size={28} />
            </button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
               <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xl">
                 9
               </div>
               <h1 className="text-xl font-bold text-gray-800 tracking-tight hidden md:block">BIDAPRO <span className="text-orange-500 text-sm font-normal">SCOREBOARD</span></h1>
            </div>
            
            {/* Table Identity Badge */}
            {boundTableName && (
                <div className="flex items-center gap-1 md:gap-2 bg-orange-50 px-2 md:px-3 py-1.5 rounded-full border border-orange-200 shadow-sm">
                    <MapPin size={14} className="text-orange-600" />
                    <span className="text-xs md:text-sm font-black text-orange-700 uppercase tracking-wide">{boundTableName}</span>
                </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-gray-500">
            {isAuthenticated ? (
                <>
                    {userRole === 'club' ? <Building2 size={16} className="text-blue-500" /> : <UserCircle size={16} className="text-orange-500" />}
                    <span className="hidden md:inline">{userRole === 'club' ? "Quản Trị Viên" : "Cơ Thủ"}</span>
                </>
            ) : (
                <span className="bg-gray-200 px-2 py-1 rounded text-gray-600">Khách</span>
            )}
          </div>
        </header>
      )}

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)}></div>
          <div className="relative w-72 bg-white h-full shadow-2xl flex flex-col animate-slide-in">
            <div className="p-4 border-b flex justify-between items-center bg-orange-500 text-white">
              <span className="font-bold text-lg">Menu</span>
              <button onClick={() => setIsSidebarOpen(false)}><X /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4">
              <nav className="space-y-1 px-2">
                <NavItem icon={<Home size={20}/>} label="Trang chủ" onClick={() => handleNav('/')} />
                
                {/* Admin Only Links */}
                {isAuthenticated && userRole === 'club' && (
                    <>
                        <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase mt-2">Quản lý</div>
                        <NavItem icon={<LayoutGrid size={20}/>} label="Quản lý bàn & Tính tiền" onClick={() => handleNav('/club-manager')} />
                        <NavItem icon={<Settings size={20}/>} label="Cấu hình hệ thống" onClick={() => handleNav('/config')} />
                    </>
                )}

                <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase mt-2">Cá nhân</div>
                <NavItem icon={<History size={20}/>} label="Lịch sử đấu" onClick={() => handleNav('/history')} />
                <NavItem icon={<Video size={20}/>} label="Luyện tập" onClick={() => handleNav('/practice')} />
                {isAuthenticated && <NavItem icon={<User size={20}/>} label="Tài khoản" onClick={() => handleNav('/login')} />}
              </nav>
            </div>

            <div className="p-4 border-t">
              {isAuthenticated ? (
                <button 
                  onClick={() => {
                    onLogout();
                    setIsSidebarOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Đăng xuất</span>
                </button>
              ) : (
                <button 
                  onClick={() => handleNav('/login')}
                  className="flex items-center gap-3 w-full px-4 py-3 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                >
                  <LogIn size={20} />
                  <span className="font-medium">Đăng nhập</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`flex-1 ${!isLoginPage ? 'p-4 md:p-6' : ''} overflow-y-auto`}>
        {children}
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors text-left"
  >
    {icon}
    <span className="font-medium">{label}</span>
  </button>
);

export default Layout;
