# n8n AI and LangChain Nodes Reference

This document provides complete JSON structures for n8n AI nodes, particularly for building AI agents, chatbots, and LLM-powered workflows.

---

## AI Agent Node (Tools Agent)

The AI Agent is the core node for building autonomous AI workflows:

```json
{
  "id": "agent-1",
  "name": "AI Agent",
  "type": "@n8n/n8n-nodes-langchain.agent",
  "typeVersion": 2.2,
  "position": [500, 300],
  "parameters": {
    "agent": "toolsAgent",
    "promptType": "define",
    "text": "={{ $json.userMessage }}",
    "options": {
      "systemMessage": "You are a helpful AI assistant. Be concise and accurate."
    }
  }
}
```

---

## Chat Model Nodes

### OpenAI Chat Model

```json
{
  "id": "openai-chat",
  "name": "OpenAI Chat Model",
  "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
  "typeVersion": 1.2,
  "position": [700, 500],
  "parameters": {
    "model": {
      "__rl": true,
      "mode": "list",
      "value": "gpt-4o-mini"
    },
    "options": {
      "temperature": 0.7,
      "maxTokens": 2048
    }
  }
}
```

### OpenAI Direct Node (Message a Model)

For direct LLM calls without agent capabilities:

```json
{
  "id": "openai-direct",
  "name": "Message a model",
  "type": "@n8n/n8n-nodes-langchain.openAi",
  "typeVersion": 1.8,
  "position": [500, 300],
  "parameters": {
    "modelId": {
      "__rl": true,
      "mode": "list",
      "value": "gpt-4o-mini",
      "cachedResultName": "GPT-4O-MINI"
    },
    "messages": {
      "values": [
        {
          "content": "=You are a helpful assistant.\n\nUser request:\n{{ $json.userInput }}\n\nRespond with a clear, helpful answer."
        }
      ]
    },
    "jsonOutput": true,
    "options": {}
  }
}
```

---

## Text Classifier Node

Classify text into categories using AI:

```json
{
  "id": "classifier-1",
  "name": "Text Classifier",
  "type": "@n8n/n8n-nodes-langchain.textClassifier",
  "typeVersion": 1.1,
  "position": [500, 300],
  "parameters": {
    "inputText": "={{ $json.text }}",
    "categories": {
      "categories": [
        {
          "category": "Support",
          "description": "Customer support requests, help tickets, issues"
        },
        {
          "category": "Sales",
          "description": "Sales inquiries, pricing questions, demos"
        },
        {
          "category": "Feedback",
          "description": "Product feedback, suggestions, reviews"
        }
      ]
    },
    "options": {}
  }
}
```

---

## Memory Nodes

### Simple Memory (Buffer Window)

```json
{
  "id": "memory-1",
  "name": "Simple Memory",
  "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
  "typeVersion": 1.3,
  "position": [700, 600],
  "parameters": {
    "sessionKey": "={{ $json.sessionId }}",
    "contextWindowLength": 10
  }
}
```

---

## Tool Nodes

### Custom Code Tool

Create custom tools for AI agents:

```json
{
  "id": "tool-code",
  "name": "Custom Code Tool",
  "type": "@n8n/n8n-nodes-langchain.toolCode",
  "typeVersion": 1.0,
  "position": [700, 400],
  "parameters": {
    "name": "calculator",
    "description": "Performs mathematical calculations. Input should be a math expression.",
    "code": "const result = eval(query);\nreturn `The result is: ${result}`;"
  }
}
```

### Call n8n Workflow Tool

Let AI agents call other workflows:

```json
{
  "id": "tool-workflow",
  "name": "Call Workflow",
  "type": "@n8n/n8n-nodes-langchain.toolWorkflow",
  "typeVersion": 2.0,
  "position": [700, 400],
  "parameters": {
    "name": "search_database",
    "description": "Search the database for user records. Input should be a search query.",
    "workflowId": "workflow-id-here"
  }
}
```

---

## Vector Store Nodes

### Simple Vector Store (In-Memory)

