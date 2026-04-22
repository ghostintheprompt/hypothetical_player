/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, useCallback, ChangeEvent } from 'react';
import { 
  Play, 
  Pause, 
  Monitor, 
  Shield, 
  ShieldOff, 
  Ghost, 
  Settings, 
  Maximize, 
  Volume2, 
  VolumeX,
  FileVideo,
  Database,
  Cpu,
  Zap,
  EyeOff,
  Video,
  Camera,
  Layers,
  ArrowRightLeft,
  Activity,
  Plus,
  Trash2,
  Lock,
  Unlock,
  MessageSquare,
  Video as ZoomIcon,
  FileText,
  AlertCircle,
  ThumbsDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
type CamoType = 'EXCEL' | 'SLACK' | 'ZOOM' | 'DOCS';
interface MediaSource {
  id: string;
  type: 'file' | 'camera';
  label: string;
  url?: string;
  stream?: MediaStream;
}

export default function App() {
  const [sources, setSources] = useState<MediaSource[]>([]);
  const [liveSourceId, setLiveSourceId] = useState<string | null>(null);
  const [previewSourceId, setPreviewSourceId] = useState<string | null>(null);
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [isShieldActive, setIsShieldActive] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [camoType, setCamoType] = useState<CamoType>('EXCEL');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'latest'>('idle');

  const checkUpdates = useCallback(async (isManual = false) => {
    setUpdateStatus('checking');
    try {
      const response = await fetch('https://api.github.com/repos/ghostintheprompt/hybo/releases/latest');
      if (!response.ok) throw new Error();
      const data = await response.json();
      const latestVersion = data.tag_name.replace('v', '');
      const currentVersion = '1.0.0'; // Should match package.json
      
      if (latestVersion !== currentVersion) {
        setUpdateStatus('available');
        if (isManual) window.open('https://github.com/ghostintheprompt/hybo/releases', '_blank');
      } else {
        setUpdateStatus('latest');
      }
    } catch (err) {
      setUpdateStatus('idle');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => checkUpdates(false), 3000);
    return () => clearTimeout(timer);
  }, [checkUpdates]);
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Handlers ---
  const addFileSource = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newSource: MediaSource = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'file',
        label: file.name,
        url: URL.createObjectURL(file)
      };
      setSources(s => [...s, newSource]);
      if (!previewSourceId) setPreviewSourceId(newSource.id);
    }
  };

  const addCameraSource = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const newSource: MediaSource = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'camera',
        label: `CAMERA ${sources.filter(s => s.type === 'camera').length + 1}`,
        stream
      };
      setSources(s => [...s, newSource]);
      if (!previewSourceId) setPreviewSourceId(newSource.id);
    } catch (err) {
      console.error("Camera access failed", err);
    }
  };

  const removeSource = (id: string) => {
    setSources(s => {
      const filtered = s.filter(src => src.id !== id);
      const target = s.find(src => src.id === id);
      if (target?.stream) {
        target.stream.getTracks().forEach(track => track.stop());
      }
      return filtered;
    });
    if (previewSourceId === id) setPreviewSourceId(null);
    if (liveSourceId === id) setLiveSourceId(null);
  };

  const performTransition = () => {
    if (previewSourceId) {
      setLiveSourceId(previewSourceId);
      setIsPlaying(true);
    }
  };

  const togglePanic = useCallback(() => {
    setIsGhostMode(prev => !prev);
  }, []);

  // Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLocked) return;
      if (e.key.toLowerCase() === 'p' || e.key === 'Escape') togglePanic();
      if (e.key.toLowerCase() === 't' || e.code === 'Space') performTransition();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePanic, previewSourceId, isLocked]);

  // Sync streams to video elements
  useEffect(() => {
    const liveSource = sources.find(s => s.id === liveSourceId);
    if (liveVideoRef.current && liveSource) {
      if (liveSource.type === 'camera' && liveSource.stream) {
        liveVideoRef.current.srcObject = liveSource.stream;
      } else if (liveSource.url) {
        liveVideoRef.current.srcObject = null;
        liveVideoRef.current.src = liveSource.url;
      }
      liveVideoRef.current.play().catch(() => {});
    }
  }, [liveSourceId, sources]);

  useEffect(() => {
    const previewSource = sources.find(s => s.id === previewSourceId);
    if (previewVideoRef.current && previewSource) {
      if (previewSource.type === 'camera' && previewSource.stream) {
        previewVideoRef.current.srcObject = previewSource.stream;
      } else if (previewSource.url) {
        previewVideoRef.current.srcObject = null;
        previewVideoRef.current.src = previewSource.url;
      }
      previewVideoRef.current.play().catch(() => {});
    }
  }, [previewSourceId, sources]);

  // --- Render Helpers ---
  const DynamicCamoUI = () => {
    if (camoType === 'EXCEL') {
      return (
        <div className="fixed inset-0 bg-white text-black p-4 z-[9999] overflow-hidden font-sans select-none pointer-events-none">
          <div className="flex items-center gap-4 border-b pb-2 mb-2">
            <div className="font-bold text-green-700">Excel</div>
            <div className="text-xs text-gray-500">Global_Assets_Allocation_Q3.xlsx</div>
          </div>
          <div className="grid grid-cols-12 gap-0 border">
            {Array.from({ length: 600 }).map((_, i) => (
              <div key={i} className="border p-1 text-[8px] h-5 bg-gray-50 border-gray-200 overflow-hidden">
                {Math.random() > 0.85 ? (Math.random() * 5000).toLocaleString() : ''}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (camoType === 'SLACK') {
      return (
        <div className="fixed inset-0 bg-[#3F0E40] text-white p-4 z-[9999] overflow-hidden font-sans flex select-none pointer-events-none">
          <div className="w-64 border-r border-white/10 p-4 space-y-4">
             <div className="font-bold text-lg mb-6">HYBO Workspace</div>
             <div className="text-zinc-400 text-xs"># general</div>
             <div className="text-zinc-400 text-xs"># engineering</div>
             <div className="text-white text-xs font-bold bg-blue-600 rounded px-2 py-1"># project-aurora</div>
             <div className="text-zinc-400 text-xs"># random</div>
          </div>
          <div className="flex-1 bg-white text-black p-6 space-y-6">
             <div className="text-lg font-bold border-b pb-2"># project-aurora</div>
             <div className="flex gap-3">
                <div className="w-8 h-8 bg-zinc-200 rounded" />
                <div>
                   <div className="font-bold text-xs">Senior Architect (You)</div>
                   <div className="text-sm">I've pushed the latest refactor. The VRAM management logic is now air-gapped.</div>
                </div>
             </div>
             <div className="flex gap-3">
                <div className="w-8 h-8 bg-zinc-800 rounded" />
                <div>
                   <div className="font-bold text-xs">Project Manager</div>
                   <div className="text-sm">Great work. Let's maintain this velocity.</div>
                </div>
             </div>
          </div>
        </div>
      );
    }

    if (camoType === 'ZOOM') {
      return (
        <div className="fixed inset-0 bg-[#1a1a1a] text-white z-[9999] overflow-hidden font-sans flex flex-col select-none pointer-events-none">
           <div className="flex-1 grid grid-cols-2 gap-px bg-zinc-800">
              <div className="bg-zinc-900 flex items-center justify-center border-2 border-green-500/50">
                 <div className="text-center">
                    <div className="w-24 h-24 bg-zinc-800 rounded-full mx-auto mb-4 overflow-hidden">
                       <div className="w-full h-full bg-gradient-to-tr from-zinc-700 to-zinc-900" />
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest">Global Lead Architect (YOU)</div>
                 </div>
              </div>
              <div className="bg-zinc-900 flex items-center justify-center p-8 grayscale opacity-40">
                 <div className="text-center">
                    <div className="w-20 h-20 bg-zinc-800 rounded-full mx-auto mb-4" />
                    <div className="text-[10px] uppercase text-zinc-500">Connecting Audio...</div>
                 </div>
              </div>
           </div>
           <div className="h-16 bg-black flex items-center justify-center gap-8 px-6">
              <div className="flex gap-6">
                <div className="text-center opacity-40"><ZoomIcon className="w-5 h-5 mx-auto" /><span className="text-[8px]">Stop Video</span></div>
                <div className="text-center text-red-500"><AlertCircle className="w-5 h-5 mx-auto" /><span className="text-[8px]">Muted</span></div>
              </div>
              <div className="bg-red-600 px-4 py-1.5 rounded text-xs font-bold">Leave Meeting</div>
           </div>
        </div>
      );
    }

    if (camoType === 'DOCS') {
      return (
        <div className="fixed inset-0 bg-[#f8f9fa] text-black z-[9999] overflow-hidden font-sans p-12 select-none pointer-events-none">
           <div className="max-w-2xl mx-auto bg-white shadow-lg h-full p-16 border rounded">
              <div className="text-3xl font-bold text-zinc-800 mb-8 border-b pb-4">Internal System Guidelines</div>
              <p className="text-sm leading-relaxed text-zinc-600 mb-6 font-serif">
                This document outlines the standard operating procedures for the implementation of the new air-gapped 
                transcoding engine. All engineers must adhere to the VRAM isolation policies established in Q1.
              </p>
              <div className="space-y-4">
                 <div className="h-4 bg-zinc-100 rounded w-full" />
                 <div className="h-4 bg-zinc-100 rounded w-[90%]" />
                 <div className="h-4 bg-zinc-100 rounded w-[95%]" />
                 <div className="h-4 bg-zinc-100 rounded w-full" />
                 <div className="h-4 bg-zinc-100 rounded w-[40%]" />
              </div>
           </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-screen ghost-grid flex flex-col transition-colors duration-500 ${isGhostMode ? 'bg-white' : 'bg-black'}`}
    >
      <div className="scanline" />

      {/* Header Bar */}
      {!isGhostMode && (
        <div className="h-10 flex items-center justify-between px-4 bg-zinc-950 border-b border-zinc-800 z-50">
          <div className="flex items-center gap-3">
            <Ghost className="w-4 h-4 text-ghost-green animate-pulse" />
            <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">HYBO // MULTI-PRO MASTER</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-2 py-0.5 border border-zinc-800 bg-zinc-900 rounded text-[9px] font-mono text-ghost-green">
              {currentTime.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="flex items-center gap-2 px-2 py-0.5 border border-red-900/50 bg-red-950/20 rounded-full animate-pulse">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              <span className="text-[8px] font-bold text-red-500">GHOST STREAM ACTIVE</span>
            </div>
            <button 
              onClick={() => setIsLocked(!isLocked)}
              className={`p-1.5 rounded transition-colors ${isLocked ? 'text-ghost-green bg-zinc-900' : 'text-zinc-600 hover:text-white'}`}
            >
              {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            </button>
          </div>
        </div>
      )}

      {/* Production Deck (Main Area) */}
      <div className={`flex-1 flex gap-px bg-zinc-900 overflow-hidden ${isGhostMode ? 'opacity-0' : 'opacity-100'}`}>
        
        {/* Preview Panel */}
        <div className="flex-1 relative bg-black flex flex-col group">
          <div className="absolute top-2 left-2 z-20 px-2 py-0.5 bg-zinc-900/80 border border-zinc-700 text-[8px] font-bold text-zinc-400 uppercase tracking-widest">
            PREVIEW
          </div>
          <div className="flex-1 flex items-center justify-center overflow-hidden">
             <video ref={previewVideoRef} muted className="w-full h-full object-contain grayscale-[0.5]" />
          </div>
          {previewSourceId && (
            <div className="absolute bottom-2 left-2 right-2 text-[8px] text-zinc-600 font-mono flex justify-between bg-black/40 p-1">
              <span>SOURCE: {sources.find(s => s.id === previewSourceId)?.label}</span>
              <span>READY</span>
            </div>
          )}
        </div>

        {/* Action Column */}
        <div className="w-24 bg-zinc-950 flex flex-col items-center justify-center gap-6 border-x border-zinc-800 z-30">
          <button 
            onClick={performTransition}
            className="group relative flex flex-col items-center justify-center gap-2 w-16 h-16 rounded-full border border-zinc-800 hover:border-ghost-green transition-all"
          >
            <div className="absolute inset-0 bg-ghost-green/5 rounded-full scale-0 group-hover:scale-100 transition-transform" />
            <ArrowRightLeft className="w-6 h-6 text-zinc-600 group-hover:text-ghost-green" />
            <span className="text-[8px] font-bold text-zinc-700 uppercase">CUT</span>
          </button>
          <div className="w-full h-px bg-zinc-900 mx-4" />
          <div className="flex flex-col gap-3">
             <button onClick={togglePanic} className="p-3 text-zinc-700 hover:text-red-500 transition-colors">
                <ShieldOff className="w-5 h-5" />
             </button>
             <button onClick={() => setShowSettings(true)} className="p-3 text-zinc-700 hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
             </button>
          </div>
        </div>

        {/* Live Panel */}
        <div className="flex-1 relative bg-black flex flex-col">
          <div className="absolute top-2 left-2 z-20 px-2 py-0.5 bg-red-600 border border-red-500 text-[8px] font-bold text-white uppercase tracking-widest">
            LIVE / PROGRAM
          </div>
          <div className="flex-1 flex items-center justify-center relative">
             <video ref={liveVideoRef} className="w-full h-full object-contain" />
             
             {/* OBFS Overlay */}
             {isShieldActive && (
               <div className="absolute inset-0 pointer-events-none opacity-[0.04] overflow-hidden">
                  <div className="absolute inset-0 animate-pulse bg-gradient-to-tr from-ghost-green to-transparent" />
                  <div className="w-full h-full" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />
               </div>
             )}

             <div className="absolute bottom-4 right-4 flex flex-col items-center gap-2 group/vol">
                <input 
                  type="range" 
                  min="0" max="1" step="0.01" 
                  defaultValue="0.8"
                  className="w-24 h-1 bg-zinc-800 accent-ghost-green -rotate-90 origin-bottom translate-y-[-40px] opacity-0 group-hover/vol:opacity-100 transition-opacity"
                  onChange={(e) => {
                    if (liveVideoRef.current) liveVideoRef.current.volume = parseFloat(e.target.value);
                  }}
                />
                <div className="p-2 bg-zinc-950/80 rounded border border-zinc-800">
                   <Volume2 className="w-3 h-3 text-zinc-500" />
                </div>
             </div>
          </div>
          
          <div className="h-1 bg-zinc-800 relative">
             <motion.div 
               animate={{ width: isPlaying ? '100%' : '0%' }}
               transition={{ duration: liveVideoRef.current?.duration || 0, ease: 'linear' }}
               className="h-full bg-red-500"
             />
          </div>
        </div>
      </div>

      {/* Source Bin / Switcher */}
      {!isGhostMode && (
        <div className="h-48 bg-zinc-950 border-t border-zinc-900 flex p-3 gap-3 overflow-x-auto shadow-inner">
           {/* Add New Tools */}
           <div className="flex flex-col gap-2 min-w-[120px]">
              <div className="text-[8px] font-bold text-zinc-600 uppercase mb-1">Inject Source</div>
              <label className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 hover:border-ghost-green cursor-pointer text-zinc-400 hover:text-white transition-all text-xs rounded-sm">
                <Plus className="w-4 h-4" />
                <span>LOAD FILE</span>
                <input type="file" className="hidden" accept="video/*" onChange={addFileSource} />
              </label>
              <button 
                onClick={addCameraSource}
                className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 hover:border-ghost-green text-zinc-400 hover:text-white transition-all text-xs rounded-sm text-left"
              >
                <Camera className="w-4 h-4" />
                <span>CAM FEED</span>
              </button>
           </div>

           <div className="w-px bg-zinc-900 h-full mx-2" />

           {/* Gross Integrations (Humor Section) */}
           <div className="flex flex-col gap-2 min-w-[140px]">
              <div className="text-[8px] font-bold text-zinc-600 uppercase mb-1">Gross Devices</div>
              <div className="flex gap-2">
                 <div className="relative group/slack">
                   <button 
                     onClick={() => setCamoType('SLACK')}
                     className={`p-2 rounded border transition-all ${camoType === 'SLACK' ? 'border-ghost-green bg-zinc-900' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'}`}
                   >
                     <MessageSquare className="w-4 h-4 text-zinc-500" />
                   </button>
                   <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 opacity-0 group-hover/slack:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                     ewwwww
                   </div>
                 </div>

                 <div className="relative group/zoom">
                   <button 
                     onClick={() => setCamoType('ZOOM')}
                     className={`p-2 rounded border transition-all ${camoType === 'ZOOM' ? 'border-ghost-green bg-zinc-900' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'}`}
                   >
                     <ZoomIcon className="w-4 h-4 text-zinc-500" />
                   </button>
                   <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 opacity-0 group-hover/zoom:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                     puke
                   </div>
                 </div>

                 <div className="relative group/docs">
                   <button 
                     onClick={() => setCamoType('DOCS')}
                     className={`p-2 rounded border transition-all ${camoType === 'DOCS' ? 'border-ghost-green bg-zinc-900' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'}`}
                   >
                     <FileText className="w-4 h-4 text-zinc-500" />
                   </button>
                   <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 opacity-0 group-hover/docs:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                     cringe
                   </div>
                 </div>
                 
                 <div className="relative group/excel">
                   <button 
                     onClick={() => setCamoType('EXCEL')}
                     className={`p-2 rounded border transition-all ${camoType === 'EXCEL' ? 'border-ghost-green bg-zinc-900' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'}`}
                   >
                     <Layers className="w-4 h-4 text-zinc-500" />
                   </button>
                   <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 opacity-0 group-hover/excel:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                     classic
                   </div>
                 </div>
              </div>
              <div className="mt-auto flex items-center gap-1">
                 <ThumbsDown className="w-2.5 h-2.5 text-zinc-700" />
                 <span className="text-[7px] text-zinc-700 uppercase font-bold">corporate vomit v1.2</span>
              </div>
           </div>

           <div className="w-px bg-zinc-900 h-full mx-2" />

           {/* Source List */}
           <div className="flex-1 flex gap-3 h-full">
              {sources.map(src => (
                <div 
                  key={src.id}
                  onClick={() => setPreviewSourceId(src.id)}
                  className={`relative min-w-[180px] h-full bg-black border transition-all cursor-pointer group flex flex-col rounded-sm overflow-hidden ${
                    previewSourceId === src.id ? 'border-ghost-green ring-1 ring-ghost-green/30' : 
                    liveSourceId === src.id ? 'border-red-500 ring-1 ring-red-500/30' : 
                    'border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex-1 overflow-hidden relative grayscale group-hover:grayscale-0 transition-all flex items-center justify-center bg-zinc-900">
                    {src.type === 'camera' ? (
                      <Camera className="w-8 h-8 text-zinc-800" />
                    ) : (
                      <Video className="w-8 h-8 text-zinc-800" />
                    )}
                    
                    {liveSourceId === src.id && (
                      <div className="absolute top-1 right-1 bg-red-600 px-1 text-[6px] font-bold text-white uppercase rounded-sm">LIVE</div>
                    )}
                  </div>
                  
                  <div className="p-2 bg-zinc-900 text-[8px] flex items-center justify-between">
                    <span className="truncate max-w-[100px] text-zinc-500 font-mono tracking-tighter uppercase">{src.label}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSource(src.id);
                      }}
                      className="text-zinc-700 hover:text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
              
              {sources.length === 0 && (
                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-zinc-900 rounded-lg">
                  <span className="text-[10px] text-zinc-800 font-bold uppercase tracking-[0.4em]">Awaiting Signals...</span>
                </div>
              )}
           </div>

           {/* Master Stats HUD */}
           <div className="w-56 bg-zinc-900/50 p-3 rounded-sm border border-zinc-800/50 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[8px] text-zinc-600 uppercase">SYS_LOAD</span>
                <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden">
                   <motion.div 
                     animate={{ width: ['20%', '25%', '22%'] }}
                     transition={{ repeat: Infinity, duration: 2 }}
                     className="h-full bg-ghost-green" 
                   />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[8px] text-zinc-600 uppercase">ENCODING</span>
                <span className="text-[8px] text-ghost-green font-bold">STABLE VBR</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[8px] text-zinc-600 uppercase">GHOST_SHIELD</span>
                <span className={`text-[8px] font-bold ${isShieldActive ? 'text-ghost-green' : 'text-zinc-600'}`}>
                  {isShieldActive ? 'ACTIVE' : 'OFFLINE'}
                </span>
              </div>
              <div className="mt-auto flex items-center gap-2 opacity-50">
                <Activity className="w-3 h-3 text-ghost-green" />
                <span className="text-[8px] font-mono text-zinc-500">PING: 12ms</span>
              </div>
           </div>
        </div>
      )}

      {/* Ghost/Panic Overlay */}
      {isGhostMode && <DynamicCamoUI />}

      {/* Settings Modal (Simplified) */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          >
            <div className="w-full max-w-sm bg-zinc-950 border border-zinc-900 p-8 rounded-sm relative">
              <button 
                onClick={() => setShowSettings(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white"
              >
                [CLOSE]
              </button>
              <h2 className="text-xl font-bold text-ghost-green mb-8 tracking-tighter uppercase italic">HYBO // STUDIO CONFIG</h2>
              
              <div className="space-y-8">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase text-zinc-500">Screenshot Hardening</span>
                    <button 
                      onClick={() => setIsShieldActive(!isShieldActive)}
                      className={`w-10 h-5 rounded-full relative transition-colors ${isShieldActive ? 'bg-ghost-green' : 'bg-zinc-800'}`}
                    >
                      <motion.div 
                        animate={{ x: isShieldActive ? 22 : 2 }}
                        className="w-4 h-4 bg-white rounded-full absolute top-0.5" 
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] uppercase text-zinc-500">Multicam Sync</span>
                     <span className="text-[10px] text-ghost-green underline cursor-pointer">OPTIMIZE NOW</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] uppercase text-zinc-500">System Software</span>
                     <button 
                       onClick={() => checkUpdates(true)}
                       disabled={updateStatus === 'checking'}
                       className="text-[10px] text-ghost-green underline hover:text-white transition-colors disabled:opacity-50"
                     >
                       {updateStatus === 'checking' ? 'CHECKING...' : 
                        updateStatus === 'available' ? 'UPDATE AVAILABLE' : 
                        updateStatus === 'latest' ? 'UP TO DATE' : 'CHECK FOR UPDATES...'}
                     </button>
                  </div>
                </div>

                <div className="pt-8 border-t border-zinc-900">
                   <p className="text-[9px] leading-relaxed text-zinc-500">
                      HYBO Studio is a production-hardened media deck. It processes signals locally 
                      and uses air-gapped transcoding to ensure no footprint is left in your system VRAM 
                      accessible by monitoring tools.
                   </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
