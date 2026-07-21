"use client";

import { BaseHero } from "@/components/shared/DesignSystem";
import { Shield, Eye, Lock, RefreshCw, FileText } from "lucide-react";

export default function PrivacyPage() {
  const sections = [
    {
      icon: Eye,
      title: "1. Information We Collect",
      content: "We collect information you directly provide when registering and using DevArc. This includes your name, email address, experience level, target domains, uploaded resume PDF files, and responses to onboarding questions. In addition, when using interactive voice assessments, we process voice waveform data to analyze communication skills."
    },
    {
      icon: Shield,
      title: "2. How We Use Information",
      content: "We use the collected details to generate custom interactive roadmaps, tailor AI Monaco coach coding hints, evaluate interview waveforms, track compiler sandbox performance, and deliver AI credits metrics. We do not sell or lease your personal credentials to third-party databases."
    },
    {
      icon: Lock,
      title: "3. Data Protection Standards",
      content: "Your data is protected in transit and at rest using industry-grade encryption models. Access parameters such as database tokens and API keys are stored securely using AWS SSM parameter stores. Uploaded resumes are securely parsed and can be removed at any time from your Profile settings."
    },
    {
      icon: RefreshCw,
      title: "4. Updates to This Policy",
      content: "We may update this Privacy Policy from time to time to reflect operational or security improvements in the DevArc platform. We recommend checking this page periodically to remain informed about our data protection standards."
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-background text-foreground p-6 md:p-8 space-y-8 font-sans">
      <BaseHero
        badgeText="Privacy & Security"
        title="Privacy Policy"
        highlight="DevArc Platform"
        description="Learn how we gather, process, and secure your developer profile details, resume files, and technical assessment metrics."
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
          <FileText size={14} className="text-primary" /> Last updated: July 2026. For questions, contact support@getdevarc.com.
        </p>
      </div>
    </div>
  );
}
