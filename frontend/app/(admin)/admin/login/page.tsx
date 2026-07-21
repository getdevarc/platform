"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Sparkles, ShieldCheck, ShieldAlert, LogOut, ArrowLeft } from "lucide-react";
import { useLoaderStore } from "@/store/useLoaderStore";
import { canAccessAdminPortal } from "@/lib/permissions";
import Link from "next/link";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, logout, user, isAuthenticated } = useAuthStore();
  const loader = useLoaderStore();
  const router = useRouter();

  // Access denied helper states
  const [errorState, setErrorState] = useState<"unauthorized" | null>(null);
  const [attemptedEmail, setAttemptedEmail] = useState("");

  // Clean mount/unmount check
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Securely redirect if already logged in as admin
  useEffect(() => {
    if (mounted && isAuthenticated && user && canAccessAdminPortal(user)) {
      router.replace("/admin");
    }
  }, [mounted, isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    loader.show("Verifying Admin Credentials...");
    setErrorState(null);
    try {
      await login({ email, password });
      
      // Fetch state from store directly
      const loggedUser = useAuthStore.getState().user;
      
      if (!canAccessAdminPortal(loggedUser)) {
        setAttemptedEmail(email);
        setErrorState("unauthorized");
        toast.error("Access Denied: Administrative account required.");
      } else {
        toast.success("Super Admin console unlocked.");
        router.push("/admin");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Login failed. Please verify credentials.");
    } finally {
      loader.hide();
    }
  };

  const handleClearAndReturn = () => {
    const rootState = useLoaderStore.getState();
    rootState.show("Returning to main site...");
    setTimeout(() => {
      logout();
      setErrorState(null);
      rootState.hide();
      router.push("/");
    }, 1000);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6 relative font-sans overflow-hidden">
      {/* Background aesthetics */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_var(--secondary),_var(--background)_85%)] -z-10" />
      <div className="absolute top-[30%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-primary/10 rounded-full blur-[160px] -z-10" />

      <div className="w-full max-w-md space-y-6 z-10">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg shadow-primary/20">
            DA
          </div>
          <span className="font-bold text-2xl tracking-tight bg-gradient-to-r from-foreground to-zinc-500 bg-clip-text text-transparent">
            DevArc Panel
          </span>
          <span className="text-[9px] font-extrabold text-primary uppercase tracking-widest bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
            SYSTEM SUPERADMIN
          </span>
        </div>

        {errorState === "unauthorized" ? (
          <Card className="border border-red-500/20 bg-card/50 backdrop-blur-xl shadow-2xl rounded-2xl animate-in fade-in zoom-in duration-300">
            <CardHeader className="space-y-2 text-center pb-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-500 mb-2">
                <ShieldAlert size={24} />
              </div>
              <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                Access Denied
              </CardTitle>
              <CardDescription className="text-muted-foreground text-xs">
                Your account is currently unauthorized.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground leading-relaxed">
                The account <span className="text-foreground font-semibold underline">{attemptedEmail}</span> does not have administrative privileges to access the DevArc Operating Panel.
              </p>
              <div className="bg-red-500/5 border border-red-500/10 py-2.5 px-4 rounded-xl text-left text-xs text-red-400 flex items-start gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                <span>To grant administrative rights, use the User Management settings within an approved session, or contact the owner.</span>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button
                variant="destructive"
                className="w-full h-11 bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-500/20 font-bold uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                onClick={handleClearAndReturn}
              >
                <LogOut size={14} />
                Return to Home
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card className="border border-border bg-card/40 backdrop-blur-xl shadow-2xl rounded-2xl">
            <CardHeader className="space-y-1.5 pb-4 text-center">
              <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                Super Admin Login
              </CardTitle>
              <CardDescription className="text-muted-foreground text-xs">
                Secure administrative access to the DevArc Operating Panel.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 pt-1">
                <div className="space-y-2">
                  <Label htmlFor="admin-email" className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Email Address</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@getdevarc.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-background/50 border-border h-11 text-foreground placeholder:text-zinc-500 focus:border-primary/50 transition-colors rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password" className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-background/50 border-border h-11 text-foreground placeholder:text-zinc-500 focus:border-primary/50 transition-colors rounded-xl text-sm"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4 mt-2">
                <Button 
                  type="submit" 
                  className="w-full h-11 bg-primary hover:bg-primary/95 text-primary-foreground font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-primary/10 transition-transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck size={14} />
                  Unlock Control Panel
                </Button>

                <div className="relative flex items-center justify-center w-full my-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <span className="relative px-3 bg-card font-bold uppercase tracking-widest text-[8px] text-muted-foreground">Navigation</span>
                </div>

                <Link href="/" className="w-full">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-10 border-border bg-secondary/20 hover:bg-secondary/40 text-muted-foreground hover:text-foreground rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    Back to Landing Page
                  </Button>
                </Link>
              </CardFooter>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
