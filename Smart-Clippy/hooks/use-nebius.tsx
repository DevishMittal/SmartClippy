import { useState, useCallback, useEffect } from 'react';
import type { ClipboardItem } from './use-clipboard-history';

interface NebiusOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  apiKey: string;
}

interface NebiusModel {
  id: string;
  name: string;
  version?: string;
}

export function useNebius(defaultOptions: NebiusOptions) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<NebiusModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [currentModel, setCurrentModel] = useState<string>(
    defaultOptions.model || 'meta-llama/Meta-Llama-3.1-70B-Instruct'
  );

  useEffect(() => {
    if (defaultOptions.model) {
      setCurrentModel(defaultOptions.model);
    }
  }, [defaultOptions.model]);

  const fetchAvailableModels = useCallback(async () => {
    if (!defaultOptions.apiKey) {
      setAvailableModels([]);
      return [];
    }

    setIsLoadingModels(true);
    setError(null);

    try {
      const response = await fetch('/api/nebius/models', {
        headers: {
          'Authorization': `Bearer ${defaultOptions.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }

      const data = await response.json();
      const models = data.models || [];
      console.log('Fetched Nebius models:', models);
      setAvailableModels(models);
      return models;
    } catch (error) {
      console.error('Failed to fetch Nebius models:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch models');
      return [];
    } finally {
      setIsLoadingModels(false);
    }
  }, [defaultOptions.apiKey]);

  const callNebius = useCallback(async (prompt: string, options: Partial<NebiusOptions> = {}) => {
    try {
      console.log('Calling Nebius with:', {
        model: currentModel,
        prompt: prompt.slice(0, 100) + '...',
        temperature: options.temperature || defaultOptions.temperature,
        maxTokens: options.maxTokens || defaultOptions.maxTokens
      });

      const response = await fetch('/api/nebius/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${defaultOptions.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: currentModel,
          messages: [
            { role: "user", content: prompt }
          ],
          temperature: options.temperature || defaultOptions.temperature || 0.3,
          max_tokens: options.maxTokens || defaultOptions.maxTokens || 1000
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Nebius API error:', error);
        throw new Error(error.message || 'Failed to call Nebius');
      }

      const data = await response.json();
      console.log('Nebius response:', data);
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Nebius API call failed:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }, [currentModel, defaultOptions.apiKey, defaultOptions.temperature, defaultOptions.maxTokens]);

  const summarizeContent = useCallback(async (item: ClipboardItem) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const prompt = `You are a helpful AI assistant. Please create a clear and concise summary of the following content, focusing on the key points and main ideas:\n\n${item.content}\n\nSummary:`;
      const summary = await callNebius(prompt);
      
      const updatedItem = {
        ...item,
        summary: summary.trim()
      };
      
      return updatedItem;
    } finally {
      setIsProcessing(false);
    }
  }, [callNebius]);

  const translateContent = useCallback(async (item: ClipboardItem, targetLanguage: string) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const prompt = `You are a skilled translator. Please translate the following content to ${targetLanguage}, maintaining the original meaning and tone:\n\n${item.content}\n\nTranslation:`;
      const translated = await callNebius(prompt);
      
      const updatedItem = {
        ...item,
        translated: translated.trim()
      };
      
      return updatedItem;
    } finally {
      setIsProcessing(false);
    }
  }, [callNebius]);

  const formatCode = useCallback(async (item: ClipboardItem) => {
    if (item.type !== 'code') return item;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const prompt = `You are an expert programmer. Please format and clean up the following code while preserving its functionality. Only return the formatted code without any explanations or additional text:\n\n${item.content}`;
      const formattedCode = await callNebius(prompt);
      
      const updatedItem = {
        ...item,
        content: formattedCode.trim()
      };
      
      return updatedItem;
    } finally {
      setIsProcessing(false);
    }
  }, [callNebius]);

  return {
    isProcessing,
    error,
    summarizeContent,
    translateContent,
    formatCode,
    callNebius,
    availableModels,
    isLoadingModels,
    fetchAvailableModels,
    currentModel
  };
} 