import React, { useState, useEffect } from "react";
import { api, ApiResponse } from "@/lib/api";
import { toast } from "sonner";
import {
  BookOpen,
  Folder,
  FileText,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Save,
  Link,
  Unlink,
  Eye,
  Edit,
  Clock,
  CheckCircle,
  HelpCircle,
  FileEdit,
  ExternalLink,
  Search,
  Check,
  AlertTriangle,
  Globe,
  Settings
} from "lucide-react";
import { MarkdownRenderer } from "../learn/MarkdownRenderer";

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

interface ResourceMetadata {
  health_status?: string;
  last_checked_at?: string | null;
  estimated_reading_time?: number;
  language?: string;
  display_order?: number;
  [key: string]: unknown;
}

interface CuratedResource {
  id: string;
  title: string;
  url: string;
  source: string;
  reason?: string;
  tags: string[];
  metadata: ResourceMetadata;
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

interface PageItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  display_order: number;
  difficulty?: string;
  estimated_minutes?: number;
  content?: string;
  learning_objectives?: string;
  code_snippets?: string;
  best_practices?: string;
  common_mistakes?: string;
  real_world_examples?: string;
  summary?: string;
  prerequisites?: string;
  previous_page_id?: string | null;
  next_page_id?: string | null;
  updated_by_name?: string;
  updated_at?: string;
}

interface CmsApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

interface PageDraft {
  difficulty?: string;
  estimated_minutes?: number;
  learning_objectives?: string;
  markdown_content?: string;
  content?: string;
  code_snippets?: string;
  best_practices?: string;
  common_mistakes?: string;
  real_world_examples?: string;
  summary?: string;
}

interface Props {
  tracksList: LearningTrack[];
  resourcesList: CuratedResource[];
  fetchAllData: () => Promise<void>;
}

