
import React, { useState } from 'react';
import { GenerationSettings } from '../types';
import { DIMENSION_LIMITS, STEPS_LIMITS } from '../constants';

interface Props {
  settings: GenerationSettings;
  onChange: (updates: Partial<GenerationSettings>) => void;
}

export const GenerationSettingsPanel: React.FC<Props> = ({ settings, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const randomizeSeed = () => {
    onChange({ seed: Math.floor(Math.random() * 2147483647) });
  };

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 hover:bg-gray-700/50 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          Generation Parameters
        </span>
        <svg 
          className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
          xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-gray-700 space-y-4 bg-gray-900/50">
          {/* Seed */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Seed</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={settings.seed}
                onChange={(e) => onChange({ seed: parseInt(e.target.value) || 0 })}
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
              />
              <button 
                onClick={randomizeSeed}
                className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded transition-colors"
                title="Randomize Seed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/></svg>
              </button>
            </div>
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Width</label>
              <select 
                value={settings.width}
                onChange={(e) => onChange({ width: parseInt(e.target.value) })}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200"
              >
                {Array.from({ length: (DIMENSION_LIMITS.max - DIMENSION_LIMITS.min) / DIMENSION_LIMITS.step + 1 }).map((_, i) => {
                  const val = DIMENSION_LIMITS.min + i * DIMENSION_LIMITS.step;
                  return <option key={val} value={val}>{val}px</option>;
                })}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Height</label>
              <select 
                value={settings.height}
                onChange={(e) => onChange({ height: parseInt(e.target.value) })}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200"
              >
                {Array.from({ length: (DIMENSION_LIMITS.max - DIMENSION_LIMITS.min) / DIMENSION_LIMITS.step + 1 }).map((_, i) => {
                  const val = DIMENSION_LIMITS.min + i * DIMENSION_LIMITS.step;
                  return <option key={val} value={val}>{val}px</option>;
                })}
              </select>
            </div>
          </div>

          {/* Inference Steps */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs text-gray-400">Inference Steps</label>
              <span className="text-xs font-mono text-blue-400">{settings.steps}</span>
            </div>
            <input
              type="range"
              min={STEPS_LIMITS.min}
              max={STEPS_LIMITS.max}
              value={settings.steps}
              onChange={(e) => onChange({ steps: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};
