"use client";

import React from "react";
import {
  Plus,
  MessageSquare,
  Trash2,
  X,
  Menu,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Chat session interface
 */
export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  isOpen: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
  onCollapse: () => void;
}

/**
 * ChatSidebar Component
 *
 * Sidebar for managing multiple chat sessions
 */
export function ChatSidebar({
  sessions,
  activeSessionId,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  isOpen,
  isCollapsed,
  onToggle,
  onCollapse,
}: ChatSidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static z-50 h-full bg-[#0a0f1a] border-r border-blue-900/20 flex flex-col transition-all duration-300 shrink-0 ${
          isOpen ? "translate-x-0 w-60" : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "lg:w-0 lg:border-0 lg:overflow-hidden" : "lg:w-60"}`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-blue-900/20 flex items-center justify-between min-w-[240px]">
          <h2 className="text-sm font-semibold text-slate-300">Chat History</h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onCollapse}
              className="hidden lg:flex h-8 w-8 text-slate-400 hover:text-white"
              title={isCollapsed ? "Show sidebar" : "Hide sidebar"}
            >
              {isCollapsed ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="lg:hidden h-8 w-8 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-3 min-w-[240px]">
          <Button
            onClick={onNewChat}
            className="w-full justify-start gap-2 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 hover:from-blue-600/30 hover:to-indigo-600/30 border border-blue-700/30 text-blue-300"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">
              No chat history yet
            </p>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all ${
                  activeSessionId === session.id
                    ? "bg-blue-600/30 border border-blue-500/40"
                    : "hover:bg-slate-700/50 bg-slate-800/30"
                }`}
                onClick={() => onSelectSession(session.id)}
              >
                <MessageSquare className="h-4 w-4 text-blue-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">
                    {session.title && session.title.trim()
                      ? session.title
                      : "New Chat"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {session.updatedAt
                      ? new Date(session.updatedAt).toLocaleDateString()
                      : "Today"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 hover:bg-red-900/20 shrink-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className={`fixed top-4 left-4 z-30 lg:hidden h-10 w-10 bg-slate-800/80 backdrop-blur-sm border border-blue-900/20 ${
          isOpen ? "hidden" : ""
        }`}
      >
        <Menu className="h-5 w-5 text-slate-300" />
      </Button>
    </>
  );
}
