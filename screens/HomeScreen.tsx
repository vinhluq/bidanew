import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, History, Dumbbell } from 'lucide-react';

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col items-center justify-center py-10">
      
      {/* Hero Section */}
      <div className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-2xl bg-gray-900 border-4 border-gray-800">
        {/* Background Image Simulation */}
        <div className="absolute inset-0 opacity-40">
           <img 
            src="https://picsum.photos/1200/800?grayscale" 
            alt="Billiard Hall" 
            className="w-full h-full object-cover"
           />
        </div>
        
        {/* Content Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-8">
            <div className="mb-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-500 rounded-full text-white text-4xl font-black mb-4 shadow-lg border-4 border-white/20">9</div>
                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-lg">
                    SCOREBOARD
                </h1>
                <p className="text-gray-300 mt-2 font-light text-lg tracking-widest uppercase">Bảng điểm thông minh</p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 w-full">
                
                {/* Practice Button */}
                <button 
                    onClick={() => navigate('/practice')}
                    className="group flex flex-col items-center gap-3 transition-transform transform hover:scale-105"
                >
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-xl border-4 border-white/10 group-hover:border-white/40 transition-all">
                        <Dumbbell size={48} className="text-white" />
                    </div>
                    <span className="text-white font-bold text-lg uppercase tracking-wide drop-shadow-md">Luyện tập</span>
                </button>

                {/* History Button */}
                <button 
                    onClick={() => navigate('/history')}
                    className="group flex flex-col items-center gap-3 transition-transform transform hover:scale-105"
                >
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center shadow-xl border-4 border-white/10 group-hover:border-white/40 transition-all">
                        <History size={48} className="text-white" />
                    </div>
                    <span className="text-white font-bold text-lg uppercase tracking-wide drop-shadow-md">Lịch sử</span>
                </button>

                {/* Start Match Button */}
                <button 
                    onClick={() => navigate('/setup-match')}
                    className="group flex flex-col items-center gap-3 transition-transform transform hover:scale-105"
                >
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-xl border-4 border-white/10 group-hover:border-white/40 transition-all animate-pulse-slow">
                        <PlayCircle size={56} className="text-white fill-current" />
                    </div>
                    <span className="text-white font-bold text-lg uppercase tracking-wide drop-shadow-md">Bắt đầu</span>
                </button>

            </div>
        </div>
      </div>
      
      <div className="mt-8 text-center text-gray-500 text-sm">
        Phiên bản 2.0.1 - BIDAPRO System
      </div>
    </div>
  );
};

export default HomeScreen;
