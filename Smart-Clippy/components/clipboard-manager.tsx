'use client';

import { useState, useEffect } from 'react';
import { useClipboardHistory, type ClipboardItem } from '../hooks/use-clipboard-history';
import { useOllama } from '../hooks/use-ollama';
import { useNebius } from '../hooks/use-nebius';
import { Button } from './ui/button';
import { ModelSelector } from './model-selector';
import { toast } from 'sonner';
import { useLocalStorage } from '../lib/hooks/use-local-storage';
import { Moon, Sun, Search, Clipboard, Clock, Zap, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9" />; // Placeholder with same dimensions
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200"
    >
      {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </Button>
  );
}

export function ClipboardManager() {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
  const [provider, setProvider] = useLocalStorage<'ollama' | 'nebius'>('selected-provider', 'ollama');
  const [selectedModel, setSelectedModel] = useLocalStorage('selected-model', 'qwen2.5');
  const [apiKey, setApiKey] = useLocalStorage('nebius-api-key', '');
  
  const {
    history,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    clearHistory,
    removeItem,
    updateItem,
    hasFocus
  } = useClipboardHistory();

  const {
    isProcessing: isOllamaProcessing,
    error: ollamaError,
    formatCode: formatCodeOllama,
    summarizeContent: summarizeContentOllama,
    translateContent: translateContentOllama,
    availableModels: ollamaModels,
    isLoadingModels: isLoadingOllamaModels,
    fetchAvailableModels: fetchOllamaModels
  } = useOllama({
    model: provider === 'ollama' ? selectedModel : undefined,
    temperature: 0.3,
    maxTokens: 1000
  });

  const {
    isProcessing: isNebiusProcessing,
    error: nebiusError,
    formatCode: formatCodeNebius,
    summarizeContent: summarizeContentNebius,
    translateContent: translateContentNebius,
    availableModels: nebiusModels,
    isLoadingModels: isLoadingNebiusModels,
    fetchAvailableModels: fetchNebiusModels
  } = useNebius({
    model: provider === 'nebius' ? selectedModel : undefined,
    temperature: 0.3,
    maxTokens: 1000,
    apiKey
  });

  const [selectedItem, setSelectedItem] = useState<ClipboardItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleProviderChange = (newProvider: 'ollama' | 'nebius') => {
    setProvider(newProvider);
    // Reset selected model when changing providers
    setSelectedModel(newProvider === 'ollama' ? 'qwen2.5' : 'meta-llama/Meta-Llama-3.1-70B-Instruct');
  };

  const handleModelChange = (model: string, provider: 'ollama' | 'nebius') => {
    setSelectedModel(model);
    toast.success(`Model changed to ${model}`);
  };

  const handleApiKeyChange = (key: string) => {
    setApiKey(key);
    if (key) {
      fetchNebiusModels();
    }
  };

  const isProcessing = provider === 'ollama' ? isOllamaProcessing : isNebiusProcessing;
  const error = provider === 'ollama' ? ollamaError : nebiusError;

  const handleFormat = async (item: ClipboardItem) => {
    try {
      const formatFn = provider === 'ollama' ? formatCodeOllama : formatCodeNebius;
      const updatedItem = await formatFn(item);
      updateItem(updatedItem);
      setSelectedItem(updatedItem);
      toast.success('Code formatted successfully');
    } catch (error) {
      console.error('Format error:', error);
      toast.error('Failed to format code', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  const handleSummarize = async (item: ClipboardItem) => {
    try {
      const summarizeFn = provider === 'ollama' ? summarizeContentOllama : summarizeContentNebius;
      const updatedItem = await summarizeFn(item);
      updateItem(updatedItem);
      setSelectedItem(updatedItem);
      toast.success('Content summarized successfully');
    } catch (error) {
      console.error('Summarize error:', error);
      toast.error('Failed to summarize content', { 
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  const handleTranslate = async (item: ClipboardItem, language: string) => {
    try {
      const translateFn = provider === 'ollama' ? translateContentOllama : translateContentNebius;
      const updatedItem = await translateFn(item, language);
      updateItem(updatedItem);
      setSelectedItem(updatedItem);
      toast.success('Content translated successfully');
    } catch (error) {
      console.error('Translate error:', error);
      toast.error('Failed to translate content', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  const filteredHistory = history.filter((item: ClipboardItem) =>
    item.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Copied to clipboard');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-slate-50 to-teal-100 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900 text-slate-900 dark:text-slate-100 transition-colors duration-500">
      <div className="flex flex-col h-full max-w-5xl mx-auto p-6 space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between flex-wrap gap-4 bg-white/80 dark:bg-slate-800/80 p-6 rounded-xl backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 shadow-lg"
        >
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3"
            >
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500 bg-clip-text text-transparent">
                Smart-Clippy
              </h1>
              <div className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-xs font-medium text-blue-600 dark:text-blue-300">
                AI Powered
              </div>
            </motion.div>
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={handleModelChange}
              ollamaModels={ollamaModels}
              nebiusModels={nebiusModels}
              isLoadingModels={provider === 'ollama' ? isLoadingOllamaModels : isLoadingNebiusModels}
              onRefresh={provider === 'ollama' ? fetchOllamaModels : fetchNebiusModels}
              provider={provider}
              onProviderChange={handleProviderChange}
              apiKey={apiKey}
              onApiKeyChange={handleApiKeyChange}
            />
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={isMonitoring ? stopMonitoring : startMonitoring}
                variant={isMonitoring ? "destructive" : "default"}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Clipboard className="w-4 h-4 mr-2" />
                {isMonitoring ? "Stop Monitoring" : "Start Monitoring"}
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={clearHistory}
                variant="outline"
                className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm hover:shadow transition-all duration-200"
              >
                <X className="w-4 h-4 mr-2" />
                Clear History
              </Button>
            </motion.div>
          </div>
        </motion.div>

        <AnimatePresence>
          {isMonitoring && !hasFocus && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200 px-6 py-3 rounded-lg shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="animate-pulse">
                  <Clock className="w-5 h-5" />
                </div>
                Window is not focused. Click anywhere in the window to resume clipboard monitoring.
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search clipboard history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:text-slate-100 shadow-sm transition-all duration-200"
          />
        </div>

        <div className="flex flex-1 gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-1/2 space-y-4"
          >
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              <Clock className="w-5 h-5" />
              History
            </div>
            <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
              <AnimatePresence>
                {filteredHistory.map((item: ClipboardItem) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedItem(item)}
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedItem?.id === item.id
                        ? 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-800/50 border-blue-500 dark:border-blue-400 shadow-md'
                        : 'bg-white/80 dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700">
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {item.type === 'image' && item.imageData ? (
                      <div className="mt-2 h-20 overflow-hidden rounded-lg shadow-sm">
                        <img 
                          src={item.imageData} 
                          alt="Clipboard content" 
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <p className="mt-2 text-sm truncate text-slate-700 dark:text-slate-300">{item.content}</p>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-1/2 space-y-4"
          >
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              <Zap className="w-5 h-5" />
              Actions
            </div>
            {selectedItem ? (
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-lg"
                >
                  {selectedItem.type === 'image' && selectedItem.imageData ? (
                    <div className="flex justify-center">
                      <img 
                        src={selectedItem.imageData} 
                        alt="Clipboard content" 
                        className="max-h-[400px] object-contain rounded-lg shadow-md"
                      />
                    </div>
                  ) : (
                    <pre className="whitespace-pre-wrap break-words text-slate-700 dark:text-slate-300 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                      {selectedItem.content}
                    </pre>
                  )}
                </motion.div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => selectedItem.type === 'image' && selectedItem.imageData 
                      ? handleCopyToClipboard(selectedItem.imageData)
                      : handleCopyToClipboard(selectedItem.content)
                    }
                    variant="default"
                    disabled={isProcessing}
                    className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
                  >
                    Copy
                  </Button>
                  <Button
                    onClick={() => removeItem(selectedItem.id)}
                    variant="destructive"
                    disabled={isProcessing}
                    className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white"
                  >
                    Delete
                  </Button>
                  <Button
                    onClick={() => handleFormat(selectedItem)}
                    disabled={selectedItem.type !== 'code' || isProcessing}
                    variant="secondary"
                    className="bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-700 text-white"
                  >
                    {isProcessing ? (
                      <>
                        <span className="animate-spin mr-2">⌛</span>
                        Formatting...
                      </>
                    ) : (
                      'Format Code'
                    )}
                  </Button>
                  <Button
                    onClick={() => handleSummarize(selectedItem)}
                    disabled={isProcessing}
                    variant="secondary"
                    className="bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white"
                  >
                    {isProcessing ? (
                      <>
                        <span className="animate-spin mr-2">⌛</span>
                        Summarizing...
                      </>
                    ) : (
                      'Summarize'
                    )}
                  </Button>
                  <Button
                    onClick={() => handleTranslate(selectedItem, 'English')}
                    disabled={isProcessing}
                    variant="secondary"
                    className="bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 text-white"
                  >
                    {isProcessing ? (
                      <>
                        <span className="animate-spin mr-2">⌛</span>
                        Translating...
                      </>
                    ) : (
                      'Translate'
                    )}
                  </Button>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-4 p-4 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 shadow-md"
                    >
                      <h3 className="text-md font-semibold">Error</h3>
                      <p className="mt-1 text-sm">{error}</p>
                    </motion.div>
                  )}

                  {selectedItem.summary && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-4 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border border-emerald-200 dark:border-emerald-700 shadow-md"
                    >
                      <h3 className="text-md font-semibold text-emerald-700 dark:text-emerald-200">Summary</h3>
                      <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-300">{selectedItem.summary}</p>
                    </motion.div>
                  )}

                  {selectedItem.translated && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border border-amber-200 dark:border-amber-700 shadow-md"
                    >
                      <h3 className="text-md font-semibold text-amber-700 dark:text-amber-200">Translation</h3>
                      <p className="mt-1 text-sm text-amber-600 dark:text-amber-300">{selectedItem.translated}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center text-center p-12 bg-white/80 dark:bg-slate-800/80 rounded-xl backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-lg"
              >
                <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-r from-blue-500 to-teal-500 flex items-center justify-center text-white">
                  <Clipboard className="w-8 h-8" />
                </div>
                <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
                  Select an item from history to view actions
                </p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Copy text, code, or images to get started
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
} 