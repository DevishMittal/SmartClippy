# Smart-Clippy: AI-Powered Clipboard Manager

Smart-Clippy is an intelligent clipboard manager that enhances your clipboard experience with AI-powered features. Built as a Screenpipe plugin, it provides seamless integration with your workflow and offers advanced text processing capabilities.

## Features

- 🎨 Beautiful, modern UI with light/dark mode support
- 🤖 AI-powered text processing:
  - Text summarization
  - Language translation
  - Code formatting
- 📋 Clipboard history management
- 🔍 Real-time search functionality
- ⚡ Multiple AI provider support (Ollama & Nebius)
- 🎯 Model selection for different tasks
- 🔒 Secure API key management
- 🌈 Responsive and animated UI components

## Tech Stack

- **Framework**: Next.js 15
- **UI Components**: Radix UI + Tailwind CSS
- **Styling**: TailwindCSS with custom animations
- **State Management**: React Hooks + Local Storage
- **Animations**: Framer Motion
- **AI Integration**: Ollama & Nebius API
- **Development**: TypeScript, ESLint

## Getting Started

### Prerequisites

- Node.js 18+ or Bun runtime
- Screenpipe CLI installed
- (Optional) Ollama or Nebius API key for AI features

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd screenpipe
```

2. Install dependencies:
```bash
bun install
# or
npm install
```
3. Start Screenpipe:



4. Run the development server:
```bash
bun dev
# or
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## AI Provider Setup

### Using Ollama

1. Install Ollama:
```bash
# macOS or Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows
# Download from https://ollama.com/download
```

2. Start the Ollama service:
```bash
ollama serve
```

3. Pull the required models:
```bash
ollama pull qwen2.5
```

4. In Smart-Clippy:
   - Select "Ollama" as your AI provider
   - Choose your preferred model from the dropdown
   - No API key required as Ollama runs locally

### Using Nebius

1. Sign up for a Nebius account at [https://nebius.ai](https://nebius.ai)

2. Get your API key:
   - Go to your Nebius dashboard
   - Navigate to API Keys section
   - Create a new API key
   - Copy the key

3. In Smart-Clippy:
   - Select "Nebius" as your AI provider
   - Paste your API key in the settings
   - Choose your preferred model from the dropdown

### Using AI Features

1. **Text Summarization**:
   - Copy any text to your clipboard
   - Select the text from the clipboard history
   - Click the "Summarize" button
   - The AI will generate a concise summary

2. **Language Translation**:
   - Copy text in any language
   - Select the text from the clipboard history
   - Click the "Translate" button
   - The AI will translate the text to English

3. **Code Formatting**:
   - Copy code snippets
   - Select the code from the clipboard history
   - The AI will automatically detect and format the code
   - Syntax highlighting will be applied based on the language

### Tips

- For best results with code formatting, use Ollama with the Qwen2.5 model
- Nebius provides better performance for language translation tasks
- You can switch between providers at any time
- Clear your clipboard history regularly for better performance
- Use the search function to quickly find past clipboard items

### Project Structure

```
screenpipe/
├── app/                # Next.js app directory
├── components/         # React components
│   ├── ui/            # Reusable UI components
│   └── ...            # Feature components
├── hooks/             # Custom React hooks
├── lib/               # Utility functions
├── public/            # Static assets
└── ...
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## Acknowledgments

- Built with [Screenpipe](https://docs.screenpi.pe)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)