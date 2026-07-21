"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useRequireAdmin } from "@/hooks/useRequireRole";
import { useLoaderStore } from "@/store/useLoaderStore";
import { canAccessAdminPortal } from "@/lib/permissions";
import { useThemeTransition } from "@/hooks/useThemeTransition";
import { api, ApiResponse } from "@/lib/api";
import { toast } from "sonner";
import LearningCMSWorkspace from "@/components/feature/admin/LearningCMSWorkspace";
import CuratedResourcesWorkspace from "@/components/feature/admin/CuratedResourcesWorkspace";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FolderGit,
  Search,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Link2,
  Unlink,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Award,
  Calendar,
  Hash,
  Briefcase,
  Settings,
  LogOut,
  Sun,
  Moon
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  activeTracks: number;
  studyGuidesGenerated: number;
  resourcesGenerated: number;
  solvedProblemsCount: number;
  completedInterviews: number;
  recentActivity: Array<{
    type: string;
    description: string;
    created_at: string;
  }>;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  target_domain?: string;
  target_role?: string;
  dream_company?: string;
  enrolledTracks: string[];
  currentModule?: string;
  last_login_at?: string;
  created_at: string;
  status: string;
  is_superadmin?: boolean;
}

interface LearningTrack {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: string;
  estimated_hours: number;
  icon: string;
  status: string;
  display_order: number;
}

interface LearningModule {
  id: string;
  track_id: string;
  title: string;
  sort_order: number;
}

interface CuratedResource {
  id: string;
  title: string;
  url: string;
  source: string;
  reason?: string;
  tags: string[];
  metadata: Record<string, unknown>;
  category: string;
  provider: string;
  difficulty: string;
  is_official: boolean;
  type: string;
  associations: Array<{
    associationId: string;
    type: string;
    id: string;
  }>;
}

interface PlatformSetting {
  key: string;
  value: Record<string, any> | { limit: number } | { level: string } | { enabled: boolean } | { allowed: boolean };
  description?: string;
  updated_at: string;
  updated_by_name?: string;
}

interface AdminApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

