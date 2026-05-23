import React, { useEffect, useState } from 'react';
import { intelligenceEngine, Suggestion } from '../services/intelligenceEngine';
import { Sparkles } from 'lucide-react';

export function ProactiveSuggestionBar({ pagePath, navigateTo }: { pagePath: string, navigateTo: (module: string) => void }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      const data = await intelligenceEngine.getContextualSuggestions(pagePath, navigateTo);
      setSuggestions(data);
    };
    fetchSuggestions();
  }, [pagePath, navigateTo]);

  if (suggestions.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 bg-indigo-950/90 border border-indigo-700/50 rounded-2xl p-4 shadow-2xl flex items-center gap-4 transition-all animate-in slide-in-from-bottom-4">
        <Sparkles className="text-indigo-400" size={20} />
        <div className="flex-1">
            <h4 className="text-xs font-bold text-indigo-100 italic">اقتراح ذكي من المساعد:</h4>
            {suggestions.map((s, idx) => (
                <button key={`suggestion-${s.id}-${idx}`} onClick={s.action} className="text-sm font-bold text-white hover:text-indigo-300">
                    {s.title}
                </button>
            ))}
        </div>
    </div>
  );
}
