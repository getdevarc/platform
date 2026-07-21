"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
}

const PreWithCopy = React.memo(function PreWithCopy({ children, rawCode }: { children: React.ReactNode; rawCode: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  return (
    <div className="relative group/code-block my-4">
      <pre className="bg-muted/40 border border-border rounded-xl p-4 overflow-x-auto text-[11px] font-mono leading-relaxed text-emerald-600 dark:text-emerald-400 pr-14 select-text">
        {children}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 p-1.5 rounded-lg bg-background border border-border text-muted-foreground hover:text-foreground opacity-0 group-hover/code-block:opacity-100 transition-opacity focus:opacity-100 flex items-center gap-1.5 text-[9px] font-sans font-bold shadow-sm"
        title="Copy code"
      >
        {copied ? (
          <>
            <Check size={11} className="text-emerald-500" />
            <span className="text-emerald-500">Copied!</span>
          </>
        ) : (
          <>
            <Copy size={11} />
            <span>Copy</span>
          </>
        )}
      </button>
    </div>
  );
});

export const MarkdownRenderer = React.memo(function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-xl sm:text-2xl font-black text-foreground mt-6 mb-4 pb-2 border-b border-border uppercase tracking-tight">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-extrabold text-foreground mt-6 mb-3 uppercase tracking-wider flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-bold text-foreground mt-4 mb-2">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="text-[12px] leading-relaxed text-muted-foreground mb-4 font-sans font-normal">
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-5 mb-4 space-y-1.5 text-[12px] text-muted-foreground">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-5 mb-4 space-y-1.5 text-[12px] text-muted-foreground">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="leading-relaxed font-sans">{children}</li>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-primary bg-primary/5 px-4 py-3 rounded-r-xl my-4 text-[12px] italic text-foreground leading-relaxed font-sans">
            {children}
          </blockquote>
        ),
        code: ({ className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || "");
          const inline = !match;
          const codeString = String(children).replace(/\n$/, "");
          
          return inline ? (
            <code className="bg-muted border border-border text-primary text-[10px] px-1.5 py-0.5 rounded font-mono font-medium">
              {children}
            </code>
          ) : (
            <PreWithCopy rawCode={codeString}>
              <code className={className} {...props}>
                {children}
              </code>
            </PreWithCopy>
          );
        },
        table: ({ children }) => (
          <div className="overflow-x-auto my-6 rounded-xl border border-border">
            <table className="w-full text-left border-collapse text-[12px]">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-muted font-black uppercase text-[10px] tracking-wider border-b border-border text-muted-foreground">
            {children}
          </thead>
        ),
        tbody: ({ children }) => (
          <tbody className="divide-y divide-border bg-muted/10">
            {children}
          </tbody>
        ),
        tr: ({ children }) => <tr>{children}</tr>,
        th: ({ children }) => <th className="p-3 text-muted-foreground font-bold">{children}</th>,
        td: ({ children }) => <td className="p-3 text-foreground/90">{children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
});
