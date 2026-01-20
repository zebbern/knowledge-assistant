"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Loader2,
  Sparkles,
  RefreshCw,
  PanelLeftClose,
  PanelLeft,
  Copy,
  Check,
  Download,
  Pencil,
  RotateCcw,
  X,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatSidebar, type ChatSession } from "@/components/chat-sidebar";
import { CodeBlock } from "@/components/mermaid";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Available AI models from OpenRouter (free tier - verified working)
 */
const AI_MODELS = [
  {
    id: "xiaomi/mimo-v2-flash:free",
    name: "Mimo V2 Flash",
    provider: "Xiaomi",
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct:free",
    name: "Llama 3.3 70B",
    provider: "Meta",
  },
  {
    id: "mistralai/devstral-2512:free",
    name: "Devstral 2",
    provider: "Mistral",
  },
  {
    id: "deepseek/deepseek-r1-0528:free",
    name: "DeepSeek R1",
    provider: "DeepSeek",
  },
  {
    id: "z-ai/glm-4.5-air:free",
    name: "GLM 4.5 Air",
    provider: "Z.AI",
  },
];

const DEFAULT_MODEL = AI_MODELS[0].id;
const MODEL_KEY = "knowledge-ai-model";

/**
 * Message interface for chat history
 */
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

/**
 * LocalStorage keys for persisting chat data
 */
const SESSIONS_KEY = "knowledge-ai-sessions";
const MESSAGES_KEY_PREFIX = "knowledge-ai-messages-";
const ACTIVE_SESSION_KEY = "knowledge-ai-active-session";

/**
 * Quick question suggestions for users
 */
const quickQuestions = [
  { label: "Overview", question: "Give me an overview of your knowledge" },
  { label: "Capabilities", question: "What can you help me with?" },
  {
    label: "Details",
    question: "Tell me more details about your expertise",
  },
];

/**
 * Generate unique ID for messages and sessions
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create welcome message
 */
function createWelcomeMessage(): Message {
  return {
    id: generateId(),
    role: "assistant",
    content:
      "👋 Hello! I'm your Knowledge AI assistant. I can answer questions based on my specialized knowledge base. How can I help you today?",
    timestamp: new Date().toISOString(),
  };
}

/**
 * Load sessions from localStorage
 */
function loadSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(SESSIONS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        // Ensure all sessions have valid structure
        return parsed.map((s) => ({
          id: s.id || generateId(),
          title: s.title && s.title.trim() ? s.title : "New Chat",
          createdAt: s.createdAt || new Date().toISOString(),
          updatedAt: s.updatedAt || new Date().toISOString(),
        }));
      }
    }
  } catch (e) {
    console.error("Error loading sessions:", e);
    // Clear corrupted data
    localStorage.removeItem(SESSIONS_KEY);
  }
  return [];
}

/**
 * Save sessions to localStorage
 */
function saveSessions(sessions: ChatSession[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error("Error saving sessions:", e);
  }
}

/**
 * Load messages for a session
 */
function loadMessages(sessionId: string): Message[] {
  if (typeof window === "undefined") return [createWelcomeMessage()];
  try {
    const stored = localStorage.getItem(MESSAGES_KEY_PREFIX + sessionId);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Error loading messages:", e);
  }
  return [createWelcomeMessage()];
}

/**
 * Save messages for a session
 */
function saveMessages(sessionId: string, messages: Message[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      MESSAGES_KEY_PREFIX + sessionId,
      JSON.stringify(messages),
    );
  } catch (e) {
    console.error("Error saving messages:", e);
  }
}

/**
 * Delete messages for a session
 */
function deleteMessages(sessionId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(MESSAGES_KEY_PREFIX + sessionId);
  } catch (e) {
    console.error("Error deleting messages:", e);
  }
}

/**
 * Get/Set active session ID
 */
function getActiveSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_SESSION_KEY);
}

function setActiveSessionId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (id) localStorage.setItem(ACTIVE_SESSION_KEY, id);
  else localStorage.removeItem(ACTIVE_SESSION_KEY);
}

