
import React, { useState, useEffect } from 'react';
import { AppView, SystemState, ChannelProfile, NEW_PROFILE_TEMPLATE } from './types';
import ContentGenerator from './components/ContentGenerator';
import SheetPlanner from './components/SheetPlanner';
import ChannelAudit from './components/ChannelAudit';
import Settings from './components/Settings';
import { 
  LayoutDashboard, 
  PenTool, 
  Database, 
  Stethoscope, 
  Menu, 
  X, 
  Youtube, 
  Settings as SettingsIcon, 
  Zap, 
  ArrowRight, 
  ChevronDown, 
  Command,
  LogOut,
  Sparkles,
  Plus,
  Bell
} from 'lucide-react';

// Initial Empty State
const INITIAL_STATE: SystemState = {
  profiles: [],
  activeProfileId: null,
  isEncrypted: false
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [systemState, setSystemState] = useState<SystemState>(INITIAL_STATE);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  // State để truyền dữ liệu khi chuyển trang (VD: Từ Audit -> Generator)
  const [navParams, setNavParams] = useState<any>(null);

  // Load settings from localStorage
  useEffect(() => {
    const loadData = () => {
        const savedState = localStorage.getItem('tubeMasterSystem_v2');
        if (savedState) {
          try {
            const parsed = JSON.parse(savedState);
            if (parsed && Array.isArray(parsed.profiles)) {
                setSystemState(parsed);
                return;
            }
          } catch (e) {
            console.error("Lỗi đọc dữ liệu hệ thống, sẽ khởi tạo lại:", e);
          }
        }
        
        const defaultProfile = { ...NEW_PROFILE_TEMPLATE, id: 'default-001', name: 'Demo Channel', avatarColor: 'bg-indigo-500' };
        const newState = {
            profiles: [defaultProfile],
            activeProfileId: 'default-001',
            isEncrypted: false
        };
        setSystemState(newState);
        localStorage.setItem('tubeMasterSystem_v2', JSON.stringify(newState));
    };
    
    loadData();
  }, []);

  const handleSaveState = (newState: SystemState) => {
    setSystemState(newState);
    localStorage.setItem('tubeMasterSystem_v2', JSON.stringify(newState));
  };

  const switchProfile = (profileId: string) => {
      const newState = { ...systemState, activeProfileId: profileId };
      handleSaveState(newState);
      setIsProfileMenuOpen(false);
  };

  // Hàm điều hướng thông minh
  const handleNavigate = (view: AppView, params?: any) => {
      if (params) {
          setNavParams(params);
      }
      setCurrentView(view);
      setIsMobileMenuOpen(false);
  };

  const getActiveProfile = (): ChannelProfile | undefined => {
      return systemState.profiles.find(p => p.id === systemState.activeProfileId);
  };

  const activeProfile = getActiveProfile();

  const renderContent = () => {
    if (!activeProfile && currentView !== AppView.SETTINGS && currentView !== AppView.DASHBOARD) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] text-slate-500 animate-fade-in">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <SettingsIcon className="w-10 h-10 text-slate-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Chưa chọn Hồ sơ Kênh</h2>
                <p className="mb-6 text-center max-w-md">Hệ thống cần biết bạn đang làm việc với kênh nào để tải cấu hình API và dữ liệu tương ứng.</p>
                <button 
                  onClick={() => setCurrentView(AppView.SETTINGS)} 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition shadow-lg shadow-indigo-200"
                >
                    Thiết lập ngay
                </button>
            </div>
        )
    }

    switch (currentView) {
      case AppView.GENERATOR:
        return <ContentGenerator activeProfile={activeProfile} initialParams={navParams} />;
      case AppView.SHEET_PLANNER:
        return <SheetPlanner activeProfile={activeProfile} onNavigate={handleNavigate} />;
      case AppView.AUDIT:
        return <ChannelAudit activeProfile={activeProfile} onNavigate={handleNavigate} />;
      case AppView.SETTINGS:
        return <Settings systemState={systemState} onSaveState={handleSaveState} />;
      case AppView.DASHBOARD:
      default:
        return <Dashboard onViewChange={handleNavigate} activeProfile={activeProfile} />;
    }
  };

  const NavItem = ({ view, icon: Icon, label, desc }: { view: AppView; icon: any; label: string, desc?: string }) => (
    <button
      onClick={() => {
        handleNavigate(view);
      }}
      className={`group flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all duration-200 mb-1 ${
        currentView === view 
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon className={`w-5 h-5 transition-colors ${currentView === view ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
      <div className="text-left">
        <span className="block text-sm font-medium">{label}</span>
      </div>
    </button>
  );

  return (
    <div className="flex h-full bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-72 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0
      `}>
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-900/20">
              <Youtube className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
               <h1 className="text-lg font-bold tracking-tight text-white leading-none">TubeMaster</h1>
               <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-0.5">AI Operating System</p>
            </div>
          </div>
        </div>

        {/* Profile Selector */}
        <div className="px-4 py-6">
             <div className="relative">
                <button 
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="w-full flex items-center gap-3 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all text-left group"
                >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-inner ${activeProfile?.avatarColor || 'bg-slate-600'}`}>
                        {activeProfile?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Workspace</p>
                        <p className="text-sm font-bold text-white truncate group-hover:text-indigo-200 transition">{activeProfile?.name || 'Chọn kênh...'}</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {isProfileMenuOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 shadow-xl rounded-xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="max-h-60 overflow-y-auto py-1">
                            {systemState.profiles.map(p => (
                                <button 
                                    key={p.id}
                                    onClick={() => switchProfile(p.id)}
                                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-slate-700 transition ${p.id === systemState.activeProfileId ? 'bg-slate-700 text-white font-bold' : 'text-slate-300'}`}
                                >
                                    <div className={`w-2 h-2 rounded-full ${p.avatarColor || 'bg-slate-500'}`}></div>
                                    {p.name}
                                </button>
                            ))}
                        </div>
                        <button 
                            onClick={() => {
                                setCurrentView(AppView.SETTINGS);
                                setIsProfileMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 text-xs font-bold text-indigo-400 border-t border-slate-700 hover:bg-slate-700 hover:text-white flex items-center gap-2 transition"
                        >
                            <Plus className="w-3 h-3" /> QUẢN LÝ / THÊM MỚI
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 overflow-y-auto space-y-6 custom-scrollbar">
          <div>
             <div className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Core Modules</div>
             <NavItem view={AppView.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
             <NavItem view={AppView.SHEET_PLANNER} icon={Database} label="Automation Hub" />
             <NavItem view={AppView.GENERATOR} icon={PenTool} label="Content Studio" />
             <NavItem view={AppView.AUDIT} icon={Stethoscope} label="Channel Audit" />
          </div>
          
          <div>
             <div className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">System</div>
             <NavItem view={AppView.SETTINGS} icon={SettingsIcon} label="Settings & API" />
          </div>
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-slate-800">
           <div className="bg-slate-800/50 rounded-lg p-3 flex items-center justify-between border border-slate-700/50">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                 <span className="text-xs font-mono text-slate-400">v2.1.0 connected</span>
              </div>
              <SettingsIcon className="w-3 h-3 text-slate-500" />
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 h-full relative">
        
        {/* Mobile Header Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
        )}

        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-slate-200 px-4 h-16 flex justify-between items-center sticky top-0 z-10">
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white"><Youtube className="w-5 h-5" /></div>
             <span className="font-bold text-slate-800">TubeMaster</span>
           </div>
           <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
             <Menu className="w-6 h-6" />
           </button>
        </header>

        {/* View Content */}
        <main className="flex-1 overflow-auto custom-scrollbar relative">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-soft-light fixed"></div>
            {renderContent()}
        </main>
      </div>
    </div>
  );
};

/* --- SUB-COMPONENT: DASHBOARD --- */
const Dashboard: React.FC<{ onViewChange: (view: AppView, params?: any) => void, activeProfile?: ChannelProfile }> = ({ onViewChange, activeProfile }) => {
  const [stats, setStats] = useState({
      pending: 0,
      scripts: 0,
      health: 0
  });

  // Load real-time stats from localStorage
  useEffect(() => {
      if (!activeProfile) return;

      // 1. Get Scripts Count
      const savedScripts = JSON.parse(localStorage.getItem('tm_saved_scripts') || '[]');
      const profileScripts = savedScripts.filter((s: any) => s.profileId === activeProfile.id);

      // 2. Get Pending Jobs (Sheets)
      const savedRows = JSON.parse(localStorage.getItem(`tm_sheet_${activeProfile.id}`) || '[]');
      const pending = savedRows.filter((r: any) => r.status !== 'PUBLISHED' && r.status !== 'ERROR').length;

      // 3. Get Health Score
      const savedAudit = JSON.parse(localStorage.getItem(`tm_audit_${activeProfile.id}`) || 'null');
      const health = savedAudit ? savedAudit.score : 0;

      setStats({
          pending,
          scripts: profileScripts.length,
          health
      });

  }, [activeProfile]); // Re-run when profile changes

  const statItems = [
    { label: 'Video Đang Chờ', value: stats.pending.toString(), icon: Database, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Kịch Bản Đã Viết', value: stats.scripts.toString(), icon: PenTool, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Sức Khỏe Kênh', value: stats.health > 0 ? stats.health.toString() : '--', icon: Stethoscope, color: stats.health >= 80 ? 'text-green-600' : stats.health >= 50 ? 'text-yellow-600' : 'text-red-600', bg: stats.health >= 80 ? 'bg-green-100' : 'bg-slate-100' },
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            Xin chào, <span className="text-indigo-600">{activeProfile?.name || 'Creator'}</span> 👋
          </h2>
          <p className="text-slate-500 font-medium">Đây là trung tâm chỉ huy kênh YouTube của bạn.</p>
        </div>
        <div className="flex gap-3">
             <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 hover:border-slate-300 transition shadow-sm">
                <Bell className="w-5 h-5" />
             </button>
             <button 
                onClick={() => onViewChange(AppView.GENERATOR)}
                className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-lg font-bold shadow-lg shadow-slate-900/20 transition transform hover:-translate-y-0.5"
             >
                <Plus className="w-4 h-4" /> Tạo Nội Dung
             </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statItems.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
               <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                 <stat.icon className="w-6 h-6" />
               </div>
               <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition" />
            </div>
            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</h3>
            <p className="text-4xl font-black text-slate-900">{activeProfile ? stat.value : '--'}</p>
          </div>
        ))}
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Quick Access */}
         <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-lg text-slate-900 mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" /> Tác Vụ Nhanh
            </h3>
            <div className="space-y-4">
               <button 
                 onClick={() => onViewChange(AppView.SHEET_PLANNER)}
                 disabled={!activeProfile}
                 className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-white hover:from-blue-100 border border-blue-100 rounded-xl group transition disabled:opacity-50"
               >
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-blue-600 group-hover:text-blue-700">
                        <Database className="w-5 h-5" />
                     </div>
                     <div className="text-left">
                        <p className="font-bold text-slate-800">Xử lý Google Sheets</p>
                        <p className="text-xs text-slate-500">Tự động hóa SEO & Upload</p>
                     </div>
                  </div>
                  <div className="bg-white px-3 py-1 rounded-full text-xs font-bold text-blue-600 border border-blue-200 group-hover:bg-blue-600 group-hover:text-white transition">Start</div>
               </button>

               <button 
                 onClick={() => onViewChange(AppView.AUDIT)}
                 disabled={!activeProfile}
                 className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-white hover:from-purple-100 border border-purple-100 rounded-xl group transition disabled:opacity-50"
               >
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-purple-600 group-hover:text-purple-700">
                        <Stethoscope className="w-5 h-5" />
                     </div>
                     <div className="text-left">
                        <p className="font-bold text-slate-800">Khám Kênh</p>
                        <p className="text-xs text-slate-500">Phân tích chỉ số & đối thủ</p>
                     </div>
                  </div>
                  <div className="bg-white px-3 py-1 rounded-full text-xs font-bold text-purple-600 border border-purple-200 group-hover:bg-purple-600 group-hover:text-white transition">Audit</div>
               </button>
            </div>
         </div>

         {/* System Status */}
         <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl shadow-slate-900/10">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
            <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-red-500 rounded-full blur-3xl opacity-20"></div>
            
            <h3 className="font-bold text-lg mb-6 relative z-10 flex items-center gap-2">
               <Command className="w-5 h-5 text-slate-400" /> System Integrity
            </h3>
            
            <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
                    <span className="text-slate-300 text-sm font-medium">API Connection (Gemini)</span>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${activeProfile?.geminiApiKey ? 'text-green-400' : 'text-red-400'}`}>
                            {activeProfile?.geminiApiKey ? 'ACTIVE' : 'DISCONNECTED'}
                        </span>
                        <div className={`w-2 h-2 rounded-full ${activeProfile?.geminiApiKey ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-red-400'}`}></div>
                    </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
                    <span className="text-slate-300 text-sm font-medium">Content Database</span>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${activeProfile?.sheetId ? 'text-blue-400' : 'text-yellow-400'}`}>
                            {activeProfile?.sheetId ? 'LINKED' : 'MOCK MODE'}
                        </span>
                        <div className={`w-2 h-2 rounded-full ${activeProfile?.sheetId ? 'bg-blue-400' : 'bg-yellow-400 animate-pulse'}`}></div>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 text-xs text-slate-400 font-mono">
                <p>Current Session ID: {Math.random().toString(36).substring(7).toUpperCase()}</p>
                <p className="mt-1">Encryption: AES-256 (Simulated)</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default App;
