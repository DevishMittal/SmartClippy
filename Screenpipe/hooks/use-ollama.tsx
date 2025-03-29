import { useState, useCallback } from 'react';
import type { ClipboardItem } from './use-clipboard-history';

interface OllamaOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export function useOllama(defaultOptions: OllamaOptions = {}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callOllama = async (prompt: string, options: OllamaOptions = {}) => {
    const baseUrl = 'http://localhost:11434/api';
    
    try {
      console.log('Calling Ollama with prompt:', prompt.slice(0, 100) + '...');
      
      const response = await fetch(`${baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: options.model || defaultOptions.model || 'qwen2.5',
          prompt: prompt,
          stream: false,
          options: {
            temperature: options.temperature || defaultOptions.temperature || 0.3,
            num_predict: options.maxTokens || defaultOptions.maxTokens || 1000,
          }
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Ollama API error:', error);
        throw new Error(error.message || 'Failed to call Ollama');
      }

      const data = await response.json();
      console.log('Ollama response:', data);
      return data.response;
    } catch (error) {
      console.error('Ollama API call failed:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  };

  const summarizeContent = useCallback(async (item: ClipboardItem) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const prompt = `You are a helpful AI assistant. Please create a clear and concise summary of the following content, focusing on the key points and main ideas:\n\n${item.content}\n\nSummary:`;
      const summary = await callOllama(prompt);
      
      const updatedItem = {
        ...item,
        summary: summary.trim()
      };
      
      return updatedItem;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const translateContent = useCallback(async (item: ClipboardItem, targetLanguage: string) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const prompt = `You are a skilled translator. Please translate the following content to ${targetLanguage}, maintaining the original meaning and tone:\n\n${item.content}\n\nTranslation:`;
      const translated = await callOllama(prompt);
      
      const updatedItem = {
        ...item,
        translated: translated.trim()
      };
      
      return updatedItem;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const formatCode = useCallback(async (item: ClipboardItem) => {
    if (item.type !== 'code') return item;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const prompt = `You are an expert programmer. Please format and clean up the following code while preserving its functionality. Only return the formatted code without any explanations or additional text:\n\n${item.content}`;
      const formattedCode = await callOllama(prompt);
      
      const updatedItem = {
        ...item,
        content: formattedCode.trim()
      };
      
      return updatedItem;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    isProcessing,
    error,
    summarizeContent,
    translateContent,
    formatCode,
    callOllama
  };
} 