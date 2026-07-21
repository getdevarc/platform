"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, Code2, Compass, Speech, Cpu, ArrowRight, CheckCircle2, ChevronRight, 
  Terminal, ShieldCheck, ChevronDown, User, Star, Award
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

// FAQ interface
interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: "How does the AI create my career roadmap?",
    a: "Our AI scans your uploaded resume, professional background, and timeline goals against target descriptions from top tech companies. It then identifies skill gaps and designs a step-by-step milestone path to bridge them."
  },
  {
    q: "Can I simulate realistic technical interviews?",
    a: "Yes. Our mock interview sandbox hosts active text-and-voice coding simulations. An AI interviewer asks dynamic follow-ups based on your code choices and grades you across Logic, Code Quality, and Communication."
  },
  {
    q: "Is Monaco Editor fully custom-configured?",
    a: "DevArc uses the exact editor engine that powers VS Code. We focus strictly on boosting your typing flow and surrounding it with contextual AI code analysis, hint actions, and console results."
  },
  {
    q: "How is DevArc different from standard problem platforms?",
    a: "Standard platforms focus on rote memorization of problems. DevArc is a career copilot that integrates resume audits, roadmap checkpoints, active problem sandboxes, and speech mock interviews into a single, cohesive developer workspace."
  }
];

