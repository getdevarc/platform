"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ArrowRight, ArrowLeft, Upload, CheckCircle2, User as UserIcon, Briefcase, GraduationCap, Target } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

type Step = 1 | 2 | 3 | 4;

export default function RegisterPage() {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { register, login } = useAuthStore();

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

  const handleNext = () => setStep((prev) => (prev + 1) as Step);
  const handleBack = () => setStep((prev) => (prev - 1) as Step);

  const handleRegister = async () => {
    setLoading(true);
    try {
      // Step 1: Create Account
      await register({ 
        name: formData.name, 
        email: formData.email, 
        password: formData.password 
      });

      // Step 2: Login to get token for subsequent profile updates
      await login({ email: formData.email, password: formData.password });
      
      // Step 3: Proceed to Profile Setup
      handleNext();
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async () => {
    setLoading(true);
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
    }
  };

  const handleResumeUpload = async () => {
    if (!resume) {
      router.push("/dashboard");
      return;
    }

    setLoading(true);
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
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4 py-20 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(var(--primary-rgb),0.05),transparent_50%)]" />

      <Card className="w-full max-w-lg border-white/5 bg-zinc-950/50 backdrop-blur-2xl shadow-2xl relative z-10 overflow-hidden">
        {/* Progress Bar */}
        <div className="h-1 bg-zinc-900 w-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out" 
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        <CardHeader className="space-y-2 pb-8">
          <div className="flex justify-between items-center mb-4">
             <div className="h-10 w-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary font-bold">
                DA
             </div>
             <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">
                Step {step} of 4
             </div>
          </div>
          {step === 1 && (
            <>
              <CardTitle className="text-2xl font-bold text-white tracking-tight">Create your account</CardTitle>
              <CardDescription className="text-zinc-400 font-medium">Start your journey with an AI-powered mentor.</CardDescription>
            </>
          )}
          {step === 2 && (
            <>
              <CardTitle className="text-2xl font-bold text-white tracking-tight">Professional Profile</CardTitle>
              <CardDescription className="text-zinc-400 font-medium">Tell us about your current status and target domain.</CardDescription>
            </>
          )}
          {step === 3 && (
            <>
              <CardTitle className="text-2xl font-bold text-white tracking-tight">Career Goals</CardTitle>
              <CardDescription className="text-zinc-400 font-medium">Personalize your AI roadmap logic.</CardDescription>
            </>
          )}
          {step === 4 && (
            <>
              <CardTitle className="text-2xl font-bold text-white tracking-tight">Upload Resume</CardTitle>
              <CardDescription className="text-zinc-400 font-medium">AI will analyze your skills to build a better roadmap.</CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="pb-8 min-h-[300px] flex flex-col justify-center">
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <Label className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest pl-1">Full Name</Label>
                <Input 
                  placeholder="Aman Jha" 
                  className="bg-zinc-900/50 border-white/5 h-12 rounded-2xl focus:border-primary/50"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest pl-1">Email</Label>
                <Input 
                  type="email" 
                  placeholder="name@example.com" 
                  className="bg-zinc-900/50 border-white/5 h-12 rounded-2xl focus:border-primary/50"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest pl-1">Password</Label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="bg-zinc-900/50 border-white/5 h-12 rounded-2xl focus:border-primary/50"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="space-y-3">
                  <Label className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Experience Level</Label>
                  <div className="grid grid-cols-2 gap-4">
                     {[
                       { id: "Fresher", icon: GraduationCap, label: "Fresher" },
                       { id: "Working Professional", icon: Briefcase, label: "Professional" }
                     ].map((opt) => (
                        <button 
                          key={opt.id}
                          onClick={() => setFormData({...formData, role: opt.id})}
                          className={cn(
                            "flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all group",
                            formData.role === opt.id 
                              ? "bg-primary/10 border-primary text-primary" 
                              : "bg-white/5 border-white/5 text-zinc-500 hover:bg-white/10"
                          )}
                        >
                           <opt.icon size={24} className={cn("transition-colors", formData.role === opt.id ? "text-primary" : "text-zinc-600 group-hover:text-zinc-400")} />
                           <span className="text-xs font-bold tracking-widest">{opt.label}</span>
                        </button>
                     ))}
                  </div>
               </div>

               <div className="space-y-3">
                  <Label className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Target Domain</Label>
                  <div className="grid grid-cols-3 gap-2">
                     {["Frontend", "Backend", "Full Stack", "DevOps", "Data Science", "Mobile UI"].map((domain) => (
                        <button 
                          key={domain}
                          onClick={() => setFormData({...formData, targetDomain: domain})}
                          className={cn(
                             "py-3 px-1 rounded-xl border text-[10px] font-bold uppercase transition-all tracking-tighter",
                             formData.targetDomain === domain 
                               ? "bg-primary border-primary text-white"
                               : "bg-white/5 border-white/5 text-zinc-500 hover:border-zinc-700"
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
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                   <Label className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                      <Target size={12} className="text-primary" /> What is your primary 3-month goal?
                   </Label>
                   <Input 
                      placeholder="e.g., Land a SDE-1 role at a startup" 
                      className="bg-zinc-900/50 border-white/5 h-12 rounded-2xl"
                      value={formData.answers.goal}
                      onChange={(e) => setFormData({...formData, answers: {...formData.answers, goal: e.target.value}})}
                   />
                </div>
                <div className="space-y-2">
                   <Label className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Target Dream Company</Label>
                   <Input 
                      placeholder="e.g., Google, Stripe, or Early Stage AI startup" 
                      className="bg-zinc-900/50 border-white/5 h-12 rounded-2xl"
                      value={formData.answers.dream_company}
                      onChange={(e) => setFormData({...formData, answers: {...formData.answers, dream_company: e.target.value}})}
                   />
                </div>
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-center gap-4">
                   <div className="h-8 w-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                      <CheckCircle2 size={16} />
                   </div>
                   <p className="text-[10px] text-amber-200/50 font-medium uppercase tracking-widest">AI will prioritize these targets in your roadmap logic.</p>
                </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 text-center">
                <div 
                  className={cn(
                    "border-2 border-dashed rounded-3xl p-10 flex flex-col items-center gap-4 transition-all cursor-pointer",
                    resume ? "bg-emerald-500/5 border-emerald-500/20" : "bg-zinc-900/20 border-white/5 hover:border-primary/20"
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
                     "h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg",
                     resume ? "bg-emerald-500 text-white" : "bg-zinc-800 text-zinc-500"
                   )}>
                      {resume ? <CheckCircle2 size={32} /> : <Upload size={32} />}
                   </div>
                   <div>
                      <h4 className="font-bold text-white mb-1">{resume ? resume.name : "Select Resume PDF"}</h4>
                      <p className="text-xs text-zinc-500 font-medium">Drag and drop or click to upload</p>
                   </div>
                </div>
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Skip this step if you don&apos;t have a resume yet.</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-black/20 p-8 border-t border-white/5 gap-3">
          {step > 1 && (
            <Button 
              variant="outline" 
              className="h-12 w-12 rounded-2xl border-white/10 hover:bg-white/5"
              onClick={handleBack}
              disabled={loading}
            >
               <ArrowLeft size={18} />
            </Button>
          )}
          
          {step === 1 && (
            <Button 
              className="flex-1 h-12 rounded-2xl bg-primary text-white font-bold uppercase tracking-widest group shadow-lg shadow-primary/20"
              onClick={handleRegister}
              disabled={loading || !formData.email || !formData.password}
            >
               {loading ? <Loader2 className="animate-spin" /> : "Next Step"}
               <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          )}

          {step === 2 && (
             <Button 
               className="flex-1 h-12 rounded-2xl bg-primary text-white font-bold uppercase tracking-widest"
               onClick={handleNext}
               disabled={loading}
             >
                Continue <ArrowRight size={16} className="ml-2" />
             </Button>
          )}

          {step === 3 && (
             <Button 
               className="flex-1 h-12 rounded-2xl bg-primary text-white font-bold uppercase tracking-widest"
               onClick={handleProfileSubmit}
               disabled={loading || !formData.answers.goal}
             >
                {loading ? <Loader2 className="animate-spin" /> : "Save Profile"}
                <ArrowRight size={16} className="ml-2" />
             </Button>
          )}

          {step === 4 && (
             <div className="flex-1 flex gap-3">
                <Button 
                  variant="ghost" 
                  className="flex-1 h-12 rounded-2xl text-zinc-500 font-bold uppercase tracking-widest"
                  onClick={() => router.push("/dashboard")}
                  disabled={loading}
                >
                  Skip
                </Button>
                <Button 
                  className="flex-2 h-12 px-8 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/20"
                  onClick={handleResumeUpload}
                  disabled={loading || !resume}
                >
                   {loading ? <Loader2 className="animate-spin" /> : "Analyze & Finish"}
                </Button>
             </div>
          )}
        </CardFooter>
      </Card>

      <div className="mt-8 text-center text-zinc-600 text-xs relative z-10">
         Already have an account? <Link href="/login" className="text-primary hover:underline">Log in</Link>
      </div>
    </div>
  );
}
