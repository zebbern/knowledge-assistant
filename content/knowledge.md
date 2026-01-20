---
name: Knowledge AI
description: Free chat agent powered by your knowledge files. Build domain-specific AI assistants or interactive project docs.
metadata:
  author: zebbern
  version: "1.2"
  repo: https://github.com/zebbern/knowledge-assistant
---

## About Knowledge AI

Knowledge AI is a free, file-based chat agent that answers questions from your custom knowledge files. It provides a clean Next.js chat interface that reads markdown files from a `content/` folder and uses them as context for AI responses.

### Key Features

- **Streaming Responses** - Real-time token-by-token output
- **Knowledge-Based Context** - AI grounded in your documentation
- **Markdown Rendering** - Full markdown with syntax highlighting
- **Mermaid Diagrams** - Live diagram rendering in chat
- **Code Blocks** - Syntax-highlighted with copy functionality
- **JSON Handling** - Collapsible JSON blocks for workflows
- **Persistent Sessions** - Conversations stored in local storage

### Use Cases

1. **Domain-Specific Assistants** - Create specialized AI for any topic
2. **Project Documentation** - Let users query your GitHub repos
3. **Internal Knowledge Bases** - Company wikis and procedures
4. **Learning Tools** - Educational content with interactive Q&A

### How It Works

1. You add markdown files to the `content/` folder
2. The API reads all `.md` and `.txt` files at request time
3. Content is sent as context to OpenRouter
4. AI responds based on your knowledge files

### Getting Started

1. Clone the repository
2. Add your OpenRouter API key to `.env.local`
3. Replace this file with your own content
4. Run `npm run dev` and start chatting

### Technical Stack

- Next.js 15 with App Router
- OpenRouter API (free models available)
- TypeScript
- Tailwind CSS
- Mermaid for diagrams

### Customization

- **Add knowledge files**: Drop `.md` or `.txt` files in `content/`
- **Change the model**: Edit `route.ts` to use different OpenRouter models
- **Adjust max tokens**: Modify the API configuration as needed
- **Style the interface**: Customize via Tailwind CSS

### Support

Open an issue on GitHub: https://github.com/zebbern/knowledge-assistant
