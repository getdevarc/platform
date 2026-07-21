"use client";

import React, { useState, useEffect } from "react";

interface NotesEditorProps {
  pageId: string;
  initialNotes: string;
  onSave: (notes: string) => Promise<void>;
}

export default function NotesEditor({ pageId, initialNotes, onSave }: NotesEditorProps) {
  const [localText, setLocalText] = useState(initialNotes || "");
  const [isSaving, setIsSaving] = useState(false);

  // Sync state with active page updates
  useEffect(() => {
    setLocalText(initialNotes || "");
  }, [pageId, initialNotes]);

  // Debounced auto-save loop
  useEffect(() => {
    if (localText === (initialNotes || "")) return;

    setIsSaving(true);
    const delay = setTimeout(async () => {
      try {
        await onSave(localText);
      } catch (err) {
        console.error("Notes auto-save failed:", err);
      } finally {
        setIsSaving(false);
      }
    }, 600);

    return () => clearTimeout(delay);
  }, [localText, onSave, initialNotes]);

  return (
    <div className="space-y-1.5 border-t border-border pt-3">
      <div className="flex justify-between items-center">
        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground block">Personal Learning Notes</span>
        {isSaving && (
          <span className="text-[8px] text-primary font-mono animate-pulse block">Saving...</span>
        )}
      </div>
      <textarea
        value={localText}
        onChange={(e) => setLocalText(e.target.value)}
        placeholder="Write private notes... (Auto-saves)"
        className="w-full min-h-[90px] bg-muted/40 border border-border rounded-lg px-2.5 py-2 text-[11px] text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 outline-none resize-none transition-colors"
      />
    </div>
  );
}
