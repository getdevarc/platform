"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Sparkles, Code2, Compass, Speech } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useLoaderStore } from "@/store/useLoaderStore";

const SLIDES = [
  {
    icon: Compass,
    image: "/images/auth_slide_career_path.png",
    title: "AI Interactive Roadmaps",
    description: "Generate structured, interactive pathways that guide your career transition from Frontend to System Architect based on real-time gap analysis.",
  },
  {
    icon: Code2,
    image: "/images/auth_slide_code_sandbox.png",
    title: "Monaco Coding Coach",
    description: "Solve algorithmic core challenges in a high-productivity sandbox. Get context-aware AI Hints, code reviews, and explanations.",
  },
  {
    icon: Speech,
    image: "/images/auth_slide_voice_interview.png",
    title: "AI Voice Mock Interviews",
    description: "Simulate live interactive technical interviews with dynamic questions, live waveform indicators, and immediate diagnostic review scorecards.",
  },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, loading } = useAuthStore();
  const loader = useLoaderStore();
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-rotate slideshow
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    loader.show("Logging in to DevArc...");
    try {
      await login({ email, password });
      toast.success("Welcome back to DevArc!");
      router.push("/");
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Login failed. Please check your credentials.");
    } finally {
      loader.hide();
    }
  };

  const SlideIcon = SLIDES[currentSlide].icon;

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#060606] text-white overflow-hidden font-sans">
      {/* LEFT SIDE (~65%): HERO SLIDESHOW */}
      <div className="hidden lg:flex lg:col-span-8 relative flex-col justify-between p-12 overflow-hidden border-r border-white/5">
        {/* Visual Background Gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#111111,_#060606_80%)] -z-10" />
        <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[140px] -z-10" />
        
        {/* Header */}
        <div className="relative flex items-center gap-3 z-10">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-extrabold text-lg shadow-lg shadow-primary/20">
            DA
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            DevArc
          </span>
          <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full ml-1">
            Career Copilot
          </span>
        </div>

        {/* Slide Content */}
        <div className="relative my-auto z-10 flex flex-col justify-center min-h-[400px] w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
            >
              <div className="md:col-span-5 space-y-6">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-zinc-900 border border-white/10 text-primary mb-2 shadow-xl shadow-black/40">
                  <SlideIcon size={24} className="text-primary" />
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
                  {SLIDES[currentSlide].title}
                </h2>
                <p className="text-sm text-zinc-450 leading-relaxed">
                  {SLIDES[currentSlide].description}
                </p>
              </div>

              <div className="md:col-span-7 bg-zinc-950/40 border border-white/5 rounded-2xl p-2 shadow-2xl backdrop-blur-xl max-h-[300px] overflow-hidden flex items-center justify-center">
                <img 
                  src={SLIDES[currentSlide].image} 
                  alt={SLIDES[currentSlide].title} 
                  className="rounded-xl w-full h-auto object-cover max-h-[280px]"
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Carousel Indicators */}
        <div className="relative flex items-center gap-6 z-10">
          <div className="flex gap-2">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentSlide === idx ? "w-8 bg-primary" : "w-2 bg-zinc-800 hover:bg-zinc-700"
                }`}
              />
            ))}
          </div>
          <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest">
            AI-powered Developer Career Engine
          </p>
        </div>
      </div>

      {/* RIGHT SIDE (~35%): THE GLASSMORPHIC CARD & LOGIN FORM */}
      <div className="col-span-1 lg:col-span-4 flex items-center justify-center p-6 relative bg-[#090909] lg:bg-transparent">
        {/* Background Accent Glow for Mobile */}
        <div className="absolute top-[20%] right-[10%] w-[250px] h-[250px] bg-primary/10 rounded-full blur-[80px] lg:hidden -z-10" />

        <div className="w-full max-w-sm space-y-6 z-10">
          {/* Logo header for mobile only */}
          <div className="flex flex-col items-center text-center space-y-2 lg:hidden">
            <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg shadow-primary/20">
              DA
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">DevArc Workspace</h1>
            <p className="text-xs text-zinc-500">Log in to continue your developer growth journey.</p>
          </div>

          <Card className="border border-white/5 bg-zinc-950/40 backdrop-blur-xl shadow-2xl rounded-2xl">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl font-bold tracking-tight text-white hidden lg:block">Welcome Back</CardTitle>
              <CardDescription className="text-zinc-500 text-xs hidden lg:block">
                Enter your credentials to launch your copilot.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 pt-1">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs text-zinc-400 font-medium">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-zinc-900/40 border-white/5 h-11 text-white placeholder:text-zinc-600 focus:border-primary/50 transition-colors rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs text-zinc-400 font-medium">Password</Label>
                    <Link href="/forgot-password" className="text-xs text-primary hover:underline font-medium">Forgot password?</Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-zinc-900/40 border-white/5 h-11 text-white placeholder:text-zinc-650 focus:border-primary/50 transition-colors rounded-xl text-sm"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4 mt-2">
                <Button 
                  type="submit" 
                  className="w-full h-11 bg-primary hover:bg-primary/95 text-primary-foreground font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-primary/10 transition-transform active:scale-[0.98]"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Launch App
                </Button>

                {/* Divider */}
                <div className="relative flex items-center justify-center w-full my-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/5"></div>
                  </div>
                  <span className="relative px-3 bg-[#0c0c0c] font-bold uppercase tracking-widest text-[9px] text-zinc-600">or continue with</span>
                </div>

                {/* Social Login Buttons */}
                <div className="grid grid-cols-2 gap-3 w-full">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 border-white/5 bg-zinc-900/10 hover:bg-zinc-900/30 text-zinc-400 hover:text-white rounded-xl text-xs flex items-center justify-center gap-2"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.587-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 5.92 1 12.2s4.92 11.2 11.24 11.2c6.6 0 11-4.64 11-11.2 0-.756-.08-1.334-.18-1.915H12.24z"/>
                    </svg>
                    Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 border-white/5 bg-zinc-900/10 hover:bg-zinc-900/30 text-zinc-400 hover:text-white rounded-xl text-xs flex items-center justify-center gap-2"
                  >
                    <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                    GitHub
                  </Button>
                </div>

                <p className="text-xs text-center text-zinc-500 mt-1">
                  Don&apos;t have an account?{" "}
                  <Link href="/register" className="text-primary hover:underline font-bold text-xs uppercase tracking-wide">
                    Sign Up
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
