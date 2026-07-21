"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ArrowRight, ArrowLeft, Upload, CheckCircle2, Briefcase, GraduationCap, Target, Cpu, ShieldAlert, BadgeInfo } from "lucide-react";
import Link from "next/link";
import { useLoaderStore } from "@/store/useLoaderStore";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

type Step = 1 | 2 | 3 | 4;

const REG_SLIDES = [
  {
    icon: Cpu,
    image: "/images/auth_slide_career_path.png",
    title: "AI Biography Mapping",
    description: "Submit details about your background and profile. DevArc analyzes your credentials against thousands of industry standards to optimize placement targets.",
  },
  {
    icon: ShieldAlert,
    image: "/images/auth_slide_code_sandbox.png",
    title: "Skill Gap Auditing",
    description: "Scan your resume to instantly spotlight technical gaps relative to direct Job Descriptions at Google, Stripe, and modern startups.",
  },
  {
    icon: BadgeInfo,
    image: "/images/auth_slide_voice_interview.png",
    title: "Adaptive Training Path",
    description: "Unlock curated algorithmic challenges tailored specifically for your target timeframe and career benchmarks.",
  },
];

export default function RegisterPage() {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { register, login } = useAuthStore();
  const loader = useLoaderStore();
  const [currentSlide, setCurrentSlide] = useState(0);

  // OTP Validation States
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  // Resend countdown: seconds remaining (0 = can resend)
  const [resendCountdown, setResendCountdown] = useState(0);

  // Start a 60-second countdown after OTP is sent
  useEffect(() => {
    if (!otpSent) return;
    setResendCountdown(60);
    const interval = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [otpSent]);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Fresher",
    targetDomain: "Frontend",
    answers: {
      goal: "",
      timeline: "3 months",
      dream_company: ""
    }
  });

  const [resume, setResume] = useState<File | null>(null);

  const isBotEmail = (email: string) => {
    const banned = ["mailinator.com", "yopmail.com", "tempmail.com", "10minutemail.com", "sharklasers.com", "guerrillamail.com", "dispostable.com", "getairmail.com", "burnermail.io"];
    const domain = email.split("@")[1]?.toLowerCase();
    return banned.includes(domain);
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "bg-zinc-800" };
    if (pass.length < 6) return { score: 25, label: "Very Weak", color: "bg-red-500" };
    
    let score = 0;
    if (pass.length >= 8) score += 25;
    if (/[0-9]/.test(pass)) score += 25;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 25;

    if (score <= 25) return { score: 25, label: "Weak", color: "bg-orange-500" };
    if (score <= 50) return { score: 50, label: "Medium", color: "bg-yellow-550 bg-yellow-500" };
    if (score <= 75) return { score: 75, label: "Strong", color: "bg-emerald-500" };
    return { score: 100, label: "Very Strong", color: "bg-emerald-600" };
  };

  // Auto-rotate slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % REG_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handleNext = () => setStep((prev) => (prev + 1) as Step);
  const handleBack = () => setStep((prev) => (prev - 1) as Step);

  const handleSendOTP = async () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      toast.error("Please fill in name, email, and password first.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (isBotEmail(formData.email.trim())) {
      toast.error("Spam/temporary emails are not allowed.");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    loader.show("Sending verification code to your email...");
    try {
      await api.post("/auth/send-signup-otp", { email: formData.email.trim() });
      setOtpSent(true);
      setOtpCode("");
      toast.success("Verification code sent to your email!");
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Failed to send OTP.");
    } finally {
      setLoading(false);
      loader.hide();
    }
  };

  const handleResendOTP = async () => {
    if (resendCountdown > 0 || loading) return;
    setOtpCode("");
    setLoading(true);
    loader.show("Resending verification code...");
    try {
      await api.post("/auth/send-signup-otp", { email: formData.email.trim() });
      toast.success("New verification code sent!");
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Failed to resend OTP.");
    } finally {
      setLoading(false);
      loader.hide();
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    loader.show("Creating your DevArc account...");
    try {
      // Step 1: Create Account with OTP verification
      await register({ 
        name: formData.name, 
        email: formData.email, 
        password: formData.password,
        otp: otpCode
      });

      // Step 2: Login to get token for subsequent profile updates
      await login({ email: formData.email, password: formData.password });
      
      // Step 3: Proceed to Profile Setup
      setStep(2);
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Registration failed. Verify OTP code.");
    } finally {
      setLoading(false);
      loader.hide();
    }
  };

  const handleProfileSubmit = async () => {
    setLoading(true);
    loader.show("Saving profile choices...");
    try {
      await api.post("/career/onboarding", {
        role: formData.role,
        target_domain: formData.targetDomain,
        answers: formData.answers
      });
      handleNext();
    } catch (err) {
      toast.error("Failed to save profile.");
    } finally {
      setLoading(false);
      loader.hide();
    }
  };

  const handleResumeUpload = async () => {
    if (!resume) {
      router.push("/dashboard");
      return;
    }

    setLoading(true);
    loader.show("AI analyzing your resume...");
    const fd = new FormData();
    fd.append("resume", resume);

    try {
      await api.post("/career/analyze-resume", fd);
      toast.success("Resume analyzed and profile updated!");
      router.push("/dashboard");
    } catch (err) {
      toast.error("Failed to analyze resume. You can finish this later.");
      router.push("/dashboard");
    } finally {
      setLoading(false);
      loader.hide();
    }
  };

  const SlideIcon = REG_SLIDES[currentSlide].icon;

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-background text-foreground overflow-hidden font-sans">
      {/* LEFT SIDE (~65%): HERO SLIDESHOW */}
      <div className="hidden lg:flex lg:col-span-7 relative flex-col justify-between p-12 overflow-hidden border-r border-border">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_var(--secondary),_var(--background)_80%)] -z-10" />
        <div className="absolute bottom-[20%] left-[10%] w-[350px] h-[350px] bg-primary/10 rounded-full blur-[140px] -z-10" />
        
        {/* Header Link */}
        <div className="relative flex items-center gap-3 z-10">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-extrabold text-lg shadow-lg shadow-primary/20">
            DA
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-foreground to-zinc-500 bg-clip-text text-transparent">
            DevArc
          </span>
          <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full ml-1">
            Sign Up
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
                  {REG_SLIDES[currentSlide].title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {REG_SLIDES[currentSlide].description}
                </p>
              </div>

              <div className="md:col-span-7 bg-card/40 border border-border rounded-xl p-2 shadow-2xl backdrop-blur-xl max-h-[300px] overflow-hidden flex items-center justify-center">
                <img 
                  src={REG_SLIDES[currentSlide].image} 
                  alt={REG_SLIDES[currentSlide].title} 
                  className="rounded-xl w-full h-auto object-cover max-h-[280px]"
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Carousel Indicators */}
        <div className="relative flex items-center gap-6 z-10">
          <div className="flex gap-2">
            {REG_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentSlide === idx ? "w-8 bg-primary" : "w-2 bg-muted hover:bg-zinc-500"
                }`}
              />
            ))}
          </div>
          <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest">
            AI Profile Mapping Setup
          </p>
        </div>
      </div>

      {/* RIGHT SIDE (~35%): MULTI-STEP SIGNUP PANEL */}
      <div className="col-span-1 lg:col-span-5 flex items-center justify-center p-6 relative bg-card lg:bg-transparent overflow-y-auto max-h-screen">
        <div className="absolute top-[20%] right-[10%] w-[250px] h-[250px] bg-primary/10 rounded-full blur-[80px] lg:hidden -z-10" />

        <div className="w-full max-w-md space-y-6 py-8">
          <div className="flex flex-col items-center text-center space-y-1 lg:hidden">
            <div className="h-10 w-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary font-bold">
              DA
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground mt-2">Create DevArc Account</h1>
            <p className="text-xs text-zinc-500">Step {step} of 4</p>
          </div>

          <Card className="border border-border bg-card/40 backdrop-blur-xl shadow-2xl rounded-2xl relative overflow-hidden">
            {/* Progress Stepper Bar */}
            <div className="absolute top-0 left-0 w-full h-[3px] bg-muted">
              <div 
                className="h-full bg-primary transition-all duration-500 ease-out" 
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>

            <CardHeader className="space-y-1 pb-4 pt-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest">
                  Step {step} of 4
                </span>
                <span className="text-[9px] text-zinc-550 uppercase tracking-widest">
                  {step === 1 ? "Credentials" : step === 2 ? "Background" : step === 3 ? "Directives" : "Resume"}
                </span>
              </div>
              
              <div className="pt-2">
                {step === 1 && (
                  <>
                    <CardTitle className="text-lg font-bold text-foreground tracking-tight">Create your account</CardTitle>
                    <CardDescription className="text-muted-foreground text-xs">
                      Build your profile to start your journey with an AI coach.
                    </CardDescription>
                  </>
                )}
                {step === 2 && (
                  <>
                    <CardTitle className="text-lg font-bold text-foreground tracking-tight">Professional Profile</CardTitle>
                    <CardDescription className="text-muted-foreground text-xs">
                      Tell us about your background status and target domain.
                    </CardDescription>
                  </>
                )}
                {step === 3 && (
                  <>
                    <CardTitle className="text-lg font-bold text-foreground tracking-tight">Career Goals</CardTitle>
                    <CardDescription className="text-muted-foreground text-xs">
                      Personalize your AI career roadmap logic.
                    </CardDescription>
                  </>
                )}
                {step === 4 && (
                  <>
                    <CardTitle className="text-lg font-bold text-foreground tracking-tight">Onboard Resume</CardTitle>
                    <CardDescription className="text-muted-foreground text-xs">
                      AI analyzes your skills to diagnose initial target gaps.
                    </CardDescription>
                  </>
                )}
              </div>
            </CardHeader>

            <CardContent className="pb-6 pt-1 min-h-[260px] flex flex-col justify-center">
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {otpSent ? (
                    <div className="space-y-3 bg-primary/5 border border-primary/10 p-5 rounded-2xl">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Email Verification Required</h4>
                          <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                            A 6-digit code was sent to{" "}
                            <strong className="text-foreground">{formData.email}</strong>.
                          </p>
                        </div>
                        <span className="text-[9px] bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-full px-2 py-0.5 font-bold shrink-0 whitespace-nowrap">
                          Valid 10 min
                        </span>
                      </div>
                      <div className="space-y-1.5 pt-1">
                        <Label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">OTP Code</Label>
                        <Input 
                          placeholder="Enter 6-digit code" 
                          maxLength={6}
                          className="bg-background/40 border-border h-12 text-foreground text-center font-mono tracking-[0.4em] text-xl placeholder:text-muted-foreground/40 placeholder:tracking-normal focus:border-primary/50 transition-colors rounded-xl"
                          value={otpCode}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, "");
                            setOtpCode(val);
                          }}
                        />
                        <div className="flex items-center justify-between pt-1">
                          <p className="text-[10px] text-muted-foreground">
                            {otpCode.length}/6 digits entered
                          </p>
                          <button
                            type="button"
                            onClick={handleResendOTP}
                            disabled={resendCountdown > 0 || loading}
                            className="text-[10px] font-bold transition-colors disabled:text-muted-foreground/50 enabled:text-primary enabled:hover:underline"
                          >
                            {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend Code"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider pl-0.5">Full Name</Label>
                        <Input 
                          placeholder="Aman Jha" 
                          className="bg-background/40 border-border h-11 text-foreground placeholder:text-zinc-500 focus:border-primary/50 transition-colors rounded-xl text-sm"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider pl-0.5">Email Address</Label>
                        <Input 
                          type="email" 
                          placeholder="name@example.com" 
                          className="bg-background/40 border-border h-11 text-foreground placeholder:text-zinc-500 focus:border-primary/50 transition-colors rounded-xl text-sm"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider pl-0.5">Password</Label>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          className="bg-background/40 border-border h-11 text-foreground placeholder:text-zinc-500 focus:border-primary/50 transition-colors rounded-xl text-sm"
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                        />
                        {formData.password && (
                          <div className="pt-2 space-y-1">
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase text-zinc-500">
                              <span>Security:</span>
                              <span className={cn(
                                formData.password.length < 8 ? "text-red-500" :
                                getPasswordStrength(formData.password).label === "Weak" ? "text-orange-500" :
                                getPasswordStrength(formData.password).label === "Medium" ? "text-yellow-500" : "text-emerald-500"
                              )}>
                                {getPasswordStrength(formData.password).label}
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                              <div 
                                className={cn("h-full transition-all duration-300", getPasswordStrength(formData.password).color)}
                                style={{ width: `${getPasswordStrength(formData.password).score}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="space-y-2">
                    <Label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Experience Level</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: "Fresher", icon: GraduationCap, label: "Fresher" },
                        { id: "Working Professional", icon: Briefcase, label: "Professional" }
                      ].map((opt) => (
                        <button 
                          type="button"
                          key={opt.id}
                          onClick={() => setFormData({...formData, role: opt.id})}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center",
                            formData.role === opt.id 
                              ? "bg-primary/10 border-primary text-primary" 
                              : "bg-secondary/40 border-border text-muted-foreground hover:bg-secondary/70"
                          )}
                        >
                          <opt.icon size={20} className={formData.role === opt.id ? "text-primary" : "text-zinc-500"} />
                          <span className="text-xs font-bold uppercase tracking-wider">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Target Domain</Label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {["Frontend", "Backend", "Full Stack", "DevOps", "Data Science", "Mobile UI"].map((domain) => (
                        <button 
                          type="button"
                          key={domain}
                          onClick={() => setFormData({...formData, targetDomain: domain})}
                          className={cn(
                            "py-2 px-1 rounded-lg border text-[9px] font-extrabold uppercase transition-all tracking-wider text-center",
                            formData.targetDomain === domain 
                              ? "bg-primary border-primary text-primary-foreground"
                              : "bg-secondary/40 border-border text-muted-foreground hover:border-zinc-500"
                          )}
                        >
                          {domain}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Target size={12} className="text-primary" /> What is your primary 3-month goal?
                    </Label>
                    <Input 
                      placeholder="e.g., Land a SDE-1 role at a startup" 
                      className="bg-background/40 border-border h-11 text-foreground placeholder:text-zinc-500 focus:border-primary/50 transition-colors rounded-xl text-sm"
                      value={formData.answers.goal}
                      onChange={(e) => setFormData({...formData, answers: {...formData.answers, goal: e.target.value}})}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Target Dream Company</Label>
                    <Input 
                      placeholder="e.g., Google, Stripe, or Early Stage AI startup" 
                      className="bg-background/40 border-border h-11 text-foreground placeholder:text-zinc-500 focus:border-primary/50 transition-colors rounded-xl text-sm"
                      value={formData.answers.dream_company}
                      onChange={(e) => setFormData({...formData, answers: {...formData.answers, dream_company: e.target.value}})}
                    />
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-center gap-3 mt-1">
                    <CheckCircle2 size={16} className="text-amber-500 shrink-0" />
                    <p className="text-[9px] text-zinc-400 leading-normal uppercase font-bold tracking-wider">The career engine uses these goals to adjust algorithm choices.</p>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4 animate-in fade-in duration-300 text-center">
                  <div 
                    className={cn(
                      "border border-dashed rounded-2xl p-6 flex flex-col items-center gap-3 transition-all cursor-pointer",
                      resume ? "bg-emerald-500/5 border-emerald-500/20" : "bg-secondary/20 border-border hover:border-primary/20"
                    )}
                    onClick={() => document.getElementById("resume-upload")?.click()}
                  >
                    <input 
                      id="resume-upload" 
                      type="file" 
                      className="hidden" 
                      accept=".pdf" 
                      onChange={(e) => {
                        if (e.target.files) setResume(e.target.files[0]);
                      }}
                    />
                    <div className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center shadow-lg",
                      resume ? "bg-emerald-500 text-white" : "bg-secondary text-muted-foreground"
                    )}>
                      {resume ? <CheckCircle2 size={24} /> : <Upload size={24} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-foreground mb-0.5">{resume ? resume.name : "Select Resume PDF"}</h4>
                      <p className="text-[10px] text-zinc-505 text-zinc-500">Drag and drop or click to upload</p>
                    </div>
                  </div>
                  <p className="text-[9px] text-zinc-550 uppercase font-bold tracking-wider">Optional: Skip if you prefer full manual setup.</p>
                </div>
              )}
            </CardContent>

            <CardFooter className="bg-secondary/10 p-5 border-t border-border gap-2">
              {step > 1 && (
                <Button 
                  type="button"
                  variant="outline" 
                  className="h-11 w-11 shrink-0 rounded-xl border-border bg-secondary/20 hover:bg-secondary/40 text-muted-foreground hover:text-foreground"
                  onClick={handleBack}
                  disabled={loading}
                >
                  <ArrowLeft size={16} />
                </Button>
              )}
              
              {step === 1 && (
                <div className="flex-1 flex gap-2">
                  {otpSent && (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 px-4 rounded-xl border-border bg-secondary/20 hover:bg-secondary/40 text-muted-foreground hover:text-foreground"
                      onClick={() => setOtpSent(false)}
                      disabled={loading}
                    >
                      Back
                    </Button>
                  )}
                  <Button 
                    type="button"
                    className="flex-1 h-11 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-bold uppercase tracking-widest text-xs"
                    onClick={otpSent ? handleRegister : handleSendOTP}
                    disabled={loading || !formData.email || !formData.password || (otpSent && otpCode.length !== 6)}
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {otpSent ? "Verify & Register" : "Request Verification Code"}
                    <ArrowRight size={14} className="ml-1.5" />
                  </Button>
                </div>
              )}

              {step === 2 && (
                <Button 
                  type="button"
                  className="flex-1 h-11 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-bold uppercase tracking-widest text-xs"
                  onClick={handleNext}
                  disabled={loading}
                >
                  Continue <ArrowRight size={14} className="ml-1.5" />
                </Button>
              )}

              {step === 3 && (
                <Button 
                  type="button"
                  className="flex-1 h-11 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-bold uppercase tracking-widest text-xs"
                  onClick={handleProfileSubmit}
                  disabled={loading || !formData.answers.goal}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Save Profile"}
                  <ArrowRight size={14} className="ml-1.5" />
                </Button>
              )}

              {step === 4 && (
                <div className="flex-1 flex gap-2">
                  <Button 
                    type="button"
                    variant="ghost" 
                    className="flex-1 h-11 rounded-xl text-zinc-500 font-bold uppercase tracking-widest text-[10px]"
                    onClick={() => router.push("/dashboard")}
                    disabled={loading}
                  >
                    Skip
                  </Button>
                  <Button 
                    type="button"
                    className="h-11 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/10"
                    onClick={handleResumeUpload}
                    disabled={loading || !resume}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Analyze & Finish"}
                  </Button>
                </div>
              )}
            </CardFooter>
          </Card>

          <p className="text-xs text-center text-zinc-500 relative z-10">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-bold text-xs uppercase tracking-wide">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
