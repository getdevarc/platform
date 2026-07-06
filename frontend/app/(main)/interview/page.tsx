"use client";

import { useState, useEffect, useRef } from "react";
import { api, ApiResponse } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  Bot, 
  User, 
  Timer, 
  Flag, 
  BrainCircuit, 
  CheckCircle2, 
  XCircle,
  Trophy,
  Loader2,
  ArrowRight,
  Download,
  Play
} from "lucide-react";
import Editor from "@monaco-editor/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface TestCaseResult {
  input: string;
  expected: string;
  output: string;
  passed: boolean;
}

interface Evaluation {
  verdict: string;
  logicScore: number;
  codeQualityScore: number;
  communicationScore: number;
  totalScore: number;
  overallFeedback?: string;
  feedback?: string;
  strengths: string[];
  weaknesses: string[];
  testCases?: TestCaseResult[];
}

interface CompletedQuestion {
  index: number;
  title: string;
  questionText: string;
  code: string;
  language: string;
  evaluation?: Evaluation;
  timeTaken: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface InterviewSession {
  id: string;
  status: string;
  type?: string;
  question: string;
  transcript: Message[];
  evaluation?: Evaluation;
  created_at?: string;
}

const boilerplates = {
  javascript: `// Write your JavaScript solution here...\n\nfunction solve(nums) {\n  // your code\n  return 0;\n}`,
  python: `# Write your Python solution here...\n\ndef solve(nums):\n    # your code\n    return 0`,
  cpp: `// Write your C++ solution here...\n#include <iostream>\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int solve(vector<int>& nums) {\n        // your code\n        return 0;\n    }\n};`,
  java: `// Write your Java solution here...\nimport java.util.*;\n\npublic class Solution {\n    public int solve(int[] nums) {\n        // your code\n        return 0;\n    }\n}`
};

export default function InterviewPage() {
  const [mode, setMode] = useState<"selection" | "session" | "evaluation">("selection");
  const [interviewType, setInterviewType] = useState<string>("DSA");
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [code, setCode] = useState(boilerplates.javascript);
  const [language, setLanguage] = useState<"javascript" | "python" | "cpp" | "java">("javascript");
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runningTests, setRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<{
     success: boolean;
     feedback: string;
     testCases: { input: string; expected: string; output: string; passed: boolean }[];
  } | null>(null);
  const [activeTestTab, setActiveTestTab] = useState(0);

  // Multi-question solve tracking states
  const [completedQuestions, setCompletedQuestions] = useState<CompletedQuestion[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [currentQuestionText, setCurrentQuestionText] = useState<string>("");
  const [isQuestionLocked, setIsQuestionLocked] = useState<boolean>(false);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [selectedCompletedQuestion, setSelectedCompletedQuestion] = useState<CompletedQuestion | null>(null);
  
  // Draggable Split Panel States
  const [panelHeight, setPanelHeight] = useState(230);
  const [isDragging, setIsDragging] = useState(false);

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const { user } = useAuthStore();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Helper to extract question title safely
  const extractQuestionTitle = (text: string, index: number) => {
    if (!text) return `Question #${index + 1}`;
    const lines = text.split("\n");
    for (const line of lines) {
      const clean = line.replace(/[#*`]/g, "").trim();
      if (clean && clean.toLowerCase().startsWith("title:")) {
        return clean.replace(/title:/i, "").trim();
      }
      if (clean && clean.toLowerCase().includes("challenge")) {
        return clean;
      }
      if (line.trim().startsWith("#") || line.trim().startsWith("##")) {
        return clean;
      }
    }
    return `Challenge #${index + 1}`;
  };

  // Restore active session on mount
  useEffect(() => {
    const initSession = async () => {
      const activeId = localStorage.getItem("active_interview_id");
      if (activeId) {
        // Fast restore initial state from localStorage instantly to avoid selection flashes
        const localCode = localStorage.getItem(`active_code_${activeId}`);
        const localLang = localStorage.getItem(`active_lang_${activeId}`);
        const localCompleted = localStorage.getItem(`completed_questions_${activeId}`);
        const localIndex = localStorage.getItem(`active_index_${activeId}`);
        const localLocked = localStorage.getItem(`is_locked_${activeId}`);
        const localQText = localStorage.getItem(`current_question_${activeId}`);

        if (localCode) setCode(localCode);
        if (localLang) setLanguage(localLang as "javascript" | "python" | "cpp" | "java");
        if (localCompleted) setCompletedQuestions(JSON.parse(localCompleted));
        if (localIndex) setActiveIndex(parseInt(localIndex, 10));
        if (localLocked === "true") {
          setIsQuestionLocked(true);
          setIsTimerRunning(false);
        } else {
          setIsQuestionLocked(false);
          setIsTimerRunning(true);
        }
        if (localQText) setCurrentQuestionText(localQText);
        setMode("session");

        try {
          const res = await api.get<ApiResponse<InterviewSession>>(`/interview/session/${activeId}`);
          const fetchedSession = res.data.data;
          
          if (fetchedSession && fetchedSession.status === "ongoing") {
            setSession(fetchedSession);
            setInterviewType(fetchedSession.type || "DSA");
            
            // Restore transcript
            if (fetchedSession.transcript && fetchedSession.transcript.length > 0) {
              setMessages(fetchedSession.transcript);
            } else {
              setMessages([{ role: "assistant", content: localQText || fetchedSession.question }]);
            }
            
            // Restore progress timer if active
            if (localLocked !== "true" && fetchedSession.created_at) {
              const start = new Date(fetchedSession.created_at).getTime();
              const diffSec = Math.floor((Date.now() - start) / 1000);
              setTimer(diffSec > 0 ? diffSec : 0);
            }
          } else {
            localStorage.removeItem("active_interview_id");
            localStorage.removeItem("active_interview_type");
            setMode("selection");
          }
        } catch (err) {
          console.error("Failed to restore interview session", err);
          localStorage.removeItem("active_interview_id");
          localStorage.removeItem("active_interview_type");
          setMode("selection");
        }
      }
    };
    initSession();
  }, []);

  // Sync editor content back to storage for persistency on reload
  const handleCodeChange = (val: string | undefined) => {
    const nextCode = val || "";
    setCode(nextCode);
    if (session) {
      localStorage.setItem(`active_code_${session.id}`, nextCode);
    }
  };

  const handleLanguageChange = (nextLang: keyof typeof boilerplates) => {
    setLanguage(nextLang);
    const nextBoiler = boilerplates[nextLang];
    setCode(nextBoiler);
    if (session) {
      localStorage.setItem(`active_lang_${session.id}`, nextLang);
      localStorage.setItem(`active_code_${session.id}`, nextBoiler);
    }
  };

  // Exit Navigation Warning guards
  useEffect(() => {
    if (mode !== "session") return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Are you sure you want to leave? Your active interview session progress will be lost.";
      return e.returnValue;
    };

    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (anchor) {
        const href = anchor.getAttribute("href");
        if (href && !href.startsWith("#") && !href.startsWith("javascript:")) {
          e.preventDefault();
          e.stopPropagation();
          toast.error("You cannot leave the interview room while the session is active. Please click 'Finish Session' to submit and exit.");
        }
      }
    };

    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      toast.error("Navigation is disabled during a live interview. Click 'Finish Session' to complete the session.");
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    document.addEventListener("click", handleAnchorClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("click", handleAnchorClick, true);
    };
  }, [mode]);

  // Draggable slider calculation
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newHeight = window.innerHeight - e.clientY - 64; 
      if (newHeight >= 100 && newHeight <= window.innerHeight - 200) {
        setPanelHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const downloadReport = () => {
    if (!session || !session.evaluation) return;
    const doc = new jsPDF() as jsPDF & {
      autoTable: (options: Record<string, unknown>) => void;
      lastAutoTable?: { finalY: number };
    };
    const evalData = session.evaluation;

    doc.setFontSize(22);
    doc.setTextColor(14, 165, 233);
    doc.text("DEVARC INTERVIEW REPORT", 105, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Candidate: ${user?.name}`, 20, 40);
    doc.text(`Track: ${interviewType}`, 20, 50);
    doc.text(`Verdict: ${evalData.verdict}`, 20, 60);

    doc.autoTable({
      startY: 70,
      head: [['Metric', 'Score']],
      body: [
        ['Overall Logic', `${evalData.logicScore}%`],
        ['Code Quality', `${evalData.codeQualityScore}%`],
        ['Communication', `${evalData.communicationScore}%`],
        ['Total Score', `${evalData.totalScore}%`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [14, 165, 233] },
      margin: { top: 70 }
    });

    if (evalData.overallFeedback) {
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text("Overall Feedback:", 20, (doc.lastAutoTable?.finalY ?? 70) + 15);
      doc.setFontSize(10);
      doc.text(evalData.overallFeedback, 20, (doc.lastAutoTable?.finalY ?? 70) + 25, { maxWidth: 170 });
    }

    completedQuestions.forEach((cq, index) => {
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(14, 165, 233);
      doc.text(`Question #${index + 1}: ${cq.title}`, 20, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Time Elapsed: ${formatTime(cq.timeTaken)}`, 20, 30);
      doc.text(`Validation Passrate: ${cq.evaluation?.testCases?.filter((t: TestCaseResult) => t.passed).length || 0}/${cq.evaluation?.testCases?.length || 3} Cases`, 20, 38);

      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text("Submitted Candidate Code:", 20, 48);
      doc.setFontSize(8);
      
      // Split long code into lines for PDF output safety
      const splitCode = doc.splitTextToSize(cq.code, 170);
      doc.text(splitCode, 20, 55);

      doc.setFontSize(12);
      doc.text("Interviewer Diagnostic feedback:", 20, 180);
      doc.setFontSize(9);
      doc.text(doc.splitTextToSize(cq.evaluation?.feedback || "No specific feedback logged.", 170), 20, 187);
    });

    doc.save(`DevArc_Interview_${session.id.slice(0,8)}.pdf`);
    toast.success("Consolidated report downloaded!");
  };

  const startSession = async () => {
    setLoading(true);
    setTestResults(null);
    setCompletedQuestions([]);
    setActiveIndex(0);
    setIsQuestionLocked(false);
    setIsTimerRunning(true);
    setTimer(0);
    setSelectedCompletedQuestion(null);
    
    try {
      const res = await api.post<ApiResponse<InterviewSession>>("/interview/start", { 
        type: interviewType 
      });
      setSession(res.data.data);
      setCurrentQuestionText(res.data.data.question);
      setMessages([{ role: "assistant", content: res.data.data.question }]);
      
      // Persist active session context
      localStorage.setItem("active_interview_id", res.data.data.id);
      localStorage.setItem("active_interview_type", interviewType);
      localStorage.removeItem(`active_code_${res.data.data.id}`);
      localStorage.setItem(`active_lang_${res.data.data.id}`, language);
      localStorage.setItem(`completed_questions_${res.data.data.id}`, JSON.stringify([]));
      localStorage.setItem(`active_index_${res.data.data.id}`, "0");
      localStorage.setItem(`is_locked_${res.data.data.id}`, "false");
      localStorage.setItem(`current_question_${res.data.data.id}`, res.data.data.question);
      
      setMode("session");
    } catch (err) {
      toast.error("Failed to start interview session.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mode === "session" && isTimerRunning) {
      const interval = setInterval(() => setTimer(prev => prev + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [mode, isTimerRunning]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}.${secs.toString().padStart(2, "0")} Minute`;
  };

  const handleSubmitSolution = async () => {
    if (!session || loading || isQuestionLocked) return;
    setLoading(true);
    try {
      const res = await api.post("/interview/evaluate-question", {
        interviewId: session.id,
        code,
        language,
        questionText: currentQuestionText || session.question
      });
      
      const evalData = res.data.data.evaluationResult;
      
      setIsQuestionLocked(true);
      setIsTimerRunning(false);
      localStorage.setItem(`is_locked_${session.id}`, "true");
      
      if (res.data.data.updatedTranscript) {
        setMessages(res.data.data.updatedTranscript);
      }
      
      // Save current solved question properties
      const newCompletion = {
        index: activeIndex,
        title: extractQuestionTitle(currentQuestionText || session.question, activeIndex),
        questionText: currentQuestionText || session.question,
        code,
        language,
        evaluation: evalData,
        timeTaken: timer
      };
      
      const newCompletedList = [...completedQuestions, newCompletion];
      setCompletedQuestions(newCompletedList);
      localStorage.setItem(`completed_questions_${session.id}`, JSON.stringify(newCompletedList));
      
      toast.success("Solution submitted successfully! Interviewer review logged.");
    } catch (err) {
      toast.error("Failed to submit solution.");
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = async () => {
    if (!session || loading) return;
    setLoading(true);
    try {
      const res = await api.post("/interview/next-question", {
        interviewId: session.id,
        type: interviewType
      });
      
      const nextIndex = activeIndex + 1;
      setActiveIndex(nextIndex);
      localStorage.setItem(`active_index_${session.id}`, String(nextIndex));
      
      const newQ = res.data.data.newQuestion;
      setCurrentQuestionText(newQ);
      localStorage.setItem(`current_question_${session.id}`, newQ);
      
      const defaultBoiler = boilerplates[language];
      setCode(defaultBoiler);
      localStorage.setItem(`active_code_${session.id}`, defaultBoiler);
      
      setTimer(0);
      setIsTimerRunning(true);
      setIsQuestionLocked(false);
      localStorage.setItem(`is_locked_${session.id}`, "false");
      
      if (res.data.data.updatedTranscript) {
        setMessages(res.data.data.updatedTranscript);
      }
      
      setTestResults(null);
      toast.success(`Loaded question #${nextIndex + 1}!`);
    } catch (err) {
      toast.error("Failed to generate next question.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !session || loading) return;

    const userMsg = input.trim();
    setInput("");

    // Intercept chat keywords like next question
    if (userMsg.toLowerCase() === "next question") {
      if (isQuestionLocked) {
        handleNextQuestion();
        return;
      } else {
        toast.warning("Please submit your current solution before requesting the next question.");
        return;
      }
    }

    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
       const res = await api.post<ApiResponse<{ response: string }>>("/interview/message", {
          interviewId: session.id,
          message: userMsg
       });
       setMessages(prev => [...prev, { role: "assistant", content: res.data.data.response }]);
    } catch (err) {
       toast.error("Interviewer did not reply. Please try again.");
    } finally {
       setLoading(false);
    }
  };

  const handleRunCode = async () => {
    if (!session || runningTests || isQuestionLocked) return;
    setRunningTests(true);
    setTestResults(null);
    try {
      const res = await api.post<ApiResponse<{
         success: boolean;
         feedback: string;
         testCases: { input: string; expected: string; output: string; passed: boolean }[];
      }>>("/interview/test", {
         interviewId: session.id,
         code: code,
         language: language
      });
      setTestResults(res.data.data);
      setActiveTestTab(0);
      if (res.data.data.success) {
         toast.success("All test cases passed!");
      } else {
         toast.error("Failed test cases detected.");
      }
    } catch (err) {
      toast.error("Failed to run code evaluation. Try again.");
    } finally {
      setRunningTests(false);
    }
  };

  const handleFinish = async () => {
    if (!session || submitting) return;
    setSubmitting(true);
    try {
      const res = await api.post<ApiResponse<InterviewSession>>("/interview/finish", {
        interviewId: session.id,
        code: code,
        language: language,
        completedQuestions
      });

      // Clean up search persistence
      localStorage.removeItem("active_interview_id");
      localStorage.removeItem("active_interview_type");
      localStorage.removeItem(`active_code_${session.id}`);
      localStorage.removeItem(`active_lang_${session.id}`);
      localStorage.removeItem(`completed_questions_${session.id}`);
      localStorage.removeItem(`is_locked_${session.id}`);
      localStorage.removeItem(`current_question_${session.id}`);
      localStorage.removeItem(`active_index_${session.id}`);

      setSession(res.data.data);
      setMode("evaluation");
      toast.success("Interview completed! Generating your report...");
    } catch (err) {
      toast.error("Failed to generate evaluation.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReattempt = () => {
     localStorage.removeItem("active_interview_id");
     localStorage.removeItem("active_interview_type");
     setMode("selection");
     setSession(null);
     setCode(boilerplates.javascript);
     setLanguage("javascript");
     setTimer(0);
     setTestResults(null);
     setMessages([]);
  };

  const renderFormattedText = (text: string) => {
    if (!text) return null;
    return text.split("\n").map((line, idx) => {
      let formatted = line;
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      formatted = formatted.replace(/`(.*?)`/g, "<code class='px-1.5 py-0.5 bg-zinc-800 rounded font-mono text-xs text-primary'>$1</code>");

      if (formatted.startsWith("### ")) {
        return <h3 key={idx} className="text-base font-bold my-3 text-white border-b border-white/5 pb-1" dangerouslySetInnerHTML={{ __html: formatted.slice(4) }} />;
      }
      if (formatted.startsWith("## ")) {
        return <h2 key={idx} className="text-lg font-bold my-4 text-white" dangerouslySetInnerHTML={{ __html: formatted.slice(3) }} />;
      }
      if (formatted.startsWith("# ")) {
        return <h1 key={idx} className="text-2xl font-bold my-5 text-white" dangerouslySetInnerHTML={{ __html: formatted.slice(2) }} />;
      }
      if (formatted.trim().startsWith("- ") || formatted.trim().startsWith("* ")) {
        const content = formatted.trim().slice(2);
        return <li key={idx} className="ml-4 list-disc text-sm text-zinc-350 my-1.5" dangerouslySetInnerHTML={{ __html: content }} />;
      }
      if (formatted.trim() === "") {
        return <div key={idx} className="h-3" />;
      }
      return <p key={idx} className="text-sm text-zinc-355 leading-relaxed my-2" dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  if (mode === "selection") {
    return (
      <div className="min-h-[calc(100vh-64px)] w-full flex flex-col items-center justify-center bg-[#0a0a0a] px-6 text-center">
         <div className="max-w-2xl w-full space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
               <div className="h-16 w-16 bg-primary/10 border border-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/5">
                  <BrainCircuit size={32} className="text-primary" />
               </div>
               <h1 className="text-4xl font-bold text-white tracking-tight">AI Mock Interview Room</h1>
               <p className="text-zinc-500 text-lg">Test your software engineering expertise under dynamic tech interview scenarios.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
               {[
                 { id: "DSA", name: "Data Structures", desc: "Arrays, Trees, Graphs, DP" },
                 { id: "System Design", name: "System Design", desc: "Scalability, LLD, HLD" },
                 { id: "Frontend", name: "Frontend Core", desc: "React, Performance, JS" },
                 { id: "Frameworks", name: "Frameworks", desc: "Node.js, Next.js, Django" }
               ].map((type) => (
                  <button 
                    key={type.id}
                    onClick={() => setInterviewType(type.id)}
                    className={cn(
                      "p-6 rounded-3xl border text-left transition-all group relative overflow-hidden",
                      interviewType === type.id 
                        ? "bg-primary/10 border-primary shadow-lg shadow-primary/5" 
                        : "bg-white/5 border-white/5 hover:border-zinc-700"
                    )}
                  >
                     {interviewType === type.id && (
                       <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary animate-pulse" />
                     )}
                     <h3 className={cn("font-bold mb-1 transition-colors", interviewType === type.id ? "text-primary" : "text-white")}>{type.name}</h3>
                     <p className="text-[10px] text-zinc-550 font-bold uppercase tracking-widest">{type.desc}</p>
                  </button>
               ))}
            </div>

            <Button 
               className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all group"
               onClick={startSession}
               disabled={loading}
             >
               {loading ? <Loader2 className="animate-spin mr-2" /> : "Start Interview Room"}
               <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
         </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#0a0a0a] overflow-hidden select-none">
      
      {/* Sidebar Questions Tracker Panel */}
      <div className="w-16 bg-zinc-950 border-r border-[#161616] flex flex-col items-center py-4 space-y-4 shrink-0 z-30">
         <Badge className="bg-primary/20 text-primary border-none text-[8px] font-bold px-1.5 uppercase font-mono mb-2 select-none">Mock</Badge>
         
         <button 
           onClick={() => setSelectedCompletedQuestion(null)}
           className={cn(
             "h-10 w-10 rounded-xl flex items-center justify-center border transition-all cursor-pointer",
             selectedCompletedQuestion === null 
               ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20" 
               : "bg-zinc-900 border-white/5 text-zinc-400 hover:text-white"
           )}
           title="Active Sandbox Workspace"
         >
            <BrainCircuit size={18} />
         </button>
         
         <div className="w-8 border-t border-white/5 my-2" />
         
         {completedQuestions.map((cq, idx) => (
            <button 
              key={idx}
              onClick={() => setSelectedCompletedQuestion(cq)}
              className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center border transition-all cursor-pointer relative",
                selectedCompletedQuestion?.index === cq.index 
                  ? "bg-zinc-800 border-primary text-primary" 
                  : "bg-zinc-900 border-white/5 text-zinc-400 hover:text-white"
              )}
              title={cq.title}
            >
               <span className="text-[10px] font-bold font-mono">Q{idx + 1}</span>
               <div className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 text-[8px] font-bold text-white flex items-center justify-center shadow">
                  ✓
               </div>
            </button>
         ))}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {selectedCompletedQuestion ? (
          /* Completed Question Read-Only Review Panel */
          <div className="flex-1 p-8 bg-zinc-950/80 overflow-y-auto space-y-8 select-text">
             <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                   <h2 className="text-xl font-bold text-white tracking-tight">{selectedCompletedQuestion.title}</h2>
                   <p className="text-[9px] text-zinc-550 uppercase tracking-widest font-bold mt-1">Mock Interview submission review</p>
                </div>
                <Button 
                   variant="outline" 
                   className="border-white/10 text-xs font-bold rounded-xl h-9 text-zinc-300 hover:text-white bg-zinc-900/50 hover:bg-zinc-900"
                   onClick={() => setSelectedCompletedQuestion(null)}
                >
                   Back to Active Workspace
                </Button>
             </div>

             <div className="grid grid-cols-3 gap-6">
                <div className="p-4 bg-zinc-900/30 border border-white/5 rounded-2xl">
                   <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Time Taken</span>
                   <span className="text-sm font-bold text-white font-mono">{formatTime(selectedCompletedQuestion.timeTaken)}</span>
                </div>
                <div className="p-4 bg-zinc-900/30 border border-white/5 rounded-2xl">
                   <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Status</span>
                   <span className="text-sm font-bold text-emerald-500 font-sans uppercase">Submitted</span>
                </div>
                <div className="p-4 bg-zinc-900/30 border border-white/5 rounded-2xl">
                   <span className="text-[9px] font-bold text-[#fafafa] uppercase tracking-widest block mb-1">Test Cases passed</span>
                   <span className="text-sm font-bold text-emerald-500 font-mono">
                      {selectedCompletedQuestion.evaluation?.testCases?.filter((t: TestCaseResult) => t.passed).length || 0} / {selectedCompletedQuestion.evaluation?.testCases?.length || 3} Passed
                   </span>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                   <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Question Details</h3>
                   <div className="p-5 bg-zinc-900/10 border border-white/5 rounded-2xl max-h-[350px] overflow-y-auto min-h-[300px]">
                      {renderFormattedText(selectedCompletedQuestion.questionText)}
                   </div>
                </div>
                <div className="space-y-3">
                   <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-sans">Submitted Code ({selectedCompletedQuestion.language})</h3>
                   <div className="border border-white/5 rounded-2xl overflow-hidden min-h-[300px] bg-zinc-950">
                      <Editor
                        height="300px"
                        theme="vs-dark"
                        language={selectedCompletedQuestion.language}
                        value={selectedCompletedQuestion.code}
                        options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13 }}
                      />
                   </div>
                </div>
             </div>
          </div>
        ) : (
          /* Active Interactive Workspace Grid Space */
          <>
            {/* Left Panel: Chat Interface */}
            <div className="w-[32%] flex flex-col border-r border-[#161616] bg-zinc-950/50 shrink-0">
               <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/40">
                  <div className="flex items-center gap-3">
                     <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                        <Bot size={18} className="text-primary" />
                     </div>
                     <div>
                        <p className="text-xs font-bold text-white uppercase tracking-wider font-sans">AI Interviewer</p>
                        <Badge variant="outline" className="text-[9px] h-4 bg-emerald-500/10 text-emerald-500 border-none font-extrabold tracking-widest">ACTIVE</Badge>
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                     <div className="flex items-center gap-2 text-zinc-400">
                        <Timer size={14} />
                        <span className="text-xs font-mono font-bold tracking-widest">{formatTime(timer)}</span>
                     </div>
                     <Button 
                       variant="destructive" 
                       size="sm" 
                       className="h-8 text-[10px] font-bold uppercase tracking-widest px-4 shadow-lg shadow-red-500/10 cursor-pointer font-sans"
                       onClick={handleFinish}
                       disabled={submitting}
                     >
                       {submitting ? <Loader2 size={12} className="animate-spin mr-2" /> : <Flag size={12} className="mr-2" />}
                       Finish Session
                     </Button>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide select-text">
                  {/* Active Question Title & Text Card */}
                  <div className="p-5 rounded-2xl bg-zinc-900/40 border border-white/5 space-y-3">
                     <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-primary uppercase tracking-wider font-sans">Question {activeIndex + 1}</h3>
                        <Badge className="bg-primary/10 text-primary border-none text-[9px] font-bold px-2 py-0.5 font-mono">
                           {currentQuestionText ? (currentQuestionText.includes("Hard") ? "Hard" : currentQuestionText.includes("Medium") ? "Medium" : "Easy") : "Medium"}
                        </Badge>
                     </div>
                     <div className="text-xs text-zinc-350 select-text leading-relaxed font-sans max-h-40 overflow-y-auto pr-2 scrollbar-thin">
                        {currentQuestionText ? renderFormattedText(currentQuestionText) : "Loading question..."}
                     </div>
                  </div>

                  <div className="h-px bg-white/5 my-4" />

                  {messages.map((msg, idx) => (
                    <div key={idx} className={cn(
                      "flex gap-4 max-w-[92%]",
                      msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}>
                       <div className={cn(
                         "h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-md",
                         msg.role === "assistant" ? "bg-zinc-800 text-zinc-355 border border-white/5" : "bg-primary text-primary-foreground font-bold text-xs"
                       )}>
                         {msg.role === "assistant" ? <Bot size={16} /> : <User size={16} />}
                       </div>
                       <div className={cn(
                         "p-4 rounded-2xl text-sm leading-relaxed shadow-lg border",
                         msg.role === "assistant" 
                           ? "bg-zinc-900/80 text-zinc-200 border-white/5" 
                           : "bg-primary/10 text-white border-primary/20 shadow-lg shadow-primary/5"
                       )}>
                         {msg.role === "assistant" ? renderFormattedText(msg.content) : msg.content}
                       </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-4 animate-pulse">
                       <div className="h-8 w-8 rounded-xl bg-zinc-800 flex items-center justify-center border border-white/5">
                          <Bot size={16} className="text-zinc-550 animate-spin" />
                       </div>
                       <div className="p-4 rounded-2xl bg-zinc-900/50 text-zinc-500 text-xs italic border border-white/5">
                          Interviewer is analyzing solution...
                       </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
               </div>

               <div className="p-6 bg-black/40 border-t border-white/5">
                  <div className="relative group">
                     <textarea 
                       placeholder="Explain your thought process..."
                       className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl p-4 pr-12 text-sm text-white placeholder:text-zinc-650 focus:border-primary/55 transition-all outline-none resize-none h-24"
                       value={input}
                       onChange={(e) => setInput(e.target.value)}
                       onKeyDown={(e) => {
                         if (e.key === "Enter" && !e.shiftKey) {
                           e.preventDefault();
                           handleSendMessage();
                         }
                       }}
                     />
                     <Button 
                       size="icon" 
                       className="absolute bottom-4 right-4 h-8 w-8 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 cursor-pointer"
                       onChange={() => {}}
                       onClick={handleSendMessage}
                       disabled={loading || !input.trim()}
                     >
                       <Send size={14} />
                     </Button>
                  </div>
               </div>
            </div>

            {/* Right Panel: Code Sandbox Editor & Test Panel */}
      <div className="flex-1 flex flex-col bg-[#1e1e1e] relative">
         {/* Sandbox Header */}
         <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-zinc-900/60 z-10">
            <div className="flex items-center gap-3">
               <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] font-sans">Solution Sandbox</span>
               <div className="h-4 w-px bg-white/10" />
               
               {/* Language Dropdown Select */}
               <select
                 value={language}
                 onChange={(e) => handleLanguageChange(e.target.value as keyof typeof boilerplates)}
                 className="bg-zinc-800/80 text-[11px] text-zinc-300 border border-white/10 rounded-lg px-2.5 py-1 outline-none cursor-pointer focus:border-primary/50 transition-all font-mono"
                 disabled={isQuestionLocked}
               >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="cpp">C++</option>
                  <option value="java">Java</option>
               </select>
            </div>
            
            <div className="flex items-center gap-2">
               <Button
                 className="h-8 text-[10px] bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 font-bold uppercase tracking-widest px-4 rounded-lg flex items-center gap-2 transition-all cursor-pointer font-sans"
                 onClick={handleRunCode}
                 disabled={runningTests || isQuestionLocked}
               >
                  {runningTests ? (
                     <Loader2 size={12} className="animate-spin" />
                  ) : (
                     <Play size={12} />
                  )}
                  Run Tests
               </Button>

               <Button
                 className={cn(
                   "h-8 text-[10px] font-bold uppercase tracking-widest px-4 rounded-lg flex items-center gap-2 transition-all cursor-pointer font-sans",
                   isQuestionLocked 
                     ? "bg-zinc-800 text-zinc-550 border border-zinc-700 cursor-not-allowed" 
                     : "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 shadow-lg shadow-emerald-500/10"
                 )}
                 onClick={handleSubmitSolution}
                 disabled={loading || isQuestionLocked}
               >
                  {loading ? (
                     <Loader2 size={12} className="animate-spin" />
                  ) : (
                     <CheckCircle2 size={12} />
                  )}
                  Submit Solution
               </Button>
            </div>
         </div>

         {/* Lock status and Next Question prompt */}
         {isQuestionLocked && (
            <div className="bg-emerald-500/15 border-b border-emerald-505/20 px-6 py-2.5 flex items-center justify-between z-10 animate-in slide-in-from-top duration-300">
               <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-505 animate-pulse" />
                  <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider font-mono">Solution Locked & Submitted</span>
               </div>
               <Button
                 onClick={handleNextQuestion}
                 className="h-7 text-[9px] bg-primary hover:bg-primary/95 text-primary-foreground font-black uppercase tracking-wider px-3.5 rounded-lg flex items-center gap-1.5 transition-all shadow cursor-pointer"
               >
                  Next Question <ArrowRight size={11} />
               </Button>
            </div>
         )}

         {/* Monaco Code Editor Pane */}
         <div className="flex-1 overflow-hidden select-text" style={{ height: `calc(100% - ${panelHeight + 56}px)` }}>
            <Editor
              height="100%"
              theme="vs-dark"
              language={language === "cpp" ? "cpp" : language === "java" ? "java" : language === "python" ? "python" : "javascript"}
              value={code}
              onChange={handleCodeChange}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: "on",
                fontFamily: "var(--font-mono)",
                padding: { top: 20 },
              }}
            />
         </div>

         {/* Draggable Panel Split Resize Divider */}
         <div 
           onMouseDown={startDrag}
           className={cn(
             "h-1.5 cursor-ns-resize bg-white/5 hover:bg-primary/60 transition-all z-35 relative flex items-center justify-center",
             isDragging ? "bg-primary/80" : ""
           )}
         >
           <div className="h-0.5 w-6 rounded bg-zinc-700/60" />
         </div>

         {/* Sandbox Test Runner Output */}
         <div className="border-t border-white/5 bg-zinc-950 flex flex-col relative z-20" style={{ height: `${panelHeight}px` }}>
            <div className="h-10 border-b border-white/5 flex items-center justify-between px-6 bg-black/40">
               <div className="flex items-center gap-2">
                  <Play size={12} className="text-primary" />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-sans">Execution Report</span>
               </div>
               
               {testResults && (
                  <div className="flex items-center gap-2 animate-in fade-in duration-300">
                     <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider font-sans">VERDICT:</span>
                     <Badge 
                       className={cn(
                          "text-[9px] font-extrabold uppercase px-2 py-0.5 border shadow-sm",
                          testResults.success 
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                       )}
                     >
                        {testResults.success ? "ACCEPTED" : "WRONG ANSWER"}
                     </Badge>
                  </div>
               )}
            </div>
            
            <div className="flex-1 flex overflow-hidden">
               {/* Test Case Indicator Tabs */}
               <div className="w-1/4 border-r border-white/5 flex flex-col divide-y divide-white/5 overflow-y-auto scrollbar-hide">
                 {testResults ? (
                   testResults.testCases.map((tc, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveTestTab(idx)}
                        className={cn(
                           "p-3 text-left transition-all hover:bg-white/5 flex items-center justify-between outline-none cursor-pointer",
                           activeTestTab === idx ? "bg-white/5 border-l-2 border-primary" : ""
                        )}
                      >
                         <span className="text-[10px] font-extrabold text-zinc-350 font-mono">Test Case {idx + 1}</span>
                         {tc.passed ? (
                            <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />
                         ) : (
                            <XCircle size={12} className="text-rose-500 flex-shrink-0" />
                         )}
                      </button>
                   ))
                 ) : (
                   <div className="p-4 text-center text-[10px] text-zinc-650 font-bold font-mono">
                      No Runs Logged
                   </div>
                 )}
               </div>

               {/* Tab Input/Expected/Output Panel */}
               <div className="flex-1 p-4 overflow-y-auto space-y-4 select-text">
                 {testResults ? (
                    <div className="space-y-3 animate-in fade-in duration-300">
                       <p className="text-[11px] text-zinc-400 italic font-sans">
                          <strong className="text-zinc-300 uppercase tracking-widest text-[9px] mr-1.5 not-italic select-none font-sans">AI Mentor Feedback:</strong> 
                          &quot;{testResults.feedback}&quot;
                       </p>
                       
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-0.5">
                             <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-widest select-none font-sans">Input</span>
                             <pre className="p-2 bg-zinc-900 rounded-lg text-xs font-mono text-zinc-300 overflow-x-auto select-all max-h-12 scrollbar-hide">
                                {testResults.testCases[activeTestTab]?.input}
                             </pre>
                          </div>
                          
                          <div className="space-y-0.5">
                             <span className="text-[9px] font-bold text-zinc-555 uppercase tracking-widest select-none font-sans">Expected Output</span>
                             <pre className="p-2 bg-zinc-900 rounded-lg text-xs font-mono text-zinc-300 overflow-x-auto select-all max-h-12 scrollbar-hide font-mono">
                                {testResults.testCases[activeTestTab]?.expected}
                             </pre>
                          </div>
                       </div>

                       <div className="space-y-0.5">
                          <span className="text-[9px] font-bold text-zinc-555 uppercase tracking-widest select-none font-sans">Candidate Output</span>
                          <pre className={cn(
                             "p-2 bg-zinc-900 rounded-lg text-xs font-mono overflow-x-auto select-all max-h-12 scrollbar-hide",
                             testResults.testCases[activeTestTab]?.passed ? "text-emerald-450 bg-emerald-500/5 border border-emerald-500/10" : "text-rose-455 bg-rose-500/5 border border-rose-500/10"
                          )}>
                             {testResults.testCases[activeTestTab]?.output}
                          </pre>
                       </div>
                    </div>
                 ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 space-y-2 select-none">
                       <Play size={20} className="text-zinc-650 animate-pulse" />
                       <p className="text-xs font-sans">Write your implementation. Switch languages and click <strong className="text-primary font-bold">Run Tests</strong> to validate your solution.</p>
                       <p className="text-[10px] text-zinc-600 font-mono">Dynamic AI evaluation handles normal, edge case, and performance inputs.</p>
                    </div>
                 )}
                </div>
             </div>
          </div>
       </div>
      </>
    )}
  </div>

      {/* Evaluation Results Overlay */}
      {mode === "evaluation" && session?.evaluation && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-black/80 animate-in fade-in duration-500">
           <Card className="w-full max-w-2xl bg-zinc-950 border-white/10 shadow-2xl relative overflow-hidden">
              {/* Background Accent */}
              <div className={cn(
                "absolute top-0 inset-x-0 h-1.5",
                session.evaluation.verdict.includes("HIRE") ? "bg-emerald-500" : "bg-red-500"
              )} />
              
              <CardHeader className="text-center pb-2">
                 <div className="mx-auto h-16 w-16 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center mb-4">
                    <Trophy size={32} className="text-primary" />
                 </div>
                 <CardTitle className="text-2xl font-bold text-white tracking-tight">Interview Complete</CardTitle>
                 <CardDescription className="uppercase tracking-widest text-[10px] font-bold text-zinc-500 font-sans">Evaluation Summary</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6 select-text">
                 <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "Logic", value: session.evaluation.logicScore, color: "text-blue-500" },
                      { label: "Quality", value: session.evaluation.codeQualityScore, color: "text-emerald-500" },
                      { label: "Comm.", value: session.evaluation.communicationScore, color: "text-primary" }
                    ].map((s) => (
                      <div key={s.label} className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                         <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{s.label}</p>
                         <p className={cn("text-2xl font-bold font-mono", s.color)}>{s.value}%</p>
                      </div>
                    ))}
                 </div>

                 <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-2 font-sans">
                       <CheckCircle2 size={14} /> Overall Feedback
                    </h4>
                    <p className="text-sm text-zinc-300 leading-relaxed italic">
                      &#34;{session.evaluation.overallFeedback}&#34;
                    </p>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2 font-sans">
                          <CheckCircle2 size={12} /> Key Strengths
                       </p>
                       <ul className="space-y-1">
                          {session.evaluation.strengths && session.evaluation.strengths.map((s: string) => (
                            <li key={s} className="text-xs text-zinc-400">• {s}</li>
                          ))}
                       </ul>
                    </div>
                    <div className="space-y-2">
                       <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 font-sans">
                          <XCircle size={12} /> Improvement Areas
                       </p>
                       <ul className="space-y-1">
                          {session.evaluation.weaknesses && session.evaluation.weaknesses.map((w: string) => (
                            <li key={w} className="text-xs text-zinc-650">• {w}</li>
                          ))}
                       </ul>
                    </div>
                 </div>

                 <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <div className="flex items-center gap-4">
                       <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-sans">Final Verdict</p>
                       <Badge className={cn(
                          "px-4 h-8 rounded-full font-bold",
                          session.evaluation.verdict === "STRONG HIRE" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" :
                          session.evaluation.verdict === "HIRE" ? "bg-primary text-white shadow-lg shadow-primary/20" :
                          "bg-zinc-800 text-zinc-400"
                       )}>
                          {session.evaluation.verdict}
                       </Badge>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline"
                        className="rounded-xl h-10 gap-2 border-white/10 bg-zinc-900 text-zinc-400 hover:text-white"
                        onClick={downloadReport}
                      >
                         <Download size={14} />
                         Download PDF
                      </Button>
                      
                      <Button 
                        variant="outline"
                        className="rounded-xl h-10 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold border-zinc-700"
                        onClick={handleReattempt}
                      >
                         Attempt Again
                      </Button>

                      <Button 
                        className="rounded-xl h-10 px-6 bg-primary text-primary-foreground hover:opacity-90 font-bold"
                        onClick={() => window.location.href = "/dashboard"}
                      >
                        Dashboard
                      </Button>
                    </div>
                 </div>
              </CardContent>
           </Card>
        </div>
      )}
    </div>
  );
}
