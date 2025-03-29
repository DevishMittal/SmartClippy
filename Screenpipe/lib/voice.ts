// lib/voice.ts
'use server'

import { screenpipe } from "@screenpipe/sdk";

// Initialize Screenpipe client (assumes Screenpipe is running locally)
const pipe = screenpipe({ apiKey: "optional-if-required" });

export async function streamVoiceCommands(callback: (text: string) => void) {
  try {
    // Stream transcriptions from Screenpipe
    pipe.streamTranscriptions((transcription) => {
      const text = transcription.text;
      if (text) {
        callback(text.toLowerCase()); // Normalize to lowercase for easier matching
      }
    });
  } catch (error) {
    console.error("Error streaming voice:", error);
    throw error;
  }
}