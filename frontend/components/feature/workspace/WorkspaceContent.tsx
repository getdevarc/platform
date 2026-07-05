"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProblemDescription } from "./ProblemDescription";
import { CodeEditor } from "./CodeEditor";
import { AiPanel } from "./AiPanel";
import { InstructionPopup } from "./InstructionPopup";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { Button } from "@/components/ui/button";
import { Lightbulb, Brain, Code2, Terminal, Play, Send, Timer, HelpCircle, CheckCircle2, XCircle, Sparkles } from "lucide-react";
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
  const router = useRouter();
  
  const { 
    sessionId, 
    code, 
    language, 
    status,
    setStatus, 
    addMessage, 
    setProblemId,
    setSessionId,
    setLanguage,
    setCode
  } = useWorkspaceStore();
  
  const [showInstructions, setShowInstructions] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [timer, setTimer] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [testResults, setTestResults] = useState<any[] | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  // Custom panel sizes states
  const [aiPanelWidth, setAiPanelWidth] = useState(400);
  const [consoleHeight, setConsoleHeight] = useState(250);
  const [isResizingAi, setIsResizingAi] = useState(false);
  const [isResizingConsole, setIsResizingConsole] = useState(false);
  
  // Collapse toggle for AI Panel
  const [aiPanelCollapsed, setAiPanelCollapsed] = useState(false);

  // Language confirm states
  const [showLangConfirm, setShowLangConfirm] = useState(false);
  const [pendingLanguage, setPendingLanguage] = useState<string | null>(null);

  // Success celebration states
  const [showSuccessCelebration, setShowSuccessCelebration] = useState(false);
  const [submissionScore, setSubmissionScore] = useState(0);

  // Reattempt verification states
  const [alreadySolvedLangs, setAlreadySolvedLangs] = useState<string[]>([]);
  const [showReattemptConfirm, setShowReattemptConfirm] = useState(false);

  // Helper to generate dynamic boilerplates based on the problem title
  const getBoilerplate = (title: string, lang: string) => {
    const camelTitle = title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
      .replace(/[^a-zA-Z0-9]/g, "");
    
    const fnName = camelTitle.charAt(0).toLowerCase() + camelTitle.slice(1);
    
    // Leetcode-style signature mapping for landmark algorithm problems
    let problemMethods: Record<string, string> = {
      twosum: "twoSum",
      validanagram: "isAnagram",
      longestsubstringwithoutrepeatingcharacters: "lengthOfLongestSubstring",
      containerwithmostwater: "maxArea",
      medianoftwosortedarrays: "findMedianSortedArrays",
      editdistance: "minDistance"
    };

    const targetFn = problemMethods[camelTitle.toLowerCase()] || fnName;
    
    const templates: Record<string, string> = {
      javascript: `function ${targetFn}(word1, word2) {\n    // write your solution here\n}`,
      python: `class Solution:\n    def ${targetFn}(self, word1: str, word2: str) -> int:\n        # write your solution here\n        pass`,
      cpp: `class Solution {\npublic:\n    int ${targetFn}(string word1, string word2) {\n        // write your solution here\n    }\n};`,
      java: `class Solution {\n    public int ${targetFn}(String word1, String word2) {\n        // write your solution here\n    }\n}`
    };
    
    // Customize specific method templates for twoSum, validanagram etc. (so they match seed variables parameter count)
    if (targetFn === "twoSum") {
      templates.javascript = `function twoSum(nums, target) {\n    // write your solution here\n}`;
      templates.python = `class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        # write your solution here\n        pass`;
      templates.cpp = `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // write your solution here\n    }\n};`;
      templates.java = `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // write your solution here\n    }\n}`;
    } else if (targetFn === "isAnagram") {
      templates.javascript = `function isAnagram(s, t) {\n    // write your solution here\n}`;
      templates.python = `class Solution:\n    def isAnagram(self, s: str, t: str) -> bool:\n        # write your solution here\n        pass`;
      templates.cpp = `class Solution {\npublic:\n    bool isAnagram(string s, string t) {\n        // write your solution here\n    }\n};`;
      templates.java = `class Solution {\n    public boolean isAnagram(String s, String t) {\n        // write your solution here\n    }\n}`;
    } else if (targetFn === "lengthOfLongestSubstring") {
      templates.javascript = `function lengthOfLongestSubstring(s) {\n    // write your solution here\n}`;
      templates.python = `class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        # write your solution here\n        pass`;
      templates.cpp = `class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        // write your solution here\n    }\n};`;
      templates.java = `class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // write your solution here\n    }\n}`;
    } else if (targetFn === "maxArea") {
      templates.javascript = `function maxArea(height) {\n    // write your solution here\n}`;
      templates.python = `class Solution:\n    def maxArea(self, height: List[int]) -> int:\n        # write your solution here\n        pass`;
      templates.cpp = `class Solution {\npublic:\n    int maxArea(vector<int>& height) {\n        // write your solution here\n    }\n};`;
      templates.java = `class Solution {\n    public int maxArea(int[] height) {\n        // write your solution here\n    }\n}`;
    } else if (targetFn === "findMedianSortedArrays") {
      templates.javascript = `function findMedianSortedArrays(nums1, nums2) {\n    // write your solution here\n}`;
      templates.python = `class Solution:\n    def findMedianSortedArrays(self, nums1: List[int], nums2: List[int]) -> float:\n        # write your solution here\n        pass`;
      templates.cpp = `class Solution {\npublic:\n    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {\n        // write your solution here\n    }\n};`;
      templates.java = `class Solution {\n    public double findMedianSortedArrays(int[] nums1, int[] nums2) {\n        // write your solution here\n    }\n}`;
    }
    
    return templates[lang] || templates.javascript;
  };

  // 1. Initial workspace restore logic (exactly ONCE on mount)
  useEffect(() => {
    setProblemId(problem.id);
    
    // Determine if instructions were already dismissed
    const dismissed = localStorage.getItem(`instructions_dismissed_${problem.id}`);
    if (!dismissed) {
      setShowInstructions(true);
    }

    const storedLang = localStorage.getItem(`solve_lang_${problem.id}`);
    const activeLang = storedLang || "javascript";
    setLanguage(activeLang);

    const storedCode = localStorage.getItem(`solve_code_${problem.id}_${activeLang}`);
    if (storedCode) {
      setCode(storedCode);
    } else {
      setCode(getBoilerplate(problem.title, activeLang));
    }
    
    setIsLoaded(true);

    // Initialize session if not exists
    const initSession = async () => {
      try {
        const res = await api.post("/sessions/start", { problemId: problem.id });
        setSessionId(res.data.data.id);
      } catch (err) {
        console.error("Failed to start session");
      }
    };
    initSession();
  }, [problem.id]);

  // 2. Persist code and language in localStorage dynamically on changes (only if fully loaded)
  useEffect(() => {
    if (isLoaded && problem && code) {
      localStorage.setItem(`solve_code_${problem.id}_${language}`, code);
    }
  }, [code, problem, language, isLoaded]);

  useEffect(() => {
    if (isLoaded && problem && language) {
      localStorage.setItem(`solve_lang_${problem.id}`, language);
    }
  }, [language, problem, isLoaded]);

  // Load previous submissions on mount to identify already solved languages
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const res = await api.get("/submissions");
        const userSubmissions = res.data.data || [];
        const acceptedLangs = userSubmissions
          .filter((s: any) => s.problem_id === problem.id && s.status === "accepted")
          .map((s: any) => s.language);
        setAlreadySolvedLangs(Array.from(new Set(acceptedLangs)));
      } catch (err) {
        console.error("Failed to fetch previous submissions", err);
      }
    };
    fetchSubmissions();
  }, [problem.id]);

  // Handle language switch warning modal flow
  const handleLanguageChange = (newLang: string) => {
    if (newLang === language) return;
    
    const defaultBoilerplate = getBoilerplate(problem.title, language);
    const hasEditedCode = code && code.trim() !== defaultBoilerplate.trim();
    
    if (hasEditedCode) {
      setPendingLanguage(newLang);
      setShowLangConfirm(true);
    } else {
      confirmLanguageSwitch(newLang);
    }
  };

  const confirmLanguageSwitch = (newLang: string) => {
    setLanguage(newLang);
    localStorage.setItem(`solve_lang_${problem.id}`, newLang);
    
    const savedCode = localStorage.getItem(`solve_code_${problem.id}_${newLang}`);
    if (savedCode) {
      setCode(savedCode);
    } else {
      setCode(getBoilerplate(problem.title, newLang));
    }
    setShowLangConfirm(false);
    setPendingLanguage(null);
  };

  // 3. Live timer ticking
  useEffect(() => {
    if (showSuccessCelebration) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [showSuccessCelebration]);

  // 4. Draggable mouse move resize listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingAi) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth >= 260 && newWidth <= 650) {
          setAiPanelWidth(newWidth);
        }
      }
      if (isResizingConsole) {
        const newHeight = window.innerHeight - e.clientY - 64;
        if (newHeight >= 120 && newHeight <= window.innerHeight - 220) {
          setConsoleHeight(newHeight);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizingAi(false);
      setIsResizingConsole(false);
    };

    if (isResizingAi || isResizingConsole) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizingAi, isResizingConsole]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // 5. Client-side Navigation Capture & Back-button Trap
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (anchor) {
        const href = anchor.getAttribute("href");
        if (href && !href.startsWith("#") && !href.startsWith("javascript:")) {
          e.preventDefault();
          e.stopPropagation();
          setShowExitConfirm(true);
        }
      }
    };

    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      setShowExitConfirm(true);
    };

    window.history.pushState(null, "", window.location.href);
    document.addEventListener("click", handleAnchorClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleAnchorClick, true);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const handleConfirmExit = () => {
    setShowExitConfirm(false);
    router.push("/dashboard");
  };

  const handleDismissInstructions = () => {
    setShowInstructions(false);
    if (problem) {
      localStorage.setItem(`instructions_dismissed_${problem.id}`, "true");
    }
  };

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
    if (!code) return toast.error("Write some code first!");
    setStatus("running");
    setTestResults(null);
    toast.info("Running code against compiled test cases...");
    try {
      const res = await api.post("/submissions", {
        problemId: problem.id,
        code,
        language,
        sessionId
      });
      if (res.data.data && res.data.data.testCases) {
        setTestResults(res.data.data.testCases);
        const allPassed = res.data.data.status === "accepted";
        if (allPassed) {
          toast.success("All sample test cases passed successfully!");
        } else {
          toast.error("Some test cases failed.");
        }
      } else {
        toast.error("Code evaluation finished but output structure was invalid.");
      }
    } catch (err) {
      toast.error("Sandbox run failed. Check server log.");
    } finally {
      setStatus("idle");
    }
  };

  const handleSubmit = async (bypassConfirm: boolean | React.MouseEvent = false) => {
    if (!code) return toast.error("Code cannot be empty");
    
    const shouldBypass = bypassConfirm === true;
    if (!shouldBypass && alreadySolvedLangs.includes(language)) {
      setShowReattemptConfirm(true);
      return;
    }

    setStatus("submitting");
    try {
      const res = await api.post("/submissions", {
        problemId: problem.id,
        code,
        language,
        sessionId
      });
      
      if (res.data.data && res.data.data.testCases) {
        setTestResults(res.data.data.testCases);
      }
      
      if (res.data.data.status === "accepted") {
        setSubmissionScore(res.data.data.score || 100);
        setShowSuccessCelebration(true);
        if (!alreadySolvedLangs.includes(language)) {
          setAlreadySolvedLangs((prev) => [...prev, language]);
        }
        toast.success(`Problem Solved in ${formatTime(timer)}! Accurate solution saved.`);
      } else {
        toast.error("Solution failed validation test cases. Check outputs below.");
      }
    } catch (err) {
      toast.error("Submission failed");
    } finally {
      setStatus("idle");
      setShowReattemptConfirm(false);
    }
  };

  return (
    <>
      {showInstructions && (
        <InstructionPopup 
          problemTitle={problem.title} 
          onStart={handleDismissInstructions} 
        />
      )}

      {/* Blurred Full-Page Backdrop-Blur Exit Confirm Dialog */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="h-10 w-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 mb-4 border border-red-500/20">
              <HelpCircle size={20} />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Go back to Dashboard?</h3>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              Are you sure you want to exit the workspace? Your code progress is preserved, but you will pause session updates.
            </p>
            <div className="flex justify-end gap-2.5">
              <Button 
                variant="ghost" 
                onClick={() => setShowExitConfirm(false)}
                className="h-9 text-xs text-zinc-400 hover:text-white hover:bg-white/5 font-semibold px-4 rounded-xl"
              >
                No, Keep Coding
              </Button>
              <Button 
                onClick={handleConfirmExit}
                className="h-9 text-xs bg-red-650 hover:bg-red-700 text-white font-bold px-4 rounded-xl shadow-lg shadow-red-900/10"
              >
                Yes, Exit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reattempt Confirmation Modal */}
      {showReattemptConfirm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="h-10 w-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 mb-4 border border-amber-500/20">
              <HelpCircle size={20} />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Already Submitted</h3>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              You have already successfully submitted code for this question in <span className="text-primary font-bold">{language}</span> language. 
              Do you want to submit a new solution? This will store your new code and elapsed stats in the database.
            </p>
            <div className="flex justify-end gap-2.5">
              <Button 
                variant="ghost" 
                onClick={() => setShowReattemptConfirm(false)}
                className="h-9 text-xs text-zinc-400 hover:text-white hover:bg-white/5 font-semibold px-4 rounded-xl"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => handleSubmit(true)}
                className="h-9 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 rounded-xl shadow-lg shadow-amber-900/15"
              >
                Reattempt
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Celebration Modal on successful compilation submission */}
      {showSuccessCelebration && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-gradient-to-b from-zinc-900 to-black border border-emerald-500/30 rounded-3xl p-8 max-w-md w-full mx-4 shadow-[0_0_50px_rgba(16,185,129,0.15)] animate-in zoom-in-95 duration-300 text-center relative overflow-hidden">
            {/* Sparkles background effect */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            <div className="mx-auto h-20 w-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-450 mb-6 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-bounce">
              <Sparkles size={40} className="text-emerald-400" />
            </div>

            <h3 className="text-2xl font-extrabold text-white mb-2 tracking-tight">Accepted!</h3>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              Congratulations! Your solution has successfully passed all verification test cases with optimal time and memory thresholds.
            </p>

            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 mb-8 flex justify-around items-center">
              <div>
                <p className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest mb-1">Score Obtained</p>
                <p className="text-2xl font-black text-emerald-400">{submissionScore}/100</p>
              </div>
              <div className="h-8 w-[1px] bg-white/5" />
              <div>
                <p className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest mb-1">Time Elapsed</p>
                <p className="text-xl font-bold text-zinc-200 font-mono">{formatTime(timer)}</p>
              </div>
            </div>

            <Button 
              onClick={() => router.push("/problems")}
              className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 group"
            >
              Solve More Problems
              <Play size={14} className="fill-black transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Blurred Backdrop Language Switch Warning */}
      {showLangConfirm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="h-10 w-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 mb-4 border border-amber-500/20">
              <HelpCircle size={20} />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Switch Language?</h3>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              Changing your language will reset the editor text. Your current code state is stored and can be recovered by switching back.
            </p>
            <div className="flex justify-end gap-2.5">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setShowLangConfirm(false);
                  setPendingLanguage(null);
                }}
                className="h-9 text-xs text-zinc-400 hover:text-white hover:bg-white/5 font-semibold px-4 rounded-xl"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (pendingLanguage) {
                    confirmLanguageSwitch(pendingLanguage);
                  }
                }}
                className="h-9 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 rounded-xl shadow-lg shadow-amber-900/15"
              >
                Yes, Switch
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className={cn(
        "flex h-[calc(100vh-64px)] bg-[#0a0a0a] overflow-hidden",
        (isResizingAi || isResizingConsole) ? "select-none" : ""
      )}>
        {/* Left: Problem Description */}
        <div className="hidden lg:flex w-[400px] border-r border-white/5 flex-col h-full bg-[#0a0a0a] shrink-0">
          <ProblemDescription 
            title={problem.title}
            difficulty={problem.difficulty}
            description={problem.description}
            exampleInput={problem.example_input}
            exampleOutput={problem.example_output}
          />
        </div>

        {/* Center: Editor & Controls */}
        <div className="flex-1 flex flex-col h-full relative bg-[#0d0d0d] overflow-hidden">
          {/* Workspace Toolbar */}
          <div className="h-12 border-b border-white/5 bg-zinc-900/10 flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-4">
              <select 
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-zinc-900 border border-white/5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 rounded-lg h-8 px-3 focus:outline-none focus:border-primary/50"
              >
                <option value="javascript">Javascript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>

              <div className="h-4 w-[1px] bg-white/5" />

              {/* Timer tag */}
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-900/50 text-[11px] font-mono text-zinc-400 border border-white/5 select-none">
                <Timer size={12} className="text-primary animate-pulse" />
                <span>{formatTime(timer)}</span>
              </div>

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

                <div className="h-4 w-[1px] bg-white/5 mx-1" />

                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    "h-8 gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-550 hover:text-primary",
                    !aiPanelCollapsed ? "text-primary bg-primary/5" : ""
                  )}
                  onClick={() => setAiPanelCollapsed(!aiPanelCollapsed)}
                >
                  <Sparkles size={14} />
                  {aiPanelCollapsed ? "Show Mentor" : "Hide Mentor"}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                 variant="ghost" 
                 size="sm" 
                 className="h-8 gap-2 bg-zinc-900 border border-white/5 text-xs font-bold"
                 onClick={handleRun}
                 disabled={status === "running"}
              >
                 <Play size={14} /> {status === "running" ? "Running..." : "Run"}
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
            <CodeEditor language={language === "java" ? "java" : language === "cpp" ? "cpp" : language === "python" ? "python" : "javascript"} />
          </div>

          {/* Bottom Console Panel Height Resizing Handle */}
          <div 
            className="h-1 bg-white/5 hover:bg-primary/50 cursor-row-resize transition-colors select-none shrink-0"
            onMouseDown={() => setIsResizingConsole(true)}
          />

          {/* Bottom Panel (Output/Console) */}
          <div 
            className="border-t border-white/5 flex flex-col bg-[#0a0a0a] shrink-0"
            style={{ height: `${consoleHeight}px` }}
          >
            <div className="h-10 border-b border-white/5 flex items-center px-4 gap-2 bg-zinc-900/10 shrink-0">
              <Terminal size={14} className="text-zinc-650" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Test Case / Console</span>
            </div>
            
            <div className="flex-grow flex flex-col overflow-y-auto">
              {testResults ? (
                // Detailed test case outputs matching backend execution details
                <div className="flex-1 p-6 space-y-5">
                  <div className="flex gap-2">
                    {testResults.map((result, idx) => (
                      <Button
                        key={idx}
                        variant={activeTab === idx ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setActiveTab(idx)}
                        className={cn(
                          "h-7 text-[10px] font-bold uppercase tracking-wide gap-1 rounded-lg px-3.5",
                          activeTab === idx 
                            ? (result.passed ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20")
                            : "text-zinc-500 hover:text-zinc-300"
                        )}
                      >
                        {result.passed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        Case {idx + 1}
                      </Button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-200">
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Input Parameters</p>
                      <pre className="bg-zinc-900/50 p-4 border border-white/5 rounded-xl text-xs font-mono text-zinc-300 overflow-x-auto min-h-[50px]">{testResults[activeTab]?.input || problem.example_input}</pre>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Expected Output</p>
                      <pre className="bg-zinc-900/50 p-4 border border-white/5 rounded-xl text-xs font-mono text-emerald-500/70 overflow-x-auto min-h-[50px]">{testResults[activeTab]?.expected || problem.example_output}</pre>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">User Output</p>
                      <pre className={cn(
                        "p-4 border rounded-xl text-xs font-mono overflow-x-auto min-h-[50px]",
                        testResults[activeTab]?.passed 
                          ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-450" 
                          : "bg-red-950/20 border-red-500/20 text-red-450"
                      )}>
                        {testResults[activeTab]?.output}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                // Standard default mock template output
                <div className="flex-1 p-6 space-y-6">
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" className="h-7 text-[10px] font-bold uppercase bg-white/5 border border-white/5 hover:bg-white/5 text-zinc-300">Case 1</Button>
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase text-zinc-650 cursor-not-allowed">Case 2</Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Example Input</p>
                      <pre className="bg-zinc-900/50 p-4 border border-white/5 rounded-xl text-xs font-mono text-zinc-350">{problem.example_input || "No input provided"}</pre>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Expected Output</p>
                      <pre className="bg-zinc-900/50 p-4 border border-white/5 rounded-xl text-xs font-mono text-emerald-500/80">{problem.example_output || "No output provided"}</pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Drag Handle for Right AI panel width resize */}
        {!aiPanelCollapsed && (
          <div 
            className="hidden xl:block w-1 bg-white/5 hover:bg-primary/50 cursor-col-resize self-stretch transition-colors select-none shrink-0"
            onMouseDown={() => setIsResizingAi(true)}
          />
        )}

        {/* Right: AI Panel */}
        {!aiPanelCollapsed && (
          <div 
            className="hidden xl:flex border-l border-white/5 bg-[#0a0a0a] flex-col h-full shrink-0"
            style={{ width: `${aiPanelWidth}px` }}
          >
            <AiPanel />
          </div>
        )}
      </div>
    </>
  );
}
