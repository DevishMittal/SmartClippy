import { useState } from 'react';
import { useClipboardHistory, type ClipboardItem } from '../hooks/use-clipboard-history';
import { useOllama } from '../hooks/use-ollama';
import { Button } from './ui/button';
import { AIPresetsSelector } from './ai-presets-selector';
import { toast } from 'sonner';

export function ClipboardManager() {
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
    isProcessing,
    error,
    formatCode,
    summarizeContent,
    translateContent,
  } = useOllama({
    model: 'qwen2.5', // using Qwen 2.5 as default model
    temperature: 0.3,
    maxTokens: 1000
  });

  const [selectedItem, setSelectedItem] = useState<ClipboardItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleFormat = async (item: ClipboardItem) => {
    try {
      const updatedItem = await formatCode(item);
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
      const updatedItem = await summarizeContent(item);
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
      const updatedItem = await translateContent(item, language);
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

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Smart Clipboard Manager</h1>
        <div className="flex items-center space-x-2">
          <Button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            variant={isMonitoring ? "destructive" : "default"}
          >
            {isMonitoring ? "Stop Monitoring" : "Start Monitoring"}
          </Button>
          <Button
            onClick={clearHistory}
            variant="outline"
          >
            Clear History
          </Button>
        </div>
        <AIPresetsSelector pipeName="clipboard-manager" />
      </div>

      {isMonitoring && !hasFocus && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-md">
          Window is not focused. Click anywhere in the window to resume clipboard monitoring.
        </div>
      )}

      <input
        type="text"
        placeholder="Search clipboard history..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="flex flex-1 space-x-4">
        <div className="w-1/2 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-2">History</h2>
          <div className="space-y-2">
            {filteredHistory.map((item: ClipboardItem) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`p-3 rounded-md cursor-pointer ${
                  selectedItem?.id === item.id
                    ? 'bg-blue-100 border-blue-500'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-sm truncate">{item.content}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="w-1/2">
          <h2 className="text-lg font-semibold mb-2">Actions</h2>
          {selectedItem ? (
            <div className="space-y-4">
              <div className="p-4 rounded-md bg-gray-100">
                <pre className="whitespace-pre-wrap break-words">
                  {selectedItem.content}
                </pre>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => handleCopyToClipboard(selectedItem.content)}
                  variant="default"
                  disabled={isProcessing}
                >
                  Copy
                </Button>
                <Button
                  onClick={() => removeItem(selectedItem.id)}
                  variant="destructive"
                  disabled={isProcessing}
                >
                  Delete
                </Button>
                <Button
                  onClick={() => handleFormat(selectedItem)}
                  disabled={selectedItem.type !== 'code' || isProcessing}
                  variant="secondary"
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
                <div className="mt-4 p-4 rounded-md bg-red-50 text-red-700">
                  <h3 className="text-md font-semibold">Error</h3>
                  <p className="mt-1 text-sm">{error}</p>
                </div>
              )}

              {selectedItem.summary && (
                <div className="mt-4 p-4 rounded-md bg-green-50">
                  <h3 className="text-md font-semibold text-green-700">Summary</h3>
                  <p className="mt-1 text-sm text-green-600">{selectedItem.summary}</p>
                </div>
              )}

              {selectedItem.translated && (
                <div className="mt-4 p-4 rounded-md bg-yellow-50">
                  <h3 className="text-md font-semibold text-yellow-700">Translation</h3>
                  <p className="mt-1 text-sm text-yellow-600">{selectedItem.translated}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              Select an item from history to view actions
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 