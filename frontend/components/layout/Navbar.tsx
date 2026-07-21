"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Code2, 
  LayoutDashboard, 
  User, 
  LogOut, 
  Settings,
  ChevronDown,
  Sparkles,
  Compass,
  MessageSquareCode,
  Menu,
  X,
  Sun,
  Moon,
  Home,
  BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLoaderStore } from "@/store/useLoaderStore";
import { useThemeTransition } from "@/hooks/useThemeTransition";
import { canAccessAdminPortal } from "@/lib/permissions";

const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || "http://localhost:3000";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuthStore();
  const { theme, toggleTheme } = useThemeTransition();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasActiveInterview, setHasActiveInterview] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const checkInterviewId = () => {
      if (typeof window !== "undefined") {
        setHasActiveInterview(!!localStorage.getItem("active_interview_id"));
      }
    };
    checkInterviewId();
    const interval = setInterval(checkInterviewId, 1000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { name: "Home", href: landingUrl, icon: Home },
    { name: "Problems", href: "/problems", icon: Code2 },
    { name: "Interview", href: "/interview", icon: MessageSquareCode },
    { name: "Career", href: "/career", icon: Compass },
    { name: "Learn", href: "/learn", icon: BookOpen },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ];

  if (!isAuthenticated) return null;

  return (
    <>
      <nav className="h-16 border-b border-zinc-200 dark:border-white/5 bg-white/75 dark:bg-black/50 backdrop-blur-md sticky top-0 z-[100] px-6 flex items-center justify-between text-zinc-950 dark:text-zinc-50">
        <div className="flex items-center gap-8">
          {hasActiveInterview ? (
            <div className="flex items-center gap-2 select-none cursor-not-allowed opacity-50">
              <div className="h-8 w-8 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-500 font-bold text-sm">
                DA
              </div>
              <span className="font-bold text-lg tracking-tight text-zinc-500">DevArc</span>
            </div>
          ) : (
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20">
                DA
              </div>
              <span className="font-bold text-lg tracking-tight text-foreground">DevArc</span>
            </Link>
          )}

          <div className="hidden md:flex items-center gap-1">
            {hasActiveInterview ? (
              <div className="px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-wider animate-pulse flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Live Session Active — Finish Session to Unlock Navigation
              </div>
            ) : (
              navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link key={link.href} href={link.href}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={cn(
                        "h-9 gap-2 px-4 transition-all duration-200",
                        isActive 
                          ? "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      )}
                    >
                      <Icon size={16} />
                      {link.name}
                    </Button>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={cn(
            "hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
            hasActiveInterview 
              ? "bg-red-500/10 border border-red-500/20 text-red-400"
              : "bg-primary/10 border border-primary/20 text-primary"
          )}>
            <Sparkles size={10} />
            {hasActiveInterview ? "Live Interview Locked" : "AI Coach Active"}
          </div>

          {mounted && !hasActiveInterview && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-xl border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground hidden md:flex items-center justify-center shrink-0"
              onClick={() => toggleTheme()}
            >
              {theme === "dark" ? <Sun size={14} className="text-yellow-500" /> : <Moon size={14} className="text-blue-400" />}
            </Button>
          )}

          <div className="hidden md:block">
            {hasActiveInterview ? (
              <div className="flex items-center gap-3 pl-2 opacity-50 cursor-not-allowed select-none">
                <div className="h-8 w-8 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center text-xs font-bold text-zinc-500">
                  {user?.name?.split(" ").map(n => n[0]).join("") || "U"}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-zinc-500 leading-none mb-1">
                    {user?.name || "Developer"}
                  </p>
                </div>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <div className="flex items-center gap-3 pl-2 cursor-pointer group outline-none">
                    <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-xs font-bold text-zinc-700 dark:text-zinc-300 group-hover:border-primary/50 transition-colors">
                      {user?.name?.split(" ").map(n => n[0]).join("") || "U"}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-white leading-none mb-1">
                        {user?.name || "Developer"}
                      </p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-none truncate max-w-[100px]">
                        {user?.email}
                      </p>
                    </div>
                    <ChevronDown size={14} className="text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2 border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-950/80 backdrop-blur-xl text-zinc-950 dark:text-zinc-200">
                  <DropdownMenuLabel className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-zinc-200 dark:bg-white/5" />
                  <Link href="/profile">
                    <DropdownMenuItem className="gap-2 py-2.5 cursor-pointer focus:bg-zinc-150 dark:focus:bg-white/5 text-zinc-700 dark:text-zinc-300 focus:text-zinc-950 dark:focus:text-white flex items-center outline-none">
                      <User size={16} />
                      Profile
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/settings">
                    <DropdownMenuItem className="gap-2 py-2.5 cursor-pointer focus:bg-zinc-150 dark:focus:bg-white/5 text-zinc-700 dark:text-zinc-300 focus:text-zinc-950 dark:focus:text-white flex items-center outline-none">
                      <Settings size={16} />
                      Settings
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/credits">
                    <DropdownMenuItem className="gap-2 py-2.5 cursor-pointer focus:bg-zinc-150 dark:focus:bg-white/5 text-zinc-700 dark:text-zinc-300 focus:text-zinc-950 dark:focus:text-white flex items-center outline-none">
                      <Sparkles size={16} className="text-primary" />
                      AI Credits
                    </DropdownMenuItem>
                  </Link>
                  {canAccessAdminPortal(user) && (
                    <Link href="/admin">
                      <DropdownMenuItem className="gap-2 py-2.5 cursor-pointer focus:bg-primary/10 text-primary flex items-center outline-none font-semibold">
                        <Sparkles size={16} className="text-primary animate-pulse" />
                        Admin Panel
                      </DropdownMenuItem>
                    </Link>
                  )}
                  <DropdownMenuSeparator className="bg-zinc-200 dark:bg-white/5" />
                  <DropdownMenuItem 
                    className="gap-2 py-2.5 cursor-pointer focus:bg-red-500/10 text-zinc-700 dark:text-zinc-300 focus:text-red-600 dark:focus:text-red-400 outline-none"
                    onClick={() => {
                      const loader = useLoaderStore.getState();
                      loader.show("Signing you out of DevArc...");
                      setTimeout(() => {
                        logout();
                        loader.hide();
                        toast.success("Successfully logged out!");
                      }, 1000);
                    }}
                  >
                    <LogOut size={16} />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
 
          {/* Mobile Menu Toggle */}
          {!hasActiveInterview && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden h-10 w-10 text-zinc-500 dark:text-zinc-400"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </Button>
          )}
        </div>
      </nav>
 
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[90] bg-white/95 dark:bg-black/95 backdrop-blur-lg md:hidden pt-20 px-6 animate-in slide-in-from-top duration-300 text-zinc-950 dark:text-zinc-50">
           <div className="space-y-4">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)}>
                    <div className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl transition-all",
                      isActive ? "bg-primary text-white" : "bg-zinc-100 dark:bg-white/5 text-zinc-650 dark:text-zinc-400"
                    )}>
                      <Icon size={20} />
                      <span className="font-bold">{link.name}</span>
                    </div>
                  </Link>
                );
              })}
              
              {mounted && (
                <div 
                  onClick={() => {
                    toggleTheme();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/5 text-zinc-600 dark:text-zinc-400 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    {theme === "dark" ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-blue-500" />}
                    <span className="font-bold">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                  </div>
                </div>
              )}
 
              <div className="pt-8 mt-8 border-t border-zinc-200 dark:border-white/5">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="h-12 w-12 rounded-full bg-zinc-105 bg-zinc-150 dark:bg-zinc-800 flex items-center justify-center text-lg font-bold text-zinc-800 dark:text-white border border-zinc-200 dark:border-white/5">
                       {user?.name?.split(" ").map(n => n[0]).join("") || "U"}
                    </div>
                    <div>
                       <p className="font-bold text-zinc-900 dark:text-white">{user?.name}</p>
                       <p className="text-xs text-zinc-500 dark:text-zinc-450">{user?.email}</p>
                    </div>
                 </div>
                 <Button 
                   variant="destructive" 
                   className="w-full h-12 rounded-2xl font-bold uppercase tracking-widest"
                   onClick={() => {
                     logout();
                     setIsMobileMenuOpen(false);
                   }}
                 >
                   <LogOut size={18} className="mr-2" />
                   Sign Out
                 </Button>
              </div>
           </div>
        </div>
      )}
    </>
  );
}
