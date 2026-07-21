import { useState, useEffect, useRef } from "react";
import { ProblemDescription } from "./ProblemDescription";
import { CodeEditor } from "./CodeEditor";
import { AiPanel } from "./AiPanel";
import { InstructionPopup } from "./InstructionPopup";
import { useWorkspaceStore, Message as WorkspaceMessage } from "@/store/useWorkspaceStore";

export interface PendingSession {
  sessionId: string;
  score: number;
}
import { Button } from "@/components/ui/button";
import { Lightbulb, Brain, Code2, Terminal, Play, Send, ChevronLeft, Clock, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle, type PanelImperativeHandle as ImperativePanelHandle, Layout } from "react-resizable-panels";

export interface Problem {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  description: string;
  example_input?: string;
  example_output?: string;
}

interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

function CustomModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Continue",
  cancelText = "Cancel",
  isDestructive = false
}: CustomModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-[24px] border border-border bg-card p-6 shadow-2xl relative space-y-4 animate-in zoom-in-95 duration-200">
        <div className="space-y-2">
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-foreground font-sans">{title}</h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed font-sans">{message}</p>
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 rounded-xl text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={onClose}
          >
            {cancelText}
          </Button>
          <Button 
            size="sm" 
            className={cn(
              "h-8 rounded-xl text-[10px] font-bold uppercase tracking-wider px-4 border-none shadow-md",
              isDestructive 
                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/20" 
                : "bg-primary hover:bg-primary/95 text-primary-foreground shadow-primary/10"
            )}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function WorkspaceContent({ problem }: { problem: Problem }) {
  const { 
    sessionId, 
    code, 
    language, 
    status,
    messages,
    score,
    setCode,
    setStatus, 
    addMessage, 
    setProblemId,
    setSessionId,
    setLanguage,
    setScore,
    setPenalty
  } = useWorkspaceStore();
  
  const [showInstructions, setShowInstructions] = useState(true);
  const [isAiOpen, setIsAiOpen] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    cost: number;
    actionType: "hint" | "explanation" | "review";
  } | null>(null);
  
  const [leaveHref, setLeaveHref] = useState<string | null>(null);
  const [referrer, setReferrer] = useState("/problems");
  
  const [showSessionPrompt, setShowSessionPrompt] = useState(false);
  const [pendingSession, setPendingSession] = useState<PendingSession | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const isNavigatingAwayRef = useRef(false);
  const aiPanelRef = useRef<ImperativePanelHandle>(null);
  
  const [panelSizes, setPanelSizes] = useState<Record<string, number>>({
    left: 25,
    center: 55,
    right: 20
  });
  const [verticalSizes, setVerticalSizes] = useState<Record<string, number>>({
    editor: 70,
    console: 30
  });

  const [testResults, setTestResults] = useState<{
    status: string;
    score: number;
    testCases: Array<{
      input: string;
      expected: string;
      output: string;
      passed: boolean;
    }>;
  } | null>(null);

  // Helper to save workspace state to localStorage
  const saveState = (updates: Partial<{
    code: string;
    language: string;
    isAiOpen: boolean;
    score: number;
    messages: WorkspaceMessage[];
    panelSizes: Record<string, number>;
    verticalSizes: Record<string, number>;
  }>) => {
    if (!problem?.id) return;
    try {
      const existingStr = localStorage.getItem(`devarc_workspace_${problem.id}`);
      const existing = existingStr ? JSON.parse(existingStr) : {};
      const updated = { ...existing, ...updates };
      localStorage.setItem(`devarc_workspace_${problem.id}`, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (typeof document !== "undefined" && document.referrer) {
      try {
        const refUrl = new URL(document.referrer);
        if (refUrl.origin === window.location.origin && refUrl.pathname !== window.location.pathname) {
          setReferrer(refUrl.pathname);
        }
      } catch (e) {}
    }
  }, []);

  const startNewChallenge = async (forceNew: boolean) => {
    try {
      const res = await api.post("/sessions/start", { problemId: problem.id, forceNew });
      const { sessionId: loadedSessionId, score: loadedScore } = res.data.data;
      setSessionId(loadedSessionId);
      setScore(loadedScore);
      setPenalty(100 - loadedScore);

      setTimeElapsed(0);
      localStorage.setItem(`devarc_elapsed_time_${problem.id}`, "0");
      setSessionStartTime(new Date().toISOString());
    } catch (err) {
      toast.error("Failed to start new challenge");
    }
  };

  const resumeChallenge = (sessionData: PendingSession) => {
    setSessionId(sessionData.sessionId);
    setScore(sessionData.score);
    setPenalty(100 - sessionData.score);

    const savedTime = localStorage.getItem(`devarc_elapsed_time_${problem.id}`);
    const seconds = savedTime ? parseInt(savedTime, 10) : 0;
    setTimeElapsed(seconds);
    setSessionStartTime(new Date().toISOString());
  };

  useEffect(() => {
    if (problem) {
      setProblemId(problem.id);

      // Restore states
      const savedStr = localStorage.getItem(`devarc_workspace_${problem.id}`);
      if (savedStr) {
        try {
          const saved = JSON.parse(savedStr);
          if (saved.code) setCode(saved.code);
          if (saved.language) setLanguage(saved.language);
          if (saved.isAiOpen !== undefined) setIsAiOpen(saved.isAiOpen);
          if (saved.score !== undefined) setScore(saved.score);
          if (saved.panelSizes) {
            if (Array.isArray(saved.panelSizes)) {
              setPanelSizes({
                left: saved.panelSizes[0] ?? 25,
                center: saved.panelSizes[1] ?? 55,
                right: saved.panelSizes[2] ?? 20
              });
            } else {
              setPanelSizes(saved.panelSizes);
            }
          }
          if (saved.verticalSizes) setVerticalSizes(saved.verticalSizes);
          if (saved.messages) {
            useWorkspaceStore.setState({ messages: saved.messages });
          }
        } catch (e) {}
      }

      const initSession = async () => {
        try {
          const activeCheck = await api.get(`/sessions/active/${problem.id}`);
          const activeSession = activeCheck.data.data;

          if (activeSession) {
            setPendingSession(activeSession);
            setShowSessionPrompt(true);
          } else {
            await startNewChallenge(false);
          }
        } catch (err) {
          console.error("Failed to check active session", err);
          await startNewChallenge(false);
        }
      };

      initSession();
    }
  }, [problem, setProblemId, setSessionId, setScore, setPenalty, setCode, setLanguage]);

  useEffect(() => {
    if (!sessionStartTime) return;
    const interval = setInterval(() => {
      setTimeElapsed((prev) => {
        const next = prev + 1;
        if (problem?.id) {
          localStorage.setItem(`devarc_elapsed_time_${problem.id}`, next.toString());
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStartTime, problem?.id]);

  // Sync state changes to localStorage
  useEffect(() => {
    if (problem?.id && code) saveState({ code });
  }, [code, problem?.id]);

  useEffect(() => {
    if (problem?.id && language) saveState({ language });
  }, [language, problem?.id]);

  useEffect(() => {
    if (problem?.id) saveState({ isAiOpen });
  }, [isAiOpen, problem?.id]);

  useEffect(() => {
    if (problem?.id) {
      saveState({ score, messages });
    }
  }, [score, messages, problem?.id]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isNavigatingAwayRef.current) return;
      e.preventDefault();
      e.returnValue = "Your current progress may be lost.";
      return e.returnValue;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (anchor && anchor.href) {
        const url = new URL(anchor.href);
        if (url.origin === window.location.origin && url.pathname !== window.location.pathname) {
          // Intercept leave/back navigation click
          e.preventDefault();
          setLeaveHref(anchor.href);
        }
      }
    };
    document.addEventListener("click", handleLinkClick, { capture: true });
    return () => document.removeEventListener("click", handleLinkClick, { capture: true });
  }, []);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      window.history.pushState(null, "", window.location.href);
      setLeaveHref("/problems");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const aiPanel = aiPanelRef.current;
    if (aiPanel) {
      if (isAiOpen) {
        if (aiPanel.isCollapsed()) {
          aiPanel.expand();
        }
      } else {
        if (!aiPanel.isCollapsed()) {
          aiPanel.collapse();
        }
      }
    }
  }, [isAiOpen]);

  const handleBackClick = () => {
    setLeaveHref("/problems");
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  };

  const handleAiActionClick = (type: "hint" | "explanation" | "review") => {
    if (!code) {
      toast.error("Please write some code first!");
      return;
    }

    let cost = 0;
    if (type === "hint") cost = 20;
    else if (type === "explanation") cost = 20;
    else if (type === "review") {
      const reviewCount = messages.filter(m => m.type === "review").length;
      cost = reviewCount === 0 ? 0 : 25;
    }

    if (cost > 0) {
      setConfirmDialog({
        isOpen: true,
        title: type === "hint" ? "Use AI Hint?" : type === "explanation" ? "Use AI Explanation?" : "Use AI Code Review?",
        message: `Using an AI ${type === "hint" ? "Hint" : type === "explanation" ? "Explanation" : "Review"} will deduct ${cost} points from your current challenge score. Do you want to continue?`,
        cost,
        actionType: type
      });
    } else {
      executeAiAction(type, 0);
    }
  };

  const executeAiAction = async (type: "hint" | "explanation" | "review", cost: number) => {
    setStatus("analyzing");
    setIsAiOpen(true);
    
    try {
      const endpoint = type === "hint" ? "/ai/hint" : type === "explanation" ? "/ai/explain" : "/ai/review";
      const res = await api.post(endpoint, { 
        problemId: problem.id, 
        userCode: code, 
        sessionId 
      });
      
      addMessage({ 
        role: "ai", 
        content: res.data.data, 
        type 
      });

      const newScore = Math.max(0, score - cost);
      setScore(newScore);
      setPenalty(100 - newScore);
      
      toast.success(cost > 0 ? `Deducted ${cost} points. AI feedback loaded.` : "AI feedback loaded.");
    } catch (err) {
      toast.error("AI Mentor is busy. Try again later!");
    } finally {
      setStatus("idle");
    }
  };

  const handleConfirmContinue = () => {
    if (!confirmDialog) return;
    executeAiAction(confirmDialog.actionType, confirmDialog.cost);
    setConfirmDialog(null);
  };

  const handleRun = async () => {
    if (!code) {
      toast.error("Please implementation code details before execution.");
      return;
    }
    setStatus("running");
    setTestResults(null);
    setActiveCaseIndex(0);

    const langIdMap: Record<string, number> = {
      javascript: 63,
      python: 71,
      cpp: 54,
      java: 62
    };
    const languageId = langIdMap[language.toLowerCase()] || 63;
    
    try {
      const res = await api.post("/submissions", {
        problemId: problem.id,
        sourceCode: code,
        languageId,
        sessionId
      });
      if (res.data.success) {
        setTestResults(res.data.data);
        if (res.data.data.status === "accepted") {
          toast.success("Correct Answer! Code run logic successful.");
        } else {
          toast.warning("Tests failed. Review inputs vs outcome.");
        }
      }
    } catch (err) {
      toast.error("Execution failed to complete.");
    } finally {
      setStatus("idle");
    }
  };

  const handleSubmit = async () => {
    if (!code) {
      toast.error("Write code before submission!");
      return;
    }
    setStatus("submitting");
    setTestResults(null);
    setActiveCaseIndex(0);

    const langIdMap: Record<string, number> = {
      javascript: 63,
      python: 71,
      cpp: 54,
      java: 62
    };
    const languageId = langIdMap[language.toLowerCase()] || 63;
    
    try {
      const res = await api.post("/submissions", {
        problemId: problem.id,
        sourceCode: code,
        languageId,
        sessionId
      });
      if (res.data.success) {
        setTestResults(res.data.data);
        if (res.data.data.status === "accepted") {
          toast.success("Accepted! Challenge successfully solved.");
          setScore(res.data.data.score);
        } else {
          toast.error("Wrong Answer. Check test case outputs.");
        }
      }
    } catch (err) {
      toast.error("Submission failed");
    } finally {
      setStatus("idle");
    }
  };

  const cleanTitle = problem.title.replace(/^#\d+[:.-]?\s*/, "");

  return (
    <>
      {showInstructions && (
        <InstructionPopup 
          problemTitle={cleanTitle} 
          onStart={() => setShowInstructions(false)}
        />
      )}
      
      <div className="flex h-[calc(100vh-64px)] bg-background text-foreground overflow-hidden w-full">
        <PanelGroup 
          id="workspace-layout-group"
          orientation="horizontal" 
          defaultLayout={panelSizes}
          onLayoutChanged={(sizes: Layout) => {
            const mappedSizes = {
              left: sizes[0] ?? 25,
              center: sizes[1] ?? 55,
              right: sizes[2] ?? 20
            };
            setPanelSizes(mappedSizes);
            saveState({ panelSizes: mappedSizes });
          }}
        >
          {/* Left: Problem Description */}
          <Panel id="left" defaultSize={panelSizes.left ?? 25} minSize={20} collapsible>
            <div className="flex flex-col h-full bg-background overflow-hidden">
              <ProblemDescription 
                title={cleanTitle}
                difficulty={problem.difficulty}
                description={problem.description}
                exampleInput={problem.example_input}
                exampleOutput={problem.example_output}
              />
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-border hover:bg-primary/45 transition-colors cursor-col-resize shrink-0" />
 
          {/* Center: Editor & Controls */}
          <Panel id="center" defaultSize={panelSizes.center ?? 55} minSize={30}>
            <div className="flex flex-col h-full relative bg-background overflow-hidden">
              {/* Workspace Toolbar */}
              <div className="h-12 border-b border-border bg-background/80 flex items-center justify-between px-5 select-none shrink-0">
                <div className="flex flex-1 min-w-0 items-center gap-4 overflow-hidden">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
                    onClick={handleBackClick}
                  >
                    <ChevronLeft size={16} />
                  </Button>
 
                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-muted/50 border border-border text-[10px] font-bold uppercase tracking-widest text-foreground rounded-lg h-8 px-2.5 outline-none cursor-pointer focus:border-primary/50 transition-all font-mono shrink-0"
                  >
                    <option value="javascript">Javascript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                  </select>
 
                  <div className="h-4 w-[1px] bg-border shrink-0" />
 
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary active:scale-[0.98] transition-transform rounded-xl hover:bg-primary/5"
                      onClick={() => handleAiActionClick("hint")}
                    >
                      <Lightbulb size={13} className="text-primary animate-pulse" />
                      {!isAiOpen && <span>Hint</span>}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-purple-400 active:scale-[0.98] transition-transform rounded-xl hover:bg-primary/5"
                      onClick={() => handleAiActionClick("explanation")}
                    >
                      <Brain size={13} className="text-purple-400" />
                      {!isAiOpen && <span>Explain</span>}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-emerald-500 active:scale-[0.98] transition-transform rounded-xl hover:bg-primary/5"
                      onClick={() => handleAiActionClick("review")}
                    >
                      <Code2 size={13} className="text-emerald-500" />
                      {!isAiOpen && <span>Review</span>}
                    </Button>
                  </div>
 
                  <div className="h-4 w-[1px] bg-border shrink-0" />
 
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-muted border border-border text-[10px] font-mono text-muted-foreground select-none shrink-0">
                    <Clock size={11} className="text-muted-foreground" />
                    <span>{formatTime(timeElapsed)}</span>
                  </div>
 
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-muted border border-border text-[10px] font-mono text-muted-foreground select-none shrink-0">
                    <Sparkles size={11} className="text-amber-500 animate-pulse" />
                    <span>Score: {score} / 100</span>
                  </div>
                </div>
 
                <div className="flex items-center gap-2 shrink-0">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 gap-1.5 bg-muted/50 border border-border hover:border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground rounded-xl active:scale-[0.98] transition-transform shrink-0"
                    onClick={() => setIsAiOpen(!isAiOpen)}
                  >
                    <Sparkles size={11} className={cn("text-primary", isAiOpen ? "animate-pulse" : "")} />
                    {isAiOpen ? "Close AI" : "Open AI Mentor"}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 gap-1.5 bg-muted/50 border border-border hover:border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground rounded-xl active:scale-[0.98] transition-transform shrink-0"
                    onClick={handleRun}
                  >
                    <Play size={12} className="text-primary fill-primary" /> Run
                  </Button>
                  <Button 
                    size="sm" 
                    className="h-8 gap-1.5 px-4 bg-primary hover:bg-primary/95 text-primary-foreground text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20 rounded-xl active:scale-[0.98] transition-transform border-none shrink-0"
                    onClick={handleSubmit}
                    disabled={status === "submitting"}
                  >
                    {status === "submitting" ? "Submitting..." : <><Send size={12} /> Submit</>}
                  </Button>
                </div>
              </div>

              <div className="flex-1 min-h-0 bg-background">
                <PanelGroup id="editor-console-layout" orientation="vertical" onLayoutChanged={(sizes: Layout) => {
                  const mappedSizes = {
                    editor: sizes[0] ?? 70,
                    console: sizes[1] ?? 30
                  };
                  setVerticalSizes(mappedSizes);
                  saveState({ verticalSizes: mappedSizes });
                }}>
                  {/* Editor */}
                  <Panel id="editor" defaultSize={verticalSizes.editor ?? 70} minSize={30}>
                    <div className="flex flex-col h-full bg-background overflow-hidden font-sans">
                      <CodeEditor language={language} />
                    </div>
                  </Panel>
 
                  <PanelResizeHandle className="h-1 bg-border hover:bg-primary/45 transition-colors cursor-row-resize shrink-0" />
 
                  {/* Console */}
                  <Panel id="console" defaultSize={verticalSizes.console ?? 30} minSize={20}>
                    <div className="h-full flex flex-col bg-card/45 border border-border overflow-hidden">
                      <div className="h-10 border-b border-border flex items-center justify-between px-5 bg-muted/30 select-none shrink-0">
                        <div className="flex items-center gap-2">
                          <Terminal size={13} className="text-primary" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">Console / Test Cases</span>
                        </div>
                        
                        {testResults && (
                          <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground animate-in fade-in duration-200">
                            <div className="flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                              <span>Total: {testResults.testCases.length}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Passed: {testResults.testCases.filter(c => c.passed).length}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                              <span className="text-rose-600 dark:text-rose-455 font-bold">Failed: {testResults.testCases.filter(c => !c.passed).length}</span>
                            </div>
                            <div className="h-3 w-[1px] bg-border" />
                            <div>Time: 12ms</div>
                            <div>Memory: 28.4MB</div>
                          </div>
                        )}
                      </div>
 
                      <div className="flex-1 p-5 overflow-y-auto scrollbar-thin">
                        {!testResults ? (
                          <div className="max-w-3xl space-y-4">
                            <div className="flex gap-2 select-none h-6 items-center">
                              <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider mr-2 font-mono">Sample Cases</span>
                              <Button variant="secondary" size="sm" className="h-6 text-[9px] font-extrabold uppercase bg-primary/10 text-primary border border-primary/20 rounded-lg">Case 1</Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest select-none font-sans">Input</p>
                                <pre className="bg-muted/30 border border-border p-3.5 rounded-2xl text-xs font-mono text-foreground overflow-x-auto select-all max-h-24 scrollbar-thin">{problem.example_input || "No input provided"}</pre>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest select-none font-sans">Expected Output</p>
                                <pre className="bg-muted/30 border border-border p-3.5 rounded-2xl text-xs font-mono text-emerald-600 dark:text-emerald-400 overflow-x-auto select-all max-h-24 scrollbar-thin">{problem.example_output || "No output provided"}</pre>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="max-w-3xl space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b border-border">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider font-mono">Execution Results</span>
                                <span className={cn(
                                  "text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-lg border",
                                  testResults.status === "accepted" 
                                    ? "bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/10" 
                                    : "bg-rose-500/5 text-rose-600 dark:text-rose-400 border-rose-500/10"
                                )}>
                                  {testResults.status === "accepted" ? "Accepted" : "Wrong Answer"}
                                </span>
                              </div>
                            </div>
 
                            <div className="flex gap-1.5 select-none overflow-x-auto pb-1 scrollbar-none">
                              {testResults.testCases.map((tc, idx) => (
                                <Button
                                  key={idx}
                                  variant="ghost"
                                  size="sm"
                                  className={cn(
                                    "h-7 text-[9px] font-bold uppercase rounded-lg px-3 transition-colors border",
                                    activeCaseIndex === idx
                                      ? "bg-secondary text-foreground border-border"
                                      : "bg-muted/35 text-muted-foreground border-transparent hover:text-foreground"
                                  )}
                                  onClick={() => setActiveCaseIndex(idx)}
                                >
                                  <span className={cn(
                                    "h-1.5 w-1.5 rounded-full shrink-0 mr-1.5",
                                    tc.passed ? "bg-emerald-500" : "bg-rose-500"
                                  )} />
                                  Case {idx + 1}
                                </Button>
                              ))}
                            </div>
 
                            {testResults.testCases[activeCaseIndex] && (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-200">
                                <div className="space-y-1">
                                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest select-none font-sans">Input</p>
                                  <pre className="bg-muted/30 border border-border p-3.5 rounded-2xl text-xs font-mono text-foreground overflow-x-auto select-all max-h-24 scrollbar-thin">
                                    {testResults.testCases[activeCaseIndex].input}
                                  </pre>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest select-none font-sans">Expected Output</p>
                                  <pre className="bg-muted/30 border border-border p-3.5 rounded-2xl text-xs font-mono text-emerald-600 dark:text-emerald-400 overflow-x-auto select-all max-h-24 scrollbar-thin">
                                    {testResults.testCases[activeCaseIndex].expected}
                                  </pre>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest select-none font-sans">Actual Output</p>
                                  <pre className={cn(
                                    "border p-3.5 rounded-2xl text-xs font-mono overflow-x-auto select-all max-h-24 scrollbar-thin",
                                    testResults.testCases[activeCaseIndex].passed
                                      ? "bg-muted/30 border-border text-emerald-600 dark:text-emerald-400"
                                      : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-455"
                                  )}>
                                    {testResults.testCases[activeCaseIndex].output}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Panel>
                </PanelGroup>
              </div>
            </div>
          </Panel>
 
          <PanelResizeHandle 
            className={cn(
              "w-1 bg-border hover:bg-primary/45 transition-colors cursor-col-resize shrink-0",
              !isAiOpen && "pointer-events-none opacity-0 w-0"
            )} 
          />
 
          {/* Right: AI Panel */}
          <Panel 
            panelRef={aiPanelRef}
            id="right" 
            defaultSize={panelSizes.right ?? 20} 
            minSize={20} 
            collapsible
          >
            <div className="flex flex-col h-full border-l border-border bg-background overflow-hidden">
              <AiPanel />
            </div>
          </Panel>
        </PanelGroup>
      </div>

      {/* AI Deduction Modal */}
      <CustomModal 
        isOpen={confirmDialog !== null && confirmDialog.isOpen}
        onClose={() => setConfirmDialog(null)}
        onConfirm={handleConfirmContinue}
        title={confirmDialog?.title || ""}
        message={confirmDialog?.message || ""}
      />

      {/* Leave Warning Modal */}
      <CustomModal 
        isOpen={leaveHref !== null}
        onClose={() => setLeaveHref(null)}
        onConfirm={() => {
          isNavigatingAwayRef.current = true;
          window.location.href = "/problems";
        }}
        title="Leave Challenge?"
        message="Your current progress may be lost. Do you want to continue?"
        confirmText="Leave"
        cancelText="Stay"
        isDestructive={true}
      />

      {/* Active Challenge Prompt Modal */}
      <CustomModal 
        isOpen={showSessionPrompt}
        onClose={() => {
          setShowSessionPrompt(false);
          startNewChallenge(true);
        }}
        onConfirm={() => {
          setShowSessionPrompt(false);
          if (pendingSession) {
            resumeChallenge(pendingSession);
          }
        }}
        title="Active Challenge Exists"
        message="You have an active challenge session. Would you like to resume your previous progress or start a new challenge from 00:00?"
        confirmText="Resume Challenge"
        cancelText="Start New"
      />
    </>
  );
}
