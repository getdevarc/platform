"use client";

import { useState, useEffect } from "react";
import { ProblemDescription } from "./ProblemDescription";
import { CodeEditor } from "./CodeEditor";
import { AiPanel } from "./AiPanel";
import { InstructionPopup } from "./InstructionPopup";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { Button } from "@/components/ui/button";
import { Lightbulb, Brain, Code2, Terminal, Play, Send } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Problem {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  description: string;
  example_input?: string;
  example_output?: string;
}

export function WorkspaceContent({ problem }: { problem: Problem }) {
  const { 
    sessionId, 
    code, 
    language, 
    status,
    setStatus, 
    addMessage, 
    setProblemId,
    setSessionId,
    setLanguage
  } = useWorkspaceStore();
  
  const [showInstructions, setShowInstructions] = useState(true);
  
  useEffect(() => {
    if (problem) {
      setProblemId(problem.id);
      // Initialize session if not exists
      const initSession = async () => {
        try {
          const res = await api.post("/sessions/start", { problemId: problem.id });
          setSessionId(res.data.data.id);
        } catch (err) {
          console.error("Failed to start session");
        }
      };
      if (!sessionId) initSession();
    }
  }, [problem, setProblemId, setSessionId, sessionId]);

  const handleAiAction = async (type: "hint" | "explanation" | "review") => {
    if (!code) {
      toast.error("Please write some code first!");
      return;
    }

    setStatus("analyzing");
    
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
    } catch (err) {
      toast.error("AI Mentor is busy. Try again later!");
    } finally {
      setStatus("idle");
    }
  };

  const handleRun = async () => {
    toast.info("Running code against sample test cases...");
    // Future implementation: Judge0 run logic
  };

  const handleSubmit = async () => {
    if (!code) return toast.error("Code cannot be empty");
    setStatus("submitting");
    try {
      const res = await api.post("/submissions", {
        problemId: problem.id,
        sourceCode: code,
        languageId: 63, // Node.js default
        sessionId
      });
      toast.success("Submission successful! Analyzing results...");
    } catch (err) {
      toast.error("Submission failed");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <>
      {showInstructions && (
        <InstructionPopup 
          problemTitle={problem.title} 
          onStart={() => setShowInstructions(false)} 
        />
      )}
      
      <div className="flex h-[calc(100vh-64px)] bg-[#0a0a0a] overflow-hidden">
        {/* Left: Problem Description */}
        <div className="hidden lg:flex w-[400px] border-r border-white/5 flex-col h-full bg-[#0a0a0a]">
          <ProblemDescription 
            title={problem.title}
            difficulty={problem.difficulty}
            description={problem.description}
            exampleInput={problem.example_input}
            exampleOutput={problem.example_output}
          />
        </div>

        {/* Center: Editor & Controls */}
        <div className="flex-1 flex flex-col h-full relative bg-[#0d0d0d]">
          {/* Workspace Toolbar */}
          <div className="h-12 border-b border-white/5 bg-zinc-900/10 flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-zinc-900 border border-white/5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 rounded-lg h-8 px-3 focus:outline-none focus:border-primary/50"
              >
                <option value="javascript">Javascript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>

              <div className="h-4 w-[1px] bg-white/5" />

              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-primary"
                  onClick={() => handleAiAction("hint")}
                >
                  <Lightbulb size={14} />
                  Hint
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-primary"
                  onClick={() => handleAiAction("explanation")}
                >
                  <Brain size={14} />
                  Explain
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-primary"
                  onClick={() => handleAiAction("review")}
                >
                  <Code2 size={14} />
                  Review
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                 variant="ghost" 
                 size="sm" 
                 className="h-8 gap-2 bg-zinc-900 border border-white/5 text-xs font-bold"
                 onClick={handleRun}
              >
                 <Play size={14} /> Run
              </Button>
              <Button 
                 size="sm" 
                 className="h-8 gap-2 px-4 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
                 onClick={handleSubmit}
                 disabled={status === "submitting"}
              >
                 {status === "submitting" ? "Submitting..." : <><Send size={14} /> Submit</>}
              </Button>
            </div>
          </div>

          {/* The Editor */}
          <div className="flex-1 overflow-hidden">
            <CodeEditor language={language} />
          </div>

          {/* Bottom Panel (Output/Console) */}
          <div className="h-1/3 border-t border-white/5 flex flex-col bg-[#0a0a0a]">
            <div className="h-10 border-b border-white/5 flex items-center px-4 gap-2 bg-zinc-900/10">
              <Terminal size={14} className="text-zinc-600" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Test Case / Console</span>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-3xl space-y-6">
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="h-7 text-[10px] font-bold uppercase bg-primary/10 text-primary border-none">Case 1</Button>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase text-zinc-600">Case 2</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Input</p>
                    <pre className="bg-zinc-900/50 p-4 border border-white/5 rounded-xl text-xs font-mono text-zinc-300">{problem.example_input || "No input provided"}</pre>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Expected Output</p>
                    <pre className="bg-zinc-900/50 p-4 border border-white/5 rounded-xl text-xs font-mono text-emerald-500/80">{problem.example_output || "No output provided"}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: AI Panel (Hidden on mobile via hidden lg:flex if needed, currently fixed) */}
        <div className="hidden xl:flex w-[400px] border-l border-white/5 bg-[#0a0a0a] flex-col h-full">
          <AiPanel />
        </div>
      </div>
    </>
  );
}
