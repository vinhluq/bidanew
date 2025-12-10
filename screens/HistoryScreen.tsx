import React from 'react';
import { MOCK_HISTORY } from '../constants';
import { Search, Filter, Calendar } from 'lucide-react';

const HistoryScreen: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 border-l-4 border-orange-500 pl-3">Lịch Sử Trận Đấu</h2>
        
        <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Tìm kiếm..." 
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-orange-500 outline-none"
                />
            </div>
            <button className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600">
                <Filter size={20} />
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-50 border-b">
                    <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thể loại</th>
                        <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Người chơi 1</th>
                        <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Tỷ số</th>
                        <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Người chơi 2</th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Kết quả</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {MOCK_HISTORY.map((match) => (
                        <tr key={match.id} className="hover:bg-orange-50 transition-colors cursor-pointer">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} />
                                    {match.date}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                                <span className="px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs uppercase font-bold">{match.type}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center font-medium">
                                {match.player1Name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className={`font-bold text-lg ${match.score1 > match.score2 ? 'text-green-600' : 'text-gray-400'}`}>{match.score1}</span>
                                <span className="mx-2 text-gray-300">-</span>
                                <span className={`font-bold text-lg ${match.score2 > match.score1 ? 'text-green-600' : 'text-gray-400'}`}>{match.score2}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center font-medium">
                                {match.player2Name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                <span className="text-orange-500 font-bold hover:underline">Chi tiết &rarr;</span>
                            </td>
                        </tr>
                    ))}
                    {MOCK_HISTORY.length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                Chưa có dữ liệu trận đấu
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default HistoryScreen;
