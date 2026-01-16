
import React from 'react';
import { CameraControlState } from '../types';
import { ROTATE_LIMITS, FORWARD_LIMITS, TILT_LIMITS } from '../constants';

interface Props {
  state: CameraControlState;
  onChange: (updates: Partial<CameraControlState>) => void;
  onReset: () => void;
}

export const CameraSliders: React.FC<Props> = ({ state, onChange, onReset }) => {
  return (
    <div className="space-y-6 bg-gray-800/50 p-6 rounded-xl border border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Manual Controls</h3>
        <button 
          onClick={onReset}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded"
        >
          Reset All
        </button>
      </div>

      <div className="space-y-4">
        {/* Rotation */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-sm text-gray-400">Rotation (Degrees)</label>
            <span className="text-sm font-mono text-blue-400">{state.rotate.toFixed(1)}°</span>
          </div>
          <input
            type="range"
            min={ROTATE_LIMITS.min}
            max={ROTATE_LIMITS.max}
            step="0.5"
            value={state.rotate}
            onChange={(e) => onChange({ rotate: parseFloat(e.target.value) })}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-[10px] text-gray-500 mt-1">
            <span>Left (-90)</span>
            <span>Center (0)</span>
            <span>Right (+90)</span>
          </div>
        </div>

        {/* Forward */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-sm text-gray-400">Forward Movement</label>
            <span className="text-sm font-mono text-blue-400">{state.forward.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min={FORWARD_LIMITS.min}
            max={FORWARD_LIMITS.max}
            step="0.1"
            value={state.forward}
            onChange={(e) => onChange({ forward: parseFloat(e.target.value) })}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* Tilt */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-sm text-gray-400">Vertical Tilt (Pitch)</label>
            <span className="text-sm font-mono text-blue-400">{state.tilt.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={TILT_LIMITS.min}
            max={TILT_LIMITS.max}
            step="0.01"
            value={state.tilt}
            onChange={(e) => onChange({ tilt: parseFloat(e.target.value) })}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-[10px] text-gray-500 mt-1">
            <span>Worm's Eye</span>
            <span>Neutral</span>
            <span>Bird's Eye</span>
          </div>
        </div>

        {/* Wide Angle */}
        <div className="flex items-center justify-between pt-2">
          <label className="text-sm text-gray-400 cursor-pointer select-none flex items-center gap-2">
            <input
              type="checkbox"
              checked={state.wideAngle}
              onChange={(e) => onChange({ wideAngle: e.target.checked })}
              className="w-4 h-4 rounded border-gray-700 text-blue-500 focus:ring-blue-500 bg-gray-700"
            />
            Wide Angle Lens
          </label>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${state.wideAngle ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-500'}`}>
            {state.wideAngle ? 'ACTIVE' : 'OFF'}
          </span>
        </div>
      </div>
    </div>
  );
};
