
import React, { useState, useEffect } from 'react';
import { GeneratedContent, ChannelProfile, SavedScript, SheetRow } from '../types';
import { generateVideoContent, generateOptimizedDescription, generateThumbnailIdeas, generateThumbnailImage, generateSocialPosts, getTrendingIdeas } from '../services/geminiService';
import { Sparkles, Copy, Loader2, Video, FileText, Tag, Download, AlertCircle, RefreshCw, Wand2, Plus, Save, Trash2, Clock, Edit3, LayoutTemplate, Database, ArrowRight, Image as ImageIcon, Palette, Share2, Facebook, Linkedin, Twitter, Check, Search, ExternalLink } from 'lucide-react';

interface ContentGeneratorProps {
  activeProfile?: ChannelProfile;
  initialParams?: any; // Props mới để nhận dữ liệu từ màn hình khác
}

const ContentGenerator: React.FC<ContentGeneratorProps> = ({ activeProfile, initialParams }) => {
  // --- INPUT STATE ---
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState(activeProfile?.defaultTone || 'Hài hước & Năng động');
  const [videoType, setVideoType] = useState<'LONG' | 'SHORT'>('LONG');
  
  // --- PROCESS STATE ---
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pushStatus, setPushStatus] = useState<'IDLE' | 'PUSHING' | 'SUCCESS'>('IDLE');

  // --- THUMBNAIL STATE ---
  const [editorTab, setEditorTab] = useState<'SCRIPT' | 'THUMBNAIL' | 'PROMOTION'>('SCRIPT');
  const [thumbPrompts, setThumbPrompts] = useState<string[]>([]);
  const [activeThumbPrompt, setActiveThumbPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSuggestingIdeas, setIsSuggestingIdeas] = useState(false);
  const [thumbnailStyle, setThumbnailStyle] = useState('Cinematic');

  // --- PROMOTION STATE ---
  const [socialPosts, setSocialPosts] = useState<{facebook?: string, twitter?: string, linkedin?: string}>({});
  const [isGeneratingSocial, setIsGeneratingSocial] = useState(false);

  // --- TREND HUNTING STATE (NEW) ---
  const [isHunting, setIsHunting] = useState(false);
  const [trendIdeas, setTrendIdeas] = useState<string[]>([]);
  const [trendSources, setTrendSources] = useState<{title: string, uri: string}[]>([]);
  const [showTrends, setShowTrends] = useState(false);

  // --- COPY STATE ---
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // --- DATA STATE ---
  const [savedScripts, setSavedScripts] = useState<SavedScript[]>([]);
  const [activeScript, setActiveScript] = useState<SavedScript | null>(null);

  // Load saved scripts from localStorage on mount
  useEffect(() => {
      const loadHistory = () => {
          const data = localStorage.getItem('tm_saved_scripts');
          if (data) {
              const parsed = JSON.parse(data);
              // Filter scripts relevant to current profile if needed, currently showing all for demo
              setSavedScripts(parsed);
          }
      };
      loadHistory();
  }, []);

  // Xử lý dữ liệu được truyền từ trang khác (VD: Từ Audit)
  useEffect(() => {
      if (initialParams && initialParams.topic) {
          setTopic(initialParams.topic);
          setActiveScript(null); // Reset về mode tạo mới
          setError(null);
      }
  }, [initialParams]);

  // Khi switch script, reset state thumbnail & promotion & trends
  useEffect(() => {
      if (activeScript) {
          setActiveThumbPrompt(activeScript.thumbnailPrompt || '');
          setGeneratedImage(null); 
          setThumbPrompts([]);
          setSocialPosts(activeScript.socialPosts || {});
          setEditorTab('SCRIPT');
          setShowTrends(false);
      }
  }, [activeScript?.id]);

  const saveHistoryToStorage = (scripts: SavedScript[]) => {
      setSavedScripts(scripts);
      localStorage.setItem('tm_saved_scripts', JSON.stringify(scripts));
  };

  const handleGenerate = async () => {
    if (!topic) return;
    if (!activeProfile?.geminiApiKey) {
        setError("Vui lòng cấu hình Gemini API Key cho kênh này trong phần Cài đặt.");
        return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const data = await generateVideoContent(activeProfile.geminiApiKey, topic, tone, videoType);
      
      // Convert GeneratedContent to SavedScript format for editing
      const newScript: SavedScript = {
          id: Date.now().toString(),
          profileId: activeProfile.id,
          type: videoType,
          topic: topic,
          title: data.title,
          description: data.description,
          content: `HOOK: ${data.hook}\n\n${data.scriptOutline.join('\n\n')}`,
          tags: data.tags,
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString()
      };

      setActiveScript(newScript);
      
      // Auto save to history
      const updatedHistory = [newScript, ...savedScripts];
      saveHistoryToStorage(updatedHistory);

    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi tạo nội dung.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCurrentWork = () => {
      if (!activeScript) return;
      setIsSaving(true);
      
      // Update modified time & prompt & social
      const updatedScript = { 
          ...activeScript, 
          lastModified: new Date().toISOString(),
          thumbnailPrompt: activeThumbPrompt,
          socialPosts: socialPosts
      };
      setActiveScript(updatedScript);

      // Update in list
      const updatedList = savedScripts.map(s => s.id === updatedScript.id ? updatedScript : s);
      saveHistoryToStorage(updatedList);

      setTimeout(() => setIsSaving(false), 500);
  };

  // --- FEATURE MỚI: ĐẨY SANG PLANNER ---
  const handlePushToPlanner = () => {
      if (!activeScript || !activeProfile) return;
      
      setPushStatus('PUSHING');

      try {
          // 1. Lấy dữ liệu Planner hiện tại của Profile này
          const storageKey = `tm_sheet_${activeProfile.id}`;
          const existingDataStr = localStorage.getItem(storageKey);
          let existingRows: SheetRow[] = existingDataStr ? JSON.parse(existingDataStr) : [];

          // 2. Tạo row mới từ Script đã viết
          const newRow: SheetRow = {
              id: `gen-${Date.now()}`,
              topic: activeScript.topic,
              status: 'OPTIMIZED', // Đã có content nên coi như đã Optimized
              optimizedTitle: activeScript.title,
              optimizedDesc: activeScript.description,
              keywords: activeScript.tags.join(', '),
              seoScore: 90, // Giả định cao vì do AI viết
              logs: 'Imported from Content Studio'
          };

          // 3. Lưu ngược lại vào Storage
          const updatedRows = [...existingRows, newRow];
          localStorage.setItem(storageKey, JSON.stringify(updatedRows));

          setTimeout(() => {
              setPushStatus('SUCCESS');
              // Reset status sau 3s
              setTimeout(() => setPushStatus('IDLE'), 3000);
          }, 800);

      } catch (e) {
          console.error(e);
          setPushStatus('IDLE');
          alert("Lỗi khi đẩy sang Planner");
      }
  };

  const handleNewProject = () => {
      setActiveScript(null);
      setTopic('');
      setError(null);
      setPushStatus('IDLE');
  };

  const handleDeleteScript = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if(window.confirm('Bạn có chắc muốn xóa kịch bản này?')) {
          const updated = savedScripts.filter(s => s.id !== id);
          saveHistoryToStorage(updated);
          if (activeScript?.id === id) {
              setActiveScript(null);
          }
      }
  };

  const handleDownload = () => {
    if (!activeScript) return;
    const content = `TITLE: ${activeScript.title}\n\nDESCRIPTION:\n${activeScript.description}\n\nTAGS: ${activeScript.tags.join(', ')}\n\nCONTENT:\n${activeScript.content}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${activeScript.title.substring(0,20)}.txt`;
    link.click();
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // --- THUMBNAIL FUNCTIONS ---
  const handleSuggestIdeas = async () => {
    if (!activeScript || !activeProfile?.geminiApiKey) return;
    setIsSuggestingIdeas(true);
    try {
        // Pass the selected style to the service
        const ideas = await generateThumbnailIdeas(activeProfile.geminiApiKey, activeScript.title, activeScript.content, thumbnailStyle);
        setThumbPrompts(ideas);
        if (ideas.length > 0 && !activeThumbPrompt) {
            setActiveThumbPrompt(ideas[0]);
        }
    } catch (e) {
        alert("Lỗi khi tạo ý tưởng thumbnail: " + e);
    } finally {
        setIsSuggestingIdeas(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!activeThumbPrompt || !activeProfile?.geminiApiKey) return;
    setIsGeneratingImage(true);
    try {
        // Pass style to generation function
        const base64 = await generateThumbnailImage(activeProfile.geminiApiKey, activeThumbPrompt, thumbnailStyle);
        setGeneratedImage(base64);
    } catch (e: any) {
        alert("Lỗi khi tạo ảnh: " + e.message);
    } finally {
        setIsGeneratingImage(false);
    }
  };

  // --- SOCIAL FUNCTIONS ---
  const handleGenerateSocial = async () => {
      if (!activeScript || !activeProfile?.geminiApiKey) return;
      setIsGeneratingSocial(true);
      try {
          const posts = await generateSocialPosts(activeProfile.geminiApiKey, activeScript.title, activeScript.description);
          setSocialPosts(posts);
      } catch (e: any) {
          alert("Lỗi tạo bài đăng MXH: " + e.message);
      } finally {
          setIsGeneratingSocial(false);
      }
  };

  // --- TREND FUNCTIONS (NEW) ---
  const handleHuntTrends = async () => {
      if (!activeProfile?.geminiApiKey) {
          setError("Vui lòng cấu hình API Key để sử dụng tính năng này.");
          return;
      }
      setIsHunting(true);
      setShowTrends(true);
      try {
          const niche = topic || "Công nghệ, Tài chính và Giải trí";
          const result = await getTrendingIdeas(activeProfile.geminiApiKey, niche);
          if (result) {
              setTrendIdeas(result.ideas);
              setTrendSources(result.sources);
          }
      } catch (e: any) {
          setError("Lỗi tìm xu hướng: " + e.message);
      } finally {
          setIsHunting(false);
      }
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-slate-50 overflow-hidden">
      
      {/* COL 1: LIBRARY SIDEBAR */}
      <div className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col h-full z-10 hidden md:flex">
          <div className="p-4 border-b border-slate-100">
              <button 
                onClick={handleNewProject}
                className="w-full flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 p-2.5 rounded-lg font-bold transition text-sm"
              >
                  <Plus className="w-4 h-4" /> Dự Án Mới
              </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {savedScripts.length === 0 && (
                  <div className="text-center py-10 px-4 text-slate-400 text-xs">
                      Chưa có kịch bản nào được lưu. Hãy tạo cái đầu tiên!
                  </div>
              )}
              {savedScripts.map(script => (
                  <div 
                    key={script.id}
                    onClick={() => setActiveScript(script)}
                    className={`group p-3 rounded-lg cursor-pointer border transition-all relative ${
                        activeScript?.id === script.id 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-transparent hover:border-slate-200'
                    }`}
                  >
                      <div className="flex justify-between items-start">
                          <div className="flex items-center gap-1.5 mb-1 opacity-80">
                              {script.type === 'SHORT' ? <Video className="w-3 h-3" /> : <LayoutTemplate className="w-3 h-3" />}
                              <span className="text-[10px] font-mono">{new Date(script.createdAt).toLocaleDateString('vi-VN')}</span>
                          </div>
                          <button 
                            onClick={(e) => handleDeleteScript(script.id, e)}
                            className={`p-1 rounded hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition ${activeScript?.id === script.id ? 'text-white' : 'text-red-500'}`}
                          >
                              <Trash2 className="w-3 h-3" />
                          </button>
                      </div>
                      <h4 className="font-bold text-sm line-clamp-2 leading-tight">{script.title || script.topic}</h4>
                  </div>
              ))}
          </div>
      </div>

      {/* COL 2: CONFIG PANEL */}
      {!activeScript && (
        <div className="w-full md:w-80 bg-white border-r border-slate-200 flex flex-col h-full overflow-y-auto p-6 animate-fade-in custom-scrollbar">
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-1 text-indigo-600">
                    <Wand2 className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-widest">AI Writer Studio</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900">Thiết Lập</h2>
            </div>
            
            <div className="space-y-6 flex-1">
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Loại Video</label>
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => setVideoType('LONG')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition ${videoType === 'LONG' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                        <LayoutTemplate className="w-6 h-6" />
                        <span className="text-xs font-bold">Video Dài</span>
                    </button>
                    <button 
                        onClick={() => setVideoType('SHORT')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition ${videoType === 'SHORT' ? 'bg-pink-50 border-pink-500 text-pink-700 ring-1 ring-pink-500' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Video className="w-6 h-6" />
                        <span className="text-xs font-bold">Shorts/Reels</span>
                    </button>
                </div>
            </div>

            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-slate-700">Chủ đề / Ý tưởng</label>
                    <button 
                        onClick={handleHuntTrends}
                        disabled={isHunting}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition"
                    >
                        {isHunting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                        Săn Trend Google
                    </button>
                </div>
                
                <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={videoType === 'SHORT' ? "VD: Mẹo cắt hành tây không cay mắt..." : "VD: Review chi tiết iPhone 15 sau 1 tháng..."}
                    className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-slate-50 text-slate-800 min-h-[120px] resize-none shadow-inner"
                />

                {/* TREND RESULTS UI */}
                {showTrends && (
                    <div className="mt-3 bg-orange-50 border border-orange-100 rounded-xl p-3 animate-fade-in">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-bold text-orange-600 uppercase flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Trending Ideas
                            </span>
                            <button onClick={() => setShowTrends(false)} className="text-orange-400 hover:text-orange-600"><Check className="w-3 h-3"/></button>
                        </div>
                        {isHunting ? (
                             <div className="flex flex-col items-center justify-center py-4 text-orange-400 text-xs gap-2">
                                 <Loader2 className="w-5 h-5 animate-spin" /> Đang quét Google Search...
                             </div>
                        ) : (
                            <div className="space-y-2">
                                {trendIdeas.map((idea, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => setTopic(idea)}
                                        className="w-full text-left text-xs text-slate-700 bg-white p-2 rounded border border-orange-100 hover:border-orange-300 hover:shadow-sm transition"
                                    >
                                        {idea}
                                    </button>
                                ))}
                                {trendSources.length > 0 && (
                                    <div className="pt-2 mt-2 border-t border-orange-200/50">
                                        <p className="text-[10px] text-orange-400 mb-1">Sources:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {trendSources.slice(0, 3).map((s, i) => (
                                                <a key={i} href={s.uri} target="_blank" rel="noreferrer" className="text-[9px] bg-white px-1.5 py-0.5 rounded text-slate-500 hover:text-indigo-600 border border-orange-100 flex items-center gap-1">
                                                    {s.title.substring(0, 15)}... <ExternalLink className="w-2 h-2"/>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Phong cách</label>
                <div className="relative">
                    <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full p-4 appearance-none border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-700 font-medium"
                    >
                    <option value="Hài hước & Năng động">😂 Hài hước & Năng động</option>
                    <option value="Nghiêm túc & Chuyên gia">🧐 Nghiêm túc & Chuyên gia</option>
                    <option value="Drama & Kịch tính">🎭 Drama & Kịch tính</option>
                    <option value="Thân thiện & Chia sẻ">🥰 Thân thiện & Chia sẻ</option>
                    </select>
                    <div className="absolute right-4 top-4 pointer-events-none text-slate-400">▼</div>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            <button
                onClick={handleGenerate}
                disabled={isLoading || !topic}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl shadow-indigo-200 transform hover:-translate-y-0.5"
            >
                {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                {isLoading ? 'AI Đang Viết...' : 'Tạo Nội Dung Ngay'}
            </button>
            </div>
        </div>
      )}

      {/* COL 3: EDITOR (MAIN AREA) */}
      <div className="flex-1 bg-slate-100/50 h-full flex flex-col overflow-hidden relative">
        {activeScript ? (
            <div className="flex flex-col h-full animate-fade-in">
                {/* Toolbar */}
                <div className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center sticky top-0 z-20 shadow-sm">
                    <div className="flex items-center gap-4">
                         <button 
                             onClick={() => setActiveScript(null)} 
                             className="md:hidden p-2 -ml-2 text-slate-500"
                         >
                            <ArrowRight className="w-5 h-5 rotate-180" />
                        </button>
                        
                        {/* View Switcher */}
                        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                            <button 
                                onClick={() => setEditorTab('SCRIPT')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition ${editorTab === 'SCRIPT' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <FileText className="w-3 h-3"/> Script
                            </button>
                            <button 
                                onClick={() => setEditorTab('THUMBNAIL')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition ${editorTab === 'THUMBNAIL' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <ImageIcon className="w-3 h-3"/> Thumbnail
                            </button>
                             <button 
                                onClick={() => setEditorTab('PROMOTION')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition ${editorTab === 'PROMOTION' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Share2 className="w-3 h-3"/> Social
                            </button>
                        </div>

                        <div className="hidden md:flex h-4 w-px bg-slate-300"></div>
                        <span className="hidden md:flex text-xs text-slate-400 items-center gap-1">
                            <Clock className="w-3 h-3" /> Saved: {new Date(activeScript.lastModified).toLocaleTimeString()}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button 
                             onClick={handleSaveCurrentWork}
                             className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition text-xs font-bold flex items-center gap-2"
                        >
                            {isSaving ? <Loader2 className="w-3 h-3 animate-spin"/> : <Save className="w-3 h-3" />} <span className="hidden md:inline">Save</span>
                        </button>
                        <button 
                             onClick={handlePushToPlanner}
                             disabled={pushStatus === 'SUCCESS'}
                             className={`px-3 py-1.5 text-white rounded-lg transition text-xs font-bold flex items-center gap-2 shadow-sm ${
                                 pushStatus === 'SUCCESS' ? 'bg-green-600' : 'bg-slate-800 hover:bg-slate-900'
                             }`}
                        >
                            {pushStatus === 'PUSHING' ? <Loader2 className="w-3 h-3 animate-spin"/> : 
                             pushStatus === 'SUCCESS' ? <Database className="w-3 h-3" /> : <Database className="w-3 h-3" />} 
                            {pushStatus === 'SUCCESS' ? 'Đã Thêm' : 'Add to Plan'}
                        </button>
                        <button 
                             onClick={handleDownload}
                             className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-xs font-bold flex items-center gap-2 shadow-indigo-200 shadow-lg"
                        >
                            <Download className="w-3 h-3" /> <span className="hidden md:inline">Export</span>
                        </button>
                    </div>
                </div>

                {/* EDITOR CONTENT AREA */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                    {editorTab === 'SCRIPT' && (
                        /* SCRIPT EDITOR */
                        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 min-h-[800px] p-8 md:p-12 animate-fade-in">
                            {/* Title Editor */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Title</label>
                                    <button 
                                        onClick={() => handleCopy(activeScript.title, 'title')}
                                        className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition ${copiedField === 'title' ? 'text-green-600' : 'text-slate-400 hover:text-indigo-600'}`}
                                    >
                                        {copiedField === 'title' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                        {copiedField === 'title' ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                                <input 
                                    type="text" 
                                    value={activeScript.title}
                                    onChange={(e) => setActiveScript({...activeScript, title: e.target.value})}
                                    className="w-full text-2xl md:text-3xl font-black text-slate-900 border-none focus:ring-0 p-0 placeholder-slate-300"
                                    placeholder="Enter Video Title Here..."
                                />
                            </div>

                            {/* Description Editor */}
                            <div className="mb-8 bg-slate-50 p-4 rounded-lg border border-slate-100 group focus-within:border-indigo-300 focus-within:ring-1 focus-within:ring-indigo-200 transition">
                                <div className="flex justify-between mb-2">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description & SEO</label>
                                    <button 
                                        onClick={() => handleCopy(activeScript.description, 'description')}
                                        className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition ${copiedField === 'description' ? 'text-green-600' : 'text-slate-400 hover:text-indigo-600'}`}
                                    >
                                        {copiedField === 'description' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                        {copiedField === 'description' ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                                <textarea 
                                    value={activeScript.description}
                                    onChange={(e) => setActiveScript({...activeScript, description: e.target.value})}
                                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm text-slate-600 font-mono min-h-[100px] resize-none"
                                    placeholder="Video description..."
                                />
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {activeScript.tags.map((tag, i) => (
                                        <span key={i} className="bg-white border border-slate-200 px-2 py-1 rounded text-[10px] text-slate-500 font-medium">#{tag}</span>
                                    ))}
                                </div>
                            </div>

                            {/* Content Editor */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <FileText className="w-3 h-3" /> Script Content
                                    </label>
                                    <button 
                                        onClick={() => handleCopy(activeScript.content, 'content')}
                                        className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition ${copiedField === 'content' ? 'text-green-600' : 'text-slate-400 hover:text-indigo-600'}`}
                                    >
                                        {copiedField === 'content' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                        {copiedField === 'content' ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                                <textarea 
                                    value={activeScript.content}
                                    onChange={(e) => setActiveScript({...activeScript, content: e.target.value})}
                                    className="w-full h-[500px] resize-y border-none focus:ring-0 p-0 text-lg leading-relaxed text-slate-800 placeholder-slate-300"
                                    placeholder="Write your script here..."
                                />
                            </div>
                        </div>
                    )}
                    
                    {editorTab === 'THUMBNAIL' && (
                        /* THUMBNAIL EDITOR */
                        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                            <Palette className="w-6 h-6 text-pink-600" /> Thumbnail Studio
                                        </h3>
                                        <p className="text-slate-500 text-sm mt-1">Sử dụng Imagen 3 để tạo hình ảnh 16:9 chất lượng cao.</p>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <select 
                                            value={thumbnailStyle} 
                                            onChange={(e) => setThumbnailStyle(e.target.value)}
                                            className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 focus:ring-pink-500 outline-none cursor-pointer hover:bg-slate-50"
                                        >
                                            <option value="Cinematic">🎬 Cinematic (Điện ảnh)</option>
                                            <option value="Hyper-Realistic">📸 Realistic (Siêu thực)</option>
                                            <option value="Anime">🎨 Anime (Hoạt hình Nhật)</option>
                                            <option value="3D Cartoon">🧸 3D Cartoon (Pixar)</option>
                                            <option value="Cyberpunk">🌃 Cyberpunk (Tương lai)</option>
                                            <option value="Minimalist">✨ Minimalist (Tối giản)</option>
                                            <option value="Retro Vintage">📻 Retro/Vintage (Cổ điển)</option>
                                            <option value="Oil Painting">🖼️ Oil Painting (Tranh sơn dầu)</option>
                                            <option value="Horror">👻 Horror (Kinh dị/Dark)</option>
                                        </select>

                                        <button 
                                            onClick={handleSuggestIdeas}
                                            disabled={isSuggestingIdeas}
                                            className="px-4 py-2 bg-pink-50 text-pink-700 border border-pink-200 rounded-lg text-xs font-bold hover:bg-pink-100 transition flex items-center gap-2"
                                        >
                                            {isSuggestingIdeas ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>}
                                            Đề xuất ý tưởng
                                        </button>
                                    </div>
                                </div>

                                {/* Prompts Selection */}
                                {thumbPrompts.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                                        {thumbPrompts.map((p, idx) => (
                                            <div 
                                                key={idx} 
                                                onClick={() => setActiveThumbPrompt(p)}
                                                className={`p-3 rounded-xl border cursor-pointer text-xs leading-relaxed transition hover:border-pink-400 ${activeThumbPrompt === p ? 'bg-pink-50 border-pink-500 text-pink-900 ring-1 ring-pink-500' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                                            >
                                                {p.substring(0, 120)}...
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Input Area */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-2">Image Prompt (English)</label>
                                        <textarea
                                            value={activeThumbPrompt}
                                            onChange={(e) => setActiveThumbPrompt(e.target.value)}
                                            placeholder="Describe the image you want to generate..."
                                            className="w-full h-24 p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-pink-500 outline-none font-mono text-sm"
                                        />
                                    </div>
                                    <button
                                        onClick={handleGenerateImage}
                                        disabled={isGeneratingImage || !activeThumbPrompt}
                                        className="w-full py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-bold hover:from-pink-700 hover:to-purple-700 transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-pink-200"
                                    >
                                        {isGeneratingImage ? <Loader2 className="animate-spin w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                                        {isGeneratingImage ? 'Đang Vẽ (Sẽ mất khoảng 10-20s)...' : 'Tạo Thumbnail Ngay'}
                                    </button>
                                </div>
                            </div>

                            {/* Result Area */}
                            {generatedImage && (
                                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-lg animate-fade-in">
                                    <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden relative group">
                                        <img src={generatedImage} alt="Generated Thumbnail" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                            <a 
                                                href={generatedImage} 
                                                download={`thumbnail-${Date.now()}.jpg`}
                                                className="bg-white text-slate-900 px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition transform"
                                            >
                                                <Download className="w-5 h-5" /> Tải Về Máy
                                            </a>
                                        </div>
                                    </div>
                                    <div className="mt-4 text-center">
                                        <p className="text-xs text-slate-400">Ảnh được tạo bởi Imagen 4.0 với phong cách {thumbnailStyle}.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {editorTab === 'PROMOTION' && (
                        /* PROMOTION EDITOR */
                        <div className="max-w-6xl mx-auto animate-fade-in space-y-6">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                            <Share2 className="w-6 h-6 text-blue-600" /> Social Booster
                                        </h3>
                                        <p className="text-slate-500 text-sm mt-1">Tự động tạo nội dung quảng bá trên đa nền tảng.</p>
                                    </div>
                                    <button 
                                        onClick={handleGenerateSocial}
                                        disabled={isGeneratingSocial}
                                        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition flex items-center gap-2 shadow-lg shadow-blue-200"
                                    >
                                        {isGeneratingSocial ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>}
                                        Tạo Bài Đăng Ngay
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* FACEBOOK */}
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <div className="flex items-center gap-2 mb-3 text-blue-700 font-bold">
                                            <Facebook className="w-5 h-5" /> Facebook
                                        </div>
                                        <textarea 
                                            value={socialPosts.facebook || ''}
                                            onChange={(e) => setSocialPosts({...socialPosts, facebook: e.target.value})}
                                            placeholder="Nội dung Facebook sẽ hiện ở đây..."
                                            className="w-full h-64 p-3 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                        />
                                        <div className="mt-2 flex justify-end">
                                             <button onClick={() => {navigator.clipboard.writeText(socialPosts.facebook || '')}} className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1">
                                                <Copy className="w-3 h-3"/> Copy
                                             </button>
                                        </div>
                                    </div>

                                    {/* TWITTER */}
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <div className="flex items-center gap-2 mb-3 text-sky-500 font-bold">
                                            <Twitter className="w-5 h-5" /> Twitter / X
                                        </div>
                                        <textarea 
                                            value={socialPosts.twitter || ''}
                                            onChange={(e) => setSocialPosts({...socialPosts, twitter: e.target.value})}
                                            placeholder="Thread Twitter sẽ hiện ở đây..."
                                            className="w-full h-64 p-3 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 outline-none resize-none"
                                        />
                                        <div className="mt-2 flex justify-end">
                                             <button onClick={() => {navigator.clipboard.writeText(socialPosts.twitter || '')}} className="text-xs font-bold text-slate-500 hover:text-sky-600 flex items-center gap-1">
                                                <Copy className="w-3 h-3"/> Copy
                                             </button>
                                        </div>
                                    </div>

                                    {/* LINKEDIN */}
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <div className="flex items-center gap-2 mb-3 text-blue-800 font-bold">
                                            <Linkedin className="w-5 h-5" /> LinkedIn
                                        </div>
                                        <textarea 
                                            value={socialPosts.linkedin || ''}
                                            onChange={(e) => setSocialPosts({...socialPosts, linkedin: e.target.value})}
                                            placeholder="Bài viết chuyên nghiệp sẽ hiện ở đây..."
                                            className="w-full h-64 p-3 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-800 outline-none resize-none"
                                        />
                                        <div className="mt-2 flex justify-end">
                                             <button onClick={() => {navigator.clipboard.writeText(socialPosts.linkedin || '')}} className="text-xs font-bold text-slate-500 hover:text-blue-800 flex items-center gap-1">
                                                <Copy className="w-3 h-3"/> Copy
                                             </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        ) : (
             <div className="h-full flex flex-col items-center justify-center text-slate-300">
                <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-6">
                    <Edit3 className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-400">Chọn hoặc Tạo mới</h3>
                <p className="max-w-xs text-center mt-2 opacity-70">Chọn một dự án từ cột bên trái hoặc tạo kịch bản mới để bắt đầu soạn thảo.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default ContentGenerator;
