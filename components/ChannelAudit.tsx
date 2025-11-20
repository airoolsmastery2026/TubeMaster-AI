
import React, { useState } from 'react';
import { auditChannel } from '../services/geminiService';
import { AuditResult, ChannelProfile, AppView } from '../types';
import { Search, Activity, TrendingUp, AlertTriangle, CheckCircle, Target, ArrowRight, PenTool } from 'lucide-react';

interface ChannelAuditProps {
    activeProfile?: ChannelProfile;
    onNavigate?: (view: AppView, params?: any) => void; // Hàm điều hướng mới
}

const ChannelAudit: React.FC<ChannelAuditProps> = ({ activeProfile, onNavigate }) => {
  const [inputInfo, setInputInfo] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAudit = async () => {
    if (!inputInfo.trim()) return;
    if (!activeProfile?.geminiApiKey) {
        setError("Lỗi: Chưa cấu hình API Key cho kênh này.");
        return;
    }

    setIsAuditing(true);
    setError(null);
    setResult(null);
    
    try {
      const res = await auditChannel(activeProfile.geminiApiKey, inputInfo);
      setResult(res);
      
      // Save to persistence for Dashboard
      if (activeProfile) {
          localStorage.setItem(`tm_audit_${activeProfile.id}`, JSON.stringify(res));
      }

    } catch (err: any) {
      setError(err.message || "Không thể phân tích. Vui lòng kiểm tra lại kết nối.");
    } finally {
      setIsAuditing(false);
    }
  };

  const handleCreateContent = (suggestion: string) => {
      if (onNavigate) {
          onNavigate(AppView.GENERATOR, { topic: suggestion });
      }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 pb-20">
        
      {/* HERO HEADER */}
      <div className="text-center mb-10">
         <h2 className="text-3xl font-black text-slate-900 mb-3">Doctor Channel 🏥</h2>
         <p className="text-slate-500 max-w-xl mx-auto">Hệ thống chẩn đoán sức khỏe kênh chuyên sâu bằng AI. Phát hiện điểm yếu, cơ hội và phân tích đối thủ cạnh tranh.</p>
      </div>

      {/* INPUT AREA */}
      {!result && (
          <div className="bg-white rounded-2xl shadow-xl shadow-indigo-900/5 border border-slate-100 overflow-hidden max-w-2xl mx-auto transition-all hover:shadow-2xl hover:shadow-indigo-900/10">
            <div className="p-8">
                <label className="block text-sm font-bold text-slate-800 mb-3">
                    Nhập dữ liệu kênh cần khám (Metrics, Tình trạng, Niche...)
                </label>
                <textarea
                    value={inputInfo}
                    onChange={(e) => setInputInfo(e.target.value)}
                    placeholder="Ví dụ: Kênh làm về Review công nghệ, 10k sub nhưng view lẹt đẹt 500 view/video. CTR 2%. Khán giả chủ yếu 18-24..."
                    className="w-full h-40 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-slate-700 text-sm bg-slate-50 mb-4"
                ></textarea>
                
                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4"/> {error}
                    </div>
                )}

                <button
                    onClick={handleAudit}
                    disabled={isAuditing || !inputInfo}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-lg shadow-indigo-200 flex justify-center items-center gap-2 text-lg"
                >
                    {isAuditing ? <Activity className="animate-spin" /> : <Search className="w-5 h-5" />}
                    {isAuditing ? 'AI Đang Chẩn Đoán...' : 'Bắt Đầu Khám Kênh'}
                </button>
            </div>
            <div className="bg-slate-50 px-8 py-4 text-center border-t border-slate-100">
                <p className="text-xs text-slate-400">Dữ liệu được bảo mật và xử lý bởi Google Gemini AI</p>
            </div>
          </div>
      )}

      {/* RESULT DASHBOARD */}
      {result && (
        <div className="animate-fade-in space-y-8">
          <div className="flex justify-between items-center">
             <button onClick={() => setResult(null)} className="text-slate-400 hover:text-indigo-600 text-sm font-bold flex items-center gap-1">
                &larr; Khám kênh khác
             </button>
             <span className="text-xs text-slate-400 uppercase font-bold tracking-widest">Audit Report Generated</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {/* SCORE CARD */}
             <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                <div className="relative w-32 h-32 mb-4 flex items-center justify-center">
                   {/* CSS Conic Gradient for score ring */}
                   <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${result.score >= 80 ? '#22c55e' : result.score >= 50 ? '#eab308' : '#ef4444'} ${result.score}%, #f1f5f9 0)` }}></div>
                   <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center flex-col">
                      <span className="text-4xl font-black text-slate-900">{result.score}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">/ 100</span>
                   </div>
                </div>
                <h3 className="font-bold text-slate-800 text-lg mb-1">Sức Khỏe Kênh</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${result.score >= 80 ? 'bg-green-100 text-green-700' : result.score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                   {result.score >= 80 ? 'Rất Tốt' : result.score >= 50 ? 'Cần Cải Thiện' : 'Nguy Hiểm'}
                </span>
             </div>

             {/* OVERVIEW CARD */}
             <div className="md:col-span-2 bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-600" /> Chẩn Đoán Tổng Quát
                </h3>
                <p className="text-slate-600 leading-relaxed text-base">
                    {result.analysis}
                </p>
                {result.competitorAnalysis && (
                    <div className="mt-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <h4 className="font-bold text-slate-700 text-sm mb-2 flex items-center gap-2"><Target className="w-4 h-4 text-blue-500"/> Phân Tích Đối Thủ</h4>
                        <p className="text-slate-600 text-sm">{result.competitorAnalysis}</p>
                    </div>
                )}
             </div>
          </div>

          {/* DETAILS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-green-50/50 border border-green-100 p-6 rounded-2xl">
                 <h3 className="font-bold text-green-800 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 fill-green-200 text-green-700" /> Điểm Mạnh
                 </h3>
                 <ul className="space-y-3">
                    {result.strengths.map((item, i) => (
                        <li key={i} className="flex gap-3 items-start text-slate-700 text-sm">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 shrink-0"></span>
                            {item}
                        </li>
                    ))}
                 </ul>
             </div>

             <div className="bg-red-50/50 border border-red-100 p-6 rounded-2xl">
                 <h3 className="font-bold text-red-800 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 fill-red-200 text-red-700" /> Vấn Đề Cần Khắc Phục
                 </h3>
                 <ul className="space-y-3">
                    {result.weaknesses.map((item, i) => (
                        <li key={i} className="flex gap-3 items-start text-slate-700 text-sm">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 shrink-0"></span>
                            {item}
                        </li>
                    ))}
                 </ul>
             </div>
          </div>

          {/* ACTION PLAN */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/50 overflow-hidden">
             <div className="bg-slate-900 text-white p-6">
                 <h3 className="font-bold text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-yellow-400" /> Action Plan (Kế Hoạch Hành Động)
                 </h3>
                 <p className="text-slate-400 text-sm mt-1">Các bước cụ thể để tối ưu hóa kênh ngay lập tức. Nhấn vào nút Bút để tạo nội dung.</p>
             </div>
             <div className="p-6 space-y-4">
                {result.actionItems.map((item, i) => (
                    <div key={i} className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 transition group">
                        <div className="w-8 h-8 rounded-full bg-white text-indigo-600 border border-indigo-100 font-bold flex items-center justify-center shadow-sm shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition">
                            {i + 1}
                        </div>
                        <p className="text-slate-700 font-medium flex-1">{item}</p>
                        
                        {/* SMART ACTION BUTTON */}
                        <button 
                            onClick={() => handleCreateContent(item)}
                            className="self-end md:self-center px-4 py-2 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-sm shrink-0"
                        >
                             <PenTool className="w-3 h-3" /> Viết Kịch Bản
                        </button>
                    </div>
                ))}
             </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default ChannelAudit;
