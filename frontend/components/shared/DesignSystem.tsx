"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sparkles, LucideIcon, CheckCircle2 } from "lucide-react";

// 1. SECTION HEADER
interface SectionHeaderProps {
  title: string;
  highlight?: string;
  badge?: string;
  description?: string;
  className?: string;
}

export function SectionHeader({ title, highlight, badge, description, className }: SectionHeaderProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {badge && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-primary/10 border border-primary/20 text-primary">
          <Sparkles size={10} />
          {badge}
        </span>
      )}
      <h2 className="text-3xl font-bold tracking-tight text-foreground">
        {title} {highlight && <span className="text-primary italic font-serif">{highlight}</span>}
      </h2>
      {description && <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">{description}</p>}
    </div>
  );
}

// 2. FEATURE CARD
interface FeatureCardProps {
  title: string;
  description: string;
  badge?: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function FeatureCard({ title, description, badge, icon: Icon, children, className, onClick }: FeatureCardProps) {
  const CardWrapper = onClick ? motion.button : motion.div;
  
  return (
    <CardWrapper
      onClick={onClick}
      whileHover={onClick ? { y: -4 } : undefined}
      className={cn(
        "text-left block w-full rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-md transition-colors hover:border-primary/20",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          {badge && (
            <span className="inline-block text-[9px] font-extrabold text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded">
              {badge}
            </span>
          )}
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-muted border border-border text-muted-foreground group-hover:text-primary transition-colors">
                <Icon size={18} />
              </div>
            )}
            <h3 className="text-lg font-bold text-foreground tracking-wide">{title}</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-normal">{description}</p>
        </div>
      </div>
      {children && <div className="mt-4">{children}</div>}
    </CardWrapper>
  );
}

// 3. STAT CARD
interface StatCardProps {
  title: string;
  value: string | number;
  highlight?: string;
  color?: string;
  icon: LucideIcon;
  className?: string;
}

export function StatCard({ title, value, highlight = "Tracked", color = "text-primary", icon: Icon, className }: StatCardProps) {
  return (
    <div className={cn("rounded-2xl border border-border bg-muted/40 p-5 backdrop-blur-sm transition-colors hover:border-primary/20", className)}>
      <div className="flex flex-row items-center justify-between pb-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          {title}
        </span>
        <Icon size={16} className={cn(color)} />
      </div>
      <div className="flex items-end gap-2 text-foreground mt-1">
        <span className="text-3xl font-bold tracking-tighter">{value}</span>
        {highlight && (
          <span className="text-[10px] text-muted-foreground/60 font-bold mb-1.5 uppercase tracking-wide">
            {highlight}
          </span>
        )}
      </div>
    </div>
  );
}

// 4. AI RECOMMENDATION CARD
interface AiRecommendationCardProps {
  recommendation: string;
  actionLabel?: string;
  onAction?: () => void;
  title?: string;
  className?: string;
}

export function AiRecommendationCard({ recommendation, actionLabel, onAction, title = "Career Copilot Directive", className }: AiRecommendationCardProps) {
  return (
    <div className={cn("relative p-5 rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-sm overflow-hidden", className)}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] -z-10" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles size={14} className="animate-pulse" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest">{title}</span>
          </div>
          <p className="text-xs text-foreground/80 leading-relaxed font-medium">
            {recommendation}
          </p>
        </div>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="shrink-0 h-9 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

// 5. TIMELINE NODE
interface TimelineNodeProps {
  title: string;
  description: string;
  status: "completed" | "current" | "locked";
  type?: string;
  isLast?: boolean;
  hasGuide?: boolean;
  onClick?: () => void;
  className?: string;
}

export function TimelineNode({ title, description, status, type, isLast, hasGuide, onClick, className }: TimelineNodeProps) {
  return (
    <div className={cn("relative pl-10 pb-8 group last:pb-0", className)} onClick={onClick}>
      {/* Connector stem */}
      {!isLast && (
        <div className={cn(
          "absolute left-4 top-6 bottom-0 w-0.5 border-l border-dashed",
          status === "completed" ? "border-emerald-500/40" : "border-border"
        )} />
      )}
      
      {/* Node bullet */}
      <div className={cn(
        "absolute left-1.5 top-1.5 h-5 w-5 rounded-full border-4 flex items-center justify-center transition-all",
        status === "completed" ? "bg-emerald-500 scale-110 border-emerald-950 dark:border-emerald-950" : 
        status === "current" ? "bg-primary animate-pulse border-primary/30" : 
        "bg-muted border-border"
      )} />

      <div className={cn(
        "p-5 rounded-2xl border transition-all cursor-pointer bg-card/40 hover:border-primary/20",
        status === "current" ? "border-primary/20 bg-primary/5" : "border-border"
      )}>
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            {type && (
              <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest rounded bg-muted text-muted-foreground border border-border">
                {type}
              </span>
            )}
            {status === "current" && (
              <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest rounded bg-primary text-primary-foreground">
                Active
              </span>
            )}
            {hasGuide && (
              <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 size={10} />
                Study Guide Available
              </span>
            )}
          </div>
          <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{title}</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

// 6. WORKSPACE SKELETON LOADER
export function WorkspaceSkeleton({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="p-5 rounded-2xl bg-muted/40 border border-border space-y-3 animate-pulse">
          <div className="flex gap-2">
            <div className="h-4 w-12 bg-muted rounded" />
            <div className="h-4 w-24 bg-muted rounded" />
          </div>
          <div className="h-5 w-2/3 bg-muted rounded" />
          <div className="h-4 w-full bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}

// 7. BASE HERO
interface BaseHeroProps {
  badgeText?: string;
  title: string;
  highlight?: string;
  description: string;
  actions?: React.ReactNode;
  className?: string;
}

export function BaseHero({ badgeText, title, highlight, description, actions, className }: BaseHeroProps) {
  return (
    <div className={cn("relative p-8 md:p-10 rounded-3xl border border-border bg-card/80 overflow-hidden shadow-2xl", className)}>
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -z-10" />
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
        <div className="space-y-2.5 max-w-2xl text-left">
          {badgeText && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-primary/10 border border-primary/20 text-primary">
              <Sparkles size={10} />
              {badgeText}
            </span>
          )}
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {title} {highlight && <span className="text-primary italic font-serif">{highlight}</span>}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
            {description}
          </p>
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
