
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
  // State
  const { state: cameraState, updateState: updateCamera, reset: resetCamera, generatedPrompt } = useCameraControls();
  const [settings, setSettings] = useState<GenerationSettings>(DEFAULT_SETTINGS);
  const [sourceImage, setSourceImage] = useState<ImageData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'3d' | 'sliders'>('3d');
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [videoResult, setVideoResult] = useState<VideoResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Lightbox & Clipboard state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('qwencam_settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) { console.error("Failed to load saved settings"); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('qwencam_settings', JSON.stringify(settings));
  }, [settings]);

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
      console.error(err);
      setError(err.message || "An error occurred during generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateVideo = async () => {
    if (!sourceImage || !result) return;

    try {
      setIsGenerating(true); 
      const videoUrl = await geminiService.generateTransitionVideo(sourceImage.base64, result.imageUrl);
      setVideoResult({
        videoUrl,
        timestamp: Date.now(),
      });
    } catch (err) {
      setError("Failed to generate transition video.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyImageToClipboard = async () => {
    if (!result?.imageUrl) return;
    
    try {
      setCopyStatus('idle');
      const response = await fetch(result.imageUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      setCopyStatus('success');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
      console.error("Failed to copy image: ", err);
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
              <p className="text-[10px] text-blue-500 font-mono tracking-tighter uppercase font-bold">Advanced Camera Morphing v1.0</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Gemini-3 Engine</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8 grid lg:grid-cols-2 gap-8 lg:items-start">
        {/* Left Column: Controls */}
        <div className="space-y-6">
          <section className="space-y-4">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Input Selection
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
                  <div>
                    <p className="text-xs font-medium text-white truncate">{sourceImage.name}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-tighter">{(sourceImage.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button 
                    onClick={() => { setSourceImage(null); setResult(null); setVideoResult(null); }}
                    className="p-2 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/40 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </button>
                </div>
              </div>
            ) : (
              <ImageUploader onUpload={setSourceImage} />
            )}
          </section>

          <section className="space-y-4">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Camera Control
            </h2>
            
            <div className="bg-gray-900/50 rounded-2xl border border-gray-800 overflow-hidden">
              <div className="flex border-b border-gray-800">
                <button 
                  onClick={() => setActiveTab('3d')}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === '3d' ? 'bg-blue-600/10 text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  3D Manipulator
                </button>
                <button 
                  onClick={() => setActiveTab('sliders')}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'sliders' ? 'bg-blue-600/10 text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  Slider Matrix
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

          <section className="space-y-2">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-widest px-1">Live Prompt Matrix</h3>
            <div className="bg-gray-900/80 p-4 rounded-xl border border-gray-800 font-mono text-xs text-blue-300/80 leading-relaxed shadow-inner">
              {generatedPrompt}
            </div>
          </section>

          <GenerationSettingsPanel settings={settings} onChange={(u) => setSettings(s => ({...s, ...u}))} />

          <button
            onClick={handleGenerate}
            disabled={!sourceImage || isGenerating}
            className={`
              w-full py-4 rounded-2xl font-bold text-lg shadow-2xl transition-all flex items-center justify-center gap-3
              ${(!sourceImage || isGenerating) 
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20 scale-[1.02] active:scale-[0.98]'
              }
            `}
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Processing Vector Fields...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 14 7-7 7 7"/><path d="M12 7v14"/></svg>
                Generate Edited Frame
              </>
            )}
          </button>
          
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}
        </div>

        {/* Right Column: Output */}
        <div className="space-y-6 sticky top-24">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Virtual Output
          </h2>

          <div className="relative aspect-square rounded-3xl bg-gray-900 border border-gray-800 flex items-center justify-center overflow-hidden shadow-inner group">
            {result ? (
              <div className="w-full h-full relative cursor-zoom-in" onClick={() => setIsLightboxOpen(true)}>
                <img 
                  src={result.imageUrl} 
                  alt="Generated Result" 
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-indigo-400 font-mono border border-indigo-500/30">
                  EDITED VERSION
                </div>
                {/* Floating Action Hint */}
                <div className="absolute inset-0 bg-indigo-500/0 hover:bg-indigo-500/5 transition-colors flex items-center justify-center opacity-0 hover:opacity-100 pointer-events-none">
                  <div className="bg-black/80 px-4 py-2 rounded-full text-xs font-medium border border-white/10 flex items-center gap-2 translate-y-4 group-hover:translate-y-0 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
                    Click to View Full Size
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-700 animate-pulse">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                </div>
                <p className="text-gray-600 text-sm font-medium">Modified perspective will appear here</p>
              </div>
            )}

            {isGenerating && (
              <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-indigo-500/10 border-b-indigo-500 rounded-full animate-spin-slow"></div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-blue-400 font-mono text-sm animate-pulse">RECONSTRUCTING MESH...</p>
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest mt-1">Applying LoRA Weights</p>
                </div>
              </div>
            )}
          </div>

          {result && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 bg-gray-900/50 p-3 rounded-xl border border-gray-800">
                  <p className="text-[10px] text-gray-500 uppercase">Resolution</p>
                  <p className="text-sm font-mono text-gray-300">{result.settings.width}x{result.settings.height}</p>
                </div>
                <button
                  onClick={copyImageToClipboard}
                  className={`
                    flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all font-medium text-sm
                    ${copyStatus === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-gray-900/50 border-gray-800 text-gray-300 hover:bg-gray-800'}
                  `}
                >
                  {copyStatus === 'success' ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                      Copied!
                    </>
                  ) : copyStatus === 'error' ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      Copy Failed
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
                      Copy to Clipboard
                    </>
                  )}
                </button>
              </div>

              {!videoResult ? (
                <button
                  onClick={handleCreateVideo}
                  disabled={isGenerating}
                  className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl border border-gray-700 transition-all flex items-center justify-center gap-2 group"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:text-blue-400 transition-colors"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.934a.5.5 0 0 0-.777-.416L16 11"/><rect width="14" height="12" x="2" y="6" rx="2"/></svg>
                  Synthesize Transition Video
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden bg-black border border-gray-800 shadow-2xl aspect-video flex items-center justify-center">
                    <video 
                      src={videoResult.videoUrl} 
                      controls 
                      autoPlay 
                      loop
                      className="w-full h-full"
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-500 uppercase px-1">
                    <span>Wan-2.2 Video Model</span>
                    <span>1080p Interpolation</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Lightbox Modal */}
      {isLightboxOpen && result && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button 
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-[110]"
            onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(false); }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
          <div className="relative max-w-full max-h-full flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
             <img 
                src={result.imageUrl} 
                alt="Full size view" 
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/5"
             />
             <div className="flex items-center gap-4">
                <button
                  onClick={copyImageToClipboard}
                  className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-full text-white text-sm font-medium transition-colors border border-white/10 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
                  {copyStatus === 'success' ? 'Copied to Clipboard' : 'Copy Image'}
                </button>
                <a 
                  href={result.imageUrl} 
                  download={`qwencam_${Date.now()}.png`}
                  className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-full text-white text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download PNG
                </a>
             </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <footer className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-600 text-xs border-t border-gray-900/50 mt-12">
        <p>&copy; 2024 QwenCam AI Studio. Powered by Qwen-Edit-2509 & Gemini-3 Native Pipeline.</p>
        <div className="flex justify-center gap-4 mt-2">
          <a href="#" className="hover:text-gray-400 transition-colors">Documentation</a>
          <a href="#" className="hover:text-gray-400 transition-colors">API Status</a>
          <a href="#" className="hover:text-gray-400 transition-colors">GitHub</a>
        </div>
      </footer>
      
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default App;
