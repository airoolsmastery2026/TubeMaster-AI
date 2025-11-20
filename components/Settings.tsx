
import React, { useState, useEffect } from 'react';
import { ChannelProfile, NEW_PROFILE_TEMPLATE, SystemState } from '../types';
import { Save, Key, Database, Clock, Youtube, ShieldCheck, AlertTriangle, Plus, Trash2, User, Lock, Eye, EyeOff, Monitor } from 'lucide-react';

interface SettingsProps {
  systemState: SystemState;
  onSaveState: (newState: SystemState) => void;
}

const Settings: React.FC<SettingsProps> = ({ systemState, onSaveState }) => {
  const [localProfiles, setLocalProfiles] = useState<ChannelProfile[]>(systemState.profiles);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(systemState.activeProfileId || '');
  const [showSecrets, setShowSecrets] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false); // Simple logic to simulate secure access

  // Đồng bộ state khi props thay đổi
  useEffect(() => {
    setLocalProfiles(systemState.profiles);
    if (systemState.activeProfileId && !selectedProfileId) {
      setSelectedProfileId(systemState.activeProfileId);
    }
  }, [systemState]);

  // Logic thêm profile mới
  const handleAddProfile = () => {
    const newProfile = {
      ...NEW_PROFILE_TEMPLATE,
      id: Date.now().toString(),
      name: `Kênh Mới ${localProfiles.length + 1}`,
      avatarColor: ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500'][Math.floor(Math.random() * 4)]
    };
    const updatedProfiles = [...localProfiles, newProfile];
    setLocalProfiles(updatedProfiles);
    setSelectedProfileId(newProfile.id);
    
    // Auto save to system
    onSaveState({
      ...systemState,
      profiles: updatedProfiles,
      activeProfileId: newProfile.id
    });
  };

  // Logic xóa profile
  const handleDeleteProfile = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa kênh này? Dữ liệu cấu hình sẽ mất vĩnh viễn.')) {
      const updatedProfiles = localProfiles.filter(p => p.id !== id);
      setLocalProfiles(updatedProfiles);
      if (selectedProfileId === id) {
        setSelectedProfileId(updatedProfiles.length > 0 ? updatedProfiles[0].id : '');
      }
      onSaveState({
        ...systemState,
        profiles: updatedProfiles,
        activeProfileId: updatedProfiles.length > 0 ? updatedProfiles[0].id : null
      });
    }
  };

  // Logic cập nhật trường dữ liệu của profile đang chọn
  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLocalProfiles(prev => prev.map(p => p.id === selectedProfileId ? { ...p, [name]: value } : p));
  };

  // Lưu toàn bộ
  const handleSaveAll = () => {
    onSaveState({
      ...systemState,
      profiles: localProfiles,
      activeProfileId: selectedProfileId
    });
    alert("Đã lưu cấu hình hệ thống thành công!");
  };

  const handleUnlock = () => {
     // Mock security: In real app, compare with stored hash
     if (pinCode === '1234') { // Default dummy pin
         setIsUnlocked(true);
         setShowSecrets(true);
     } else {
         alert("Mã PIN không đúng (Mặc định: 1234)");
     }
  };

  const currentProfile = localProfiles.find(p => p.id === selectedProfileId);

  return (
    <div className="h-[calc(100vh-60px)] flex flex-col md:flex-row bg-gray-50 overflow-hidden">
      
      {/* Left Sidebar: Profile List */}
      <div className="w-full md:w-72 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Danh Sách Kênh</h3>
          <button onClick={handleAddProfile} className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {localProfiles.map(profile => (
            <div 
              key={profile.id}
              onClick={() => setSelectedProfileId(profile.id)}
              className={`p-3 rounded-lg cursor-pointer flex items-center gap-3 transition-all border ${
                selectedProfileId === profile.id 
                  ? 'bg-blue-50 border-blue-200 shadow-sm' 
                  : 'hover:bg-gray-50 border-transparent'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${profile.avatarColor || 'bg-gray-400'}`}>
                {profile.name.substring(0, 1).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className={`font-bold text-sm truncate ${selectedProfileId === profile.id ? 'text-blue-800' : 'text-gray-700'}`}>
                    {profile.name}
                </p>
                <p className="text-[10px] text-gray-400 truncate">
                    ID: {profile.channelId || 'Chưa kết nối'}
                </p>
              </div>
              {selectedProfileId === profile.id && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              )}
            </div>
          ))}
          {localProfiles.length === 0 && (
              <div className="text-center p-8 text-gray-400 text-sm">
                  Chưa có hồ sơ nào.<br/>Nhấn + để thêm.
              </div>
          )}
        </div>
      </div>

      {/* Right Content: Profile Detail */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {currentProfile ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-6 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold shadow-md ${currentProfile.avatarColor || 'bg-gray-400'}`}>
                         <Monitor className="w-6 h-6" />
                    </div>
                    <div>
                        <input 
                            type="text" 
                            name="name"
                            value={currentProfile.name}
                            onChange={handleFieldChange}
                            className="text-xl font-bold text-gray-900 border-none focus:ring-0 p-0 bg-transparent hover:bg-gray-50 rounded"
                        />
                        <p className="text-xs text-gray-500 font-mono mt-1">Profile ID: {currentProfile.id}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => handleDeleteProfile(currentProfile.id)} className="text-red-500 hover:bg-red-50 p-2 rounded transition">
                        <Trash2 className="w-5 h-5" />
                    </button>
                    <button onClick={handleSaveAll} className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg font-bold transition shadow-lg">
                        <Save className="w-4 h-4" /> Lưu Cấu Hình
                    </button>
                </div>
            </div>

            {/* Form Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                <div className="max-w-3xl mx-auto space-y-6">
                    
                    {/* Security Lock */}
                    {!isUnlocked && (
                        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
                            <ShieldCheck className="w-12 h-12 text-yellow-600 mb-4" />
                            <h3 className="font-bold text-yellow-800 text-lg mb-2">Khu vực Bảo mật</h3>
                            <p className="text-yellow-700 mb-4 text-sm max-w-md">
                                Để xem và chỉnh sửa API Key, vui lòng nhập mã PIN bảo vệ. Việc này nhằm đảm bảo an toàn khi bạn làm việc nơi công cộng.
                            </p>
                            <div className="flex gap-2">
                                <input 
                                    type="password" 
                                    placeholder="Nhập PIN (1234)" 
                                    className="p-2 border border-yellow-300 rounded text-center w-32"
                                    value={pinCode}
                                    onChange={(e) => setPinCode(e.target.value)}
                                />
                                <button onClick={handleUnlock} className="bg-yellow-600 text-white px-4 rounded font-bold hover:bg-yellow-700">
                                    Mở Khóa
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Credentials Form - Only show if unlocked */}
                    {isUnlocked && (
                        <div className="grid grid-cols-1 gap-6 animate-fade-in">
                            {/* Gemini API */}
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h4 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2 mb-4 pb-2 border-b">
                                    <Key className="w-4 h-4 text-blue-500" /> AI Credentials (Gemini)
                                </h4>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Gemini API Key</label>
                                    <div className="relative">
                                        <input
                                            type={showSecrets ? "text" : "password"}
                                            name="geminiApiKey"
                                            value={currentProfile.geminiApiKey}
                                            onChange={handleFieldChange}
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="AIza..."
                                        />
                                        <button 
                                            onClick={() => setShowSecrets(!showSecrets)}
                                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                        >
                                            {showSecrets ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* YouTube API */}
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h4 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2 mb-4 pb-2 border-b">
                                    <Youtube className="w-4 h-4 text-red-500" /> YouTube Connection
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Channel ID</label>
                                        <input
                                            type="text"
                                            name="channelId"
                                            value={currentProfile.channelId}
                                            onChange={handleFieldChange}
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm focus:ring-2 focus:ring-red-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Client ID</label>
                                        <input
                                            type="text"
                                            name="youtubeClientId"
                                            value={currentProfile.youtubeClientId}
                                            onChange={handleFieldChange}
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm focus:ring-2 focus:ring-red-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Client Secret</label>
                                        <input
                                            type={showSecrets ? "text" : "password"}
                                            name="youtubeClientSecret"
                                            value={currentProfile.youtubeClientSecret}
                                            onChange={handleFieldChange}
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm focus:ring-2 focus:ring-red-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Google Sheets */}
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h4 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2 mb-4 pb-2 border-b">
                                    <Database className="w-4 h-4 text-green-500" /> Content Source (Google Sheets)
                                </h4>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Sheet ID</label>
                                    <input
                                        type="text"
                                        name="sheetId"
                                        value={currentProfile.sheetId}
                                        onChange={handleFieldChange}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* General Settings (Always Visible) */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                         <h4 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2 mb-4 pb-2 border-b">
                            <Clock className="w-4 h-4 text-purple-500" /> Automation Rules
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Auto Upload Delay (Seconds)</label>
                                <input
                                    type="number"
                                    name="autoUploadDelay"
                                    value={currentProfile.autoUploadDelay}
                                    onChange={handleFieldChange}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Default Tone</label>
                                <input
                                    type="text"
                                    name="defaultTone"
                                    value={currentProfile.defaultTone}
                                    onChange={handleFieldChange}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
              <Monitor className="w-16 h-16 mb-4 opacity-20" />
              <p>Chọn một kênh để cấu hình hoặc tạo mới.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