/**
 * Extract title from messages
 */
function extractTitle(messages: Message[]): string {
  const firstUserMsg = messages.find((m) => m.role === "user");
  if (firstUserMsg) {
    const text = firstUserMsg.content.trim();
    return text.length > 40 ? text.substring(0, 40) + "..." : text;
  }
  return "New Chat";
}

/**
 * ChatInterface Component
 *
 * Main chat interface with:
 * - Multiple chat sessions support
 * - Message history display with markdown rendering
 * - Persistent chat history in localStorage
 * - Input field for user messages
 * - Quick question buttons
 * - Loading states and animations
 */
export function ChatInterface() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([createWelcomeMessage()]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  // Load sessions on mount
  useEffect(() => {
    const loadedSessions = loadSessions();
    const savedActiveId = getActiveSessionId();

    // Load saved model preference
    const savedModel = localStorage.getItem(MODEL_KEY);
    if (savedModel && AI_MODELS.some((m) => m.id === savedModel)) {
      setSelectedModel(savedModel);
    }

    if (loadedSessions.length === 0) {
      const newSession: ChatSession = {
        id: generateId(),
        title: "New Chat",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setSessions([newSession]);
      setActiveSession(newSession.id);
      setActiveSessionId(newSession.id);
      saveSessions([newSession]);
    } else {
      setSessions(loadedSessions);
      const activeId =
        savedActiveId && loadedSessions.find((s) => s.id === savedActiveId)
          ? savedActiveId
          : loadedSessions[0].id;
      setActiveSession(activeId);
      const loadedMessages = loadMessages(activeId);
      setMessages(loadedMessages);
      setShowQuickQuestions(
        loadedMessages.length === 1 && loadedMessages[0].role === "assistant",
      );
    }
    setIsHydrated(true);
  }, []);

  // Save messages when they change
  useEffect(() => {
    if (isHydrated && activeSessionId) {
      saveMessages(activeSessionId, messages);
      const title = extractTitle(messages);
      setSessions((prev) => {
        const updated = prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, title, updatedAt: new Date().toISOString() }
            : s,
        );
        saveSessions(updated);
        return updated;
      });
    }
  }, [messages, isHydrated, activeSessionId]);

  /**
   * Scroll to bottom of messages
   */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /**
   * Auto-resize textarea based on content
   */
  const adjustTextareaHeight = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  /**
   * Handle model selection change
   */
  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem(MODEL_KEY, modelId);
    setModelDropdownOpen(false);
  };

  /**
   * Create new chat session
   */
  const createNewChat = () => {
    const newSession: ChatSession = {
      id: generateId(),
      title: "New Chat",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedSessions = [newSession, ...sessions];
    setSessions(updatedSessions);
    saveSessions(updatedSessions);
    setActiveSession(newSession.id);
    setActiveSessionId(newSession.id);
    setMessages([createWelcomeMessage()]);
    setShowQuickQuestions(true);
    setSidebarOpen(false);
  };

  /**
   * Switch to a different session
   */
  const selectSession = (sessionId: string) => {
    if (sessionId === activeSessionId) return;
    setActiveSession(sessionId);
    setActiveSessionId(sessionId);
    const loadedMessages = loadMessages(sessionId);
    setMessages(loadedMessages);
    setShowQuickQuestions(
      loadedMessages.length === 1 && loadedMessages[0].role === "assistant",
    );
    setSidebarOpen(false);
  };

  /**
   * Delete a session
   */
  const deleteSession = (sessionId: string) => {
    deleteMessages(sessionId);
    const updatedSessions = sessions.filter((s) => s.id !== sessionId);
    setSessions(updatedSessions);
    saveSessions(updatedSessions);
    if (sessionId === activeSessionId) {
      if (updatedSessions.length > 0) selectSession(updatedSessions[0].id);
      else createNewChat();
    }
  };

  /**
   * Send message to API and handle streaming response
   */
  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    setShowQuickQuestions(false);
    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: messageText.trim(),
      timestamp: new Date().toISOString(),
    };

    // Get current messages before adding the new one
    const currentMessages = [...messages, userMessage];

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setStreamingContent("");

    // Create a placeholder message for streaming
    const assistantMessageId = generateId();

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          model: selectedModel,
          messages: currentMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  accumulatedContent += parsed.content;
                  setStreamingContent(accumulatedContent);
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      // Final message with complete content
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: accumulatedContent.trim() || "I couldn't generate a response.",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent("");
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again!",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setStreamingContent("");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  /**
   * Clear current chat
   */
  const clearChat = () => {
    setMessages([createWelcomeMessage()]);
    setShowQuickQuestions(true);
  };

  /**
   * Copy message content to clipboard
   */
  const copyToClipboard = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  /**
   * Export chat as markdown file
   */
  const exportChat = () => {
    const session = sessions.find((s) => s.id === activeSessionId);
    const title = session?.title || "Chat Export";
    const date = new Date().toLocaleDateString();

    let markdown = `# ${title}\n\n`;
    markdown += `*Exported on ${date}*\n\n---\n\n`;

    messages.forEach((msg) => {
      if (msg.role === "user") {
        markdown += `## User\n\n${msg.content}\n\n`;
      } else {
        markdown += `## AI\n\n${msg.content}\n\n`;
      }
    });

    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Start editing a user message
   */
  const startEditing = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  /**
   * Cancel editing
   */
  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditingContent("");
  };

  /**
   * Save edited message and regenerate AI response
   */
  const saveEdit = async (messageId: string) => {
    if (!editingContent.trim() || isLoading) return;

    // Find the index of the message being edited
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1) return;

    // Remove all messages after the edited message (including AI responses)
    const newMessages = messages.slice(0, messageIndex);

    // Add the edited message
    const editedMessage: Message = {
      id: generateId(),
      role: "user",
      content: editingContent.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...newMessages, editedMessage];
    setMessages(updatedMessages);
    setEditingMessageId(null);
    setEditingContent("");
    setIsLoading(true);
    setStreamingContent("");

    // Get new AI response
    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: editingContent.trim(),
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  accumulatedContent += parsed.content;
                  setStreamingContent(accumulatedContent);
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: accumulatedContent.trim() || "I couldn't generate a response.",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent("");
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again!",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setStreamingContent("");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Regenerate AI response for the last user message
   */
  const regenerateResponse = async (afterMessageId: string) => {
    if (isLoading) return;

    // Find the user message to regenerate response for
    const messageIndex = messages.findIndex((m) => m.id === afterMessageId);
    if (messageIndex === -1) return;

    const userMessage = messages[messageIndex];
    if (userMessage.role !== "user") return;

    // Remove the AI response(s) after this user message
    const newMessages = messages.slice(0, messageIndex + 1);
    setMessages(newMessages);
    setIsLoading(true);
    setStreamingContent("");

    // Get new AI response
    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  accumulatedContent += parsed.content;
                  setStreamingContent(accumulatedContent);
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: accumulatedContent.trim() || "I couldn't generate a response.",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent("");
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again!",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setStreamingContent("");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Improve/enhance the current prompt using AI
   */
  const improvePrompt = async () => {
    if (!input.trim() || isImproving || isLoading) return;

    setIsImproving(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Please improve and enhance this prompt to be clearer, more specific, and more effective. Only return the improved prompt itself, nothing else - no explanations, no quotes, just the improved prompt text:\n\n${input}`,
        }),
      });

      const data = await response.json();
      if (response.ok && data.response) {
        setInput(data.response.trim());
        inputRef.current?.focus();
      }
    } catch (error) {
      console.error("Error improving prompt:", error);
    } finally {
      setIsImproving(false);
    }
  };

  return (
    <div className="flex h-full w-full">
      {/* Sidebar */}
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewChat={createNewChat}
        onSelectSession={selectSession}
        onDeleteSession={deleteSession}
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar with Model Selector */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-blue-900/10">
          <div className="flex items-center gap-2">
            {sidebarCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(false)}
                className="hidden lg:flex h-8 w-8 text-slate-400 hover:text-white"
                title="Show sidebar"
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Model Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium glass-card hover:bg-blue-900/30 border-blue-700/30 hover:border-blue-600/50 rounded-lg text-slate-300 transition-all"
            >
              <span className="text-slate-500">Model:</span>
              <span className="text-blue-300">
                {AI_MODELS.find((m) => m.id === selectedModel)?.name ||
                  "Select"}
              </span>
              <ChevronDown
                className={`h-3 w-3 transition-transform ${modelDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {modelDropdownOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setModelDropdownOpen(false)}
                />
                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full mt-1 z-50 min-w-[200px] glass-card rounded-lg border border-blue-700/30 shadow-xl overflow-hidden">
                  {AI_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => handleModelChange(model.id)}
                      className={`w-full px-3 py-2 text-left text-xs hover:bg-blue-900/30 transition-colors flex items-center justify-between ${
                        selectedModel === model.id
                          ? "bg-blue-900/20 text-blue-300"
                          : "text-slate-300"
                      }`}
                    >
                      <span>{model.name}</span>
                      <span className="text-slate-500 text-[10px]">
                        {model.provider}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((msg, index) => (
            <div key={msg.id} className="animate-fadeIn">
              {msg.role === "assistant" ? (
                <div className="max-w-3xl mx-auto group">
                  {/* AI Label */}
                  <p className="text-xs text-blue-400 font-medium mb-0.5 ml-1">
                    AI
                  </p>
                  {/* Message Bubble */}
                  <div className="glass-card rounded-2xl px-4 py-3 text-slate-200 text-sm leading-relaxed prose prose-invert prose-sm max-w-none prose-headings:text-slate-100 prose-p:text-slate-200 prose-strong:text-white prose-code:text-blue-300 prose-code:bg-blue-950/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-transparent prose-pre:border-0 prose-pre:p-0 prose-a:text-blue-400 prose-ul:text-slate-200 prose-ol:text-slate-200 prose-li:text-slate-200 relative">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code: CodeBlock as any,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                    {/* Copy Button */}
                    <button
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                      title="Copy message"
                    >
                      {copiedId === msg.id ? (
                        <Check className="h-3.5 w-3.5 text-green-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Quick Questions - Show after first message */}
                  {index === 0 &&
                    showQuickQuestions &&
                    messages.length === 1 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {quickQuestions.map((q) => (
                          <button
                            key={q.label}
                            onClick={() => sendMessage(q.question)}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium glass-card hover:bg-blue-900/30 border-blue-700/30 hover:border-blue-600/50 rounded-xl text-blue-300 transition-all disabled:opacity-50 flex items-center gap-2"
                          >
                            {q.label}
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              ) : (
                <div className="max-w-3xl mx-auto group">
                  {/* User Label */}
                  <p className="text-xs text-slate-400 font-medium mb-0.5 ml-1">
                    User
                  </p>
                  {/* Message Bubble - Edit Mode */}
                  {editingMessageId === msg.id ? (
                    <div className="max-w-[80%]">
                      <textarea
                        ref={editInputRef}
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className="w-full bg-slate-800/60 border border-blue-500/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                        rows={3}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={cancelEditing}
                          className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-all flex items-center gap-1"
                        >
                          <X className="h-3 w-3" /> Cancel
                        </button>
                        <button
                          onClick={() => saveEdit(msg.id)}
                          disabled={!editingContent.trim() || isLoading}
                          className="px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all disabled:opacity-50 flex items-center gap-1"
                        >
                          <Send className="h-3 w-3" /> Save & Send
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/30 rounded-2xl px-4 py-3 text-sm max-w-[80%] leading-relaxed text-slate-300 inline-block break-all">
                      {msg.content}
                    </div>
                  )}
                  {/* Action Buttons - Below message, icon-only, doesn't take space when hidden */}
                  {!editingMessageId && (
                    <div className="h-0 flex gap-1 opacity-0 group-hover:opacity-100 group-hover:h-auto group-hover:mt-1 transition-all overflow-visible">
                      <button
                        onClick={() => startEditing(msg.id, msg.content)}
                        className="p-1.5 rounded-lg bg-slate-800/30 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-all"
                        title="Edit message"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="p-1.5 rounded-lg bg-slate-800/30 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-all"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? (
                          <Check className="h-3.5 w-3.5 text-green-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                      {/* Regenerate - Show if next message is AI */}
                      {index < messages.length - 1 &&
                        messages[index + 1]?.role === "assistant" && (
                          <button
                            onClick={() => regenerateResponse(msg.id)}
                            disabled={isLoading}
                            className="p-1.5 rounded-lg bg-slate-800/30 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-all disabled:opacity-50"
                            title="Regenerate AI response"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Streaming Content Display */}
          {isLoading && streamingContent && (
            <div className="max-w-3xl mx-auto animate-fadeIn">
              <p className="text-xs text-blue-400 font-medium mb-0.5 ml-1">
                AI
              </p>
              <div className="glass-card rounded-2xl px-4 py-3 text-slate-200 text-sm leading-relaxed prose prose-invert prose-sm max-w-none prose-headings:text-slate-100 prose-p:text-slate-200 prose-strong:text-white prose-code:text-blue-300 prose-code:bg-blue-950/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-transparent prose-pre:border-0 prose-pre:p-0 prose-a:text-blue-400 prose-ul:text-slate-200 prose-ol:text-slate-200 prose-li:text-slate-200">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code: CodeBlock as any,
                  }}
                >
                  {streamingContent}
                </ReactMarkdown>
                <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-0.5" />
              </div>
            </div>
          )}

          {/* Loading Indicator (when no streaming content yet) */}
          {isLoading && !streamingContent && (
            <div className="max-w-3xl mx-auto animate-fadeIn">
              <p className="text-xs text-blue-400 font-medium mb-0.5 ml-1">
                AI
              </p>
              <div className="glass-card rounded-2xl px-4 py-4 inline-block">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - Blended with background */}
        <div className="px-4 py-4">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="flex items-center gap-3">
              {/* Clear Chat Button */}
              <Button
                type="button"
                onClick={clearChat}
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-xl bg-slate-800/30 hover:bg-blue-900/30 text-slate-400 hover:text-slate-200 shrink-0 border-0"
                title="Clear chat"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>

              {/* Export Chat Button */}
              <Button
                type="button"
                onClick={exportChat}
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-xl bg-slate-800/30 hover:bg-blue-900/30 text-slate-400 hover:text-slate-200 shrink-0 border-0"
                title="Export chat as markdown"
                disabled={messages.length <= 1}
              >
                <Download className="h-4 w-4" />
              </Button>

              {/* Input Field */}
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  rows={1}
                  className="w-full bg-slate-800/40 backdrop-blur-sm border-0 focus:ring-2 focus:ring-blue-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all resize-none pr-12"
                  disabled={isLoading || isImproving}
                />
                <button
                  type="button"
                  onClick={improvePrompt}
                  disabled={!input.trim() || isLoading || isImproving}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-400 disabled:text-slate-700 disabled:cursor-not-allowed transition-colors"
                  title="Improve prompt with AI"
                >
                  {isImproving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Send Button */}
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                size="icon"
                className="h-10 w-10 rounded-xl bg-slate-800/50 hover:bg-blue-900/30 text-slate-400 hover:text-slate-200 disabled:opacity-50 shrink-0 transition-all border-0"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>

            <p className="text-xs text-slate-600 mt-3 text-center">
              Press{" "}
              <kbd className="px-1.5 py-0.5 bg-slate-800/30 rounded text-slate-400">
                Enter
              </kbd>{" "}
              to send •{" "}
              <kbd className="px-1.5 py-0.5 bg-slate-800/30 rounded text-slate-400">
                Shift + Enter
              </kbd>{" "}
              for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
