"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  ArrowRight, 
  Loader2, 
  KeyRound, 
  Mail, 
  Compass, 
  Code2, 
  Speech 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<1 | 2>(1); // 1 = Request Reset Code, 2 = Verify Code & Reset
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();

  // Auto-rotate slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      toast.success("Verification code sent to your email!");
      setStep(2);
    } catch (err) {
      const errorMsg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to request code. Check email.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otp || !newPassword) return;

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { email, otp, newPassword });
      toast.success("Password reset successful Login with your new password.");
      router.push("/login");
    } catch (err) {
      const errorMsg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Password reset failed. Verify OTP code.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const SlideIcon = SLIDES[currentSlide].icon;

  return (
    <div className="min-h-screen bg-background text-foreground grid grid-cols-1 lg:grid-cols-12 select-none overflow-x-hidden font-sans">
      {/* LEFT SIDE (~65%): HERO SLIDESHOW */}
      <div className="hidden lg:flex lg:col-span-8 relative flex-col justify-between p-12 overflow-hidden border-r border-border">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_var(--secondary),_var(--background)_80%)] -z-10" />
        <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[140px] -z-10" />
        
        {/* Header */}
        <div className="relative flex items-center gap-3 z-10">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-extrabold text-lg shadow-lg shadow-primary/20">
            DA
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-foreground to-zinc-500 bg-clip-text text-transparent">
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
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-card border border-border text-primary mb-2 shadow-xl shadow-black/10 dark:shadow-black/40">
                  <SlideIcon size={24} className="text-primary" />
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight text-foreground leading-tight">
                  {SLIDES[currentSlide].title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {SLIDES[currentSlide].description}
                </p>
              </div>

              <div className="md:col-span-7 bg-card/40 border border-border rounded-xl p-2 shadow-2xl backdrop-blur-xl max-h-[300px] overflow-hidden flex items-center justify-center">
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
                  currentSlide === idx ? "w-8 bg-primary" : "w-2 bg-muted hover:bg-zinc-550"
                }`}
              />
            ))}
          </div>
          <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest">
            AI-powered Developer Career Engine
          </p>
        </div>
      </div>

      {/* RIGHT SIDE (~35%): CARD PANEL */}
      <div className="col-span-1 lg:col-span-4 flex items-center justify-center p-6 relative bg-card lg:bg-transparent">
        <div className="absolute top-[20%] right-[10%] w-[250px] h-[250px] bg-primary/10 rounded-full blur-[80px] lg:hidden -z-10" />

        <div className="w-full max-w-sm space-y-6 z-10">
          {/* Logo header for mobile only */}
          <div className="flex flex-col items-center text-center space-y-2 lg:hidden">
            <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg shadow-primary/20">
              DA
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1">DevArc Workspace</h1>
            <p className="text-xs text-zinc-500">Reset your forgotten password credential.</p>
          </div>

          <Card className="border border-border bg-card/40 backdrop-blur-xl shadow-2xl rounded-2xl">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl font-bold tracking-tight text-foreground hidden lg:block">Reset Password</CardTitle>
              <CardDescription className="text-muted-foreground text-xs hidden lg:block">
                {step === 1 ? "Enter your email to receive a recovery code." : "Enter confirmation OTP and choice password."}
              </CardDescription>
            </CardHeader>

            {step === 1 ? (
              <form onSubmit={handleRequestCode}>
                <CardContent className="space-y-4 pt-1">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs text-zinc-400 font-medium">Email Address</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-background/40 border-border h-11 pl-9 text-foreground placeholder:text-zinc-500 focus:border-primary/50 transition-colors rounded-xl text-sm"
                      />
                      <Mail size={16} className="absolute left-3 top-3.5 text-zinc-500" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 mt-2">
                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-primary hover:bg-primary/95 text-primary-foreground font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-primary/10 transition-transform active:scale-[0.98]"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Request Reset Code
                    <ArrowRight size={14} className="ml-1.5" />
                  </Button>
                  <Link href="/login" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mx-auto">
                    <ArrowLeft size={12} /> Back to Login
                  </Link>
                </CardFooter>
              </form>
            ) : (
              <form onSubmit={handleResetPassword}>
                <CardContent className="space-y-4 pt-1">
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-xs text-zinc-400 font-medium">6-Digit OTP Code</Label>
                    <Input
                      id="otp"
                      placeholder="000000"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                      required
                      className="bg-background/40 border-border h-11 text-center font-mono tracking-widest text-lg text-foreground placeholder:text-zinc-500 focus:border-primary/50 transition-colors rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-xs text-zinc-400 font-medium">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="bg-background/40 border-border h-11 pl-9 text-foreground placeholder:text-zinc-500 focus:border-primary/50 transition-colors rounded-xl text-sm"
                      />
                      <KeyRound size={16} className="absolute left-3 top-3.5 text-zinc-500" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 mt-2">
                  <div className="flex gap-2 w-full">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 px-4 rounded-xl border-border bg-secondary/20 hover:bg-secondary/40 text-muted-foreground hover:text-foreground"
                      onClick={() => setStep(1)}
                      disabled={loading}
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 h-11 bg-primary hover:bg-primary/95 text-primary-foreground font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-primary/10 transition-transform active:scale-[0.98]"
                      disabled={loading}
                    >
                      {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Reset Password
                      <ArrowRight size={14} className="ml-1.5" />
                    </Button>
                  </div>
                </CardFooter>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
