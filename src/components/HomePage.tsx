"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot,
  ChevronLeft,
  Command,
  Keyboard,
  Menu,
  Trash2,
} from "lucide-react";
import { useChatStore } from "@/store/chatStore";
import { CommandMenu } from "./CommadMenu";
import { ChatNavigator } from "./ChatNavigator";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";

const reasoningStates = [
  "Initializing connection...",
  "Processing input...",
  "Computing response...",
  "Generating output...",
  "Formatting response...",
];

const TypingIndicator = () => {
  const [reasoningIndex, setReasoningIndex] = useState(0);
  const [dots, setDots] = useState("");

  useEffect(() => {
    const reasoningInterval = setInterval(() => {
      setReasoningIndex((prev) => (prev + 1) % reasoningStates.length);
    }, 2000);

    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    return () => {
      clearInterval(reasoningInterval);
      clearInterval(dotsInterval);
    };
  }, []);

  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center text-primary">
        <Bot className="h-5 w-5" />
      </div>
      <div className="flex-1 font-mono">
        <div className="terminal-prompt text-muted-foreground">
          {reasoningStates[reasoningIndex]}
          {dots}
        </div>
      </div>
    </div>
  );
};

const HomePage = () => {
  const {
    messages,
    isLoading,
    setLoading,
    currentSessionId,
    createSession,
    addMessage,
    deleteAllSessions,
  } = useChatStore();

  const [mounted, setMounted] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("groq");
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCommandMenu, setShowCommandMenu] = useState(false);

  const shortcuts = [
    { label: "Command Menu", keys: "Ctrl + K" },
    { label: "Toggle Sidebar", keys: "Ctrl + /" },
    { label: "Close Sidebar", keys: "Esc" },
    { label: "Send Message", keys: "Enter" },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !currentSessionId) {
      createSession();
    }
  }, [currentSessionId, createSession, mounted]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isLoading) {
      scrollToBottom();
    }
  }, [isLoading]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      if (newWidth > 160 && newWidth < 480) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage = {
      content,
      role: "user" as const,
    };

    try {
      addMessage(userMessage);
      setLoading(true);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(({ content, role }) => ({
            content,
            role,
          })),
          model: selectedModel,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get response");
      }

      const data = await res.json();

      if (!data.content) {
        throw new Error("Invalid response format from API");
      }

      const assistantMessage = {
        content: data.content.replace(/\*/g, ""),
        role: "assistant" as const,
      };

      addMessage(assistantMessage);
    } catch (error) {
      console.error("Error: ", error);
      addMessage({
        content:
          error instanceof Error
            ? error.message
            : "Sorry, I encountered an error. Please try again.",
        role: "assistant" as const,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        setIsSidebarCollapsed(!isSidebarCollapsed);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandMenu(true);
      }
      if (e.key === "Escape" && !isSidebarCollapsed) {
        setIsSidebarCollapsed(true);
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isSidebarCollapsed]);

  const ShortcutsDialog = () => (
    <div
      className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-50 ${
        showShortcuts ? "flex" : "hidden"
      }`}
    >
      <div className="fixed left-[56%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-card text-muted-foreground p-6 shadow-lg duration-200 sm:rounded-lg">
        <div className="flex flex-col space-y-2">
          <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
          <div className="grid gap-2">
            {shortcuts.map((shortcut, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-sm"
              >
                <span>{shortcut.label}</span>
                <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded">
                  {shortcut.keys}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => setShowShortcuts(false)}
            className="px-3 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 hover:cursor-pointer rounded-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  const DeleteConfirmDialog = () => (
    <div
      className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-50 ${
        showDeleteConfirm ? "flex" : "hidden"
      }`}
    >
      <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
        <div className="flex flex-col space-y-2">
          <h2 className="text-lg font-semibold text-destructive">
            Delete All Chats
          </h2>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete all chats? This action cannot be
            undone.
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="px-3 py-2 text-sm hover:bg-muted hover:cursor-pointer rounded-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              deleteAllSessions();
              setShowDeleteConfirm(false);
            }}
            className="px-3 py-2 text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:cursor-pointer rounded-sm"
          >
            Delete All
          </button>
        </div>
      </div>
    </div>
  );

  const handleNewChat = () => {
    createSession();
  };

  if (!mounted) {
    return (
      <div className="flex h-full">
        <div className="w-80 border-r border-border">
          <div className="animate-pulse bg-card h-full" />
        </div>
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-black">
          <div className="terminal-header flex items-center justify-between px-3 py-1 bg-muted/10 border-b border-border/20">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-chart-2/70"></div>
                <div className="h-2.5 w-2.5 rounded-full bg-primary/70"></div>
                <div className="h-2.5 w-2.5 rounded-full bg-ring/70"></div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>dev@neonyx:</span>
              <span className="text-primary">$</span>
            </div>
            <div className="w-8"></div>
          </div>

          <div className="flex-1 overflow-hidden">
            <div className="animate-pulse bg-muted/5 h-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden">
      <DeleteConfirmDialog />
      <ShortcutsDialog />
      <CommandMenu
        open={showCommandMenu}
        onOpenChange={setShowCommandMenu}
        onCreateNewChat={handleNewChat}
        onShowShortcuts={() => setShowShortcuts(true)}
        onDeleteAllChats={() => setShowDeleteConfirm(true)}
      />
      <div className="flex h-full">
        <div
          ref={sidebarRef}
          style={{ width: isSidebarCollapsed ? "0px" : `${sidebarWidth}px` }}
          className="relative flex-shrink-0 transition-all duration-100 ease-in-out overflow-hidden border-r border-border"
        >
          <div className="h-full">
            <ChatNavigator />
          </div>

          <div
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize bg-border hover:bg-primary/50 transition-colors"
            onMouseDown={() => setIsResizing(true)}
          />
        </div>

        <div className="flex-1 flex flex-col h-full overflow-hidden bg-black">
          <div className="terminal-header flex items-center justify-between px-3 py-1 bg-muted/10 border-b border-border/20">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                title={
                  isSidebarCollapsed
                    ? "Open Sidebar (Ctrl + /)"
                    : "Close Sidebar (Ctrl + /)"
                }
              >
                {isSidebarCollapsed ? (
                  <Menu className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </button>

              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-chart-2/70"></div>
                <div className="h-2.5 w-2.5 rounded-full bg-primary/70"></div>
                <div className="h-2.5 w-2.5 rounded-full bg-ring/70"></div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs  text-muted-foreground">
              <span>dev@neonyx:~</span>
              <span className="text-primary">$</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCommandMenu(true)}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                title="Command Menu (Ctrl + K)"
              >
                <Command className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                title="Delete All Chats"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowShortcuts(true)}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                title="Keyboard Shortcuts"
              >
                <Keyboard className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div
            className={`flex-1 overflow-hidden ${
              messages.length === 0 ? "flex items-center justify-center" : ""
            }`}
          >
            {messages.length === 0 ? (
              <div className="flex flex-col ">
                <div className="flex flex-1 flex-col items-center justify-center p-4">
                  <div className="space-y-6 text-center">
                    <pre className="hidden md:block text-primary text-sm leading-none">
                      {`
███╗   ██╗███████╗ ██████╗ ███╗   ██╗██╗   ██╗██╗  ██╗
████╗  ██║██╔════╝██╔═══██╗████╗  ██║╚██╗ ██╔╝╚██╗██╔╝
██╔██╗ ██║█████╗  ██║   ██║██╔██╗ ██║ ╚████╔╝  ╚███╔╝ 
██║╚██╗██║██╔══╝  ██║   ██║██║╚██╗██║  ╚██╔╝   ██╔██╗ 
██║ ╚████║███████╗╚██████╔╝██║ ╚████║   ██║   ██╔╝ ██╗
╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝
`}
                    </pre>
                    <div className="space-y-2">
                      <p className="text-primary/80 text-sm">
                        Welcome to Neonyx CLI!
                      </p>
                      <p className="text-chart-2 text-xs">
                        chat until credit drains out
                      </p>
                    </div>
                  </div>
                  <div className="w-full max-w-2xl px-4 mt-8">
                    <ChatInput
                      onSend={handleSendMessage}
                      isLoading={isLoading}
                      selectedModel={selectedModel}
                      onModelSelect={setSelectedModel}
                      disabled={false}
                      hasMessages={false}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto">
                  <div className=" p-4 space-y-4">
                    {messages.map((message) => (
                      <ChatMessage key={message.id} message={message} />
                    ))}
                    {isLoading && <TypingIndicator />}
                  </div>
                  <div ref={messagesEndRef} />
                </div>
                <div className="flex-shrink-0">
                  <ChatInput
                    onSend={handleSendMessage}
                    isLoading={isLoading}
                    selectedModel={selectedModel}
                    onModelSelect={setSelectedModel}
                    disabled={false}
                    hasMessages={true}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
