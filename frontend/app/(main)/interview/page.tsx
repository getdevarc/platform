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
  Download
} from "lucide-react";
import Editor from "@monaco-editor/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface InterviewSession {
  id: string;
  question: string;
  transcript: Message[];
  evaluation?: any;
}

export default function InterviewPage() {
  const [mode, setMode] = useState<"selection" | "session" | "evaluation">("selection");
  const [interviewType, setInterviewType] = useState<string>("DSA");
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [code, setCode] = useState("// Write your solution here...");
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuthStore();
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const downloadReport = () => {
    if (!session || !session.evaluation) return;
    const doc = new (jsPDF as any)();
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
      doc.text("Overall Feedback:", 20, (doc as any).lastAutoTable.finalY + 15);
      doc.setFontSize(10);
      doc.text(evalData.overallFeedback, 20, (doc as any).lastAutoTable.finalY + 25, { maxWidth: 170 });
    }

    doc.save(`DevArc_Interview_${session.id.slice(0,8)}.pdf`);
    toast.success("Report downloaded!");
  };

  const startSession = async () => {
    setLoading(true);
    try {
      const res = await api.post<ApiResponse<InterviewSession>>("/interview/start", { 
        type: interviewType 
      });
      setSession(res.data.data);
      setMessages([{ role: "assistant", content: res.data.data.question }]);
      setMode("session");
    } catch (err) {
      toast.error("Failed to start interview session.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mode === "session") {
      const interval = setInterval(() => setTimer(prev => prev + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [mode]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !session || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await api.post<ApiResponse<{ response: string }>>("/interview/message", {
        interviewId: session.id,
        message: userMsg
      });
      setMessages(prev => [...prev, { role: "assistant", content: res.data.data.response }]);
    } catch (err) {
      toast.error("AI Interviewer is unresponsive. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    if (!session || submitting) return;
    setSubmitting(true);
    try {
      const res = await api.post<ApiResponse<InterviewSession>>("/interview/finish", {
        interviewId: session.id
      });
      setSession(res.data.data);
      setMode("evaluation");
      toast.success("Interview completed! Generating your report...");
    } catch (err) {
      toast.error("Failed to generate evaluation.");
    } finally {
      setSubmitting(false);
    }
  };

  if (mode === "selection") {
    return (
      <div className="min-h-[calc(100vh-64px)] w-full flex flex-col items-center justify-center bg-[#0a0a0a] px-6 text-center">
         <div className="max-w-2xl w-full space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
               <div className="h-16 w-16 bg-primary/10 border border-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/5">
                  <BrainCircuit size={32} className="text-primary" />
               </div>
               <h1 className="text-4xl font-bold text-white tracking-tight">AI Mock Interview</h1>
               <p className="text-zinc-500 text-lg">Prepare for your dream role with real-time feedback and detailed analysis.</p>
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
                     <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{type.desc}</p>
                  </button>
               ))}
            </div>

            <Button 
               className="w-full h-14 rounded-2xl bg-primary text-white font-bold text-sm uppercase tracking-widest shadow-lg shadow-primary/20 group"
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
    <div className="flex h-[calc(100vh-64px)] bg-[#0a0a0a] overflow-hidden">
      
      {/* Left Panel: Chat Interface */}
      <div className="w-1/2 flex flex-col border-r border-white/5 bg-zinc-950/50">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/40">
           <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                 <Bot size={18} className="text-primary" />
              </div>
              <div>
                 <p className="text-xs font-bold text-white uppercase tracking-wider">AI Interviewer</p>
                 <Badge variant="outline" className="text-[10px] h-4 bg-emerald-500/10 text-emerald-500 border-none">ACTIVE</Badge>
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
                className="h-8 text-[10px] font-bold uppercase tracking-widest px-4 shadow-lg shadow-red-500/10"
                onClick={handleFinish}
                disabled={submitting}
              >
                {submitting ? <Loader2 size={12} className="animate-spin mr-2" /> : <Flag size={12} className="mr-2" />}
                Finish
              </Button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {messages.map((msg, idx) => (
            <div key={idx} className={cn(
              "flex gap-4 max-w-[90%]",
              msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            )}>
              <div className={cn(
                "h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1",
                msg.role === "assistant" ? "bg-zinc-800 text-zinc-400" : "bg-primary text-primary-foreground"
              )}>
                {msg.role === "assistant" ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className={cn(
                "p-4 rounded-2xl text-sm leading-relaxed",
                msg.role === "assistant" 
                  ? "bg-zinc-900/80 text-zinc-300 border border-white/5" 
                  : "bg-primary/10 text-white border border-primary/20 shadow-lg shadow-primary/5"
              )}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-4">
               <div className="h-8 w-8 rounded-xl bg-zinc-800 flex items-center justify-center animate-pulse">
                  <Bot size={16} className="text-zinc-600" />
               </div>
               <div className="p-4 rounded-2xl bg-zinc-900/50 text-zinc-500 text-xs italic">
                  Interviewer is thinking...
               </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-6 bg-black/40 border-t border-white/5">
           <div className="relative group">
              <textarea 
                placeholder="Explain your thought process..."
                className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl p-4 pr-12 text-sm text-white placeholder:text-zinc-600 focus:border-primary/50 transition-all outline-none resize-none h-24"
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
                className="absolute bottom-4 right-4 h-8 w-8 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                onClick={handleSendMessage}
                disabled={loading || !input.trim()}
              >
                <Send size={14} />
              </Button>
           </div>
        </div>
      </div>

      {/* Right Panel: Editor Interface */}
      <div className="flex-1 flex flex-col bg-[#1e1e1e]">
         <div className="h-12 border-b border-white/5 flex items-center px-6 bg-zinc-900/40">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Solution Sandbox</span>
         </div>
         <div className="flex-1">
            <Editor
              height="100%"
              theme="vs-dark"
              defaultLanguage="javascript"
              value={code}
              onChange={(val) => setCode(val || "")}
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
                 <CardTitle className="text-2xl font-bold text-white tracking-tight">Interview Report</CardTitle>
                 <CardDescription className="uppercase tracking-widest text-[10px] font-bold text-zinc-500">Evaluation Summary</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-8">
                 <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "Logic", value: session.evaluation.logicScore, color: "text-blue-500" },
                      { label: "Quality", value: session.evaluation.codeQualityScore, color: "text-emerald-500" },
                      { label: "Comm.", value: session.evaluation.communicationScore, color: "text-primary" }
                    ].map((s) => (
                      <div key={s.label} className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                         <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{s.label}</p>
                         <p className={cn("text-2xl font-bold", s.color)}>{s.value}%</p>
                      </div>
                    ))}
                 </div>

                 <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                       <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                          <CheckCircle2 size={14} /> Overall Feedback
                       </h4>
                       <p className="text-sm text-zinc-300 leading-relaxed italic">
                         "{session.evaluation.overallFeedback}"
                       </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                             <CheckCircle2 size={12} /> Key Strengths
                          </p>
                          <ul className="space-y-1">
                             {session.evaluation.strengths.map((s: string) => (
                               <li key={s} className="text-xs text-zinc-400">• {s}</li>
                             ))}
                          </ul>
                       </div>
                       <div className="space-y-2">
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                             <XCircle size={12} /> Improvement Areas
                          </p>
                          <ul className="space-y-1">
                             {session.evaluation.weaknesses.map((w: string) => (
                               <li key={w} className="text-xs text-zinc-600">• {w}</li>
                             ))}
                          </ul>
                       </div>
                    </div>
                 </div>

                 <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <div className="flex items-center gap-4">
                       <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Final Verdict</p>
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
                        className="rounded-xl h-10 px-6 bg-white text-black hover:bg-zinc-200 font-bold"
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
