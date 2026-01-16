
import React, { useState, useCallback, useEffect } from 'react';
import { CameraControlState, GenerationSettings, ImageData, GenerationResult, VideoResult } from './types';
import { DEFAULT_SETTINGS, DEFAULT_CAMERA_STATE } from './constants';
import { useCameraControls } from './hooks/useCameraControls';
import { Camera3DControl } from './components/Camera3DControl';
import { CameraSliders } from './components/CameraSliders';
import { ImageUploader } from './components/ImageUploader';
import { GenerationSettingsPanel } from './components/GenerationSettings';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const { state: cameraState, updateState: updateCamera, reset: resetCamera, generatedPrompt } = useCameraControls();
  const [settings, setSettings] = useState<GenerationSettings>(DEFAULT_SETTINGS);
  const [sourceImage, setSourceImage] = useState<ImageData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'3d' | 'sliders'>('3d');
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [videoResult, setVideoResult] = useState<VideoResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Advanced UX States
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error' | 'loading'>('idle');

  // Handle ESC key for Lightbox and scroll locking
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

  // Actions
  const handleGenerate = async () => {
    if (!sourceImage) return;
    setIsGenerating(true);
    setError(null);
    setVideoResult(null);
    try {
      const editedImageUrl = await geminiService.generateImage(sourceImage, generatedPrompt, settings);
      setResult({
        imageUrl: editedImageUrl,
        prompt: generatedPrompt,
        timestamp: Date.now(),
        settings: { ...settings },
        cameraState: { ...cameraState },
      });
    } catch (err: any) {
      setError(err.message || "Perspective transformation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateVideo = async () => {
    if (!sourceImage || !result) return;
    setIsGenerating(true); 
    try {
      const videoUrl = await geminiService.generateTransitionVideo(sourceImage.base64, result.imageUrl);
      setVideoResult({ videoUrl, timestamp: Date.now() });
    } catch (err) {
      setError("Video synthesis failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * World-class Clipboard implementation
   * Ensures wide compatibility by forcing correct Mime Types
   */
  const copyImageToClipboard = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!result?.imageUrl) return;
    
    setCopyStatus('loading');
    try {
      const response = await fetch(result.imageUrl);
      const blob = await response.blob();
      
      // Ensure we use the proper clipboard type (image/png is standard)
      const data = [new ClipboardItem({ [blob.type]: blob })];
      await navigator.clipboard.write(data);
      
      setCopyStatus('success');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
      console.error("Clipboard Error:", err);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">QwenCam Studio</h1>
              <p className="text-[10px] text-blue-500 font-mono tracking-tighter uppercase font-bold">Spatial Intelligence Engine</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Gemini-3 High-Fidelity</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8 grid lg:grid-cols-2 gap-8 lg:items-start">
        {/* Left Column: Input and Controls */}
        <div className="space-y-6">
          <section className="space-y-4">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Canvas Input
            </h2>
            {sourceImage ? (
              <div className="relative group rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 shadow-2xl">
                <img 
                  src={sourceImage.base64} 
                  alt="Original" 
                  className="w-full aspect-square object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="max-w-[70%]">
                    <p className="text-xs font-medium text-white truncate">{sourceImage.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{(sourceImage.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button 
                    onClick={() => { setSourceImage(null); setResult(null); setVideoResult(null); }}
                    className="p-2 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/40 transition-all hover:rotate-90"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </div>
              </div>
            ) : (
              <ImageUploader onUpload={setSourceImage} />
            )}
          </section>

          <section className="space-y-4">
            <div className="bg-gray-900/50 rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
              <div className="flex border-b border-gray-800">
                <button 
                  onClick={() => setActiveTab('3d')}
                  className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === '3d' ? 'bg-blue-600/10 text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  3D Manipulator
                </button>
                <button 
                  onClick={() => setActiveTab('sliders')}
                  className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'sliders' ? 'bg-blue-600/10 text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  Control Matrix
                </button>
              </div>
              <div className="p-4">
                {activeTab === '3d' ? (
                  <Camera3DControl state={cameraState} onChange={updateCamera} />
                ) : (
                  <CameraSliders state={cameraState} onChange={updateCamera} onReset={resetCamera} />
                )}
              </div>
            </div>
          </section>

          <GenerationSettingsPanel settings={settings} onChange={(u) => setSettings(s => ({...s, ...u}))} />

          <button
            onClick={handleGenerate}
            disabled={!sourceImage || isGenerating}
            className={`
              w-full py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-3
              ${(!sourceImage || isGenerating) 
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20 active:scale-95'
              }
            `}
          >
            {isGenerating ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : "Render Frame"}
          </button>
          
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-xs font-mono animate-in slide-in-from-top-2">
              [SYSTEM_ERR]: {error}
            </div>
          )}
        </div>

        {/* Right Column: Results */}
        <div className="space-y-6 lg:sticky lg:top-24">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Output Buffer
          </h2>

          <div className="relative aspect-square rounded-3xl bg-gray-900 border border-gray-800 flex items-center justify-center overflow-hidden shadow-2xl group">
            {result ? (
              <div className="w-full h-full relative cursor-zoom-in overflow-hidden" onClick={() => setIsLightboxOpen(true)}>
                <img 
                  src={result.imageUrl} 
                  alt="Result" 
                  className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                />
                
                {/* Advanced Overlay */}
                <div className="absolute inset-0 bg-blue-600/0 hover:bg-blue-600/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                   <div className="bg-black/90 px-5 py-2 rounded-full text-[10px] font-bold border border-white/10 flex items-center gap-3 translate-y-4 group-hover:translate-y-0 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
                      INSPECT FULL FRAME
                   </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 space-y-4">
                <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto text-gray-700 animate-pulse">
                   <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                </div>
                <p className="text-gray-600 text-xs font-bold uppercase tracking-tighter">Waiting for spatial input</p>
              </div>
            )}

            {isGenerating && (
              <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-md flex flex-col items-center justify-center gap-4 z-10">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-indigo-500/10 border-b-indigo-500 rounded-full animate-spin-slow"></div>
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-blue-400 font-mono text-xs animate-pulse">RECONSTRUCTING_GEOMETRY...</p>
                  <p className="text-gray-500 text-[10px] font-mono">STEP_ {settings.steps} / INF</p>
                </div>
              </div>
            )}
          </div>

          {result && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                  <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">DIMS</p>
                  <p className="text-sm font-mono text-gray-300">{result.settings.width}x{result.settings.height}</p>
                </div>
                
                <button
                  onClick={copyImageToClipboard}
                  className={`
                    p-4 rounded-xl border flex items-center justify-center gap-2 transition-all font-bold text-xs uppercase tracking-widest
                    ${copyStatus === 'success' 
                      ? 'bg-green-500/10 border-green-500/50 text-green-400' 
                      : 'bg-gray-900/50 border-gray-800 text-gray-300 hover:bg-gray-800'
                    }
                  `}
                >
                  {copyStatus === 'loading' ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  ) : copyStatus === 'success' ? (
                    "COPIED!"
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
                      COPY_IMG
                    </>
                  )}
                </button>
              </div>

              {!videoResult ? (
                <button
                  onClick={handleCreateVideo}
                  disabled={isGenerating}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-[0.2em] rounded-xl transition-all shadow-xl shadow-indigo-500/10 active:scale-[0.98]"
                >
                  Synthesize Transition
                </button>
              ) : (
                <div className="relative rounded-2xl overflow-hidden bg-black border border-gray-800 shadow-2xl aspect-video group">
                  <video src={videoResult.videoUrl} controls autoPlay loop className="w-full h-full" />
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* World-Class Lightbox */}
      {isLightboxOpen && result && (
        <div 
          className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-12 animate-in fade-in duration-300 cursor-zoom-out"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Controls Overlay */}
          <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center pointer-events-none">
             <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-[10px] font-mono text-gray-400">
               QWENCAM_SESSION_ID: {result.timestamp}
             </div>
             <button 
                className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white pointer-events-auto transition-all hover:rotate-90"
                onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(false); }}
             >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
             </button>
          </div>
          
          <div 
            className="relative max-w-full max-h-full flex flex-col items-center gap-8 animate-in zoom-in-95 duration-500" 
            onClick={(e) => e.stopPropagation()}
          >
             <img 
                src={result.imageUrl} 
                alt="Lightbox View" 
                className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-[0_0_120px_rgba(59,130,246,0.15)] select-none pointer-events-none"
             />
             
             <div className="flex flex-wrap items-center justify-center gap-4 bg-black/60 p-2 rounded-2xl border border-white/5 backdrop-blur-md">
                <button
                  onClick={copyImageToClipboard}
                  className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold uppercase tracking-widest text-white transition-all border border-white/10"
                >
                  {copyStatus === 'success' ? "COPIED" : "COPY FRAME"}
                </button>
                
                <a 
                  href={result.imageUrl} 
                  download={`render_${result.timestamp}.png`}
                  className="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-xl text-white text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20"
                >
                  DOWNLOAD HD
                </a>
             </div>
          </div>
        </div>
      )}

      {/* Footer System Info */}
      <footer className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-700 text-[10px] font-mono uppercase tracking-[0.4em] mt-12">
        QWENCAM STUDIO // SPATIAL_PERSPECTIVE_MODULE_V1.2 // GOOGLE_GENAI_PIPELINE
      </footer>
      
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default App;
