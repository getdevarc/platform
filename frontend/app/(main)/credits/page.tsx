"use client";

import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { BaseHero, StatCard } from "@/components/shared/DesignSystem";
import { Sparkles, Coins, BrainCircuit, History } from "lucide-react";

export default function CreditsPage() {
  const { penalty } = useWorkspaceStore();
  const baseCredits = 500;
  const currentCredits = baseCredits - penalty;

  return (
    <div className="flex-1 overflow-y-auto bg-background text-foreground p-6 md:p-8 space-y-8 font-sans">
      <BaseHero
        badgeText="Usage Quotas"
        title="AI Copilot Credits"
        highlight={`${currentCredits} Credits`}
        description="Monitor your developer session tokens. Points are consumed proportionally based on Hint queries, code explanations, and diagnostic reviews."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Tokens Remaining"
          value={currentCredits}
          highlight="Current Balance"
          icon={Coins}
        />
        <StatCard
          title="Tokens Deducted"
          value={penalty}
          highlight="Active Session Drops"
          icon={BrainCircuit}
        />
        <StatCard
          title="Cost Scale Model"
          value="Standard"
          highlight="Platform Multiplier"
          icon={Sparkles}
        />
      </div>

      <div className="rounded-3xl border border-zinc-200 dark:border-white/5 bg-card/45 dark:bg-zinc-950/40 p-6 md:p-8 space-y-6">
        <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
          <History size={18} className="text-primary" /> Cost Deductions Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-500 dark:text-zinc-400">
            <thead className="text-[10px] font-bold text-zinc-500 dark:text-zinc-550 uppercase tracking-widest border-b border-zinc-200 dark:border-white/5">
              <tr>
                <th className="pb-3 pr-4">AI Interaction Feature</th>
                <th className="pb-3 pr-4">Cost Deduction</th>
                <th className="pb-3 pr-4">Frequency Policy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
              <tr>
                <td className="py-3.5 pr-4 text-zinc-900 dark:text-white font-medium">Request Hint</td>
                <td className="py-3.5 pr-4 text-primary font-bold">-20 Credits</td>
                <td className="py-3.5 pr-4">Reduces maximum potential points per challenge</td>
              </tr>
              <tr>
                <td className="py-3.5 pr-4 text-zinc-900 dark:text-white font-medium">Request Explanation</td>
                <td className="py-3.5 pr-4 text-primary font-bold">-20 Credits</td>
                <td className="py-3.5 pr-4">Analyzes compiler test cases and algorithms</td>
              </tr>
              <tr>
                <td className="py-3.5 pr-4 text-zinc-900 dark:text-white font-medium">Request Diagnostic Code Review</td>
                <td className="py-3.5 pr-4 text-primary font-bold">-25 Credits</td>
                <td className="py-3.5 pr-4">Detailed line-by-line review of codebase workspace edits</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
