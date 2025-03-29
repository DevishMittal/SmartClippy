import { useState } from 'react';
import type { ClipboardItem } from './use-clipboard-history';
import { useSettings } from '@/lib/hooks/use-settings';
import { useAiProvider } from './use-ai-provider';

interface AIProcessingOptions {
  summarize?: boolean;
  translate?: boolean;
  format?: boolean;
  targetLanguage?: string;
}

export function useClipboardAI() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { settings } = useSettings();
  const aiProvider = useAiProvider(settings);

  const callAI = async (prompt: string): Promise<string> => {
    if (!settings?.aiProviderType || !aiProvider.isAvailable) {
      throw new Error(aiProvider.error || 'AI provider not configured');
    }

    try {
      const baseUrl = settings.aiUrl || 'https://api.openai.com/v1';
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.aiProviderType === 'openai' ? settings.openaiApiKey : settings.user?.token}`,
        },
        body: JSON.stringify({
          model: settings.aiModel || 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: settings.customPrompt || 'You are a helpful AI assistant that processes text based on specific instructions.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: Math.min(settings.aiMaxContextChars || 512000, 1000),
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
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