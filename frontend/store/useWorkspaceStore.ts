import { create } from "zustand";

interface Message {
  role: "user" | "ai";
  content: string;
  type?: "hint" | "explanation" | "review";
}

interface WorkspaceState {
  code: string;
  language: string;
  sessionId: string | null;
  problemId: string | null;
  messages: Message[];
  status: "idle" | "running" | "submitting" | "analyzing";
  result: any | null;
  insights: any | null;
  score: number;
  penalty: number;
  
  setCode: (code: string) => void;
  setLanguage: (language: string) => void;
  setSessionId: (id: string | null) => void;
  setProblemId: (id: string | null) => void;
  addMessage: (message: Message) => void;
  setStatus: (status: WorkspaceState["status"]) => void;
  setResult: (result: any) => void;
  setInsights: (insights: any) => void;
  resetWorkspace: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  code: "",
  language: "javascript",
  sessionId: null,
  problemId: null,
  messages: [],
  status: "idle",
  result: null,
  insights: null,
  score: 100,
  penalty: 0,

  setCode: (code) => set({ code }),
  setLanguage: (language) => set({ language }),
  setSessionId: (id) => set({ sessionId: id }),
  setProblemId: (id) => set({ problemId: id }),
  addMessage: (message) => set((state) => {
    let newScore = state.score;
    let newPenalty = state.penalty;

    if (message.type === "hint") {
      newScore = Math.max(0, state.score - 20);
      newPenalty = state.penalty + 20;
    }

    return {
      messages: [...state.messages, message],
      score: newScore,
      penalty: newPenalty
    };
  }),
  setStatus: (status) => set({ status }),
  setResult: (result) => set({ result }),
  setInsights: (insights) => set({ insights }),
  resetWorkspace: () => set({ 
    code: "", 
    sessionId: null, 
    messages: [], 
    status: "idle", 
    result: null, 
    insights: null,
    score: 100,
    penalty: 0
  }),
}));
