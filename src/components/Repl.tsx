import React, { useEffect, useRef, useState } from 'react';
import { Terminal, Play } from 'lucide-react';

interface ReplProps {
  history: { cmd: string; res: any }[];
  onExecute: (cmd: string) => void;
}

export const Repl: React.FC<ReplProps> = ({ history, onExecute }) => {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when history changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onExecute(input);
    setInput('');
  };

  return (
    // FIX 1: Ensure the container strictly respects the parent's height (h-full)
    <div className="flex flex-col bg-black border border-neutral-800 rounded-lg shadow-2xl overflow-hidden h-full">
      
      {/* Header (Fixed at top) */}
      <div className="bg-neutral-800 px-4 py-2 text-xs flex items-center justify-between text-gray-400 border-b border-neutral-700 shrink-0">
        <div className="flex items-center gap-2">
          <Terminal size={14} /> SQL Console
        </div>
        <div className="flex gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="w-3 h-3 rounded-full bg-green-500" />
        </div>
      </div>

      {/* Output Log (Scrollable Middle) */}
      {/* FIX 2: Added 'min-h-0'. This is crucial! It forces the scrollbar to appear inside this div 
          instead of expanding the whole page. */}
      <div className="flex-1 p-4 overflow-y-auto min-h-0 font-mono text-sm space-y-4">
        <div className="text-gray-500 mb-4 select-none">
          -- Welcome to TitanDB v1.0 <br />
          -- Type SQL commands below. <br />
          -- Try: <span className="text-blue-400">SELECT * FROM tasks</span>
        </div>

        {history.map((entry, i) => (
          <div key={i} className="group">
            <div className="flex items-center gap-2 text-blue-400">
              <span className="text-gray-600 select-none">$</span> {entry.cmd}
            </div>
            <div className="mt-1 text-gray-300 ml-4 whitespace-pre-wrap break-words">
              {typeof entry.res === 'string' 
                ? entry.res 
                : JSON.stringify(entry.res, null, 2)}
            </div>
          </div>
        ))}
        {/* Invisible element to scroll to */}
        <div ref={bottomRef} />
      </div>

      {/* Input Area (Fixed at bottom) */}
      <form onSubmit={handleSubmit} className="p-3 bg-neutral-900 border-t border-neutral-800 flex gap-2 shrink-0">
        <span className="text-blue-500 font-mono py-2">{'>'}</span>
        <input
          className="flex-1 bg-transparent border-none outline-none font-mono text-sm text-white placeholder-gray-700"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="ENTER command..."
          autoFocus
        />
        <button type="submit" className="text-gray-500 hover:text-white transition-colors">
          <Play size={16} />
        </button>
      </form>
    </div>
  );
};