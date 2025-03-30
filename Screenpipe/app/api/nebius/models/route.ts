import { NextResponse } from 'next/server';

const DEFAULT_MODELS = [
  // Meta Llama 3.1 Models
  { id: 'meta-llama/Meta-Llama-3.1-70B-Instruct', name: 'Meta-Llama 3.1 70B Instruct' },
  { id: 'meta-llama/Meta-Llama-3.1-34B-Instruct', name: 'Meta-Llama 3.1 34B Instruct' },
  { id: 'meta-llama/Meta-Llama-3.1-8B-Instruct', name: 'Meta-Llama 3.1 8B Instruct' },
  
  // Meta Llama 2 Models
  { id: 'meta-llama/Llama-2-70b-chat-hf', name: 'Llama 2 70B Chat' },
  { id: 'meta-llama/Llama-2-13b-chat-hf', name: 'Llama 2 13B Chat' },
  { id: 'meta-llama/Llama-2-7b-chat-hf', name: 'Llama 2 7B Chat' },
  
  // Mistral Models
  { id: 'mistralai/Mistral-7B-Instruct-v0.2', name: 'Mistral 7B Instruct v0.2' },
  { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', name: 'Mixtral 8x7B Instruct v0.1' },
  
  // Yi Models
  { id: '01-ai/Yi-34B-Chat', name: 'Yi 34B Chat' },
  { id: '01-ai/Yi-6B-Chat', name: 'Yi 6B Chat' },
  
  // Qwen Models
  { id: 'Qwen/Qwen1.5-72B-Chat', name: 'Qwen 1.5 72B Chat' },
  { id: 'Qwen/Qwen1.5-14B-Chat', name: 'Qwen 1.5 14B Chat' },
  { id: 'Qwen/Qwen1.5-7B-Chat', name: 'Qwen 1.5 7B Chat' },
  
  // Gemma Models
  { id: 'google/gemma-7b-it', name: 'Gemma 7B Instruct' },
  { id: 'google/gemma-2b-it', name: 'Gemma 2B Instruct' }
];

export async function GET(request: Request) {
  try {
    const response = await fetch('https://api.studio.nebius.com/v1/models/models', {
      method: 'GET',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Return default models if API call fails
      return NextResponse.json({ models: DEFAULT_MODELS }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const data = await response.json();
    
    // Transform the response to match our expected format
    const models = data.models?.map((model: any) => ({
      id: model.id || model.model,
      name: model.name || model.id || model.model,
      version: model.version
    })) || DEFAULT_MODELS;

    return NextResponse.json({ models }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Error fetching Nebius models:', error);
    // Return default models in case of error
    return NextResponse.json(
      { models: DEFAULT_MODELS },
      { 
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 