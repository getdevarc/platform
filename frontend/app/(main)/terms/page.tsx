"use client";

import { BaseHero } from "@/components/shared/DesignSystem";
import { Scale, Users, Award, AlertTriangle, FileText } from "lucide-react";

export default function TermsPage() {
  const sections = [
    {
      icon: Users,
      title: "1. Account Registration",
      content: "Users must provide accurate email credentials and verify their registration via the dynamic OTP flow. Accounts are intended for personal usage. System resources block automated scraper registrations, bots, or temporary/disposable burner emails."
    },
    {
      icon: Award,
      title: "2. AI Credits & Sandboxes",
      content: "DevArc provides simulated tools, AI hints, sandbox execution runtimes, and mock feedback. Credits are consumed proportionally based on requests (diagnostics, hints, descriptions). Abuse of sandbox runtimes or automated script parsing of endpoints is strictly prohibited."
    },
    {
      icon: AlertTriangle,
      title: "3. Disclaimers & Limits",
      content: "Technical feedback, roadmap suggestions, and interview grading are generated through AI algorithms for educational and preparation purposes. While designed for accuracy, DevArc does not guarantee placement offers or job results at any partner companies."
    },
    {
      icon: Scale,
      title: "4. Termination Rights",
      content: "We reserve the right to suspend accounts violating system guidelines, executing high-rate automated API hits, or abusing compiler systems. Suspended accounts lose access to active roadmap parameters and accrued AI credits."
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-background text-foreground p-6 md:p-8 space-y-8 font-sans">
      <BaseHero
        badgeText="Terms & Rules"
        title="Terms of Service"
        highlight="System Agreement"
        description="Review the rules, acceptable usage terms, and guidelines for account safety, sandboxes, and AI Credits consumption."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section, idx) => {
          const Icon = section.icon;
          return (
            <div key={idx} className="rounded-3xl border border-zinc-200 dark:border-white/5 bg-card/45 dark:bg-zinc-950/40 p-6 md:p-8 space-y-4 hover:border-primary/20 transition-all duration-300 backdrop-blur-md">
              <h3 className="text-base font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                <Icon size={18} className="text-primary" /> {section.title}
              </h3>
              <p className="text-zinc-650 dark:text-zinc-405 text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">
                {section.content}
              </p>
            </div>
          );
        })}
      </div>

      <div className="rounded-3xl border border-zinc-200 dark:border-white/5 bg-card/45 dark:bg-zinc-950/40 p-6 md:p-8 text-center backdrop-blur-md">
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <FileText size={14} className="text-primary" /> Last updated: July 2026. By accessing DevArc, you agree to these operating standards.
        </p>
      </div>
    </div>
  );
}
