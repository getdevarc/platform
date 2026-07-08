"use client";

import { useState, useEffect } from "react";
import { BaseHero } from "@/components/shared/DesignSystem";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Settings, Shield, Bell, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [sessionWarnings, setSessionWarnings] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSave = () => {
    toast.success("Settings saved successfully.");
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background text-foreground p-6 md:p-8 space-y-8 font-sans">
      <BaseHero
        badgeText="App Configuration"
        title="Settings & System Dashboard"
        highlight="Preferences"
        description="Toggle styling behaviors, system notification flags, and editor defaults."
      />

      <div className="max-w-3xl space-y-6">
        {/* Appearance Section */}
        <div className="rounded-3xl border border-zinc-200 dark:border-white/5 bg-card/45 dark:bg-zinc-950/40 p-6 md:p-8 space-y-6">
          <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <Moon size={18} className="text-primary" /> Appearance Theme
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-450 uppercase tracking-wide">Select your theme preference below.</p>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setTheme("dark")}
              className={`p-4 rounded-2xl border text-center flex flex-col items-center gap-2 transition-all ${
                theme === "dark" ? "bg-primary/10 border-primary text-primary" : "bg-zinc-100/50 dark:bg-zinc-900/10 border-zinc-250 dark:border-white/5 text-zinc-500 dark:text-zinc-400"
              }`}
            >
              <Moon size={20} />
              <span className="text-xs font-bold uppercase tracking-wider">Dark Mode (Glassmorphic)</span>
            </button>
            <button
              onClick={() => setTheme("light")}
              className={`p-4 rounded-2xl border text-center flex flex-col items-center gap-2 transition-all ${
                theme === "light" ? "bg-primary/10 border-primary text-primary" : "bg-zinc-100/50 dark:bg-zinc-900/10 border-zinc-250 dark:border-white/5 text-zinc-500 dark:text-zinc-400"
              }`}
            >
              <Sun size={20} />
              <span className="text-xs font-bold uppercase tracking-wider">Light Mode</span>
            </button>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="rounded-3xl border border-zinc-200 dark:border-white/5 bg-card/45 dark:bg-zinc-950/40 p-6 md:p-8 space-y-6">
          <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <Bell size={18} className="text-primary" /> Notifications & Warnings
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl border border-zinc-200 dark:border-white/5 bg-zinc-100/30 dark:bg-zinc-900/20">
              <div className="space-y-0.5 text-left">
                <Label className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Email Notifications</Label>
                <p className="text-xs text-zinc-500 dark:text-zinc-450 leading-relaxed font-sans">Receive study guides and weekly performance summaries.</p>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-zinc-900 accent-primary"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl border border-zinc-200 dark:border-white/5 bg-zinc-100/30 dark:bg-zinc-900/20">
              <div className="space-y-0.5 text-left">
                <Label className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Navigation Guard Alerts</Label>
                <p className="text-xs text-zinc-500 dark:text-zinc-450 leading-relaxed font-sans">Prompt confirmation modal checks before quitting challenges mid-route.</p>
              </div>
              <input
                type="checkbox"
                checked={sessionWarnings}
                onChange={(e) => setSessionWarnings(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-zinc-900 accent-primary"
              />
            </div>
          </div>
        </div>

        {/* Security / System Defaults */}
        <div className="rounded-3xl border border-zinc-205 dark:border-white/5 bg-card/45 dark:bg-zinc-950/40 p-6 md:p-8 space-y-6">
          <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <Shield size={18} className="text-primary" /> Security & Session Rules
          </h3>
          <div className="p-4 rounded-2xl border border-zinc-200 dark:border-white/5 bg-zinc-100/30 dark:bg-zinc-900/20 text-left space-y-1.5">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Session Key Validation</h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-normal">
              Active sessions persist tokens correctly in browser contexts. Refresh logs require user validations before discarding scores.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSave}
            className="h-12 px-8 bg-primary hover:bg-primary/95 text-primary-foreground font-bold uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-primary/10 transition-transform active:scale-[0.98]"
          >
            Save Configuration
          </Button>
        </div>
      </div>
    </div>
  );
}
