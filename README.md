<div align="center">

## Knowledge-Assistant

#### A free, file-based chat agent that answers questions from your custom knowledge files. Ideal for building domain-specific AI assistants or interactive documentation for GitHub projects, allowing users to query your codebase through natural conversation.

<img width="400" height="400" alt="image" src="https://github.com/user-attachments/assets/eed43d7b-1406-45f2-a5e9-3fab43dd76f2" />
<img width="400" height="400" alt="image" src="https://github.com/user-attachments/assets/f99bead4-f62a-4b5b-bdb0-c196d15beaee" />

</div>

Knowledge AI loads markdown files from a `content/` directory and uses them as context for AI responses. This approach provides accurate, domain-specific answers without the complexity of vector databases or embeddings.

```mermaid
flowchart LR
    subgraph Client
        A[Chat Interface]
    end

    subgraph Server
        B[Next.js API]
        C[Knowledge Loader]
        D[OpenRouter API]
    end

    subgraph Knowledge
        E[content/*.md]
    end

    A -->|User Message| B
    B --> C
    C -->|Read Files| E
    C -->|Context + Message| D
    D -->|Streaming Response| B
    B -->|SSE Stream| A
```

## Quick Start

### Prerequisites

- Node.js 18+
- OpenRouter API key ([get one free](https://openrouter.ai))

### Installation

```bash
cd knowledge-assistance
npm install
cp .env.example .env.local
```

Edit `.env.local` with your API key:

```env
OPENROUTER_API_KEY=your_api_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Running

```bash
npm run dev       # Development
npm run build     # Production build
npm start         # Start production server
```

Access the application at `http://localhost:3000`

## Architecture

```mermaid
graph TB
    subgraph Frontend
        UI[React Chat UI]
        MD[Markdown Renderer]
        MM[Mermaid Component]
        CB[Code Block Component]
    end

    subgraph API_Layer[API Layer]
        STREAM[Stream Endpoint]
        CHAT[Chat Endpoint]
    end

    subgraph Knowledge_System[Knowledge System]
        LOADER[File Loader]
        CONTENT[Content Files]
    end

    subgraph External
        OR[OpenRouter API]
    end

    UI --> STREAM
    STREAM --> LOADER
    LOADER --> CONTENT
    STREAM --> OR
    OR --> UI
    UI --> MD
    MD --> MM
    MD --> CB
```

## Knowledge System

Add knowledge by placing markdown files in the `content/` directory:

```
content/
  knowledge.md           # General domain knowledge
  n8n-workflow-guide.md  # n8n workflow JSON reference
  n8n-ai-nodes.md        # AI/LangChain node examples
  n8n-patterns.md        # Common workflow patterns
  mermaid-syntax.md      # Mermaid diagram reference
```

The AI reads all `.md` and `.txt` files at request time and uses them as context for responses.

### Knowledge File Structure

Each knowledge file should be focused on a specific topic:

```markdown
# Topic Title

Brief overview of the topic.

## Section 1

Detailed information with examples.

## Section 2

Code examples in fenced blocks.
```

## Project Structure

```
knowledge-assistance/
  app/
    api/
      chat/
        route.ts          # Non-streaming endpoint
        stream/
          route.ts        # Streaming endpoint
    layout.tsx
    page.tsx
    globals.css
  components/
    chat.tsx              # Main chat interface
    mermaid.tsx           # Mermaid and code block rendering
    ui/                   # Shadcn UI components
  content/                # Knowledge files
  lib/
    utils.ts
```

## API Endpoints

### POST /api/chat/stream

Streaming chat endpoint using Server-Sent Events.

**Request:**

```json
{
  "message": "User message",
  "messages": [
    { "role": "user", "content": "Previous message" },
    { "role": "assistant", "content": "Previous response" }
  ]
}
```

**Response:** SSE stream with chunked content

### POST /api/chat

Non-streaming chat endpoint.

**Request:** Same as streaming endpoint

**Response:**

```json
{
  "response": "Complete AI response"
}
```

## Configuration

### Model Selection

The default model can be changed in `app/api/chat/stream/route.ts`:

```typescript
model: "xiaomi/mimo-v2-flash:free", // or any OpenRouter model
```

### Token Limits

Adjust response length:

```typescript
max_tokens: 4096,
```

## Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Chat UI
    participant API Route
    participant Knowledge Loader
    participant OpenRouter

    User->>Chat UI: Send message
    Chat UI->>API Route: POST /api/chat/stream
    API Route->>Knowledge Loader: getKnowledge()
    Knowledge Loader->>Knowledge Loader: Read content/*.md
    Knowledge Loader-->>API Route: Knowledge context
    API Route->>OpenRouter: Stream request
    loop Streaming
        OpenRouter-->>API Route: Token chunk
        API Route-->>Chat UI: SSE event
        Chat UI-->>User: Render token
    end
```
