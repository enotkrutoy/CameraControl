
import React, { useState, useCallback, useEffect } from 'react';
import { CameraControlState, GenerationSettings, ImageData, GenerationResult } from './types';
import { DEFAULT_SETTINGS } from './constants';
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
  const [error, setError] = useState<string | null>(null);
  
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error' | 'loading'>('idle');

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

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-blue-500/30">
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
            <span className="flex items-center gap-1.5 font-mono text-[10px]"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> READY</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8 grid lg:grid-cols-2 gap-8 lg:items-start">
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
                    onClick={() => { setSourceImage(null); setResult(null); }}
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
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-xs font-mono">
              [SYSTEM_ERR]: {error}
            </div>
          )}
        </div>

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
                <div className="w-16 h-16 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="text-blue-400 font-mono text-xs animate-pulse">PROCESSING...</p>
              </div>
            )}
          </div>

          {result && (
            <div className="space-y-4">
              <button
                onClick={copyImageToClipboard}
                className="w-full p-4 rounded-xl border border-gray-800 bg-gray-900/50 text-gray-300 hover:bg-gray-800 flex items-center justify-center gap-2 transition-all font-bold text-xs uppercase"
              >
                {copyStatus === 'success' ? "COPIED!" : "COPY_IMG"}
              </button>
            </div>
          )}
        </div>
      </main>

      {isLightboxOpen && result && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setIsLightboxOpen(false)}
        >
          <img src={result.imageUrl} className="max-w-full max-h-full object-contain rounded-lg" />
        </div>
      )}
    </div>
  );
};

export default App;
