"use client";

import { useEffect } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { useTheme } from "next-themes";

interface CodeEditorProps {
  initialValue?: string;
  language?: string;
}

const LANGUAGE_TEMPLATES: Record<string, string> = {
  javascript: `// Write your solution here\n\nfunction solution() {\n  \n}`,
  python: `# Write your solution here\n\ndef solution():\n    pass`,
  java: `// Write your solution here\n\nclass Solution {\n    \n}`,
  cpp: `// Write your solution here\n\nclass Solution {\n\n};`,
};

const ALL_TEMPLATES = new Set([
  "",
  "// Write your solution here...",
  "// Write your solution here\n\nfunction solution() {\n  \n}",
  "# Write your solution here\n\ndef solution():\n    pass",
  "// Write your solution here\n\nclass Solution {\n    \n}",
  "// Write your solution here\n\nclass Solution {\n\n};"
]);

export function CodeEditor({ 
  initialValue = "// Write your solution here...", 
  language = "javascript" 
}: CodeEditorProps) {
  const { code, setCode } = useWorkspaceStore();
  const { theme } = useTheme();

  useEffect(() => {
    const currentCodeNormalized = (code || "").trim();
    const isStarter = !code || ALL_TEMPLATES.has(currentCodeNormalized) || currentCodeNormalized.startsWith("// Write your solution here");
    
    if (isStarter) {
      const template = LANGUAGE_TEMPLATES[language.toLowerCase()];
      if (template) {
        setCode(template);
      }
    }
  }, [language, setCode]);

  const handleEditorWillMount = (monaco: Monaco) => {
    // Disable intrusive red error validation for JS/TS
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false, // Keep syntax checks
    });
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false,
    });
  };

  return (
    <div className="h-full w-full border-y border-zinc-200 dark:border-white/5 bg-background">
      <Editor
        height="100%"
        language={language}
        value={code || initialValue}
        theme={theme === "light" ? "light" : "vs-dark"}
        beforeMount={handleEditorWillMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "var(--font-geist-mono)",
          lineHeight: 22,
          padding: { top: 16, bottom: 16 },
          roundedSelection: false,
          scrollBeyondLastLine: false,
          readOnly: false,
          automaticLayout: true,
          cursorBlinking: "smooth",
          smoothScrolling: true,
          cursorSmoothCaretAnimation: "on",
          scrollbar: {
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
        }}
        onChange={(value) => setCode(value || "")}
        className="monaco-editor"
      />
    </div>
  );
}
