
import React, { useState, useEffect } from 'react';
import { ChannelProfile, NEW_PROFILE_TEMPLATE, SystemState } from '../types';
import { Save, Key, Database, Clock, Youtube, ShieldCheck, AlertTriangle, Plus, Trash2, User, Lock, Unlock, Eye, EyeOff, Monitor, FileKey } from 'lucide-react';

interface SettingsProps {
  systemState: SystemState;
  onSaveState: (newState: SystemState) => void;
}

// Helper: Simple XOR Cipher for simulation
// Note: In a real production app, use Web Crypto API or a library like crypto-js
const xorCipher = (text: string, pin: string): string => {
    if (!text || !pin) return text;
    let result = '';
    for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ pin.charCodeAt(i % pin.length));
    }
    return result;
};

const encryptData = (text: string, pin: string): string => {
    // XOR then Base64 to make it look like a hash/ciphertext
    try {
        return btoa(xorCipher(text, pin));
    } catch (e) {
        return text;
    }
};

const decryptData = (ciphertext: string, pin: string): string => {
    // Base64 decode then XOR
    try {
        return xorCipher(atob(ciphertext), pin);
    } catch (e) {
        return ""; // Fail gracefully
    }
};

const Settings: React.FC<SettingsProps> = ({ systemState, onSaveState }) => {
  const [localProfiles, setLocalProfiles] = useState<ChannelProfile[]>(systemState.profiles);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(systemState.activeProfileId || '');
  const [showSecrets, setShowSecrets] = useState(false);
  
  // Encryption State
  const [pinCode, setPinCode] = useState('');
  const [isPinError, setIsPinError] = useState(false);

  // Đồng bộ state khi props thay đổi
  useEffect(() => {
    setLocalProfiles(systemState.profiles);
    if (systemState.activeProfileId && !selectedProfileId) {
      setSelectedProfileId(systemState.activeProfileId);
    }
  }, [systemState]);

  // Reset PIN error when user types
  useEffect(() => {
      if (isPinError) setIsPinError(false);
  }, [pinCode]);

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

  // Toggle Encryption for current profile
  const handleToggleEncryption = () => {
    if (!pinCode || pinCode.length < 4) {
        setIsPinError(true);
        alert("Vui lòng nhập mã PIN ít nhất 4 ký tự để mã hóa/giải mã.");
        return;
    }

    const current = localProfiles.find(p => p.id === selectedProfileId);
    if (!current) return;

    const isEncrypting = !current.isEncrypted;
    
    const updatedProfile = { ...current, isEncrypted: isEncrypting };

    // List of fields to encrypt/decrypt
    const sensitiveFields: (keyof ChannelProfile)[] = ['geminiApiKey', 'youtubeApiKey', 'youtubeClientId', 'youtubeClientSecret', 'channelId', 'sheetId'];

    sensitiveFields.forEach(field => {
        const value = current[field] as string;
        if (value) {
            // @ts-ignore
            updatedProfile[field] = isEncrypting 
                ? encryptData(value, pinCode)
                : decryptData(value, pinCode);
        }
    });

    setLocalProfiles(prev => prev.map(p => p.id === selectedProfileId ? updatedProfile : p));
    setPinCode(''); // Clear PIN
    
    // Show feedback
    if (isEncrypting) {
        alert("Hồ sơ đã được mã hóa an toàn! Các key sẽ bị ẩn.");
    } else {
        alert("Đã giải mã hồ sơ. Bạn có thể chỉnh sửa key ngay bây giờ.");
    }
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
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 relative ${profile.avatarColor || 'bg-gray-400'}`}>
                {profile.name.substring(0, 1).toUpperCase()}
                {profile.isEncrypted && (
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                        <div className="bg-yellow-500 rounded-full p-1">
                            <Lock className="w-2 h-2 text-white" />
                        </div>
                    </div>
                )}
              </div>
              <div className="overflow-hidden flex-1">
                <p className={`font-bold text-sm truncate ${selectedProfileId === profile.id ? 'text-blue-800' : 'text-gray-700'}`}>
                    {profile.name}
                </p>
                <p className="text-[10px] text-gray-400 truncate flex items-center gap-1">
                    {profile.isEncrypted ? 'Encrypted • Protected' : `ID: ${profile.channelId || 'Chưa kết nối'}`}
                </p>
              </div>
              {selectedProfileId === profile.id && (
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
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
            <div className="bg-white border-b border-gray-200 p-6 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold shadow-md ${currentProfile.avatarColor || 'bg-gray-400'}`}>
                         {currentProfile.isEncrypted ? <Lock className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
                    </div>
                    <div>
                        <input 
                            type="text" 
                            name="name"
                            value={currentProfile.name}
                            onChange={handleFieldChange}
                            disabled={currentProfile.isEncrypted}
                            className="text-xl font-bold text-gray-900 border-none focus:ring-0 p-0 bg-transparent hover:bg-gray-50 rounded disabled:text-gray-500"
                        />
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-gray-500 font-mono">Profile ID: {currentProfile.id}</p>
                            {currentProfile.isEncrypted && (
                                <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3"/> Encrypted
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => handleDeleteProfile(currentProfile.id)} 
                        disabled={currentProfile.isEncrypted}
                        className="text-red-500 hover:bg-red-50 p-2 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={handleSaveAll} 
                        className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg font-bold transition shadow-lg"
                    >
                        <Save className="w-4 h-4" /> Lưu Cấu Hình
                    </button>
                </div>
            </div>

            {/* Form Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                <div className="max-w-3xl mx-auto space-y-6">
                    
                    {/* Encryption Control Panel */}
                    <div className={`p-6 rounded-xl border shadow-sm transition-all ${currentProfile.isEncrypted ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'}`}>
                        <div className="flex items-start gap-4">
                             <div className={`p-3 rounded-full ${currentProfile.isEncrypted ? 'bg-yellow-200 text-yellow-700' : 'bg-blue-200 text-blue-700'}`}>
                                 {currentProfile.isEncrypted ? <Lock className="w-6 h-6"/> : <Unlock className="w-6 h-6"/>}
                             </div>
                             <div className="flex-1">
                                 <h3 className={`font-bold text-lg ${currentProfile.isEncrypted ? 'text-yellow-800' : 'text-blue-800'}`}>
                                     {currentProfile.isEncrypted ? 'Hồ Sơ Đang Được Khóa' : 'Bảo Vệ Hồ Sơ'}
                                 </h3>
                                 <p className={`text-sm mt-1 mb-3 ${currentProfile.isEncrypted ? 'text-yellow-700' : 'text-blue-700'}`}>
                                     {currentProfile.isEncrypted 
                                        ? 'Các API Key đang được mã hóa. Nhập PIN để giải mã và chỉnh sửa.' 
                                        : 'Sử dụng PIN để mã hóa API Key trước khi lưu trữ (Local Obfuscation).'}
                                 </p>
                                 
                                 <div className="flex flex-wrap items-center gap-3">
                                     <div className="relative">
                                         <input 
                                            type="password" 
                                            value={pinCode}
                                            onChange={(e) => setPinCode(e.target.value)}
                                            placeholder="Nhập PIN (VD: 1234)"
                                            className={`pl-9 pr-4 py-2 rounded-lg border focus:ring-2 outline-none w-48 text-sm font-bold tracking-widest ${isPinError ? 'border-red-300 ring-2 ring-red-100' : 'border-white/50'}`}
                                         />
                                         <div className="absolute left-3 top-2.5 text-gray-400">
                                             <FileKey className="w-4 h-4"/>
                                         </div>
                                     </div>
                                     <button 
                                        onClick={handleToggleEncryption}
                                        className={`px-5 py-2 rounded-lg text-white font-bold text-sm shadow-md transition flex items-center gap-2 ${currentProfile.isEncrypted ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                                     >
                                         {currentProfile.isEncrypted ? <Unlock className="w-4 h-4"/> : <Lock className="w-4 h-4"/>}
                                         {currentProfile.isEncrypted ? 'Mở Khóa / Giải Mã' : 'Mã Hóa Dữ Liệu'}
                                     </button>
                                 </div>
                             </div>
                        </div>
                    </div>

                    {/* Credentials Form */}
                    <div className={`grid grid-cols-1 gap-6 animate-fade-in ${currentProfile.isEncrypted ? 'opacity-50 pointer-events-none grayscale-[50%]' : ''}`}>
                        {/* Gemini API */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h4 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2 mb-4 pb-2 border-b">
                                <Key className="w-4 h-4 text-blue-500" /> AI Credentials (Gemini)
                            </h4>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Gemini API Key</label>
                                <div className="relative">
                                    <input
                                        type={showSecrets && !currentProfile.isEncrypted ? "text" : "password"}
                                        name="geminiApiKey"
                                        value={currentProfile.geminiApiKey}
                                        onChange={handleFieldChange}
                                        disabled={currentProfile.isEncrypted}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                                        placeholder={currentProfile.isEncrypted ? "ENCRYPTED DATA HIDDEN" : "AIza..."}
                                    />
                                    {!currentProfile.isEncrypted && (
                                        <button 
                                            onClick={() => setShowSecrets(!showSecrets)}
                                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                        >
                                            {showSecrets ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                                        </button>
                                    )}
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
                                        type={showSecrets && !currentProfile.isEncrypted ? "text" : "password"}
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
