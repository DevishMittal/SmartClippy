import { useState, useEffect } from 'react';
import { useLocalStorage } from '../lib/hooks/use-local-storage';

export interface ClipboardItem {
  id: string;
  content: string;
  type: 'text' | 'code' | 'link' | 'image';
  timestamp: number;
  summary?: string;
  translated?: string;
  tags?: string[];
  imageData?: string; // Base64 encoded image data
}

export function useClipboardHistory() {
  const [history, setHistory] = useLocalStorage<ClipboardItem[]>('clipboard-history', []);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [hasFocus, setHasFocus] = useState(typeof document !== 'undefined' ? document.hasFocus() : false);

  const addItem = (item: ClipboardItem) => {
    setHistory((prev: ClipboardItem[]) => [item, ...prev].slice(0, 1000));
  };

  const updateItem = (updatedItem: ClipboardItem) => {
    setHistory((prev: ClipboardItem[]) => prev.map((item: ClipboardItem) => 
      item.id === updatedItem.id ? updatedItem : item
    ));
  };

  const removeItem = (id: string) => {
    setHistory((prev: ClipboardItem[]) => prev.filter((item: ClipboardItem) => item.id !== id));
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const startMonitoring = () => {
    setIsMonitoring(true);
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleFocus = () => setHasFocus(true);
    const handleBlur = () => setHasFocus(false);

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  useEffect(() => {
    if (!isMonitoring || !hasFocus) return;

    const handleClipboardChange = async () => {
      try {
        // Try to read image data first
        const items = await navigator.clipboard.read();
        for (const item of items) {
          if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
            const imageBlob = await item.getType(item.types.find(type => type.startsWith('image/')) || 'image/png');
            const reader = new FileReader();
            
            reader.onload = () => {
              const imageData = reader.result as string;
              
              // Check if this image already exists in recent history
              const exists = history.some((historyItem: ClipboardItem) => 
                historyItem.type === 'image' && historyItem.imageData === imageData
              );
              
              if (exists) return;

              const newItem: ClipboardItem = {
                id: crypto.randomUUID(),
                content: 'Image from clipboard',
                type: 'image',
                timestamp: Date.now(),
                imageData
              };
              addItem(newItem);
            };
            
            reader.readAsDataURL(imageBlob);
            return; // Exit if we found an image
          }
        }

        // If no image, try to read text
        const text = await navigator.clipboard.readText();
        if (!text) return;

        // Check if this content already exists in recent history
        const exists = history.some((historyItem: ClipboardItem) => 
          historyItem.type !== 'image' && historyItem.content === text
        );
        if (exists) return;

        const newItem: ClipboardItem = {
          id: crypto.randomUUID(),
          content: text,
          type: detectContentType(text),
          timestamp: Date.now(),
        };

        addItem(newItem);
      } catch (error) {
        console.error('Failed to read clipboard:', error);
      }
    };

    // Poll for clipboard changes only when window has focus
    const interval = setInterval(handleClipboardChange, 1000);
    return () => clearInterval(interval);
  }, [isMonitoring, hasFocus, history]);

  const detectContentType = (content: string): ClipboardItem['type'] => {
    if (content.startsWith('data:image/')) return 'image';
    if (content.startsWith('http://') || content.startsWith('https://')) return 'link';
    if (content.includes('{') || content.includes('function') || content.includes('class')) return 'code';
    return 'text';
  };

  return {
    history,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    clearHistory,
    removeItem,
    addItem,
    updateItem,
    hasFocus
  };
} 