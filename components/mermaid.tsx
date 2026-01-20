"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Maximize2, X, RotateCcw, Code, Eye } from "lucide-react";
import { createPortal } from "react-dom";

/**
 * Simple JSON syntax highlighter that returns styled HTML
 */
function highlightJSON(json: string): string {
  // Escape HTML first
  const escaped = json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Apply syntax highlighting with colors
  return (
    escaped
      // Strings (including keys) - pink/magenta for values
      .replace(
        /("(?:[^"\\]|\\.)*")\s*:/g,
        '<span style="color: #7dd3fc;">$1</span>:', // Light blue for keys
      )
      .replace(
        /:\s*("(?:[^"\\]|\\.)*")/g,
        ': <span style="color: #f472b6;">$1</span>', // Pink for string values
      )
      // Numbers - blue
      .replace(
        /:\s*(-?\d+\.?\d*)/g,
        ': <span style="color: #60a5fa;">$1</span>',
      )
      // Booleans and null - purple
      .replace(
        /:\s*(true|false|null)/g,
        ': <span style="color: #c084fc;">$1</span>',
      )
      // Brackets and braces - white/gray
      .replace(/([{}\[\]])/g, '<span style="color: #94a3b8;">$1</span>')
  );
}

interface MermaidProps {
  chart: string;
}

