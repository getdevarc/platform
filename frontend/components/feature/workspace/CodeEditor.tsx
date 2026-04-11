"use client";

import Editor from "@monaco-editor/react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

interface CodeEditorProps {
  initialValue?: string;
  language?: string;
}

export function CodeEditor({ 
  initialValue = "// Write your solution here...", 
  language = "javascript" 
}: CodeEditorProps) {
  const { code, setCode } = useWorkspaceStore();

  const handleEditorWillMount = (monaco: any) => {
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
    <div className="h-full w-full border-y border-border/40 bg-[#1e1e1e]">
      <Editor
        height="100%"
        language={language}
        value={code || initialValue}
        theme="vs-dark"
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