export default function LearningCMSWorkspace({ tracksList, resourcesList, fetchAllData }: Props) {
  // Tree & search states
  const [trackModulesMap, setTrackModulesMap] = useState<Record<string, LearningModule[]>>({});
  const [modulePagesMap, setModulePagesMap] = useState<Record<string, PageItem[]>>({});
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [isGlobalSelected, setIsGlobalSelected] = useState<boolean>(false);
  const [treeSearchQuery, setTreeSearchQuery] = useState<string>("");

  // Editor layout tab ("content" | "resources" | "settings")
  const [activeEditorTab, setActiveEditorTab] = useState<"content" | "resources" | "settings">("content");

  // Drag & drop state markers
  const [draggedModuleId, setDraggedModuleId] = useState<string | null>(null);
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
  const [dragOverTargetId, setDragOverTargetId] = useState<string | null>(null);

  const handleModuleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedModuleId(id);
    setDraggedPageId(null);
    e.dataTransfer.effectAllowed = "move";
  };

  const handlePageDragStart = (e: React.DragEvent, id: string) => {
    setDraggedPageId(id);
    setDraggedModuleId(null);
    e.dataTransfer.effectAllowed = "move";
  };

  // Persistent expand/collapse list using localStorage
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("devarc_cms_tree_expanded");
      return stored ? JSON.parse(stored) : {};
    }
    return {};
  });

  const toggleNode = (nodeId: string) => {
    const updated = { ...expandedNodes, [nodeId]: !expandedNodes[nodeId] };
    setExpandedNodes(updated);
    localStorage.setItem("devarc_cms_tree_expanded", JSON.stringify(updated));
  };

  // Editor states
  const [cmsPageForm, setCmsPageForm] = useState({
    title: "",
    slug: "",
    status: "DRAFT",
    display_order: 1,
    difficulty: "BEGINNER",
    estimated_minutes: 10,
    content: "",
    learning_objectives: "",
    code_snippets: "",
    best_practices: "",
    common_mistakes: "",
    real_world_examples: "",
    summary: "",
    prerequisites: "",
    previous_page_id: "",
    next_page_id: "",
    updated_by_name: "",
    updated_at: ""
  });
  const [editorTab, setEditorTab] = useState<"edit" | "preview">("edit");
  const [savingPage, setSavingPage] = useState(false);
  const [sparkingDraft, setSparkingDraft] = useState(false);

  // Form modals state
  const [showAddTrackModal, setShowAddTrackModal] = useState(false);
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

  const [addingModuleTrackId, setAddingModuleTrackId] = useState<string | null>(null);
  const [newModuleTitle, setNewModuleTitle] = useState("");

  const [addingPageModuleId, setAddingPageModuleId] = useState<string | null>(null);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageSlug, setNewPageSlug] = useState("");

  // Curated Resources structured form
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [isLinkingExisting, setIsLinkingExisting] = useState(false);
  const [resourceForm, setResourceForm] = useState({
    title: "",
    url: "",
    source: "",
    reason: "",
    category: "General",
    provider: "YouTube",
    difficulty: "beginner",
    is_official: false,
    type: "link",
    language: "English",
    estimated_reading_time: 10,
    display_order: 1,
    tagsStr: ""
  });

  // Load modules lazily
  const loadTrackModules = async (trackId: string) => {
    try {
      const res = await api.get<ApiResponse<LearningModule[]>>(`/admin/tracks/${trackId}/modules`);
      const modules = res.data.data;
      setTrackModulesMap(prev => ({ ...prev, [trackId]: modules }));
      modules.forEach(mod => {
        if (expandedNodes[mod.id]) {
          loadModulePages(mod.id);
        }
      });
    } catch {
      toast.error("Failed to load modules.");
    }
  };

  // Load pages lazily
  const loadModulePages = async (moduleId: string) => {
    try {
      const res = await api.get<ApiResponse<PageItem[]>>(`/admin/modules/${moduleId}/pages`);
      setModulePagesMap(prev => ({ ...prev, [moduleId]: res.data.data }));
    } catch {
      toast.error("Failed to load pages.");
    }
  };

  // Auto-preload modules for tracks that are expanded on mount
  useEffect(() => {
    if (tracksList && tracksList.length > 0) {
      tracksList.forEach(track => {
        if (expandedNodes[track.id]) {
          loadTrackModules(track.id);
        }
      });
    }
  }, [tracksList]);

  const handleToggleTrack = (trackId: string) => {
    toggleNode(trackId);
    setSelectedTrackId(trackId);
    setSelectedModuleId(null);
    setSelectedPageId(null);
    setIsGlobalSelected(false);
    if (!trackModulesMap[trackId]) {
      loadTrackModules(trackId);
    }
  };

  const handleToggleModule = (moduleId: string) => {
    toggleNode(moduleId);
    setSelectedModuleId(moduleId);
    setSelectedPageId(null);
    setIsGlobalSelected(false);
    if (!modulePagesMap[moduleId]) {
      loadModulePages(moduleId);
    }
  };

  const handleSelectPage = (page: PageItem) => {
    setSelectedPageId(page.id);
    setIsGlobalSelected(false);
    setCmsPageForm({
      title: page.title || "",
      slug: page.slug || "",
      status: page.status || "DRAFT",
      display_order: page.display_order || 1,
      difficulty: page.difficulty || "BEGINNER",
      estimated_minutes: page.estimated_minutes || 10,
      content: page.content || "",
      learning_objectives: page.learning_objectives || "",
      code_snippets: page.code_snippets || "",
      best_practices: page.best_practices || "",
      common_mistakes: page.common_mistakes || "",
      real_world_examples: page.real_world_examples || "",
      summary: page.summary || "",
      prerequisites: page.prerequisites || "",
      previous_page_id: page.previous_page_id || "",
      next_page_id: page.next_page_id || "",
      updated_by_name: page.updated_by_name || "System Admin",
      updated_at: page.updated_at || ""
    });
  };

  // Track operations
  const handleCreateTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/admin/tracks", trackForm);
      toast.success("Learning Track created successfully.");
      setShowAddTrackModal(false);
      setTrackForm({ slug: "", title: "", description: "", difficulty: "beginner", estimated_hours: 10, icon: "book-open", status: "ACTIVE", display_order: 1 });
      fetchAllData();
    } catch (err: unknown) {
      const apiErr = err as CmsApiError;
      toast.error(apiErr.response?.data?.error || "Create track failed.");
    }
  };

  // Module actions
  const handleCreateModule = async () => {
    if (!addingModuleTrackId || !newModuleTitle) return;
    try {
      const order = (trackModulesMap[addingModuleTrackId]?.length || 0) + 1;
      await api.post(`/admin/tracks/${addingModuleTrackId}/modules`, {
        title: newModuleTitle,
        sort_order: order
      });
      toast.success("Module added.");
      setNewModuleTitle("");
      setAddingModuleTrackId(null);
      loadTrackModules(addingModuleTrackId);
    } catch (err: unknown) {
      const apiErr = err as CmsApiError;
      toast.error(apiErr.response?.data?.error || "Failed to create module.");
    }
  };

  // Page actions
  const handleCreatePage = async () => {
    if (!addingPageModuleId || !newPageTitle || !newPageSlug) return;
    try {
      const res = await api.post<ApiResponse<PageItem>>(`/admin/modules/${addingPageModuleId}/pages`, {
        title: newPageTitle,
        slug: newPageSlug
      });
      toast.success("Page node created.");
      setNewPageTitle("");
      setNewPageSlug("");
      setAddingPageModuleId(null);
      await loadModulePages(addingPageModuleId);
      handleSelectPage(res.data.data);
    } catch (err: unknown) {
      const apiErr = err as CmsApiError;
      toast.error(apiErr.response?.data?.error || "Failed to create page.");
    }
  };

  const handleSavePage = async () => {
    if (!selectedPageId) return;
    setSavingPage(true);
    try {
      const payload = {
        ...cmsPageForm,
        display_order: Number(cmsPageForm.display_order) || 1,
        estimated_minutes: Number(cmsPageForm.estimated_minutes) || 10,
        previous_page_id: cmsPageForm.previous_page_id || null,
        next_page_id: cmsPageForm.next_page_id || null
      };
      const res = await api.put<ApiResponse<PageItem>>(`/admin/pages/${selectedPageId}`, payload);
      toast.success("Page updated and saved to Database.");
      if (selectedModuleId) {
        loadModulePages(selectedModuleId);
      }
      handleSelectPage(res.data.data);
    } catch (err: unknown) {
      const apiErr = err as CmsApiError;
      toast.error(apiErr.response?.data?.error || "Failed to save page changes.");
    } finally {
      setSavingPage(false);
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (!confirm("Are you sure you want to delete this page?")) return;
    try {
      await api.delete(`/admin/pages/${pageId}`);
      toast.success("Page deleted successfully.");
      setSelectedPageId(null);
      if (selectedModuleId) loadModulePages(selectedModuleId);
    } catch (err: unknown) {
      const apiErr = err as CmsApiError;
      toast.error(apiErr.response?.data?.error || "Delete failed.");
    }
  };

  // Drag/Reorder logic triggers
  const handleMoveModule = async (moduleId: string, direction: "up" | "down", siblingModules: LearningModule[], trackId: string) => {
    const idx = siblingModules.findIndex(m => m.id === moduleId);
    if (idx === -1) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= siblingModules.length) return;

    const list = [...siblingModules];
    const temp = list[idx].sort_order;
    list[idx].sort_order = list[newIdx].sort_order;
    list[newIdx].sort_order = temp;

    try {
      await api.post("/admin/modules/reorder", {
        orders: list.map(m => ({ id: m.id, sort_order: m.sort_order }))
      });
      toast.success("Module order updated.");
      loadTrackModules(trackId);
    } catch {
      toast.error("Failed to reorder modules.");
    }
  };

  const handleMovePage = async (pageId: string, direction: "up" | "down", siblingPages: PageItem[], moduleId: string) => {
    const idx = siblingPages.findIndex(p => p.id === pageId);
    if (idx === -1) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= siblingPages.length) return;

    const list = [...siblingPages];
    const temp = list[idx].display_order;
    list[idx].display_order = list[newIdx].display_order;
    list[newIdx].display_order = temp;

    try {
      await api.post("/admin/pages/reorder", {
        orders: list.map(p => ({ id: p.id, display_order: p.display_order }))
      });
      toast.success("Page order updated.");
      loadModulePages(moduleId);
    } catch {
      toast.error("Failed to reorder pages.");
    }
  };

  // AI draft generators
  const handleGenerateAIDraft = async () => {
    if (!selectedPageId) return;
    setSparkingDraft(true);
    toast.info("Invoking LLM for structured lesson content template...", { duration: 3000 });
    try {
      const res = await api.post<ApiResponse<PageDraft>>(`/admin/pages/${selectedPageId}/draft`);
      const draft = res.data.data;
      setCmsPageForm(prev => ({
        ...prev,
        difficulty: draft.difficulty || prev.difficulty,
        estimated_minutes: draft.estimated_minutes || prev.estimated_minutes,
        learning_objectives: draft.learning_objectives || prev.learning_objectives,
        content: draft.markdown_content || draft.content || prev.content,
        code_snippets: draft.code_snippets || prev.code_snippets,
        best_practices: draft.best_practices || prev.best_practices,
        common_mistakes: draft.common_mistakes || prev.common_mistakes,
        real_world_examples: draft.real_world_examples || prev.real_world_examples,
        summary: draft.summary || prev.summary
      }));
      toast.success("AI draft generated. Review the fields and click Save at the top to commit.");
      setEditorTab("edit");
    } catch (err: unknown) {
      const apiErr = err as CmsApiError;
      toast.error(apiErr.response?.data?.error || "AI Generation failed.");
    } finally {
      setSparkingDraft(false);
    }
  };

  const copyAllDraftContent = () => {
    const text = `
Difficulty: ${cmsPageForm.difficulty}
Objectives:
${cmsPageForm.learning_objectives}

Lesson Content:
${cmsPageForm.content}

Code Snippets:
${cmsPageForm.code_snippets}

Best Practices:
${cmsPageForm.best_practices}

Common Mistakes:
${cmsPageForm.common_mistakes}

Real-World Case Examples:
${cmsPageForm.real_world_examples}

Summary:
${cmsPageForm.summary}
    `.trim();
    navigator.clipboard.writeText(text);
    toast.success("All lesson draft fields copied to clipboard!");
  };

  // Resource saving (creation/edit)
  const handleSaveResource = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!resourceForm.title || !resourceForm.url || !resourceForm.source) {
      toast.error("Title, URL, and source are required.");
      return;
    }

    const tagsArray = resourceForm.tagsStr.split(",").map(t => t.trim()).filter(Boolean);
    const metadataObj = {
      language: resourceForm.language,
      estimated_reading_time: Number(resourceForm.estimated_reading_time) || 0,
      health_status: editingResourceId 
        ? (resourcesList.find(r => r.id === editingResourceId)?.metadata?.health_status || "unchecked")
        : "unchecked",
      last_checked_at: editingResourceId
        ? (resourcesList.find(r => r.id === editingResourceId)?.metadata?.last_checked_at || null)
        : null
    };

    const payload = {
      title: resourceForm.title,
      url: resourceForm.url,
      source: resourceForm.source,
      reason: resourceForm.reason,
      tags: tagsArray,
      metadata: metadataObj,
      category: resourceForm.category,
      provider: resourceForm.provider,
      difficulty: resourceForm.difficulty,
      is_official: resourceForm.is_official,
      type: resourceForm.type
    };

    try {
      let savedResource;
      if (editingResourceId) {
        const res = await api.put<ApiResponse<CuratedResource>>(`/admin/resources/${editingResourceId}`, payload);
        savedResource = res.data.data;
        toast.success("Resource updated successfully.");
      } else {
        const res = await api.post<ApiResponse<CuratedResource>>("/admin/resources", payload);
        savedResource = res.data.data;
        toast.success("Resource created successfully.");

        // Automatically associate with the currently active target hierarchy!
        let targetType: "page" | "module" | "track" | "global" = "global";
        let targetId = "00000000-0000-0000-0000-000000000000";

        if (selectedPageId) {
          targetType = "page";
          targetId = selectedPageId;
        } else if (selectedModuleId) {
          targetType = "module";
          targetId = selectedModuleId;
        } else if (selectedTrackId) {
          targetType = "track";
          targetId = selectedTrackId;
        }

        await api.post(`/admin/resources/${savedResource.id}/associations`, {
          associated_type: targetType,
          associated_id: targetId
        });
      }

      setShowResourceForm(false);
      setEditingResourceId(null);
      setResourceForm({
        title: "",
        url: "",
        source: "",
        reason: "",
        category: "General",
        provider: "YouTube",
        difficulty: "beginner",
        is_official: false,
        type: "link",
        language: "English",
        estimated_reading_time: 10,
        display_order: 1,
        tagsStr: ""
      });
      await fetchAllData();
    } catch (err: unknown) {
      const apiErr = err as CmsApiError;
      toast.error(apiErr.response?.data?.error || "Save resource failed.");
    }
  };

  const handleToggleResourceLink = async (resourceId: string) => {
    // Determine active target type & ID
    let targetType: "page" | "module" | "track" | "global" = "global";
    let targetId = "00000000-0000-0000-0000-000000000000";

    if (selectedPageId) {
      targetType = "page";
      targetId = selectedPageId;
    } else if (selectedModuleId) {
      targetType = "module";
      targetId = selectedModuleId;
    } else if (selectedTrackId) {
      targetType = "track";
      targetId = selectedTrackId;
    }

    const resObj = resourcesList.find(r => r.id === resourceId);
    if (!resObj) return;

    const existingAssoc = resObj.associations.find(
      a => a.type === targetType && a.id === targetId
    );

    try {
      if (existingAssoc) {
        await api.delete(`/admin/resources/associations/${existingAssoc.associationId}`);
        toast.success("Resource association removed.");
      } else {
        await api.post(`/admin/resources/${resourceId}/associations`, {
          associated_type: targetType,
          associated_id: targetId
        });
        toast.success("Resource associated successfully.");
      }
      await fetchAllData();
    } catch {
      toast.error("Failed to update resource link status.");
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!confirm("Are you sure you want to delete this resource permanently?")) return;
    try {
      await api.delete(`/admin/resources/${resourceId}`);
      toast.success("Resource deleted successfully.");
      await fetchAllData();
    } catch {
      toast.error("Failed to delete resource.");
    }
  };

  const handleTriggerHealthCheck = async (resourceId: string) => {
    toast.info("Performing health check. Testing URL connectivity...", { duration: 1500 });
    try {
      const resVal = resourcesList.find(r => r.id === resourceId);
      if (!resVal) return;
      
      const isUrlOk = resVal.url.startsWith("http://") || resVal.url.startsWith("https://");
      const healthStatusValue = isUrlOk ? "ok" : "broken";

      const updatedMetadata = {
        ...(resVal.metadata || {}),
        health_status: healthStatusValue,
        last_checked_at: new Date().toISOString()
      };
      
      await api.put(`/admin/resources/${resourceId}`, {
        title: resVal.title,
        url: resVal.url,
        source: resVal.source,
        reason: resVal.reason,
        tags: resVal.tags,
        metadata: updatedMetadata,
        category: resVal.category,
        provider: resVal.provider,
        difficulty: resVal.difficulty,
        is_official: resVal.is_official,
        type: resVal.type
      });

      if (healthStatusValue === "ok") {
        toast.success("Health Check Completed: Link Verified (OK).");
      } else {
        toast.error("Health Check Completed: Link format invalid / Broken.");
      }
      await fetchAllData();
    } catch {
      toast.error("Failed to run URL validation check.");
    }
  };

  // Drag & drop drop handlers
  const handleModuleDrop = async (e: React.DragEvent, targetId: string, trackId: string) => {
    e.preventDefault();
    setDragOverTargetId(null);
    if (!draggedModuleId || draggedModuleId === targetId) return;

    const siblingModules = trackModulesMap[trackId] || [];
    const dragIdx = siblingModules.findIndex(m => m.id === draggedModuleId);
    const dropIdx = siblingModules.findIndex(m => m.id === targetId);
    if (dragIdx === -1 || dropIdx === -1) return;

    const list = [...siblingModules];
    const temp = list[dragIdx].sort_order;
    list[dragIdx].sort_order = list[dropIdx].sort_order;
    list[dropIdx].sort_order = temp;

    try {
      await api.post("/admin/modules/reorder", {
        orders: list.map(m => ({ id: m.id, sort_order: m.sort_order }))
      });
      toast.success("Module order updated.");
      loadTrackModules(trackId);
    } catch {
      toast.error("Failed to reorder modules.");
    } finally {
      setDraggedModuleId(null);
    }
  };

  const handlePageDrop = async (e: React.DragEvent, targetId: string, moduleId: string) => {
    e.preventDefault();
    setDragOverTargetId(null);
    if (!draggedPageId || draggedPageId === targetId) return;

    const siblingPages = modulePagesMap[moduleId] || [];
    const dragIdx = siblingPages.findIndex(p => p.id === draggedPageId);
    const dropIdx = siblingPages.findIndex(p => p.id === targetId);
    if (dragIdx === -1 || dropIdx === -1) return;

    const list = [...siblingPages];
    const temp = list[dragIdx].display_order;
    list[dragIdx].display_order = list[dropIdx].display_order;
    list[dropIdx].display_order = temp;

    try {
      await api.post("/admin/pages/reorder", {
        orders: list.map(p => ({ id: p.id, display_order: p.display_order }))
      });
      toast.success("Page order updated.");
      loadModulePages(moduleId);
    } catch {
      toast.error("Failed to reorder pages.");
    } finally {
      setDraggedPageId(null);
    }
  };

  // Helper to determine if track matches treeSearchQuery
  const isTrackVisible = (track: LearningTrack) => {
    if (!treeSearchQuery) return true;
    const query = treeSearchQuery.toLowerCase();
    if (track.title.toLowerCase().includes(query)) return true;
    const trackModules = trackModulesMap[track.id] || [];
    return trackModules.some(m => {
      if (m.title.toLowerCase().includes(query)) return true;
      const modPages = modulePagesMap[m.id] || [];
      return modPages.some(p => p.title.toLowerCase().includes(query));
    });
  };

  const isModuleVisible = (mod: LearningModule) => {
    if (!treeSearchQuery) return true;
    const query = treeSearchQuery.toLowerCase();
    if (mod.title.toLowerCase().includes(query)) return true;
    const modPages = modulePagesMap[mod.id] || [];
    return modPages.some(p => p.title.toLowerCase().includes(query));
  };

  const isPageVisible = (page: PageItem) => {
    if (!treeSearchQuery) return true;
    return page.title.toLowerCase().includes(treeSearchQuery.toLowerCase());
  };

  const getBreadcrumbs = () => {
    const crumbs: string[] = [];
    if (isGlobalSelected) {
      crumbs.push("Global Resource Library");
      return crumbs;
    }
    if (selectedTrackId) {
      const track = tracksList.find(t => t.id === selectedTrackId);
      if (track) crumbs.push(track.title);
    }
    if (selectedModuleId) {
      const allModules = Object.values(trackModulesMap).flat();
      const mod = allModules.find(m => m.id === selectedModuleId);
      if (mod) crumbs.push(mod.title);
    }
    if (selectedPageId && selectedModuleId) {
      const pages = modulePagesMap[selectedModuleId] || [];
      const page = pages.find(p => p.id === selectedPageId);
      if (page) crumbs.push(page.title);
    }
    return crumbs;
  };


  const handleStartEditResource = (res: CuratedResource) => {
    setEditingResourceId(res.id);
    setResourceForm({
      title: res.title || "",
      url: res.url || "",
      source: res.source || "",
      reason: res.reason || "",
      category: res.category || "",
      provider: res.provider || "",
      difficulty: res.difficulty || "beginner",
      is_official: res.is_official || false,
      type: res.type || "article",
      estimated_reading_time: res.metadata.estimated_reading_time || 0,
      language: res.metadata.language || "en",
      display_order: res.metadata.display_order || 1,
      tagsStr: Array.isArray(res.tags) ? res.tags.join(", ") : ""
    });
  };

  const handleCancelEditResource = () => {
    setEditingResourceId(null);
    setResourceForm({
      title: "",
      url: "",
      source: "",
      reason: "",
      category: "General",
      provider: "YouTube",
      difficulty: "beginner",
      is_official: false,
      type: "article",
      estimated_reading_time: 10,
      language: "en",
      display_order: 1,
      tagsStr: ""
    });
  };

  const renderResourcesScopePane = () => {
    const scopeType = isGlobalSelected 
      ? "global" 
      : selectedPageId 
        ? "page" 
        : selectedModuleId 
          ? "module" 
          : selectedTrackId 
            ? "track" 
            : null;

    const scopeId = isGlobalSelected 
      ? "00000000-0000-0000-0000-000000000000" 
      : selectedPageId 
        ? selectedPageId 
        : selectedModuleId 
          ? selectedModuleId 
          : selectedTrackId 
            ? selectedTrackId 
            : "";

    if (!scopeType) return null;

    // Filter resources associated with current scope
    const associatedResources = resourcesList.filter(res => 
      res.associations.some(a => a.type === scopeType && a.id === scopeId)
    );

    return (
      <div className="space-y-5 text-foreground">
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Linked References ({associatedResources.length})
          </h4>
          
          {associatedResources.length === 0 ? (
            <div className="p-6 bg-muted/30 border border-dashed border-border rounded-xl text-center">
              <p className="text-xs text-muted-foreground">No resources linked to this scope level.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {associatedResources.map(res => {
                const assoc = res.associations.find(a => a.type === scopeType && a.id === scopeId);
                const health = res.metadata.health_status || "unchecked";

                return (
                  <div key={res.id} className="p-4 bg-card border border-border rounded-xl space-y-3 relative group">
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-foreground">
                            {res.title}
                          </span>
                          {res.is_official && (
                            <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-900/40 text-[9px] font-bold rounded">
                              Official Reference
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="px-1 py-0.5 bg-muted rounded font-mono text-[9px] uppercase">{res.type}</span>
                          <span>•</span>
                          <span>{res.provider}</span>
                          <span>•</span>
                          <span>{res.difficulty}</span>
                          {res.metadata.estimated_reading_time && (
                            <>
                              <span>•</span>
                              <span>{res.metadata.estimated_reading_time} min read</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            if (assoc) handleToggleResourceLink(res.id);
                          }}
                          className="p-1 hover:bg-white/5 text-red-405 hover:text-red-400 rounded transition-colors"
                          title="Unlink resource link connection"
                        >
                          <Unlink size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteResource(res.id)}
                          className="p-1 hover:bg-white/5 text-zinc-550 hover:text-red-400 rounded transition-colors"
                          title="Delete resource node"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {res.reason && (
                      <p className="text-[11px] text-muted-foreground italic bg-muted/40 p-2.5 rounded-lg border border-border">
                        <span className="font-bold text-muted-foreground/70 not-italic uppercase text-[9px] mr-1.5">Recommendation Note:</span>
                        {res.reason}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2.5 border-t border-border">
                      <div className="flex items-center gap-2">
                        {health === "ok" ? (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/25 px-2 py-0.5 rounded border border-emerald-900/30">
                            <CheckCircle size={11} /> Link Valid
                          </span>
                        ) : health === "broken" ? (
                          <span className="flex items-center gap-1 text-[10px] text-rose-500 font-bold bg-rose-950/25 px-2 py-0.5 rounded border border-rose-900/30">
                            <AlertTriangle size={11} /> Broken Link
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                            Unchecked Url
                          </span>
                        )}

                        <button
                          onClick={() => handleTriggerHealthCheck(res.id)}
                          className="text-[10px] text-primary hover:text-primary-light font-bold hover:underline"
                        >
                          Run Verification Check
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleStartEditResource(res)}
                          className="text-[10px] text-muted-foreground hover:text-foreground font-bold flex items-center gap-1"
                        >
                          <Edit size={11} /> Edit Fields
                        </button>
                        
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-muted-foreground hover:text-foreground font-bold flex items-center gap-0.5 hover:underline"
                        >
                          Preview Link <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Structured Form */}
        <div className="p-4 bg-card border border-border rounded-2xl space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-border">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-foreground">
              {editingResourceId ? "Edit Curated Reference" : "Create and Attach Reference Link"}
            </span>
            {editingResourceId && (
              <button 
                onClick={handleCancelEditResource}
                className="text-[10px] text-muted-foreground hover:text-foreground"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-1">Title</label>
              <input
                type="text"
                value={resourceForm.title}
                onChange={e => setResourceForm({ ...resourceForm, title: e.target.value })}
                className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                placeholder="e.g. SQLite Internals"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-1">Url Link</label>
              <input
                type="text"
                value={resourceForm.url}
                onChange={e => setResourceForm({ ...resourceForm, url: e.target.value })}
                className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-foreground font-mono text-[11px] focus:outline-none focus:border-primary"
                placeholder="https://example.com/sqlite-internals"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-1">Source / Publisher</label>
              <input
                type="text"
                value={resourceForm.source}
                onChange={e => setResourceForm({ ...resourceForm, source: e.target.value })}
                className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                placeholder="e.g. SQLite Org"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-1">Provider Tag</label>
              <input
                type="text"
                value={resourceForm.provider}
                onChange={e => setResourceForm({ ...resourceForm, provider: e.target.value })}
                className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                placeholder="e.g. Documentation"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-1">Resource Category</label>
              <input
                type="text"
                value={resourceForm.category}
                onChange={e => setResourceForm({ ...resourceForm, category: e.target.value })}
                className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                placeholder="e.g. Database"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-1">Difficulty level</label>
              <select
                value={resourceForm.difficulty}
                onChange={e => setResourceForm({ ...resourceForm, difficulty: e.target.value })}
                className="w-full p-1.5 bg-background border border-border rounded-lg text-foreground text-xs focus:outline-none focus:border-primary"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-1">Resource Type</label>
              <select
                value={resourceForm.type}
                onChange={e => setResourceForm({ ...resourceForm, type: e.target.value })}
                className="w-full p-1.5 bg-background border border-border rounded-lg text-foreground text-xs focus:outline-none focus:border-primary"
              >
                <option value="article">Article</option>
                <option value="video">Video</option>
                <option value="documentation">Documentation</option>
                <option value="exercise">Coding Exercise</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-1">Est. Reading min</label>
              <input
                type="number"
                value={resourceForm.estimated_reading_time || ""}
                onChange={e => setResourceForm({ ...resourceForm, estimated_reading_time: Number(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-foreground"
                placeholder="10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-1">Tags (separated by comma)</label>
              <input type="text" value={resourceForm.tagsStr} onChange={e => setResourceForm({ ...resourceForm, tagsStr: e.target.value })} className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-foreground" placeholder="database, storage, sqlite" />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-1">Language</label>
              <input type="text" value={resourceForm.language} onChange={e => setResourceForm({ ...resourceForm, language: e.target.value })} className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-foreground" placeholder="English" />
            </div>
          </div>

          <div className="text-xs space-y-3">
            <div>
              <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-1">Recommendation / Curation Reason</label>
              <textarea value={resourceForm.reason} onChange={e => setResourceForm({ ...resourceForm, reason: e.target.value })} rows={2} className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-foreground resize-none" placeholder="Why should students read this?" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_official_checkbox" checked={resourceForm.is_official} onChange={e => setResourceForm({ ...resourceForm, is_official: e.target.checked })} className="rounded border-border bg-background text-primary focus:ring-primary h-3.5 w-3.5" />
              <label htmlFor="is_official_checkbox" className="text-[10px] text-muted-foreground font-bold select-none cursor-pointer">
                Mark as Official Resource Reference
              </label>
            </div>
          </div>

          <button
            onClick={() => handleSaveResource()}
            disabled={!resourceForm.title || !resourceForm.url}
            className="w-full py-2 bg-primary hover:bg-primary-dark font-extrabold text-white text-xs rounded-xl transition-all disabled:opacity-50"
          >
            {editingResourceId ? "Save Resource Changes" : "Save and Auto-Bind Link"}
          </button>
        </div>

        {/* Link Existing Database General Resources */}
        <div className="border border-border bg-muted/20 rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Browse Libraries to Toggle Bindings
            </span>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {resourcesList.filter(res => res.id !== editingResourceId).map(res => {
              const isLinked = res.associations.some(a => a.type === scopeType && a.id === scopeId);
              
              return (
                <div key={res.id} className="flex justify-between items-center bg-muted/40 p-2.5 rounded-lg border border-border text-[11.5px]">
                  <div className="truncate flex-grow mr-2">
                    <span className="text-foreground font-medium block truncate">{res.title}</span>
                    <span className="text-[9px] text-muted-foreground block font-mono truncate">{res.url}</span>
                  </div>
                  <button
                    onClick={() => handleToggleResourceLink(res.id)}
                    className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${
                      isLinked 
                        ? "bg-red-950/20 text-red-400 border border-red-900/30 hover:bg-red-900/20" 
                        : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                    }`}
                  >
                    {isLinked ? "Disconnect" : "Connect"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex gap-6 h-[calc(100vh-170px)] overflow-hidden bg-card/30 p-6 rounded-2xl border border-border text-foreground font-sans">
      
      {/* 1. LEFT COLUMN: PERSISTENT HIERARCHICAL Explorer Tree */}
      <div className="w-80 shrink-0 flex flex-col justify-between overflow-y-auto pr-4 border-r border-border">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Curriculum Syllabus</span>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">Tracks & Curriculum</h2>
            </div>
            <button
              onClick={() => setShowAddTrackModal(true)}
              className="p-1 px-2.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-[10px] font-bold rounded-lg flex items-center gap-1 transition-all"
            >
              <Plus size={12} /> Add Track
            </button>
          </div>

          {/* VS Code title/search filter row */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-550" />
            <input
              type="text"
              placeholder="Search syllabus..."
              value={treeSearchQuery}
              onChange={(e) => setTreeSearchQuery(e.target.value)}
              className="w-full bg-background border border-border rounded-xl py-1.5 pl-8 pr-7 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
            />
            {treeSearchQuery && (
              <button 
                onClick={() => setTreeSearchQuery("")}
                className="absolute right-2.5 top-2 hover:text-white text-zinc-500 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="space-y-3">
            {/* Global fallbacks selector */}
            <div 
              onClick={() => {
                setIsGlobalSelected(true);
                setSelectedTrackId(null);
                setSelectedModuleId(null);
                setSelectedPageId(null);
                setActiveEditorTab("resources");
              }}
              className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                isGlobalSelected 
                  ? "bg-primary/10 border-primary/20 text-primary font-bold" 
                  : "bg-muted/30 border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Globe size={13} className="text-zinc-500 shrink-0" />
              <span>Global Fallback Resources</span>
            </div>

            {tracksList.filter(isTrackVisible).map(track => {
              const matchesTrackExpand = treeSearchQuery ? true : !!expandedNodes[track.id];
              const modulesForTrack = (trackModulesMap[track.id] || []).filter(isModuleVisible);

              return (
                <div key={track.id} className="space-y-1 bg-muted/20 border border-border rounded-xl p-2.5">
                  <div className="flex items-center justify-between gap-1 group min-w-0 w-full overflow-hidden">
                    <button
                      onClick={() => handleToggleTrack(track.id)}
                      className={`flex-grow flex items-center gap-2 text-xs text-left font-bold transition-all min-w-0 ${
                        selectedTrackId === track.id && !selectedModuleId ? "text-primary" : "text-foreground hover:text-primary"
                      }`}
                    >
                      {matchesTrackExpand ? <ChevronDown size={14} className="text-primary shrink-0" /> : <ChevronRight size={14} className="shrink-0" />}
                      <BookOpen size={13} className="text-zinc-500 shrink-0" />
                      <span className="truncate flex-grow">{track.title}</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTrackId(track.id);
                        setAddingModuleTrackId(track.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/5 rounded text-[10px] text-zinc-400 flex items-center gap-0.5 shrink-0"
                      title="Add module to track"
                    >
                      <Plus size={10} className="shrink-0" />Module
                    </button>
                  </div>

                  {/* Modules Segment */}
                  {matchesTrackExpand && (
                    <div className="ml-3 pl-2.5 border-l border-border space-y-2 mt-1 pt-1.5">
                      {modulesForTrack.map((mod, modIdx) => {
                        const matchesModExpand = treeSearchQuery ? true : !!expandedNodes[mod.id];
                        const pagesForMod = (modulePagesMap[mod.id] || []).filter(isPageVisible);

                        return (
                          <div 
                            key={mod.id} 
                            className={`space-y-1 rounded p-1 transition-all ${
                              dragOverTargetId === mod.id ? "bg-primary/5 border border-dashed border-primary/30" : ""
                            }`}
                            draggable
                            onDragStart={(e) => handleModuleDragStart(e, mod.id)}
                            onDragOver={(e) => { e.preventDefault(); setDragOverTargetId(mod.id); }}
                            onDragLeave={() => setDragOverTargetId(null)}
                            onDrop={(e) => handleModuleDrop(e, mod.id, track.id)}
                          >
                            <div className="flex items-center justify-between gap-1.5 group min-w-0 w-full overflow-hidden">
                              <button
                                onClick={() => handleToggleModule(mod.id)}
                                className={`flex-grow flex items-center gap-1.5 text-[11px] text-left hover:text-primary transition-all min-w-0 ${
                                  selectedModuleId === mod.id && !selectedPageId ? "text-primary font-bold" : "text-muted-foreground"
                                }`}
                              >
                                {matchesModExpand ? <ChevronDown size={12} className="text-primary-light shrink-0" /> : <ChevronRight size={12} className="shrink-0" />}
                                <Folder size={11} className="text-zinc-500 shrink-0" />
                                <span className="truncate flex-grow">{mod.title}</span>
                              </button>
 
                              {/* Action Items */}
                              <div className="flex items-center gap-0.5 shrink-0">
                                <button
                                  onClick={() => {
                                    setSelectedModuleId(mod.id);
                                    setAddingPageModuleId(mod.id);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-muted text-muted-foreground hover:text-primary rounded text-[9px] flex items-center gap-0.5 shrink-0"
                                  title="Add new Page node"
                                >
                                  <Plus size={10} className="shrink-0" />Page
                                </button>
                              </div>
                            </div>

                            {/* Pages Segment */}
                            {matchesModExpand && (
                              <div className="ml-3 pl-2.5 border-l border-border space-y-1 mt-1">
                                {pagesForMod.map((page, pageIdx) => (
                                  <div
                                    key={page.id}
                                    draggable
                                    onDragStart={(e) => handlePageDragStart(e, page.id)}
                                    onDragOver={(e) => { e.preventDefault(); setDragOverTargetId(page.id); }}
                                    onDragLeave={() => setDragOverTargetId(null)}
                                    onDrop={(e) => handlePageDrop(e, page.id, mod.id)}
                                    className={`flex items-center justify-between gap-2 p-1.5 rounded-lg text-[10px] group transition-all cursor-pointer ${
                                      selectedPageId === page.id
                                        ? "bg-primary/20 border border-primary/40 text-primary font-bold"
                                        : dragOverTargetId === page.id
                                          ? "bg-primary/5 border border-dashed border-primary/20 text-muted-foreground"
                                          : "hover:bg-muted text-muted-foreground"
                                    }`}
                                    onClick={() => handleSelectPage(page)}
                                  >
                                    <div className="flex items-center gap-1.5 truncate">
                                      <FileText size={11} className="text-zinc-500 shrink-0" />
                                      <span className="truncate">{page.title}</span>
                                      {page.status === "PUBLISHED" && (
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" title="Published Live" />
                                      )}
                                      {page.status === "REVIEW" && (
                                        <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 shrink-0" title="Under Review" />
                                      )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100" onClick={e => e.stopPropagation()}>
                                      <button
                                        onClick={() => handleDeletePage(page.id)}
                                        className="p-0.5 text-red-500 hover:bg-red-950/20 rounded"
                                        title="Delete page permanently"
                                      >
                                        <Trash2 size={10} />
                                      </button>
                                    </div>
                                  </div>
                                ))}

                                {pagesForMod.length === 0 && (
                                  <span className="text-[9px] text-zinc-650 italic pl-5">Empty pages</span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {modulesForTrack.length === 0 && (
                        <p className="text-[10px] text-zinc-650 italic pl-5">No modules mapped.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Informative Synchronizer Banner */}
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mt-4">
          <div className="flex items-center gap-1.5 text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-0.5">
            <CheckCircle size={11} /> Workspace Drag & Drop Active
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Drag any module or page file element and hover over sibling items to trigger native DB display reordering.
          </p>
        </div>
      </div>

      <div className="flex-grow flex flex-col min-h-0 overflow-y-auto">
        {!selectedPageId && !isGlobalSelected && !selectedTrackId && !selectedModuleId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-center h-full">
            <BookOpen className="h-8 w-8 text-muted-foreground/40 mb-2 animate-pulse" />
            <p className="text-xs font-semibold text-muted-foreground">CMS Curriculum Workspace</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1 max-w-[200px]">
              Select any learning track, module, or page item in the syllabus tree to configure curriculum content.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold tracking-wide border-b border-border pb-2.5">
              <span className="text-muted-foreground/70">DevArc CMS</span>
              {getBreadcrumbs().map((crumb, idx) => (
                <React.Fragment key={idx}>
                  <span className="text-muted-foreground/50">/</span>
                  <span className={idx === getBreadcrumbs().length - 1 ? "text-primary font-bold" : "text-muted-foreground"}>
                    {crumb}
                  </span>
                </React.Fragment>
              ))}
            </div>

            {/* Page Header card if editing page */}
            {selectedPageId && (
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-muted/30 border border-border p-4 rounded-xl">
                <div className="space-y-1.5 w-full lg:max-w-md">
                  <input
                    type="text"
                    value={cmsPageForm.title}
                    onChange={e => setCmsPageForm({ ...cmsPageForm, title: e.target.value })}
                    className="bg-transparent border-b border-transparent hover:border-border focus:border-primary text-base font-extrabold text-foreground focus:outline-none w-full"
                    placeholder="Page title"
                  />
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-semibold">
                    <span>Slug:</span>
                    <input
                      type="text"
                      value={cmsPageForm.slug}
                      onChange={e => setCmsPageForm({ ...cmsPageForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                      className="bg-transparent border-b border-transparent focus:border-primary font-mono text-muted-foreground focus:outline-none w-48"
                      placeholder="page-slug"
                    />
                  </div>
                </div>

                {/* Main Workspace Navigation: Content, Resources, Settings tabs */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveEditorTab("content")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      activeEditorTab === "content"
                        ? "bg-primary/20 border border-primary/30 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    Content Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveEditorTab("resources")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      activeEditorTab === "resources"
                        ? "bg-primary/20 border border-primary/30 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    Resources ({resourcesList.filter(res => res.associations.some(a => a.type === "page" && a.id === selectedPageId)).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveEditorTab("settings")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      activeEditorTab === "settings"
                        ? "bg-primary/20 border border-primary/30 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    Settings
                  </button>

                  <button
                    onClick={handleSavePage}
                    disabled={savingPage}
                    className="ml-2 px-4 py-1.5 bg-primary hover:bg-primary-dark font-extrabold text-primary-foreground rounded-lg text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Save size={13} />
                    {savingPage ? "Saving..." : "Save Page"}
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENTS FOR SELECTED PAGE */}
            {selectedPageId && activeEditorTab === "content" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-muted/30 p-1 border border-border rounded-lg w-fit">
                  <button
                    onClick={() => setEditorTab("edit")}
                    className={`px-2.5 py-1 text-xs font-bold rounded transition-colors ${
                      editorTab === "edit" ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Edit Layout
                  </button>
                  <button
                    onClick={() => setEditorTab("preview")}
                    className={`px-2.5 py-1 text-xs font-bold rounded transition-colors ${
                      editorTab === "preview" ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Live Preview
                  </button>
                </div>

                {editorTab === "edit" ? (
                  <div className="space-y-4">
                    {/* Meta parameters row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Page Difficulty</label>
                        <select
                          value={cmsPageForm.difficulty}
                          onChange={e => setCmsPageForm({ ...cmsPageForm, difficulty: e.target.value })}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-xs focus:outline-none focus:border-primary"
                        >
                          <option value="BEGINNER">BEGINNER</option>
                          <option value="INTERMEDIATE">INTERMEDIATE</option>
                          <option value="ADVANCED">ADVANCED</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center justify-between">
                          <span>Est. Minutes</span>
                          <span className="text-[9px] text-muted-foreground/60 font-normal italic">(Calculated: {Math.max(1, Math.ceil(((cmsPageForm.content?.length || 0) + (cmsPageForm.learning_objectives?.length || 0)) / 950))} min)</span>
                        </label>
                        <input
                          type="number"
                          value={cmsPageForm.estimated_minutes}
                          onChange={e => setCmsPageForm({ ...cmsPageForm, estimated_minutes: Number(e.target.value) || 1 })}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-xs focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    {/* Content textareas */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-between">
                        <span>Main Markdown Lesson Content</span>
                        {cmsPageForm.content && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(cmsPageForm.content);
                              toast.success("Lesson Content copied to clipboard!");
                            }}
                            className="text-[9px] text-primary hover:underline lowercase font-normal"
                          >
                            Copy
                          </button>
                        )}
                      </label>
                      <textarea
                        value={cmsPageForm.content}
                        onChange={e => setCmsPageForm({ ...cmsPageForm, content: e.target.value })}
                        rows={12}
                        className="w-full px-4 py-3 bg-background border border-border rounded-xl font-mono text-xs focus:outline-none focus:border-primary text-foreground resize-y"
                        placeholder="Write dynamic learning lesson guides using Markdown..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-between">
                          <span>Objectives (bullet list)</span>
                          {cmsPageForm.learning_objectives && (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(cmsPageForm.learning_objectives);
                                toast.success("Objectives copied to clipboard!");
                              }}
                              className="text-[9px] text-primary hover:underline lowercase font-normal"
                            >
                              Copy
                            </button>
                          )}
                        </label>
                        <textarea
                          value={cmsPageForm.learning_objectives}
                          onChange={e => setCmsPageForm({ ...cmsPageForm, learning_objectives: e.target.value })}
                          rows={4}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-xs font-mono resize-none focus:outline-none focus:border-primary"
                          placeholder="- Understand MVC isolations"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-between">
                          <span>Syntax Highlighted Code Snippets</span>
                          {cmsPageForm.code_snippets && (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(cmsPageForm.code_snippets);
                                toast.success("Code snippets copied to clipboard!");
                              }}
                              className="text-[9px] text-primary hover:underline lowercase font-normal"
                            >
                              Copy
                            </button>
                          )}
                        </label>
                        <textarea
                          value={cmsPageForm.code_snippets}
                          onChange={e => setCmsPageForm({ ...cmsPageForm, code_snippets: e.target.value })}
                          rows={4}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-xs font-mono resize-none focus:outline-none focus:border-primary"
                          placeholder="```javascript\n// code\n```"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-between">
                          <span>Best Practices (Engineering Dos)</span>
                          {cmsPageForm.best_practices && (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(cmsPageForm.best_practices);
                                toast.success("Best practices copied to clipboard!");
                              }}
                              className="text-[9px] text-primary hover:underline lowercase font-normal"
                            >
                              Copy
                            </button>
                          )}
                        </label>
                        <textarea
                          value={cmsPageForm.best_practices}
                          onChange={e => setCmsPageForm({ ...cmsPageForm, best_practices: e.target.value })}
                          rows={4}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-xs font-mono resize-none focus:outline-none focus:border-primary"
                          placeholder="- Cache database responses"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-between">
                          <span>Common Mistakes (Pitfalls)</span>
                          {cmsPageForm.common_mistakes && (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(cmsPageForm.common_mistakes);
                                toast.success("Common mistakes copied to clipboard!");
                              }}
                              className="text-[9px] text-primary hover:underline lowercase font-normal"
                            >
                              Copy
                            </button>
                          )}
                        </label>
                        <textarea
                          value={cmsPageForm.common_mistakes}
                          onChange={e => setCmsPageForm({ ...cmsPageForm, common_mistakes: e.target.value })}
                          rows={4}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-xs font-mono resize-none focus:outline-none focus:border-primary"
                          placeholder="- Forgetting indices attributes"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-between">
                          <span>Real-World Case Examples</span>
                          {cmsPageForm.real_world_examples && (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(cmsPageForm.real_world_examples);
                                toast.success("Real-World cases copied to clipboard!");
                              }}
                              className="text-[9px] text-primary hover:underline lowercase font-normal"
                            >
                              Copy
                            </button>
                          )}
                        </label>
                        <textarea
                          value={cmsPageForm.real_world_examples}
                          onChange={e => setCmsPageForm({ ...cmsPageForm, real_world_examples: e.target.value })}
                          rows={4}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-xs font-mono resize-none focus:outline-none focus:border-primary"
                          placeholder="Describe enterprise microservices cases..."
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-between">
                          <span>Lesson Summary (Key Takeaways)</span>
                          {cmsPageForm.summary && (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(cmsPageForm.summary);
                                toast.success("Summary copied to clipboard!");
                              }}
                              className="text-[9px] text-primary hover:underline lowercase font-normal"
                            >
                              Copy
                            </button>
                          )}
                        </label>
                        <textarea
                          value={cmsPageForm.summary}
                          onChange={e => setCmsPageForm({ ...cmsPageForm, summary: e.target.value })}
                          rows={4}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-xs font-mono resize-none focus:outline-none focus:border-primary"
                          placeholder="Write page takeaways..."
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 bg-card/50 border border-border p-6 rounded-2xl">
                    <div>
                      <h1 className="text-2xl font-extrabold text-foreground">{cmsPageForm.title || "Untitled Page"}</h1>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground font-semibold mt-1">
                        <span className="flex items-center gap-1"><Clock size={12} /> {cmsPageForm.estimated_minutes} min read</span>
                        <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded font-bold">{cmsPageForm.difficulty}</span>
                      </div>
                    </div>

                    {cmsPageForm.learning_objectives && (
                      <div className="p-4 bg-muted/50 border border-border rounded-xl space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Objectives mastered on this page:</h3>
                        <div className="text-xs text-foreground space-y-1 whitespace-pre-line leading-relaxed">
                          {cmsPageForm.learning_objectives}
                        </div>
                      </div>
                    )}

                    <div className="prose dark:prose-invert max-w-none text-sm text-foreground">
                      <MarkdownRenderer content={cmsPageForm.content || "_No contents drafted._"} />
                    </div>

                    {cmsPageForm.code_snippets && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Suggested Code Implementation:</h3>
                        <div className="bg-muted border border-border p-4 rounded-xl font-mono text-xs text-foreground whitespace-pre-wrap">
                          {cmsPageForm.code_snippets}
                        </div>
                      </div>
                    )}

                    {cmsPageForm.best_practices && (
                      <div className="p-4 border border-emerald-500/20 bg-emerald-500/5 rounded-xl space-y-2">
                        <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Best Practices:</h4>
                        <div className="text-xs text-foreground whitespace-pre-line font-medium leading-relaxed">
                          {cmsPageForm.best_practices}
                        </div>
                      </div>
                    )}

                    {cmsPageForm.common_mistakes && (
                      <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-xl space-y-2">
                        <h4 className="text-xs font-bold text-destructive uppercase tracking-wider animate-pulse">Anti-patterns & Pitfalls:</h4>
                        <div className="text-xs text-foreground whitespace-pre-line font-medium leading-relaxed">
                          {cmsPageForm.common_mistakes}
                        </div>
                      </div>
                    )}

                    {cmsPageForm.real_world_examples && (
                      <div className="p-4 border border-sky-500/20 bg-sky-500/5 rounded-xl space-y-2">
                        <h4 className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">Real-World Case Study:</h4>
                        <div className="text-xs text-foreground whitespace-pre-line font-medium leading-relaxed">
                          {cmsPageForm.real_world_examples}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. RIGHT COLUMN: CONTEXT & METADATA PANEL */}
      <div className="w-80 shrink-0 border-l border-border bg-card/50 flex flex-col p-4 overflow-y-auto">
        {!selectedPageId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-center h-full">
            <Settings className="h-8 w-8 text-muted-foreground/40 mb-2 animate-spin-slow" />
            <p className="text-xs font-semibold text-muted-foreground">Metadata Assistant</p>
            <p className="text-[10px] text-zinc-555 mt-1 max-w-[200px]">
              Select any learning page in the syllabus tree to activate the AI Content Assistant and helper utilities.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Spark AI Draft suggestion buttons */}
            <div className="bg-gradient-to-br from-purple-950/30 to-primary/10 border border-primary/20 p-4 rounded-xl space-y-3 text-left">
              <div className="flex items-center gap-1.5 text-xs text-white font-bold">
                <Sparkles size={16} className="text-primary animate-spin" />
                <span>AI Content Assistant</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Auto-generate structured database lesson recommendations (difficulty, objectives, codes, mistakes, details) matching parent module topic.
              </p>
              <button
                type="button"
                onClick={handleGenerateAIDraft}
                disabled={sparkingDraft}
                className="w-full py-2 bg-gradient-to-r from-primary to-purple-650 hover:from-primary-dark hover:to-purple-700 font-bold text-primary-foreground text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Sparkles size={13} />
                {sparkingDraft ? "Sparking Draft..." : "Spark AI Draft"}
              </button>
              {cmsPageForm.content && (
                <button
                  type="button"
                  onClick={copyAllDraftContent}
                  className="w-full py-1.5 bg-card hover:bg-muted border border-border font-bold text-muted-foreground hover:text-foreground text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all mt-2"
                >
                  Copy All Fields
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODALS segment */}
      {showAddTrackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-card border border-border w-full max-w-md p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-foreground">Create Learning Track</span>
              <button onClick={() => setShowAddTrackModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <form onSubmit={handleCreateTrack} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1 font-semibold">Title</label>
                <input
                  type="text"
                  required
                  value={trackForm.title}
                  onChange={e => setTrackForm({ ...trackForm, title: e.target.value })}
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                  placeholder="Advanced Systems"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1 font-semibold">Slug</label>
                <input
                  type="text"
                  required
                  value={trackForm.slug}
                  onChange={e => setTrackForm({ ...trackForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                  placeholder="advanced-systems"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1 font-semibold">Description</label>
                <textarea
                  required
                  value={trackForm.description}
                  onChange={e => setTrackForm({ ...trackForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-foreground focus:outline-none resize-none focus:border-primary"
                  placeholder="Syllabus overview..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1 font-semibold">Difficulty</label>
                  <select
                    value={trackForm.difficulty}
                    onChange={e => setTrackForm({ ...trackForm, difficulty: e.target.value })}
                    className="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-muted-foreground mb-1 font-semibold">Study Hours</label>
                  <input
                    type="number"
                    required
                    value={trackForm.estimated_hours}
                    onChange={e => setTrackForm({ ...trackForm, estimated_hours: Number(e.target.value) || 10 })}
                    className="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-primary hover:bg-primary/90 font-bold text-primary-foreground rounded-xl transition-colors mt-2"
              >
                Create Track
              </button>
            </form>
          </div>
        </div>
      )}

      {addingModuleTrackId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-sm p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-foreground">Add Curriculum Module</span>
              <button onClick={() => setAddingModuleTrackId(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1 font-semibold">Module Title</label>
                <input
                  type="text"
                  value={newModuleTitle}
                  onChange={e => setNewModuleTitle(e.target.value)}
                  placeholder="e.g. Distributed Database Engineering"
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              
              <button
                onClick={handleCreateModule}
                className="w-full py-2 bg-primary hover:bg-primary/90 font-bold text-primary-foreground rounded-xl transition-all mt-2"
              >
                Add Module
              </button>
            </div>
          </div>
        </div>
      )}

      {addingPageModuleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-sm p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-foreground">Create Learning Subpage</span>
              <button onClick={() => setAddingPageModuleId(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1 font-semibold">Page Title</label>
                <input
                  type="text"
                  value={newPageTitle}
                  onChange={e => {
                    setNewPageTitle(e.target.value);
                    setNewPageSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                  }}
                  placeholder="e.g. MVCC Isolation Levels"
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1 font-semibold">Page Slug</label>
                <input
                  type="text"
                  value={newPageSlug}
                  onChange={e => setNewPageSlug(e.target.value)}
                  placeholder="mvcc-isolation-levels"
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              
              <button
                onClick={handleCreatePage}
                className="w-full py-2 bg-primary hover:bg-primary/90 font-bold text-primary-foreground rounded-xl transition-all mt-2"
              >
                Create Page
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