export function Mermaid({ chart }: MermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  // Copy chart code to clipboard
  const handleCopyChart = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await navigator.clipboard.writeText(chart);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Portal mount check
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const renderChart = async () => {
      if (!chart.trim()) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Dynamically import mermaid to avoid SSR issues
        const mermaid = (await import("mermaid")).default;

        // Initialize with dark theme - suppress error popups
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          themeVariables: {
            primaryColor: "#3b82f6",
            primaryTextColor: "#e2e8f0",
            primaryBorderColor: "#1e40af",
            lineColor: "#64748b",
            secondaryColor: "#1e293b",
            tertiaryColor: "#0f172a",
          },
          securityLevel: "loose",
          suppressErrorRendering: true,
        });

        // Generate unique ID
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Parse first to catch errors
        await mermaid.parse(chart.trim());

        // Render
        const { svg: renderedSvg } = await mermaid.render(id, chart.trim());

        if (!cancelled) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (err: any) {
        console.error("Mermaid error:", err);
        if (!cancelled) {
          // Extract meaningful error message
          let message = "Failed to render diagram";
          if (err?.message) {
            message = err.message;
          } else if (err?.str) {
            message = err.str;
          }
          setError(message);
          setSvg("");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    const timer = setTimeout(renderChart, 50);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [chart]);

  // Close fullscreen on escape and reset position
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFullscreen(false);
        setZoom(100);
        setPosition({ x: 0, y: 0 });
      }
    };
    if (isFullscreen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -10 : 10;
    setZoom((z) => Math.min(Math.max(z + delta, 25), 300));
  }, []);

  // Mouse drag handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 0) {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
      }
    },
    [position],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    },
    [isDragging, dragStart],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleReset = () => {
    setZoom(100);
    setPosition({ x: 0, y: 0 });
  };

  const handleClose = () => {
    setIsFullscreen(false);
    setZoom(100);
    setPosition({ x: 0, y: 0 });
  };

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
        <p className="font-medium mb-1">Diagram Error</p>
        <pre className="text-xs text-slate-400 overflow-x-auto whitespace-pre-wrap">
          {chart}
        </pre>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 rounded-lg p-4 flex items-center justify-center gap-2">
        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-400 text-sm">Rendering diagram...</span>
      </div>
    );
  }

  if (!svg) {
    return (
      <pre className="bg-slate-800/50 rounded-lg p-3 text-xs text-slate-400 overflow-x-auto">
        {chart}
      </pre>
    );
  }

  return (
    <>
      {/* Compact view with header bar like JSON */}
      <div className="relative group my-2">
        {/* Header bar with buttons */}
        <div className="flex items-center justify-between bg-white/5 px-3 py-1.5 rounded-t-lg border-b border-white/10">
          <span className="text-xs text-white/50 font-mono">Mermaid</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
            >
              {showRaw ? (
                <>
                  <Eye className="w-3 h-3" />
                  Diagram
                </>
              ) : (
                <>
                  <Code className="w-3 h-3" />
                  Raw
                </>
              )}
            </button>
            <button
              onClick={handleCopyChart}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
              title="Copy mermaid code"
            >
              {copied ? (
                <>
                  <svg
                    className="w-3 h-3 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy
                </>
              )}
            </button>
            {!showRaw && (
              <button
                onClick={() => setIsFullscreen(true)}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                title="Fullscreen"
              >
                <Maximize2 className="w-3 h-3" />
                Fullscreen
              </button>
            )}
          </div>
        </div>
        {/* Content */}
        {showRaw ? (
          <div className="overflow-auto rounded-b-lg bg-slate-950/50 max-h-[300px]">
            <pre className="p-4 m-0 bg-transparent text-sm font-mono leading-relaxed text-slate-300 whitespace-pre-wrap">
              {chart}
            </pre>
          </div>
        ) : (
          <div
            className="overflow-hidden rounded-b-lg bg-slate-950/50 flex justify-center p-4 cursor-pointer"
            onClick={() => setIsFullscreen(true)}
            style={{ transform: "scale(0.85)", transformOrigin: "center top" }}
          >
            <div
              ref={containerRef}
              className="mermaid-container"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>
        )}
      </div>

      {/* Fullscreen modal - using portal to render at document root */}
      {isFullscreen &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex flex-col"
            style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
          >
            {/* Controls */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/80">
              <div className="flex items-center gap-4">
                {!showRaw && (
                  <>
                    <span className="text-slate-400 text-sm">
                      Zoom: {zoom}% | Scroll to zoom, drag to pan
                    </span>
                    <button
                      onClick={handleReset}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all flex items-center gap-2 text-sm"
                      title="Reset view"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reset
                    </button>
                  </>
                )}
                {showRaw && (
                  <span className="text-slate-400 text-sm">
                    Raw Mermaid Code
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowRaw(!showRaw)}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 text-sm ${
                    showRaw
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                  }`}
                  title={showRaw ? "Show diagram" : "Show raw code"}
                >
                  {showRaw ? (
                    <Eye className="h-3.5 w-3.5" />
                  ) : (
                    <Code className="h-3.5 w-3.5" />
                  )}
                  {showRaw ? "Diagram" : "Raw"}
                </button>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                  title="Close (Esc)"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            {/* Content area */}
            {showRaw ? (
              <div className="flex-1 overflow-auto p-8">
                <pre className="bg-slate-900/50 rounded-lg p-6 text-sm text-slate-300 font-mono whitespace-pre-wrap max-w-4xl mx-auto">
                  {chart}
                </pre>
              </div>
            ) : (
              <div
                className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${zoom / 100})`,
                    transition: isDragging ? "none" : "transform 0.1s ease-out",
                  }}
                >
                  <div
                    className="mermaid-fullscreen"
                    dangerouslySetInnerHTML={{ __html: svg }}
                  />
                </div>
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

/**
 * Code block component that handles mermaid diagrams and JSON with copy
 */
interface CodeBlockProps {
  className?: string;
  children?: React.ReactNode;
}

export function CodeBlock({ className, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";

  // Get the code content
  const code = String(children).replace(/\n$/, "");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // If it's a mermaid code block, render the diagram
  if (language === "mermaid") {
    return <Mermaid chart={code} />;
  }

  // If it's JSON, render with copy button and expand/collapse
  if (language === "json") {
    const lineCount = code.split("\n").length;
    const isLongCode = lineCount > 10;

    return (
      <div className="relative group my-2">
        {/* Header bar with buttons */}
        <div className="flex items-center justify-between bg-white/5 px-3 py-1.5 rounded-t-lg border-b border-white/10">
          <span className="text-xs text-white/50 font-mono">JSON</span>
          <div className="flex items-center gap-2">
            {isLongCode && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
              >
                {expanded ? (
                  <>
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                    Collapse
                  </>
                ) : (
                  <>
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                    Expand ({lineCount} lines)
                  </>
                )}
              </button>
            )}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
              title="Copy JSON"
            >
              {copied ? (
                <>
                  <svg
                    className="w-3 h-3 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
        {/* Code content with syntax highlighting */}
        <div
          className={`overflow-auto rounded-b-lg bg-slate-950/50 ${
            !expanded && isLongCode ? "max-h-[200px]" : "max-h-[600px]"
          } transition-all duration-300`}
        >
          <pre className="p-4 m-0 bg-transparent text-sm font-mono leading-relaxed">
            <code
              className="block"
              dangerouslySetInnerHTML={{ __html: highlightJSON(code) }}
            />
          </pre>
        </div>
      </div>
    );
  }

  // Otherwise, render as a regular code block
  return <code className={className}>{children}</code>;
}
