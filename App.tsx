
import React, { useState, useCallback, useEffect } from 'react';
import { CameraControlState, GenerationSettings, ImageData, GenerationResult } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { useCameraControls } from './hooks/useCameraControls';
import { Camera3DControl } from './components/Camera3DControl';
import { CameraSliders } from './components/CameraSliders';
import { ImageUploader } from './components/ImageUploader';
import { GenerationSettingsPanel } from './components/GenerationSettings';
import { PromptConsole } from './components/PromptConsole';
import { HistorySidebar } from './components/HistorySidebar';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const { state: cameraState, updateState: updateCamera, reset: resetCamera, generatedPrompt } = useCameraControls();
  const [settings, setSettings] = useState<GenerationSettings>(DEFAULT_SETTINGS);
  const [sourceImage, setSourceImage] = useState<ImageData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'3d' | 'sliders'>('3d');
  const [history, setHistory] = useState<GenerationResult[]>([]);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error' | 'loading'>('idle');

  // Persistence of history (session-only)
  const addToHistory = useCallback((res: GenerationResult) => {
    setHistory(prev => [res, ...prev.slice(0, 9)]); // Keep last 10
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
    };

    if (isLightboxOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isLightboxOpen]);

  const handleGenerate = async () => {
    if (!sourceImage) return;
    setIsGenerating(true);
    setError(null);
    try {
      const editedImageUrl = await geminiService.generateImage(sourceImage, generatedPrompt, settings);
      const newResult: GenerationResult = {
        id: Math.random().toString(36).substring(7),
        imageUrl: editedImageUrl,
        prompt: generatedPrompt,
        timestamp: Date.now(),
        settings: { ...settings },
        cameraState: { ...cameraState },
      };
      setResult(newResult);
      addToHistory(newResult);
    } catch (err: any) {
      setError(err.message || "Perspective transformation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyImageToClipboard = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!result?.imageUrl) return;
    
    setCopyStatus('loading');
    try {
      const response = await fetch(result.imageUrl);
      const blob = await response.blob();
      const data = [new ClipboardItem({ [blob.type]: blob })];
      await navigator.clipboard.write(data);
      setCopyStatus('success');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  const handleSelectHistory = (item: GenerationResult) => {
    setResult(item);
    updateCamera(item.cameraState);
    setSettings(item.settings);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {/* HUD Header */}
      <header className="border-b border-white/5 bg-black/60 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative w-12 h-12 bg-black rounded-xl border border-white/10 flex items-center justify-center shadow-2xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
              </div>
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-500">QwenCam <span className="text-blue-500">Studio</span></h1>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-blue-500/80 font-mono tracking-widest uppercase font-bold">Spatial Intelligence Node</span>
                <span className="w-1 h-1 rounded-full bg-gray-800" />
                <span className="text-[10px] text-gray-500 font-mono">v3.0.4-BETA</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">System Status</span>
              <span className="flex items-center gap-2 font-mono text-[10px] text-green-400">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div> 
                NEURAL_LINKS_ACTIVE
              </span>
            </div>
            <div className="h-8 w-[1px] bg-white/5" />
            <div className="flex items-center gap-3">
               <button className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all">
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
               </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 grid lg:grid-cols-[280px_1fr_400px] gap-8">
        
        {/* Left Column: History & Stats */}
        <aside className="space-y-6 hidden lg:block">
          <HistorySidebar 
            history={history} 
            onSelect={handleSelectHistory} 
            onClear={() => setHistory([])} 
          />
          
          <div className="bg-gray-900/40 rounded-2xl border border-gray-800 p-5 space-y-4">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Optical Statistics</h3>
            <div className="space-y-3">
              {[
                { label: 'Latency', value: '42ms', color: 'text-green-400' },
                { label: 'Mem Load', value: '1.2GB', color: 'text-blue-400' },
                { label: 'Frames', value: '30 FPS', color: 'text-purple-400' },
              ].map((stat, i) => (
                <div key={i} className="flex justify-between items-center bg-black/40 p-2 rounded-lg border border-white/5">
                  <span className="text-[10px] text-gray-500 uppercase font-mono">{stat.label}</span>
                  <span className={`text-[10px] font-bold font-mono ${stat.color}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Center Column: Viewport & Controls */}
        <div className="space-y-6">
          <section className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span> Input Canvas
              </h2>
              {sourceImage && (
                <span className="text-[10px] text-blue-400 font-mono bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  {sourceImage.name.toUpperCase()}
                </span>
              )}
            </div>
            
            {sourceImage ? (
              <div className="relative group rounded-3xl overflow-hidden bg-gray-900 border border-white/10 shadow-2xl transition-all hover:border-blue-500/30">
                <img 
                  src={sourceImage.base64} 
                  alt="Original" 
                  className="w-full aspect-video object-cover opacity-60 group-hover:opacity-100 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-400 font-mono">BUFFER_ID: {Math.random().toString(16).slice(2, 10)}</p>
                    <p className="text-[11px] font-bold text-white uppercase tracking-wider">Source Material Loaded</p>
                  </div>
                  <button 
                    onClick={() => { setSourceImage(null); setResult(null); }}
                    className="w-10 h-10 bg-red-500/10 text-red-500 rounded-full border border-red-500/20 hover:bg-red-500 hover:text-white transition-all transform hover:rotate-90 flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </div>
              </div>
            ) : (
              <ImageUploader onUpload={setSourceImage} />
            )}
          </section>

          <section className="space-y-4">
            <div className="bg-gray-900/40 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
              <div className="flex bg-black/40 border-b border-white/5">
                <button 
                  onClick={() => setActiveTab('3d')}
                  className={`flex-1 py-5 text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${activeTab === '3d' ? 'bg-blue-600/10 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 11V5a2 2 0 0 1 2-2h6"/><path d="M21 11V5a2 2 0 0 0-2-2h-6"/><path d="M21 13v6a2 2 0 0 1-2 2h-6"/><path d="M3 13v6a2 2 0 0 0 2 2h6"/><circle cx="12" cy="12" r="3"/></svg>
                  Spatial 3D
                </button>
                <button 
                  onClick={() => setActiveTab('sliders')}
                  className={`flex-1 py-5 text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${activeTab === 'sliders' ? 'bg-blue-600/10 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="2" y1="14" x2="6" y2="14"/><line x1="10" y1="8" x2="14" y2="8"/><line x1="18" y1="16" x2="22" y2="16"/></svg>
                  Fine Tune
                </button>
              </div>
              <div className="p-6">
                {activeTab === '3d' ? (
                  <Camera3DControl state={cameraState} onChange={updateCamera} />
                ) : (
                  <CameraSliders state={cameraState} onChange={updateCamera} onReset={resetCamera} />
                )}
              </div>
            </div>
          </section>

          <PromptConsole prompt={generatedPrompt} />
        </div>

        {/* Right Column: Output & Action */}
        <aside className="space-y-6">
          <section className="space-y-4">
            <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></span> Output Stream
            </h2>

            <div className="relative aspect-square rounded-[2rem] bg-gray-950 border border-white/5 flex items-center justify-center overflow-hidden shadow-2xl group">
              {result ? (
                <div className="w-full h-full relative cursor-zoom-in group/img overflow-hidden" onClick={() => setIsLightboxOpen(true)}>
                  <img 
                    src={result.imageUrl} 
                    alt="Result" 
                    className="w-full h-full object-contain transition-all duration-1000 group-hover/img:scale-105"
                  />
                  <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover/img:opacity-100 transition-opacity pointer-events-none" />
                </div>
              ) : (
                <div className="text-center p-8 space-y-6">
                  <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto text-gray-800 animate-pulse border border-white/5">
                     <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">Standby</p>
                    <p className="text-gray-700 text-[9px] font-mono mt-1">NO_RENDER_DATA_DETECTED</p>
                  </div>
                </div>
              )}

              {isGenerating && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center gap-6 z-20">
                  <div className="relative">
                    <div className="w-24 h-24 border-2 border-blue-500/10 rounded-full animate-[spin_3s_linear_infinite]" />
                    <div className="absolute inset-0 w-24 h-24 border-t-2 border-blue-500 rounded-full animate-spin shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                  </div>
                  <div className="text-center">
                    <p className="text-blue-400 font-black text-xs tracking-[0.4em] animate-pulse">RENDER_ACTIVE</p>
                    <p className="text-gray-600 font-mono text-[9px] mt-2 uppercase">Computing spatial vectors...</p>
                  </div>
                </div>
              )}
            </div>

            {result && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={copyImageToClipboard}
                  className="p-4 rounded-2xl border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white flex items-center justify-center gap-2 transition-all font-bold text-[10px] uppercase tracking-widest"
                >
                  {copyStatus === 'success' ? "COPIED" : "Copy Buffer"}
                </button>
                <a
                  href={result.imageUrl}
                  download="qwencam-render.png"
                  className="p-4 rounded-2xl border border-white/10 bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white flex items-center justify-center gap-2 transition-all font-bold text-[10px] uppercase tracking-widest"
                >
                  Download
                </a>
              </div>
            )}
          </section>

          <GenerationSettingsPanel settings={settings} onChange={(u) => setSettings(s => ({...s, ...u}))} />

          <button
            onClick={handleGenerate}
            disabled={!sourceImage || isGenerating}
            className={`
              w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl transition-all flex flex-col items-center justify-center gap-1 overflow-hidden relative group
              ${(!sourceImage || isGenerating) 
                ? 'bg-gray-900 text-gray-700 cursor-not-allowed border border-white/5' 
                : 'bg-white text-black hover:scale-[1.02] active:scale-95'
              }
            `}
          >
            {isGenerating ? (
              <span className="animate-pulse">Processing...</span>
            ) : (
              <>
                <span className="relative z-10">Execute Render</span>
                <span className="text-[8px] font-mono opacity-40 relative z-10">{settings.quality.toUpperCase()} ENGINE ACTIVE</span>
              </>
            )}
            {!isGenerating && sourceImage && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>
          
          {error && (
            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-mono flex gap-3 items-start">
              <span className="font-bold">[ERR]</span>
              <span>{error}</span>
            </div>
          )}
        </aside>
      </main>

      {/* Full-screen Lightbox */}
      {isLightboxOpen && result && (
        <div 
          className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-6 cursor-zoom-out animate-in fade-in zoom-in duration-300"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="relative max-w-7xl w-full h-full flex items-center justify-center">
             <img src={result.imageUrl} className="max-w-full max-h-full object-contain shadow-[0_0_100px_rgba(0,0,0,0.5)] rounded-lg" />
             <div className="absolute top-0 right-0 p-4">
                <button className="text-white/50 hover:text-white transition-colors">
                   <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[120px] rounded-full" />
      </div>
    </div>
  );
};

export default App;
