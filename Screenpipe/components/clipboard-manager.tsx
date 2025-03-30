import { useState, useEffect } from 'react';
import { useClipboardHistory, type ClipboardItem } from '../hooks/use-clipboard-history';
import { useOllama } from '../hooks/use-ollama';
import { useNebius } from '../hooks/use-nebius';
import { Button } from './ui/button';
import { ModelSelector } from './model-selector';
import { toast } from 'sonner';
import { useLocalStorage } from '../lib/hooks/use-local-storage';
import { Moon, Sun } from 'lucide-react';

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

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 text-slate-900 dark:text-slate-100">
      <div className="flex flex-col h-full max-w-4xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4 bg-white/50 dark:bg-slate-800/50 p-4 rounded-lg backdrop-blur-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-teal-400 bg-clip-text text-transparent">
              Smart-Clippy
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
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
            <Button
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              variant={isMonitoring ? "destructive" : "default"}
              className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
            >
              {isMonitoring ? "Stop Monitoring" : "Start Monitoring"}
            </Button>
            <Button
              onClick={clearHistory}
              variant="outline"
              className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Clear History
            </Button>
          </div>
        </div>

        {isMonitoring && !hasFocus && (
          <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200 px-4 py-2 rounded-lg">
            Window is not focused. Click anywhere in the window to resume clipboard monitoring.
          </div>
        )}

        <input
          type="text"
          placeholder="Search clipboard history..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:text-slate-100"
        />

        <div className="flex flex-1 space-x-4">
          <div className="w-1/2 overflow-y-auto">
            <h2 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">History</h2>
            <div className="space-y-2">
              {filteredHistory.map((item: ClipboardItem) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    selectedItem?.id === item.id
                      ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-500 dark:border-blue-400'
                      : 'bg-white/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {item.type === 'image' && item.imageData ? (
                    <div className="mt-1 h-16 overflow-hidden rounded-md">
                      <img 
                        src={item.imageData} 
                        alt="Clipboard content" 
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    <p className="mt-1 text-sm truncate text-slate-700 dark:text-slate-300">{item.content}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="w-1/2">
            <h2 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">Actions</h2>
            {selectedItem ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700">
                  {selectedItem.type === 'image' && selectedItem.imageData ? (
                    <div className="flex justify-center">
                      <img 
                        src={selectedItem.imageData} 
                        alt="Clipboard content" 
                        className="max-h-[400px] object-contain rounded-lg"
                      />
                    </div>
                  ) : (
                    <pre className="whitespace-pre-wrap break-words text-slate-700 dark:text-slate-300">
                      {selectedItem.content}
                    </pre>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
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

                {error && (
                  <div className="mt-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200">
                    <h3 className="text-md font-semibold">Error</h3>
                    <p className="mt-1 text-sm">{error}</p>
                  </div>
                )}

                {selectedItem.summary && (
                  <div className="mt-4 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700">
                    <h3 className="text-md font-semibold text-emerald-700 dark:text-emerald-200">Summary</h3>
                    <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-300">{selectedItem.summary}</p>
                  </div>
                )}

                {selectedItem.translated && (
                  <div className="mt-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700">
                    <h3 className="text-md font-semibold text-amber-700 dark:text-amber-200">Translation</h3>
                    <p className="mt-1 text-sm text-amber-600 dark:text-amber-300">{selectedItem.translated}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-slate-500 dark:text-slate-400 p-8 bg-white/50 dark:bg-slate-800/50 rounded-lg backdrop-blur-sm border border-slate-200 dark:border-slate-700">
                Select an item from history to view actions
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 