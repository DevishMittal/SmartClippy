import { useState, useEffect } from 'react';
import { useLocalStorage } from './use-local-storage';

export interface ClipboardItem {
  id: string;
  content: string;
  type: 'text' | 'code' | 'link' | 'image';
  timestamp: number;
  summary?: string;
  translated?: string;
  tags?: string[];
}

export function useClipboardHistory() {
  const [history, setHistory] = useLocalStorage<ClipboardItem[]>('clipboard-history', []);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    if (!isMonitoring) return;

    const handleClipboardChange = async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (!text) return;

        // Check if this content already exists in recent history
        const exists = history.some(item => item.content === text);
        if (exists) return;

        const newItem: ClipboardItem = {
          id: crypto.randomUUID(),
          content: text,
          type: detectContentType(text),
          timestamp: Date.now(),
        };

        setHistory(prev => [newItem, ...prev].slice(0, 1000)); // Keep last 1000 items
      } catch (error) {
        console.error('Failed to read clipboard:', error);
      }
    };

    // Poll for clipboard changes
    const interval = setInterval(handleClipboardChange, 1000);
    return () => clearInterval(interval);
  }, [isMonitoring, history]);

  const detectContentType = (content: string): ClipboardItem['type'] => {
    if (content.startsWith('http://') || content.startsWith('https://')) return 'link';
    if (content.includes('{') || content.includes('function') || content.includes('class')) return 'code';
    return 'text';
  };

  const startMonitoring = () => setIsMonitoring(true);
  const stopMonitoring = () => setIsMonitoring(false);
  const clearHistory = () => setHistory([]);
  
  const removeItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  return {
    history,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    clearHistory,
    removeItem,
  };
} 