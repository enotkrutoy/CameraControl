
import React from 'react';

interface Props {
  prompt: string;
}

export const PromptConsole: React.FC<Props> = ({ prompt }) => {
  return (
    <div className="bg-black/80 rounded-xl border border-blue-500/20 p-4 font-mono text-[11px] space-y-2 overflow-hidden shadow-inner h-24">
      <div className="flex items-center gap-2 text-blue-500/60 uppercase tracking-widest font-bold">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        Spatial Instruction Buffer
      </div>
      <div className="text-gray-400 leading-relaxed overflow-y-auto h-12 scrollbar-hide">
        <span className="text-blue-400 mr-2">>></span>
        {prompt === "no camera movement" ? (
          <span className="italic text-gray-600">Standby: Adjust controls to generate instruction set...</span>
        ) : (
          prompt
        )}
      </div>
    </div>
  );
};
