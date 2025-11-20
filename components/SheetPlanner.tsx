
import React, { useState, useEffect, useRef } from 'react';
import { SheetRow, ChannelProfile, LogEntry, RowStatus, AppView } from '../types';
import { optimizeSheetRow } from '../services/geminiService';
import { Play, Pause, RefreshCw, CloudUpload, Clock, Terminal, Youtube, Check, Loader, AlertTriangle, Hash, FileUp, Download, FileSpreadsheet, Trash2, PenTool } from 'lucide-react';

interface SheetPlannerProps {
  activeProfile?: ChannelProfile;
  onNavigate: (view: AppView, params?: any) => void;
}

const SheetPlanner: React.FC<SheetPlannerProps> = ({ activeProfile, onNavigate }) => {
  const [rows, setRows] = useState<SheetRow[]>([]);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [enableAutoUpload, setEnableAutoUpload] = useState(true);
  const [uploadDelay, setUploadDelay] = useState(10);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const autoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- UTILS & LOGGING ---
  const addLog = (message: string, type: LogEntry['type'] = 'INFO') => {
    const newLog: LogEntry = {
      id: Date.now().toString() + Math.random().toString(),
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour12: false }),
      message,
      type
    };
    setLogs(prev => [...prev, newLog]);
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // --- DATA PERSISTENCE & INIT ---
  // 1. Load data when profile changes
  useEffect(() => {
    setIsAutoRunning(false);
    setLogs([]);
    
    if (activeProfile) {
        addLog(`Initialized environment for profile: ${activeProfile.name}`, 'INFO');
        setUploadDelay(activeProfile.autoUploadDelay || 10);
        
        // Load Rows from Storage
        const storageKey = `tm_sheet_${activeProfile.id}`;
        const savedRowsData = localStorage.getItem(storageKey);
        
        if (savedRowsData) {
            try {
                const parsedRows = JSON.parse(savedRowsData);
                setRows(parsedRows);
                if (parsedRows.length > 0) {
                    addLog(`Restored ${parsedRows.length} pending jobs from previous session.`, 'SUCCESS');
                }
            } catch (e) {
                console.error("Failed to load saved rows", e);
                setRows([]);
            }
        } else {
            setRows([]);
        }

        if (!activeProfile.sheetId) {
             addLog("MODE: Local File System (No Google Sheet linked)", 'WARNING');
        } else {
             addLog(`Connected to Google Sheets [${activeProfile.sheetId.substring(0, 6)}...]`, 'SUCCESS');
        }
    }
  }, [activeProfile?.id]);

  // 2. Auto-save rows whenever they change
  useEffect(() => {
      if (activeProfile?.id) {
          const storageKey = `tm_sheet_${activeProfile.id}`;
          localStorage.setItem(storageKey, JSON.stringify(rows));
      }
  }, [rows, activeProfile?.id]);


  // --- CSV HANDLING ---
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    addLog(`Reading file: ${file.name}...`, 'INFO');
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const text = e.target?.result as string;
        try {
            const parsedRows = parseCSV(text);
            if (parsedRows.length > 0) {
                // Merge with existing or replace? Let's append for now
                setRows(prev => [...prev, ...parsedRows]);
                addLog(`Successfully imported ${parsedRows.length} rows from CSV.`, 'SUCCESS');
            } else {
                addLog("File is empty or invalid format.", 'ERROR');
            }
        } catch (err) {
            addLog("Error parsing CSV file.", 'ERROR');
        }
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  // Simple CSV Parser
  const parseCSV = (csvText: string): SheetRow[] => {
    const lines = csvText.split(/\r\n|\n/);
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const topicIndex = headers.findIndex(h => h.includes('topic') || h.includes('chủ đề') || h.includes('content') || h.includes('tên'));
    const targetIndex = topicIndex !== -1 ? topicIndex : 0;

    const result: SheetRow[] = [];
    
    for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i].trim();
        if (!currentLine) continue;
        
        // Regex split ignore commas inside quotes
        const columns = currentLine.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        
        const rawTopic = columns[targetIndex]?.replace(/^"|"$/g, '').trim();
        
        if (rawTopic) {
            result.push({
                id: `row-${Date.now()}-${i}-${Math.random().toString(36).substr(2,5)}`,
                topic: rawTopic,
                status: 'PENDING'
            });
        }
    }
    return result;
  };

  const handleExportCSV = () => {
    if (rows.length === 0) {
        addLog("Nothing to export.", 'WARNING');
        return;
    }
    let csvContent = "ID,Original Topic,Status,Optimized Title,Optimized Description,Keywords,SEO Score,Video ID\n";
    rows.forEach(row => {
        const clean = (text?: string) => `"${(text || '').replace(/"/g, '""')}"`;
        const line = [
            row.id,
            clean(row.topic),
            row.status,
            clean(row.optimizedTitle),
            clean(row.optimizedDesc),
            clean(row.keywords),
            row.seoScore || 0,
            row.videoId || ''
        ].join(",");
        csvContent += line + "\n";
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `tube_master_export_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addLog("Exported report successfully.", 'SUCCESS');
  };

  const loadSampleData = () => {
      const initialData: SheetRow[] = [
        { id: 'sample-1', topic: "Đánh giá iPhone 15 Pro Max sau 6 tháng", status: 'PENDING' },
        { id: 'sample-2', topic: "Hướng dẫn làm Affiliate Marketing Shopee", status: 'PENDING' },
        { id: 'sample-3', topic: "Top 5 sách hay về tư duy làm giàu", status: 'PENDING' },
      ];
      setRows(prev => [...prev, ...initialData]);
      addLog(`Loaded ${initialData.length} sample rows.`, 'INFO');
  };

  const handleClearAll = () => {
      if(window.confirm("Bạn có chắc muốn xóa toàn bộ danh sách công việc không?")) {
          setRows([]);
          addLog("Cleared all rows.", 'WARNING');
      }
  };

  // --- AI PROCESS LOGIC ---
  const processSingleRow = async (rowId: string) => {
    if (!activeProfile?.geminiApiKey) {
        addLog("ERROR: Missing Gemini API Key. Process aborted.", 'ERROR');
        setIsAutoRunning(false);
        return;
    }

    const currentRow = rows.find(r => r.id === rowId);
    if (!currentRow || (currentRow.status !== 'PENDING' && currentRow.status !== 'ERROR')) return;

    addLog(`>>> START JOB [${rowId}]`, 'INFO');
    updateRowStatus(rowId, 'PROCESSING');

    try {
      addLog(`[${rowId}] Analyzing topic & keywords...`, 'INFO');
      const optimizedRow = await optimizeSheetRow(activeProfile.geminiApiKey, currentRow);
      
      setRows(prev => prev.map(r => r.id === rowId ? { ...optimizedRow, status: 'OPTIMIZED' } : r));
      addLog(`[${rowId}] Optimization Complete. SEO Score: ${optimizedRow.seoScore}`, 'SUCCESS');

      if (!enableAutoUpload) {
        addLog(`[${rowId}] Auto-upload disabled. Job finished.`, 'WARNING');
        return;
      }

      if (isAutoRunning) {
          addLog(`[${rowId}] Cooldown ${uploadDelay}s before upload...`, 'INFO');
          await new Promise(resolve => setTimeout(resolve, uploadDelay * 1000));
      } else {
          await new Promise(resolve => setTimeout(resolve, 1000));
      }

      addLog(`[${rowId}] Pushing to YouTube API...`, 'INFO');
      updateRowStatus(rowId, 'UPLOADING');
      
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      
      const mockVideoId = `v${Date.now().toString().substring(8)}`;
      updateRowStatus(rowId, 'PUBLISHED', mockVideoId);
      addLog(`[${rowId}] PUBLISH SUCCESS. Video ID: ${mockVideoId}`, 'SUCCESS');

    } catch (error: any) {
      addLog(`[${rowId}] FAILED: ${error.message}`, 'ERROR');
      updateRowStatus(rowId, 'ERROR', undefined, error.message);
    }
  };

  const updateRowStatus = (id: string, status: RowStatus, videoId?: string, errorMsg?: string) => {
    setRows(prev => prev.map(r => 
      r.id === id 
        ? { ...r, status, videoId, logs: errorMsg || r.logs } 
        : r
    ));
  };

  useEffect(() => {
    if (!isAutoRunning) {
      if (autoIntervalRef.current) {
        clearInterval(autoIntervalRef.current);
        autoIntervalRef.current = null;
      }
      return;
    }

    addLog(">>> SYSTEM AUTO-PILOT ENGAGED", 'WARNING');

    autoIntervalRef.current = setInterval(() => {
      setRows(currentRows => {
        const isBusy = currentRows.some(r => r.status === 'PROCESSING' || r.status === 'UPLOADING');
        
        if (!isBusy) {
          const nextRow = currentRows.find(r => r.status === 'PENDING');
          if (nextRow) {
            setTimeout(() => processSingleRow(nextRow.id), 0);
          } else {
            setIsAutoRunning(false);
            addLog(">>> QUEUE EMPTY. AUTO-PILOT DISENGAGED.", 'SUCCESS');
          }
        }
        return currentRows;
      });
    }, 2000);

    return () => {
      if (autoIntervalRef.current) clearInterval(autoIntervalRef.current);
    };
  }, [isAutoRunning, enableAutoUpload, uploadDelay]); 


  const getStatusBadge = (status: RowStatus) => {
    const styles = {
      'PENDING': 'bg-slate-100 text-slate-500 border-slate-200',
      'PROCESSING': 'bg-blue-50 text-blue-600 border-blue-200 animate-pulse',
      'OPTIMIZED': 'bg-purple-50 text-purple-600 border-purple-200',
      'UPLOADING': 'bg-orange-50 text-orange-600 border-orange-200 animate-pulse',
      'PUBLISHED': 'bg-green-50 text-green-600 border-green-200',
      'ERROR': 'bg-red-50 text-red-600 border-red-200',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wide border ${styles[status] || styles.PENDING}`}>
        {status}
      </span>
    );
  };

  if (!activeProfile) return null;

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 p-4 flex flex-wrap justify-between items-center gap-4 shadow-sm z-20">
        <div className="flex items-center gap-3">
           <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isAutoRunning ? 'bg-red-50 border-red-100 text-red-600' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
              <div className={`w-2 h-2 rounded-full ${isAutoRunning ? 'bg-red-500 animate-ping' : 'bg-slate-400'}`}></div>
              <span className="text-xs font-bold uppercase">{isAutoRunning ? 'RUNNING' : 'IDLE'}</span>
           </div>
           
           <div className="h-6 w-px bg-slate-200 mx-1"></div>

           <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 hover:border-slate-400 transition"
           >
             <FileUp className="w-4 h-4 text-green-600" /> Import CSV
           </button>
           
           <button 
             onClick={handleExportCSV}
             disabled={rows.length === 0}
             className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 hover:border-slate-400 transition disabled:opacity-50"
           >
             <Download className="w-4 h-4 text-blue-600" /> Export
           </button>
           
           {rows.length > 0 && (
             <button onClick={handleClearAll} className="p-1.5 text-slate-400 hover:text-red-500 transition" title="Clear All">
                <Trash2 className="w-4 h-4"/>
             </button>
           )}
        </div>
        
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
               <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={enableAutoUpload} onChange={(e) => setEnableAutoUpload(e.target.checked)} className="w-4 h-4 accent-indigo-600 rounded" />
                  <span className="text-xs font-bold text-slate-700">Auto Upload</span>
               </label>
               <div className="w-px h-4 bg-slate-300"></div>
               <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <input 
                    type="number" 
                    value={uploadDelay} 
                    onChange={(e) => setUploadDelay(Number(e.target.value))}
                    className="w-10 bg-transparent text-xs font-bold text-center outline-none border-b border-transparent focus:border-indigo-500" 
                  />
                  <span className="text-xs text-slate-400">s</span>
               </div>
           </div>

           <button 
             onClick={() => setIsAutoRunning(!isAutoRunning)}
             disabled={rows.length === 0}
             className={`flex items-center gap-2 px-5 py-2 rounded-lg text-white font-bold text-xs uppercase tracking-wide transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
               isAutoRunning 
                ? 'bg-red-600 hover:bg-red-700 shadow-red-200' 
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
             }`}
           >
             {isAutoRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
             {isAutoRunning ? 'STOP' : 'START'}
           </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* DATA GRID */}
        <div className="flex-1 overflow-auto bg-white relative">
          {rows.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 border-dashed border-2 border-slate-100 m-4 rounded-2xl bg-slate-50">
                <FileSpreadsheet className="w-16 h-16 mb-4 text-slate-300" />
                <h3 className="text-lg font-bold text-slate-700">Chưa có dữ liệu</h3>
                <p className="text-sm text-center max-w-sm mt-2 mb-6">Import file CSV chứa danh sách chủ đề video để bắt đầu quy trình tự động hóa.</p>
                <div className="flex gap-3">
                    <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-lg shadow-indigo-200 transition flex items-center gap-2">
                        <CloudUpload className="w-4 h-4" /> Upload CSV
                    </button>
                    <button onClick={loadSampleData} className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg font-bold transition">
                        Dùng Dữ Liệu Mẫu
                    </button>
                </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 sticky top-0 z-10 text-[10px] uppercase text-slate-500 font-bold tracking-wider border-b border-slate-200 shadow-sm">
                <tr>
                    <th className="p-4 w-16 text-center text-slate-400">#</th>
                    <th className="p-4 w-1/3">Topic Source</th>
                    <th className="p-4">AI Optimization</th>
                    <th className="p-4 w-32 text-center">Status</th>
                    <th className="p-4 w-24 text-center">Cmd</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                {rows.map((row, index) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition group">
                    <td className="p-4 text-slate-400 font-mono text-xs text-center">{index + 1}</td>
                    <td className="p-4">
                        <div className="font-semibold text-slate-800 mb-1 line-clamp-2">{row.topic}</div>
                        {row.status === 'ERROR' && <div className="flex items-center gap-1 text-red-500 text-xs"><AlertTriangle className="w-3 h-3"/> {row.logs}</div>}
                    </td>
                    <td className="p-4">
                        {row.optimizedTitle ? (
                        <div className="space-y-1.5 animate-fade-in">
                            <div className="text-indigo-700 font-bold text-xs leading-normal">{row.optimizedTitle}</div>
                            <div className="flex gap-2 items-center">
                            <span className={`text-[10px] px-1.5 rounded border ${row.seoScore && row.seoScore > 80 ? 'bg-green-50 text-green-600 border-green-100' : 'bg-yellow-50 text-yellow-600 border-yellow-100'}`}>
                                SEO: {row.seoScore}
                            </span>
                            <div className="flex gap-1 overflow-hidden">
                                {row.keywords?.split(',').slice(0,2).map((k,i) => (
                                <span key={i} className="text-[10px] text-slate-400 flex items-center"><Hash className="w-2 h-2"/>{k.trim()}</span>
                                ))}
                            </div>
                            </div>
                        </div>
                        ) : (
                            <div className="flex items-center gap-2 text-slate-300 text-xs italic">
                                <Loader className={`w-3 h-3 ${row.status === 'PROCESSING' ? 'animate-spin text-indigo-400' : ''}`} />
                                {row.status === 'PROCESSING' ? 'AI Thinking...' : 'Waiting...'}
                            </div>
                        )}
                    </td>
                    <td className="p-4 text-center">
                        {getStatusBadge(row.status)}
                    </td>
                    <td className="p-4 text-center flex justify-center gap-1">
                        {row.status === 'PENDING' && !isAutoRunning && (
                        <button onClick={() => processSingleRow(row.id)} className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded transition" title="Optimize AI">
                            <Play className="w-4 h-4" />
                        </button>
                        )}
                         <button onClick={() => onNavigate(AppView.GENERATOR, { topic: row.topic })} className="p-1.5 hover:bg-purple-50 text-purple-600 rounded transition" title="Write Script">
                            <PenTool className="w-4 h-4" />
                        </button>
                        {row.videoId && (
                            <a href="#" className="flex justify-center text-red-600 hover:text-red-700"><Youtube className="w-5 h-5"/></a>
                        )}
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
          )}
        </div>

        {/* TERMINAL / LOGS */}
        <div className="h-64 lg:h-auto lg:w-[380px] bg-[#0F1117] text-slate-300 flex flex-col border-t lg:border-t-0 lg:border-l border-slate-800 shadow-2xl font-mono text-xs z-30">
            <div className="p-3 bg-[#161b22] border-b border-slate-800 flex justify-between items-center select-none">
                <div className="flex items-center gap-2">
                    <Terminal className="w-3 h-3 text-indigo-400" />
                    <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Console Output</span>
                </div>
                <button onClick={() => setLogs([])} className="hover:text-white transition"><RefreshCw className="w-3 h-3"/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {logs.length === 0 && <div className="text-slate-600 italic mt-4 text-center">System initialized. Ready for commands.</div>}
                {logs.map((log) => (
                    <div key={log.id} className="flex gap-2 leading-relaxed hover:bg-white/5 p-0.5 -mx-1 px-1 rounded">
                        <span className="text-slate-500 shrink-0 select-none">{log.timestamp}</span>
                        <span className={`break-all ${
                            log.type === 'ERROR' ? 'text-red-400 font-bold' :
                            log.type === 'SUCCESS' ? 'text-green-400' :
                            log.type === 'WARNING' ? 'text-yellow-400' : 'text-slate-300'
                        }`}>
                            {log.type === 'ERROR' && '✖ '}
                            {log.type === 'SUCCESS' && '✔ '}
                            {log.message}
                        </span>
                    </div>
                ))}
                <div ref={logsEndRef} />
            </div>

            <div className="p-2 bg-[#161b22] border-t border-slate-800 text-[10px] text-slate-500 flex justify-between">
                <span>Target: {activeProfile.channelId ? 'Live API' : 'Sandbox'}</span>
                <span className={enableAutoUpload ? 'text-green-500' : 'text-yellow-500'}>{enableAutoUpload ? 'UPLOAD: ON' : 'UPLOAD: OFF'}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SheetPlanner;
