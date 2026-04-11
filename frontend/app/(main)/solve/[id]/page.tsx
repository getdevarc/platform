"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiResponse } from "@/lib/api";
import { WorkspaceContent } from "@/components/feature/workspace/WorkspaceContent";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ClientOnly } from "@/components/shared/ClientOnly";

export default function SolvePage() {
  const params = useParams();
  const problemId = params.id as string;
  const [problem, setProblem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const res = await api.get<ApiResponse<any>>(`/problems/${problemId}`);
        setProblem(res.data.data);
      } catch (err) {
        toast.error("Failed to load problem. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [problemId]);

  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#0a0a0a]">
       <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
       <p className="text-zinc-500 font-medium">Preparing Workspace...</p>
    </div>
  );

  if (!problem) return (
    <div className="h-screen w-full flex items-center justify-center bg-[#0a0a0a]">
       <p className="text-zinc-500">Problem not found.</p>
    </div>
  );

  return (
    <ClientOnly>
      <div className="h-[calc(100vh-64px)] overflow-hidden bg-[#0a0a0a]">
        <WorkspaceContent problem={problem} />
      </div>
    </ClientOnly>
  );
}
