"use client";

import { useChatStore } from "@/store/chatStore";
import { Check, ChevronRight, Edit2, Plus, Trash2, X } from "lucide-react";
import { KeyboardEvent, useEffect, useRef, useState } from "react";

export function ChatNavigator() {
  const {
    sessions,
    currentSessionId,
    createSession,
    loadSession,
    deleteSession,
    renameSession,
  } = useChatStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  const handleEditCommand = (
    e: KeyboardEvent<HTMLInputElement>,
    sessionId: string
  ) => {
    if (e.key === "Enter") {
      if (editingName.trim()) {
        renameSession(sessionId, editingName.trim());
        setEditingId(null);
        setEditingName("");
      }
    } else if (e.key === "Escape") {
      setEditingId(null);
      setEditingName("");
    }
  };

  const startEditing = (session: { id: string; name: string }) => {
    setEditingId(session.id);
    setEditingName(session.name);
  };

  const handleRename = (sessionId: string) => {
    if (editingName.trim()) {
      renameSession(sessionId, editingName.trim());
      setEditingId(null);
      setEditingName("");
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Chats</h2>
        <button
          onClick={() => {
            createSession();
          }}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          title="New Chat"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow--auto">
        <div className="space-y-1 p-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`group flex items-center gap-2 p-2 cursor-pointer transition-color ${
                session.id === currentSessionId
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
              onClick={() => loadSession(session.id)}
            >
              {editingId === session.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => handleEditCommand(e, session.id)}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRename(session.id);
                    }}
                    className="p-1 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(null);
                      setEditingName("");
                    }}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <ChevronRight className="h-4 w-4" />
                  <div className="flex-1 min-w-0">
                    <div className="trucate text-sm">{session.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(session.lastUpdatedAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(session);
                      }}
                      className="p-1 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
