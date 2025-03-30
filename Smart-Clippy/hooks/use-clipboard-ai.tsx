import { useState } from 'react';
import type { ClipboardItem } from './use-clipboard-history';
import { useSettings } from '@/lib/hooks/use-settings';
import { useAiProvider } from './use-ai-provider';
import type { Settings as BaseSettings } from '@screenpipe/js';

type Settings = BaseSettings & {
  aiPresetId?: string;
};

type UseSettingsReturn = {
  settings: Partial<Settings> | null;
};

interface AIPreset {
  id: string;
  url: string;
  model: string;
  provider: 'openai' | 'native-ollama' | 'custom' | 'screenpipe-cloud';
  apiKey?: string;
  maxContextChars: number;
  prompt?: string;
}

interface AIProcessingOptions {
  summarize?: boolean;
  translate?: boolean;
  format?: boolean;
  targetLanguage?: string;
}

export function useClipboardAI() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { settings } = useSettings() as UseSettingsReturn;
  const aiProvider = useAiProvider(settings ?? undefined);

  const callAI = async (prompt: string): Promise<string> => {
    console.log('Starting AI call with:', {
      provider: settings?.aiProviderType,
      isAvailable: aiProvider.isAvailable,
      error: aiProvider.error
    });
  
    if (!settings?.aiProviderType || !aiProvider.isAvailable) {
      console.error('AI Provider Error:', aiProvider.error || 'AI provider not configured');
      throw new Error(aiProvider.error || 'AI provider not configured');
    }
  
    try {
      const preset = settings.aiPresets?.find(preset => preset.id === settings.aiPresetId);
      console.log('Using preset:', preset);
  
      if (!preset) {
        console.error('No AI preset selected');
        throw new Error('No AI preset selected');
      }
  
      const baseUrl = preset.url;
      console.log('Making request to:', `${baseUrl}/generate`);
  
      const response = await fetch(`${baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: preset.model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.3,
            num_predict: Math.min(preset.maxContextChars || 512000, 1000),
          }
        }),
      });
  
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('API Error:', error);
        throw new Error(`AI API error: ${error.message || response.statusText}`);
      }
  
      const data = await response.json();
      console.log('API Response:', data);
      return data.response;
    } catch (error) {
      console.error('AI API call failed:', error);
      throw error;
    }
  };

  const processContent = async (
    item: ClipboardItem,
    options: AIProcessingOptions = {}
  ) => {
    if (!settings?.aiPresetId) {
      throw new Error('No AI preset selected');
    }

    setIsProcessing(true);
    try {
      let prompt = '';

      if (options.summarize) {
        prompt = `Create a concise summary of the following content while preserving key information:\n\n${item.content}`;
      } else if (options.translate && options.targetLanguage) {
        prompt = `Translate the following content to ${options.targetLanguage}:\n\n${item.content}`;
      } else if (options.format && item.type === 'code') {
        prompt = `Format and clean up this code while preserving its functionality. Return only the formatted code without explanations:\n\n${item.content}`;
      }

      const result = await callAI(prompt);

      return {
        ...item,
        content: options.format ? result : item.content,
        summary: options.summarize ? result : item.summary,
        translated: options.translate ? result : undefined
      };
    } catch (error) {
      console.error('AI processing failed:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCode = async (item: ClipboardItem) => {
    if (item.type !== 'code') return item;
    return processContent(item, { format: true });
  };

  const summarizeContent = async (item: ClipboardItem) => {
    return processContent(item, { summarize: true });
  };

  const translateContent = async (item: ClipboardItem, targetLanguage: string) => {
    return processContent(item, { translate: true, targetLanguage });
  };

  return {
    isProcessing,
    formatCode,
    summarizeContent,
    translateContent,
    processContent,
    isAvailable: aiProvider.isAvailable,
    error: aiProvider.error
  };
} 