```json
{
  "id": "vectorstore-1",
  "name": "Simple Vector Store",
  "type": "@n8n/n8n-nodes-langchain.vectorStoreInMemory",
  "typeVersion": 1.0,
  "position": [500, 300],
  "parameters": {
    "mode": "insert",
    "memoryKey": "my_documents"
  }
}
```

---

## Embeddings Nodes

### OpenAI Embeddings

```json
{
  "id": "embeddings-1",
  "name": "OpenAI Embeddings",
  "type": "@n8n/n8n-nodes-langchain.embeddingsOpenAi",
  "typeVersion": 1.0,
  "position": [700, 500],
  "parameters": {
    "model": "text-embedding-3-small",
    "options": {}
  }
}
```

---

## Document Loaders

### Default Data Loader

```json
{
  "id": "loader-1",
  "name": "Default Data Loader",
  "type": "@n8n/n8n-nodes-langchain.documentDefaultDataLoader",
  "typeVersion": 1.0,
  "position": [300, 400],
  "parameters": {
    "dataType": "json",
    "options": {
      "metadata": {
        "values": [{ "name": "source", "value": "api" }]
      }
    }
  }
}
```

---

## Complete AI Agent Workflow Example

Here's a complete workflow with an AI agent connected to tools and memory:

```json
{
  "name": "AI Assistant with Tools",
  "nodes": [
    {
      "id": "webhook-trigger",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [250, 300],
      "parameters": {
        "httpMethod": "POST",
        "path": "ai-chat",
        "responseMode": "responseNode"
      },
      "webhookId": "ai-chat-webhook"
    },
    {
      "id": "agent-main",
      "name": "AI Agent",
      "type": "@n8n/n8n-nodes-langchain.agent",
      "typeVersion": 2.2,
      "position": [500, 300],
      "parameters": {
        "agent": "toolsAgent",
        "promptType": "define",
        "text": "={{ $json.body.message }}",
        "options": {
          "systemMessage": "You are a helpful AI assistant. Use the available tools when needed."
        }
      }
    },
    {
      "id": "llm-model",
      "name": "OpenAI Chat Model",
      "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
      "typeVersion": 1.2,
      "position": [700, 500],
      "parameters": {
        "model": { "__rl": true, "mode": "list", "value": "gpt-4o-mini" },
        "options": { "temperature": 0.7 }
      }
    },
    {
      "id": "memory-node",
      "name": "Simple Memory",
      "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
      "typeVersion": 1.3,
      "position": [700, 600],
      "parameters": {
        "sessionKey": "={{ $json.body.sessionId }}",
        "contextWindowLength": 10
      }
    },
    {
      "id": "respond-node",
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.1,
      "position": [750, 300],
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ { response: $json.output } }}"
      }
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{ "node": "AI Agent", "type": "main", "index": 0 }]]
    },
    "AI Agent": {
      "main": [[{ "node": "Respond to Webhook", "type": "main", "index": 0 }]]
    },
    "OpenAI Chat Model": {
      "ai_languageModel": [
        [{ "node": "AI Agent", "type": "ai_languageModel", "index": 0 }]
      ]
    },
    "Simple Memory": {
      "ai_memory": [[{ "node": "AI Agent", "type": "ai_memory", "index": 0 }]]
    }
  }
}
```

---

## Connection Types for AI Nodes

AI nodes use special connection types:

| Connection Type    | Description          | Used By                    |
| ------------------ | -------------------- | -------------------------- |
| `main`             | Standard data flow   | All nodes                  |
| `ai_languageModel` | LLM connection       | Chat models → Agent        |
| `ai_memory`        | Memory connection    | Memory nodes → Agent       |
| `ai_tool`          | Tool connection      | Tool nodes → Agent         |
| `ai_outputParser`  | Output parser        | Parsers → Chains           |
| `ai_retriever`     | Retriever connection | Vector stores → Chains     |
| `ai_document`      | Document connection  | Loaders → Vector stores    |
| `ai_embedding`     | Embedding connection | Embeddings → Vector stores |

Example AI connection:

```json
{
  "connections": {
    "OpenAI Chat Model": {
      "ai_languageModel": [
        [{ "node": "AI Agent", "type": "ai_languageModel", "index": 0 }]
      ]
    }
  }
}
```