export default function LandingPage() {
  const { isAuthenticated, loading } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"roadmap" | "workspace" | "interview">("roadmap");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary font-sans relative overflow-hidden">
      
      {/* 1. FLOATING HEADER */}
      <header className="fixed top-0 left-0 w-full z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3 rounded-full border border-border bg-card/60 backdrop-blur-lg shadow-xl shadow-background/10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-extrabold text-md shadow-lg shadow-primary/20">
              DA
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              DevArc
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#different" className="text-xs text-muted-foreground hover:text-foreground font-medium uppercase tracking-wider transition-colors">Differentiation</a>
            <a href="#lifecycle" className="text-xs text-muted-foreground hover:text-foreground font-medium uppercase tracking-wider transition-colors">Developer Loop</a>
            <a href="#previews" className="text-xs text-muted-foreground hover:text-foreground font-medium uppercase tracking-wider transition-colors">Product Preview</a>
            <a href="#faq" className="text-xs text-muted-foreground hover:text-foreground font-medium uppercase tracking-wider transition-colors">FAQ</a>
          </nav>
          
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="h-4 w-4 rounded-full border border-primary border-t-transparent animate-spin" />
            ) : isAuthenticated ? (
              <Button 
                onClick={() => router.push("/dashboard")}
                className="h-9 px-4 rounded-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold uppercase tracking-widest text-[10px]"
              >
                Go to Workspace <ArrowRight size={12} className="ml-1" />
              </Button>
            ) : (
              <>
                <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground font-bold uppercase tracking-widest px-3">
                  Sign In
                </Link>
                <Button 
                  onClick={() => router.push("/register")}
                  className="h-9 px-4 rounded-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/10"
                >
                  Join Waiting List
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[120px] -z-10" />
        <div className="absolute top-0 left-0 w-full h-[600px] bg-[radial-gradient(circle_at_50%_0%,_var(--muted),_transparent_60%)] -z-15" />
        
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-primary/10 border border-primary/20 text-primary mx-auto">
            <Sparkles size={11} className="animate-pulse" />
            AI-powered Developer Career Copilot
          </span>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
            Stop grinding problems.<br />
            <span className="bg-gradient-to-r from-primary via-emerald-500 to-primary bg-clip-text text-transparent italic font-serif">
              Model your career.
            </span>
          </h1>
          
          <p className="text-muted-foreground text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed">
            DevArc is the first unified workspace built to align your CV profiling, technical DSA solving skills, and voice mock interviews under a single, adaptive AI training journey.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              onClick={() => router.push(isAuthenticated ? "/dashboard" : "/register")}
              size="lg"
              className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-bold uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all w-full sm:w-auto"
            >
              Launch Your Copilot
            </Button>
            <a
              href="#previews"
              className="h-12 px-6 rounded-xl bg-muted/50 hover:bg-muted border border-border text-muted-foreground hover:text-foreground font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all w-full sm:w-auto"
            >
              View System Demo <ChevronRight size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* 3. CORE DIFFERENTIATION */}
      <section id="different" className="py-20 px-6 border-y border-border bg-muted/10 relative">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Why DevArc is <span className="text-primary italic font-serif">Different</span>
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Traditional coding sites throw problems at you. DevArc shapes you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-2xl border border-rose-500/10 bg-rose-500/5 space-y-4">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-550 px-2 py-0.5 rounded bg-rose-500/10">Traditional Platforms</span>
              <h3 className="text-lg font-bold text-foreground/90">Rote Grinding & Disconnection</h3>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-rose-550 font-bold shrink-0 mt-0.5">•</span>
                  <span>Solving problems randomly without knowing which skills actually match your target company.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-550 font-bold shrink-0 mt-0.5">•</span>
                  <span>Writing code blindly, relying inside static output boxes without code review advice.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-550 font-bold shrink-0 mt-0.5">•</span>
                  <span>Mock interviews being separate, costly add-ons unrelated to your progress history.</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-4 shadow-lg shadow-emerald-500/5">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 px-2 py-0.5 rounded bg-emerald-500/15">The DevArc Way</span>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                Unified AI Career Loop <Sparkles size={16} className="text-emerald-500" />
              </h3>
              <ul className="space-y-2.5 text-xs text-foreground/90">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✓</span>
                  <span>Dynamic roadmaps targeting your specific resume gaps and dream job criteria.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✓</span>
                  <span>Monaco Editor sandbox supported by active AI explanations directly side-by-side.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✓</span>
                  <span>Voice mock interviews that dynamically check topics you struggled with in the workspace.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PRODUCT LIFECYCLE SECTIONS */}
      <section id="lifecycle" className="py-20 px-6">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Target Path Workflow</span>
            <h2 className="text-3xl font-extrabold text-foreground">Inside the Developer Lifecycle</h2>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-md mx-auto">Four integrated modules working together to accelerate your professional growth.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                num: "01",
                title: "Resume & Goal Profiling",
                desc: "Upload your CV. AI maps domain targets and lists concrete skill discrepancies relative to your dream company.",
                icon: Cpu,
              },
              {
                num: "02",
                title: "Interactive Roadmaps",
                desc: "Get an interactive milestone roadmap. Adjust target parameters and watch the system redraw nodes instantly.",
                icon: Compass,
              },
              {
                num: "03",
                title: "Monaco Solving Sandbox",
                desc: "Resolve algorithm checkpoints using custom tools. Click for voice explanations and review diagnostics.",
                icon: Code2,
              },
              {
                num: "04",
                title: "Voice Interview Rooms",
                desc: "Put theoretical work to the test. Simulate live voice/chat mock sessions scored by multi-axis review grids.",
                icon: Speech,
              }
            ].map((step, idx) => {
              const StepIcon = step.icon;
              return (
                <div key={idx} className="p-6 rounded-2xl border border-border bg-card space-y-4 hover:border-primary/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-muted-foreground/30">{step.num}</span>
                    <StepIcon size={20} className="text-primary" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">{step.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE PRODUCT PREVIEWS */}
      <section id="previews" className="py-24 px-6 border-t border-border bg-muted/5">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">Live Workspace Previews</span>
              <h2 className="text-3xl font-extrabold text-foreground">Experience the Copilot Workspace</h2>
              <p className="text-muted-foreground text-xs sm:text-sm max-w-md">Click tabs to query other sections and see exact UI mockups.</p>
            </div>
            
            <div className="flex gap-2 p-1.5 rounded-xl bg-muted border border-border shrink-0 self-start md:self-end">
              {(["roadmap", "workspace", "interview"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                    activeTab === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-3xl border border-border bg-card shadow-2xl relative overflow-hidden min-h-[400px] flex items-center justify-center">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 blur-[80px] -z-10" />
            
            {activeTab === "roadmap" && (
              <div className="w-full space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="flex items-center gap-2">
                    <Compass size={18} className="text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">Target: Senior Full-Stack Engineer</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded">
                    Roadmap Progress: 64% Completed
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <span>Module 1</span>
                      <span className="text-emerald-600 font-extrabold">Complete</span>
                    </div>
                    <h4 className="text-sm font-bold text-foreground">DSA Fundamentals (Trees & Graphs)</h4>
                    <p className="text-[11px] text-muted-foreground">Master recursive iterations, graph node connectivity and traversals.</p>
                  </div>

                  <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2 relative font-sans">
                    <div className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <span>Module 2</span>
                      <span className="text-primary font-extrabold">Active Target</span>
                    </div>
                    <h4 className="text-sm font-bold text-foreground">Advanced System Design</h4>
                    <p className="text-[11px] text-muted-foreground">Understand message broker queues, caching invalidation and replication strategies.</p>
                  </div>

                  <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2 opacity-50">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <span>Module 3</span>
                      <span>Locked</span>
                    </div>
                    <h4 className="text-sm font-bold text-foreground">Deployment & CI/CD Pipelines</h4>
                    <p className="text-[11px] text-muted-foreground">Deploy docker containers atomically and configure fail-safe AWS SSM scripts.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "workspace" && (
              <div className="w-full space-y-4 animate-in fade-in duration-300 font-mono">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2 font-sans">
                    <Terminal size={14} className="text-primary" />
                    <span className="text-xs font-bold text-foreground">Problem: Longest Substring Without Repeating Characters</span>
                  </div>
                  <div className="flex gap-2 font-sans">
                    <span className="text-[9px] font-bold uppercase bg-muted border border-border px-2 py-0.5 rounded text-foreground">JavaScript</span>
                    <span className="text-[9px] font-bold uppercase bg-primary/10 text-primary px-2 py-0.5 rounded">AI Active</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Mock Code Editor */}
                  <div className="lg:col-span-8 bg-muted/40 p-4 rounded-xl border border-border min-h-[160px] text-xs text-foreground/80 leading-normal space-y-2">
                    <p className="text-muted-foreground/60">{"// Press Hint above for context-aware recommendations"}</p>
                    <p><span className="text-purple-500 font-bold">function</span> <span className="text-yellow-600 dark:text-yellow-405 font-bold">lengthOfLongestSubstring</span>(s) &#123;</p>
                    <p className="pl-4"><span className="text-purple-500 font-bold">let</span> map = <span className="text-purple-500 font-bold">new</span> <span className="text-blue-500 font-medium">Map</span>();</p>
                    <p className="pl-4"><span className="text-purple-500 font-bold">let</span> start = <span className="text-primary font-bold animate-pulse">0</span>; <span className="text-emerald-600 font-sans">{"// AI recommends sliding window pointers"}</span></p>
                    <p className="pl-4">...</p>
                    <p>&#125;</p>
                  </div>
                  
                  {/* Mock AI Companion Chat */}
                  <div className="lg:col-span-4 bg-muted/60 p-4 rounded-xl border border-primary/20 space-y-3 font-sans">
                    <div className="flex items-center gap-2 text-primary">
                      <Sparkles size={12} />
                      <span className="text-[9px] font-extrabold uppercase tracking-widest">AI Mentor Diagnostic</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      &quot;I notice you initialized your sliding pointer correctly. Focus next on updating the character map with indices to bypass duplicate sweeps.&quot;
                    </p>
                    <div className="flex gap-1.5">
                      <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary">Hint Provided</span>
                      <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-border text-muted-foreground">Review Code</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "interview" && (
              <div className="w-full space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="flex items-center gap-2">
                    <Speech size={18} className="text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">Live VOICE Assessment Session</span>
                  </div>
                  <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded animate-pulse">● Recording Waveforms</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Live speech visualization */}
                  <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col justify-between min-h-[150px]">
                    <div className="space-y-2">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Interviewer Question</p>
                      <p className="text-xs text-foreground/90 leading-relaxed font-medium font-sans">
                        &quot;Your array-based traversal looks complete. Can you tell me how the space complexity is affected if we transition from a recursive setup to an iterative stack?&quot;
                      </p>
                    </div>
                    <div className="flex items-center gap-1 mt-4">
                      {Array.from({ length: 15 }).map((_, i) => (
                        <div 
                           key={i} 
                           className="w-1 bg-primary rounded-full transition-all" 
                           style={{ 
                             height: `${3 + Math.sin(i) * 20}px`,
                             opacity: 0.15 + (i % 3) * 0.25 
                           }} 
                        />
                      ))}
                      <span className="text-[9px] font-medium text-muted-foreground ml-2">User speaking...</span>
                    </div>
                  </div>

                  {/* Real-time scorecard preview */}
                  <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
                    <p className="text-[9px] text-primary uppercase tracking-widest font-extrabold">Assessment Scorecard</p>
                    <div className="grid grid-cols-3 gap-2 text-center font-sans">
                      <div className="bg-muted p-2.5 rounded-lg border border-border">
                        <span className="block text-lg font-black text-foreground">88%</span>
                        <span className="text-[8px] text-muted-foreground uppercase font-medium">Logic</span>
                      </div>
                      <div className="bg-muted p-2.5 rounded-lg border border-border">
                        <span className="block text-lg font-black text-foreground">92%</span>
                        <span className="text-[8px] text-muted-foreground uppercase font-medium">Code Quality</span>
                      </div>
                      <div className="bg-muted p-2.5 rounded-lg border border-border">
                        <span className="block text-lg font-black text-foreground">79%</span>
                        <span className="text-[8px] text-muted-foreground uppercase font-medium">Comm.</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-muted-foreground leading-relaxed">
                      <strong>AI Recommendations:</strong> Work on clearly explaining variable names as you initialize loops to elevate your communication score.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. STATISTICS & TRUST */}
      <section className="py-20 px-6 border-y border-border bg-muted/10">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { metric: "14 Days", label: "Average target time reduction" },
            { metric: "1,500+", label: "Algorithms resolved with AI hints" },
            { metric: "84%", label: "First-attempt system interview pass rate" },
            { metric: "4.9/5", label: "User satisfaction rating" }
          ].map((stat, idx) => (
            <div key={idx} className="text-center space-y-1">
              <span className="block text-3xl font-extrabold text-foreground tracking-tighter">{stat.metric}</span>
              <span className="block text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 7. FAQ ACCORDION */}
      <section id="faq" className="py-20 px-6">
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Frequently Asked Questions</h2>
            <p className="text-xs text-muted-foreground">Everything you need to know about DevArc&apos;s workspace features.</p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => (
              <div 
                key={idx} 
                className="rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left text-xs font-bold uppercase tracking-wider text-foreground/90 hover:text-foreground"
                >
                  <span>{faq.q}</span>
                  <ChevronDown 
                    size={16} 
                    className={cn("text-muted-foreground transition-transform duration-300", expandedFaq === idx ? "rotate-180" : "")} 
                  />
                </button>
                
                <AnimatePresence initial={false}>
                  {expandedFaq === idx && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-xs text-muted-foreground leading-relaxed max-w-2xl font-medium">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. CTA / WAITING LIST SECTION */}
      <section className="py-24 px-6 border-t border-border bg-muted/5 relative">
        <div className="max-w-4xl mx-auto rounded-3xl border border-primary/20 bg-primary/5 p-8 md:p-12 text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 blur-[80px] -z-10" />
          
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 mx-auto">
            <Sparkles size={11} /> Accelerate Your Path
          </span>
          
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
            Ready to upgrade your system engineering benchmarks?
          </h2>
          
          <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
            Design your professional journey, solve algorithm prompts dynamically, and get hired with DevArc.
          </p>
          
          <div className="pt-2">
            <Button
              onClick={() => router.push(isAuthenticated ? "/dashboard" : "/register")}
              className="h-11 px-8 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/10"
            >
              Get Started Now <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="py-12 border-t border-border bg-muted/20 text-muted-foreground text-xs">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 font-sans">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-black text-xs">
              DA
            </div>
            <span className="font-bold tracking-tight text-foreground">DevArc Platform</span>
          </div>

          <p className="text-center md:text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            &copy; {new Date().getFullYear()} DevArc Corporation. All rights reserved.
          </p>

          <div className="flex gap-4">
            <Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