export default function AdminPage() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeTransition();
  const { loading: authLoading, user, isAuthenticated } = useRequireAdmin("/admin/login");
  const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "tracks" | "resources" | "settings">("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  // States
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [tracksList, setTracksList] = useState<LearningTrack[]>([]);
  const [resourcesList, setResourcesList] = useState<CuratedResource[]>([]);
  const [settingsList, setSettingsList] = useState<PlatformSetting[]>([]);

  // Search filter
  const [userSearchQuery, setUserSearchQuery] = useState("");
  // Collapsible detailed user card tracker
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  // CRUD selection modal / edit states
  const [editTrackId, setEditTrackId] = useState<string | null>(null);
  const [trackForm, setTrackForm] = useState({
    slug: "",
    title: "",
    description: "",
    difficulty: "beginner",
    estimated_hours: 10,
    icon: "book-open",
    status: "ACTIVE",
    display_order: 1
  });

  const [activeTrackForModules, setActiveTrackForModules] = useState<string | null>(null);
  const [modulesList, setModulesList] = useState<LearningModule[]>([]);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newModuleOrder, setNewModuleOrder] = useState(1);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingModuleTitle, setEditingModuleTitle] = useState("");
  const [editingModuleOrder, setEditingModuleOrder] = useState(1);

  // Curated resource mapping states removed (migrated to hierarchical workspace)

  // Enforce admin validation
  useEffect(() => {
    if (!authLoading && isAuthenticated && user && canAccessAdminPortal(user)) {
      fetchAllData();
    }
  }, [authLoading, isAuthenticated, user]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, tracksRes, resourcesRes, settingsRes] = await Promise.all([
        api.get<ApiResponse<AdminStats>>("/admin/stats"),
        api.get<ApiResponse<UserProfile[]>>("/admin/users"),
        api.get<ApiResponse<LearningTrack[]>>("/admin/tracks"),
        api.get<ApiResponse<CuratedResource[]>>("/admin/resources"),
        api.get<ApiResponse<PlatformSetting[]>>("/admin/settings")
      ]);

      setStats(statsRes.data.data);
      setUsersList(usersRes.data.data);
      setTracksList(tracksRes.data.data);
      setResourcesList(resourcesRes.data.data);
      setSettingsList(settingsRes.data.data);
    } catch (err: unknown) {
      const axiosError = err as AdminApiError;
      toast.error(axiosError.response?.data?.error || "Error loading admin console data.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (targetUserId: string, newRole: string) => {
    try {
      const res = await api.put<ApiResponse<UserProfile>>(`/admin/users/${targetUserId}/role`, { role: newRole });
      toast.success(`Role updated successfully for ${res.data.data.name}.`);
      fetchAllData();
    } catch (err: unknown) {
      const axiosError = err as AdminApiError;
      toast.error(axiosError.response?.data?.error || "Role modification failed.");
    }
  };

  // Track operations
  const handleSubmitTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editTrackId) {
        await api.put(`/admin/tracks/${editTrackId}`, trackForm);
        toast.success("Learning Track updated successfully.");
      } else {
        await api.post("/admin/tracks", trackForm);
        toast.success("Learning Track created successfully.");
      }
      setEditTrackId(null);
      setTrackForm({ slug: "", title: "", description: "", difficulty: "beginner", estimated_hours: 10, icon: "book-open", status: "ACTIVE", display_order: 1 });
      fetchAllData();
    } catch (err: unknown) {
      const axiosError = err as AdminApiError;
      toast.error(axiosError.response?.data?.error || "Operation failed.");
    }
  };

  const handleSoftArchiveTrack = async (trackId: string) => {
    if (!confirm("Are you sure you want to soft-archive this learning track? Existing enrollments will be preserved.")) return;
    try {
      await api.delete(`/admin/tracks/${trackId}`);
      toast.success("Learning Track archived successfully.");
      fetchAllData();
    } catch (err: unknown) {
      const axiosError = err as AdminApiError;
      toast.error(axiosError.response?.data?.error || "Archiving failed.");
    }
  };

  const handleRestoreTrack = async (trackId: string) => {
    try {
      await api.post(`/admin/tracks/${trackId}/restore`);
      toast.success("Learning Track restored successfully.");
      fetchAllData();
    } catch (err: unknown) {
      const axiosError = err as AdminApiError;
      toast.error(axiosError.response?.data?.error || "Failed to restore track.");
    }
  };

  // Module operations
  const handleLoadModules = async (trackId: string) => {
    setActiveTrackForModules(trackId);
    try {
      const res = await api.get<ApiResponse<LearningModule[]>>(`/admin/tracks/${trackId}/modules`);
      setModulesList(res.data.data);
      // Auto-set order suggestion
      const maxOrder = res.data.data.reduce((max, m) => Math.max(max, m.sort_order), 0);
      setNewModuleOrder(maxOrder + 1);
    } catch (err: unknown) {
      toast.error("Failed to retrieve modules.");
    }
  };

  const handleCreateModule = async () => {
    if (!activeTrackForModules || !newModuleTitle) return;
    try {
      await api.post(`/admin/tracks/${activeTrackForModules}/modules`, {
        title: newModuleTitle,
        sort_order: newModuleOrder
      });
      toast.success("Module added.");
      setNewModuleTitle("");
      handleLoadModules(activeTrackForModules);
    } catch (err: unknown) {
      const axiosError = err as AdminApiError;
      toast.error(axiosError.response?.data?.error || "Failed to create module.");
    }
  };

  const handleUpdateModule = async (moduleId: string) => {
    try {
      await api.put(`/admin/modules/${moduleId}`, {
        title: editingModuleTitle,
        sort_order: editingModuleOrder
      });
      toast.success("Module updated.");
      setEditingModuleId(null);
      if (activeTrackForModules) handleLoadModules(activeTrackForModules);
    } catch (err: unknown) {
      const axiosError = err as AdminApiError;
      toast.error(axiosError.response?.data?.error || "Failed to update module.");
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm("Are you sure you want to delete this module?")) return;
    try {
      await api.delete(`/admin/modules/${moduleId}`);
      toast.success("Module deleted.");
      if (activeTrackForModules) handleLoadModules(activeTrackForModules);
    } catch (err: unknown) {
      const axiosError = err as AdminApiError;
      toast.error(axiosError.response?.data?.error || "Failed to delete module.");
    }
  };

  // Curated Resources operations
  // Platform Settings Save Handler
  const handleSaveSetting = async (settingKey: string, settingValue: any, settingDescription?: string) => {
    try {
      await api.put(`/admin/settings/${settingKey}`, {
        value: settingValue,
        description: settingDescription
      });
      toast.success(`Platform setting '${settingKey}' saved successfully.`);
      fetchAllData();
    } catch (err: unknown) {
      const axiosError = err as AdminApiError;
      toast.error(axiosError.response?.data?.error || "Failed to save platform setting.");
    }
  };

  // Filter users by search
  const filteredUsers = usersList.filter(u =>
    u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    (u.target_domain && u.target_domain.toLowerCase().includes(userSearchQuery.toLowerCase()))
  );

  if (authLoading || !isAuthenticated || !user || !canAccessAdminPortal(user)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background text-foreground min-h-screen">
        <Clock className="animate-spin h-8 w-8 text-primary mb-2" />
        <p className="text-muted-foreground text-sm">Processing permissions and loading administrative tools...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background text-foreground">
        <Clock className="animate-spin h-8 w-8 text-primary mb-2" />
        <p className="text-muted-foreground text-sm">Loading admin dashboard console...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-background text-foreground min-h-screen overflow-hidden">
      
      {/* Sidebar Controls */}
      <div className={`w-full ${isSidebarCollapsed ? "md:w-20 md:px-3" : "md:w-64"} shrink-0 border-b md:border-b-0 md:border-r border-border bg-card/40 p-6 flex flex-col justify-between transition-all duration-300`}>
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between gap-1.5 mb-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles size={16} className="text-primary shrink-0" />
                {!isSidebarCollapsed && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary truncate leading-none">Super Admin</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="hidden md:flex p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all shrink-0"
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              </button>
            </div>
            {!isSidebarCollapsed && (
              <h1 className="text-sm font-black text-foreground leading-tight tracking-tight uppercase">DevArc SuperAdmin</h1>
            )}
          </div>

          <div className="space-y-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              title="Dashboard Metrics"
              className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3"} rounded-xl text-left text-sm font-medium transition-all ${
                activeTab === "dashboard"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <LayoutDashboard size={16} className="shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">Dashboard Metrics</span>}
            </button>
            <button
              onClick={() => setActiveTab("users")}
              title="User Accounts"
              className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3"} rounded-xl text-left text-sm font-medium transition-all ${
                activeTab === "users"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Users size={16} className="shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">User Accounts</span>}
            </button>
            <button
              onClick={() => setActiveTab("tracks")}
              title="Tracks & Curriculum"
              className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3"} rounded-xl text-left text-sm font-medium transition-all ${
                activeTab === "tracks"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <BookOpen size={16} className="shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">Tracks & Curriculum</span>}
            </button>
            <button
              onClick={() => setActiveTab("resources")}
              title="Curated Resources"
              className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3"} rounded-xl text-left text-sm font-medium transition-all ${
                activeTab === "resources"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <FolderGit size={16} className="shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">Curated Resources</span>}
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              title="Platform Settings"
              className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3"} rounded-xl text-left text-sm font-medium transition-all ${
                activeTab === "settings"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Settings size={16} className="shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">Platform Settings</span>}
            </button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border space-y-4 min-w-0">
          {!isSidebarCollapsed ? (
            <div className="flex flex-col gap-3">
              <p className="text-[10px] text-muted-foreground/60 leading-relaxed truncate">
                Logged in as: <span className="font-semibold text-muted-foreground block truncate">{user?.email}</span>
              </p>
              <button
                type="button"
                className="w-full h-9 rounded-xl hover:bg-muted border border-border text-muted-foreground hover:text-foreground text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                onClick={() => toggleTheme()}
              >
                {theme === "dark" ? <Sun size={14} className="text-yellow-500" /> : <Moon size={14} className="text-blue-500" />}
                <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
              </button>
              <button 
                type="button"
                className="w-full h-9 rounded-xl hover:bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                onClick={() => {
                  const loader = useLoaderStore.getState();
                  loader.show("Ending Super Admin session...");
                  setTimeout(() => {
                    logout();
                    loader.hide();
                    toast.success("Super Admin logged out.");
                    router.push("/");
                  }, 1000);
                }}
              >
                <LogOut size={14} />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground" title={`Logged in as: ${user?.email}`}>
                {user?.email ? user.email[0].toUpperCase() : "U"}
              </div>
              <button
                type="button"
                onClick={() => toggleTheme()}
                title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer transition-colors"
              >
                {theme === "dark" ? <Sun size={16} className="text-yellow-500" /> : <Moon size={16} className="text-blue-500" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  const loader = useLoaderStore.getState();
                  loader.show("Ending Super Admin session...");
                  setTimeout(() => {
                    logout();
                    loader.hide();
                    toast.success("Super Admin logged out.");
                    router.push("/");
                  }, 1000);
                }}
                title="Log Out Super Admin"
                className="h-8 w-8 rounded-lg hover:bg-white/5 text-red-400 flex items-center justify-center cursor-pointer transition-colors"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Core Area Content */}
      <div className="flex-grow overflow-y-auto p-6 md:p-8">
        
        {/* TAB 1: METRICS DASHBOARD */}
        {activeTab === "dashboard" && stats && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Platform Overview</h2>
              <p className="text-muted-foreground text-sm">Vital aggregate statistics and engagement parameters.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Stat block 1 */}
              <div className="p-6 rounded-2xl bg-card border border-border flex items-center gap-4">
                <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Registered Users</p>
                  <p className="text-2xl font-extrabold text-foreground">{stats.totalUsers}</p>
                </div>
              </div>

              {/* Stat block 2 */}
              <div className="p-6 rounded-2xl bg-card border border-border flex items-center gap-4">
                <div className="h-12 w-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                  <BookOpen size={24} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Active Learning Tracks</p>
                  <p className="text-2xl font-extrabold text-foreground">{stats.activeTracks}</p>
                </div>
              </div>

              {/* Stat block 3 */}
              <div className="p-6 rounded-2xl bg-card border border-border flex items-center gap-4">
                <div className="h-12 w-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                  <Award size={24} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Study Guides Generated</p>
                  <p className="text-2xl font-extrabold text-foreground">{stats.studyGuidesGenerated}</p>
                </div>
              </div>

              {/* Stat block 4 */}
              <div className="p-6 rounded-2xl bg-card border border-border flex items-center gap-4">
                <div className="h-12 w-12 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-400">
                  <FolderGit size={24} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Curated Links Suggested</p>
                  <p className="text-2xl font-extrabold text-foreground">{stats.resourcesGenerated}</p>
                </div>
              </div>

              {/* Stat block 5 */}
              <div className="p-6 rounded-2xl bg-card border border-border flex items-center gap-4">
                <div className="h-12 w-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Solved Challenges</p>
                  <p className="text-2xl font-extrabold text-foreground">{stats.solvedProblemsCount}</p>
                </div>
              </div>

              {/* Stat block 6 */}
              <div className="p-6 rounded-2xl bg-card border border-border flex items-center gap-4">
                <div className="h-12 w-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-400">
                  <Sparkles size={24} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">AI Mock Interviews</p>
                  <p className="text-2xl font-extrabold text-foreground">{stats.completedInterviews}</p>
                </div>
              </div>

            </div>

            {/* Timeline Segment */}
            <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
              <div>
                <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Recent Activity Logs</h3>
                <p className="text-xs text-muted-foreground/70">Real-time actions occurring across the platform.</p>
              </div>
              <div className="space-y-2">
                {stats.recentActivity && stats.recentActivity.length > 0 ? (
                  stats.recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-muted/50 border border-border rounded-xl text-xs">
                      <div className={`h-2 w-2 rounded-full shrink-0 ${
                        activity.type === "signup" ? "bg-emerald-500" :
                        activity.type === "enrollment" ? "bg-blue-500" : "bg-purple-500"
                      }`} />
                      <span className="flex-grow text-foreground">{activity.description}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(activity.created_at).toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">No recent platform actions logged.</p>
                )}
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card/40">
              <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                <AlertCircle size={16} />
                <span className="text-xs font-semibold">Curation Protocol Guidelines</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                As a Super Administrator, you are responsible for monitoring curriculum alignment. Archiving a track preserves user learning achievements. Always verify mock resources carry safe URL references before associating them polymorphically.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: USER ACCOUNTS */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">User Registrations</h2>
                <p className="text-muted-foreground text-sm">Promote access roles and inspect learning statistics.</p>
              </div>

              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input
                  type="text"
                  placeholder="Search by name, email, or domain..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors text-foreground"
                />
              </div>
            </div>

            <div className="border border-border rounded-2xl bg-card/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-foreground">
                  <thead className="bg-muted text-xs font-bold border-b border-border uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="p-4">User Details</th>
                      <th className="p-4">Target Career Goal</th>
                      <th className="p-4">Enrolled Tracks</th>
                      <th className="p-4">Authorization</th>
                      <th className="p-4">Last Login</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredUsers.map((u) => {
                      const isCurrentUserSuperAdmin = user?.email === "jhaaman810@gmail.com";
                      const isRowExpanded = expandedUserId === u.id;

                      return (
                        <React.Fragment key={u.id}>
                          <tr
                            onClick={() => setExpandedUserId(isRowExpanded ? null : u.id)}
                            className="hover:bg-white/5 transition-colors cursor-pointer"
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className="font-semibold text-foreground">{u.name}</div>
                                {u.is_superadmin && (
                                  <span className="text-[8px] bg-primary/10 text-primary border border-primary/20 px-1 py-0.5 rounded font-bold uppercase tracking-widest">
                                    Super
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">{u.email}</div>
                              <div className="text-[10px] text-muted-foreground/50 mt-0.5">Joined {new Date(u.created_at).toLocaleDateString()}</div>
                            </td>
                            <td className="p-4 text-foreground">
                              {u.target_domain ? (
                                <div className="flex items-center gap-1.5 text-xs bg-muted border border-border px-2 py-1 rounded-lg w-fit">
                                  <Briefcase size={12} className="text-muted-foreground" />
                                  {u.target_domain}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground/50 italic">Unconfigured onboarding</span>
                              )}
                            </td>
                            <td className="p-4">
                              {u.enrolledTracks.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5 max-w-[240px]">
                                  {u.enrolledTracks.map((t, idx) => (
                                    <span key={idx} className="text-[10px] bg-primary/15 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground/50">No enrollments</span>
                              )}
                            </td>
                            <td className="p-4">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                u.role === "admin"
                                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                  : "bg-muted text-muted-foreground border border-border"
                              }`}>
                                {u.role || "user"}
                              </span>
                            </td>
                            <td className="p-4 text-xs text-zinc-400">
                              {u.last_login_at ? (
                                <span className="flex items-center gap-1 text-[11px] text-foreground">
                                  <Calendar size={12} className="text-muted-foreground" />
                                  {new Date(u.last_login_at).toLocaleDateString()}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/50 italic">Never</span>
                              )}
                            </td>
                            <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                              {u.email === "jhaaman810@gmail.com" ? (
                                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest block text-right pr-2">Super Admin</span>
                              ) : u.role === "admin" ? (
                                <button
                                  onClick={() => handleUpdateRole(u.id, "user")}
                                  disabled={!isCurrentUserSuperAdmin}
                                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                                    isCurrentUserSuperAdmin
                                      ? "bg-muted hover:bg-secondary border-border text-red-500 dark:text-red-400"
                                      : "bg-muted border-border text-muted-foreground/50 cursor-not-allowed"
                                  }`}
                                  title={!isCurrentUserSuperAdmin ? "Required authorization: Super Admin (jhaaman810@gmail.com)" : "Demote administrator to user account"}
                                >
                                  Demote
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdateRole(u.id, "admin")}
                                  disabled={!isCurrentUserSuperAdmin}
                                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
                                    isCurrentUserSuperAdmin
                                      ? "bg-primary/10 hover:bg-primary/20 border-primary/30 text-primary"
                                      : "bg-muted border-border text-muted-foreground/50 cursor-not-allowed"
                                  }`}
                                  title={!isCurrentUserSuperAdmin ? "Required authorization: Super Admin (jhaaman810@gmail.com)" : "Promote user to administrator"}
                                >
                                  Promote
                                </button>
                              )}
                            </td>
                          </tr>

                          {isRowExpanded && (
                            <tr className="bg-muted/40 border-b border-border">
                              <td colSpan={6} className="p-5">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs text-foreground">
                                  <div className="space-y-1">
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Career Goal Details</span>
                                    <div>Target Role: <strong className="text-foreground">{u.target_role || "Not specified"}</strong></div>
                                    <div>Dream Company: <strong className="text-foreground">{u.dream_company || "Not specified"}</strong></div>
                                  </div>

                                  <div className="space-y-1">
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Curriculum Status</span>
                                    <div>Current Module: <strong className="text-foreground">{u.currentModule || "None"}</strong></div>
                                    <div>Enrollments: <strong className="text-foreground">{u.enrolledTracks.length} active</strong></div>
                                  </div>

                                  <div className="space-y-1">
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Security & Flags</span>
                                    <div>Super Administrator: <strong className={u.is_superadmin ? "text-primary font-bold" : "text-zinc-400"}>{u.is_superadmin ? "Yes" : "No"}</strong></div>
                                    <div>Status: <strong className="text-emerald-400 capitalize">{u.status || "Active"}</strong></div>
                                  </div>

                                  <div className="space-y-1">
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Sessions Metadata</span>
                                    <div>Registration Date: <strong className="text-foreground">{new Date(u.created_at).toLocaleString()}</strong></div>
                                    <div>Last Login Seen: <strong className="text-foreground">{u.last_login_at ? new Date(u.last_login_at).toLocaleString() : "Never"}</strong></div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground italic">
                          No matching developer records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TRACKS & CURRICULUM */}
        {activeTab === "tracks" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Curriculum Workspace</h2>
              <p className="text-muted-foreground text-sm">Manage tracks, modules, pages and lesson content directly.</p>
            </div>
            <LearningCMSWorkspace
              tracksList={tracksList}
              resourcesList={resourcesList}
              fetchAllData={fetchAllData}
            />
          </div>
        )}

        {/* TAB 4: CURATED RESOURCES */}
        {activeTab === "resources" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Curated Resources Workspace</h2>
              <p className="text-muted-foreground text-sm">Manage hierarchical course reference materials scoping from pages and module lessons.</p>
            </div>
            <CuratedResourcesWorkspace
              tracksList={tracksList}
              fetchAllData={fetchAllData}
              onNavigateToTracks={() => setActiveTab("tracks")}
            />
          </div>
        )}
        {/* TAB 5: PLATFORM SETTINGS */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Platform Settings</h2>
              <p className="text-muted-foreground text-sm">Fine-tune global variables, credit limits, security policies, and feature access flags. Changes are audited.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {settingsList.map((setting) => {
                // Parse label & description mapping
                let label = setting.key;
                let description = setting.description || "Platform configuration flag.";
                
                if (setting.key === "max_daily_credits") {
                  label = "Maximum Daily Credits Limit";
                  description = "The maximum number of AI generation credits a user can consume per day.";
                } else if (setting.key === "default_difficulty") {
                  label = "Default Recommendation Difficulty";
                  description = "The fallback baseline level for new curriculum suggestions.";
                } else if (setting.key === "maintenance_mode") {
                  label = "Global Maintenance Mode";
                  description = "Locks platform routes to read-only operation except for admin staff.";
                } else if (setting.key === "allow_registration") {
                  label = "Allow User Registration";
                  description = "Controls whether new visitor registration is enabled.";
                }

                const val = (setting.value || {}) as Record<string, any>;

                return (
                  <div key={setting.key} className="p-6 rounded-2xl bg-card border border-border flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-foreground">{label}</span>
                        <span className="text-[10px] font-mono bg-muted border border-border px-2 py-0.5 rounded text-muted-foreground">{setting.key}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>

                    <div className="pt-2 flex flex-col gap-3">
                      {setting.key === "max_daily_credits" && (
                        <div className="flex gap-2.5">
                          <input
                            type="number"
                            className="bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary flex-1"
                            defaultValue={val.limit || 50}
                            id={`input-${setting.key}`}
                          />
                          <button
                            onClick={() => {
                              const el = document.getElementById(`input-${setting.key}`) as HTMLInputElement;
                              const limitValue = parseInt(el?.value || "50", 10);
                              handleSaveSetting(setting.key, { limit: limitValue }, description);
                            }}
                            className="px-3.5 py-1.5 bg-primary hover:bg-primary-dark font-bold text-primary-foreground text-xs rounded-xl transition-all"
                          >
                            Save Limit
                          </button>
                        </div>
                      )}

                      {setting.key === "default_difficulty" && (
                        <div className="flex gap-2.5">
                          <select
                            className="bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary flex-1"
                            defaultValue={val.level || "beginner"}
                            id={`input-${setting.key}`}
                          >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                          </select>
                          <button
                            onClick={() => {
                              const el = document.getElementById(`input-${setting.key}`) as HTMLSelectElement;
                              handleSaveSetting(setting.key, { level: el?.value || "beginner" }, description);
                            }}
                            className="px-3.5 py-1.5 bg-primary hover:bg-primary-dark font-bold text-primary-foreground text-xs rounded-xl transition-all"
                          >
                            Set Level
                          </button>
                        </div>
                      )}

                      {(setting.key === "maintenance_mode" || setting.key === "allow_registration") && (
                        <div className="flex items-center justify-between bg-muted/50 p-3 rounded-xl border border-border">
                          <span className="text-xs text-muted-foreground">Current state: <strong className="text-foreground capitalize">{String(val.enabled ?? val.allowed ?? "false")}</strong></span>
                          <button
                            onClick={() => {
                              let nextVal = false;
                              if (setting.key === "maintenance_mode") {
                                nextVal = !(val.enabled ?? false);
                                handleSaveSetting(setting.key, { enabled: nextVal }, description);
                              } else {
                                nextVal = !(val.allowed ?? true);
                                handleSaveSetting(setting.key, { allowed: nextVal }, description);
                              }
                            }}
                            className={`px-3 py-1 font-bold text-xs rounded-lg transition-colors ${
                              (val.enabled ?? val.allowed)
                                ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                            }`}
                          >
                            {(val.enabled ?? val.allowed) ? "Turn Off" : "Turn On"}
                          </button>
                        </div>
                      )}

                      <div className="text-[10px] text-muted-foreground pt-2 border-t border-border space-y-1">
                        <div className="flex justify-between">
                          <span>Updated By:</span>
                          <span className="text-foreground/80 font-semibold">{setting.updated_by_name || "System Base"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Last Changed:</span>
                          <span className="text-foreground/80">{new Date(setting.updated_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
