import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PracticeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDrill, setSelectedDrill] = useState('Bida 3C - Bộ 50');
  
  return (
    <div className="flex flex-col h-full gap-4 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-2">
        <button onClick={() => navigate('/')} className="p-2 bg-white rounded-full shadow hover:bg-gray-100">
            <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">Chế độ Luyện Tập</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-[500px]">
        {/* Left Column: Diagram */}
        <div className="lg:col-span-1 bg-gray-800 rounded-2xl p-4 flex flex-col items-center justify-center relative shadow-lg">
             <div className="text-gray-400 absolute top-4 left-4 text-xs uppercase tracking-widest">Sơ đồ kỹ thuật</div>
             {/* Mock Diagram - using a CSS representation of a pool table diagram */}
             <div className="w-[80%] aspect-[1/2] border-4 border-gray-600 bg-gray-700 relative rounded-lg">
                <div className="absolute top-[20%] left-[20%] w-4 h-4 bg-yellow-400 rounded-full shadow"></div>
                <div className="absolute bottom-[20%] right-[30%] w-4 h-4 bg-white rounded-full shadow"></div>
                <div className="absolute top-[30%] right-[20%] w-4 h-4 bg-red-500 rounded-full shadow"></div>
                
                {/* Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <line x1="20%" y1="20%" x2="80%" y2="30%" stroke="white" strokeWidth="1" strokeDasharray="4" opacity="0.5" />
                </svg>
             </div>
             <div className="mt-6 text-white text-center">
                 <h3 className="font-bold text-xl text-orange-400">Bộ 50</h3>
                 <p className="text-sm text-gray-400 mt-2">Công thức: Điểm trúng = Điểm đầu - Điểm đánh</p>
             </div>
        </div>

        {/* Right Column: Camera & Controls */}
        <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Camera Feed */}
            <div className="bg-black rounded-2xl overflow-hidden aspect-video relative shadow-xl border-2 border-gray-800">
                <img src="https://picsum.photos/800/450" alt="Camera" className="w-full h-full object-cover" />
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full text-white text-xs font-bold animate-pulse">
                    <Video size={12} /> REC
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-2xl p-6 shadow-sm flex-1 flex flex-col justify-between">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Chọn bài tập</label>
                    <select 
                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 outline-none"
                        value={selectedDrill}
                        onChange={(e) => setSelectedDrill(e.target.value)}
                    >
                        <option>Bida 3C - Bộ 50</option>
                        <option>Bida 3C - Bộ Plus</option>
                        <option>Bida 3C - A băng đảo</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                    <button className="flex items-center justify-center gap-2 py-4 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors font-bold text-lg border-2 border-green-200">
                        <CheckCircle size={28} />
                        ĐẠT
                    </button>
                    <button className="flex items-center justify-center gap-2 py-4 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors font-bold text-lg border-2 border-red-200">
                        <XCircle size={28} />
                        HỎNG
                    </button>
                </div>

                <div className="mt-6 pt-6 border-t flex justify-between items-center text-sm text-gray-500">
                    <span>Lần tập: 12</span>
                    <span>Tỷ lệ: <strong className="text-orange-500 text-lg">65%</strong></span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeScreen;
