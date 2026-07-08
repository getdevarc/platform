"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { BaseHero, StatCard } from "@/components/shared/DesignSystem";
import { User, Briefcase, Mail, Calendar, Compass, Target, Edit2, Check, X, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/lib/api";

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Edited States
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editDomain, setEditDomain] = useState("");
  
  // Avatar preview
  const [avatar, setAvatar] = useState<string | null>(null);

  // Initialize form
  useEffect(() => {
    if (user) {
      setEditName(user.name || "");
      setEditRole(user.role || "");
      setEditDomain(user.target_domain || "");
      
      const savedAvatar = localStorage.getItem(`avatar_${user.id}`);
      if (savedAvatar) {
        setAvatar(savedAvatar);
      }
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setAvatar(base64);
        localStorage.setItem(`avatar_${user.id}`, base64);
        toast.success("Profile image updated successfully!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.put("/auth/profile", {
        name: editName,
        role: editRole,
        target_domain: editDomain
      });

      if (res.data.success && user) {
        updateUser({
          ...user,
          name: editName,
          role: editRole,
          target_domain: editDomain
        });
        setIsEditing(false);
        toast.success("Profile updated successfully!");
      }
    } catch (err) {
      toast.error("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const mockJoinedDate = "July 2026"; 

  return (
    <div className="flex-1 overflow-y-auto bg-background text-foreground p-6 md:p-8 space-y-8 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <BaseHero
          badgeText="Account Details"
          title="Developer Profile"
          highlight={user?.name || "Developer"}
          description="View and update your career roadmap parameters, target domain, and account details."
        />
        {!isEditing ? (
          <Button 
            onClick={() => setIsEditing(true)}
            className="rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white text-xs font-bold uppercase tracking-wider h-11 px-5"
          >
            <Edit2 size={14} className="mr-2" /> Modify Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button 
              variant="outline"
              disabled={loading}
              onClick={() => {
                if (user) {
                  setEditName(user.name || "");
                  setEditRole(user.role || "");
                  setEditDomain(user.target_domain || "");
                }
                setIsEditing(false);
              }}
              className="rounded-xl border-zinc-200 dark:border-white/10 bg-zinc-100/50 dark:bg-zinc-900/30 text-zinc-500 dark:text-zinc-400 h-11 text-xs font-bold uppercase tracking-wider px-4"
            >
              <X size={14} className="mr-1.5" /> Cancel
            </Button>
            <Button 
              disabled={loading}
              onClick={handleSave}
              className="rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-bold h-11 text-xs uppercase tracking-wider px-5"
            >
              {loading ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Check size={14} className="mr-1.5" />}
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Profile Header Image Display */}
      <div className="flex items-center gap-6 bg-card/45 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/5 p-6 rounded-3xl">
        <div className="relative group rounded-2xl overflow-hidden h-20 w-20 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-white/10">
          {avatar ? (
            <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <User size={36} className="text-zinc-400 dark:text-zinc-650" />
          )}
          <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-[10px] font-bold uppercase tracking-wider text-white">
            <Camera size={18} className="mb-1" />
            Upload
            <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </label>
        </div>
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">{user?.name || "Developer"}</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400/70 leading-relaxed">{user?.email}</p>
          <p className="text-[10px] text-zinc-550 pt-1 font-mono">Role: {user?.role || "Fresher"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Target Domain"
          value={user?.target_domain || "Unset"}
          highlight="Platform Track"
          icon={Compass}
        />
        <StatCard
          title="Career Role"
          value={user?.role || "Unset"}
          highlight="Current Status"
          icon={Briefcase}
        />
        <StatCard
          title="Joined Date"
          value={mockJoinedDate}
          highlight="Registration Time"
          icon={Calendar}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="rounded-3xl border border-zinc-200 dark:border-white/5 bg-card/45 dark:bg-zinc-950/40 p-6 md:p-8 space-y-6">
          <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <User size={18} className="text-primary" /> Primary Account Information
          </h3>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest pl-0.5">Full Name</span>
              {isEditing ? (
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-zinc-100/50 dark:bg-zinc-900/40 border-zinc-200 dark:border-white/5 h-12 text-zinc-900 dark:text-white focus:border-primary/50 transition-colors rounded-xl text-sm"
                />
              ) : (
                <div className="h-12 flex items-center px-4 rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-100/30 dark:bg-zinc-900/20 text-zinc-800 dark:text-zinc-300 font-medium text-sm">
                  {user?.name || "N/A"}
                </div>
              )}
            </div>
            
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest pl-0.5">Email Address</span>
              <div className="h-12 flex items-center justify-between px-4 rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-100/30 dark:bg-zinc-900/20 text-zinc-800 dark:text-zinc-300 font-medium text-sm">
                <span className="truncate">{user?.email}</span>
                <Mail size={16} className="text-zinc-400 dark:text-zinc-650 shrink-0 ml-2" />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 dark:border-white/5 bg-card/45 dark:bg-zinc-950/40 p-6 md:p-8 space-y-6">
          <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <Target size={18} className="text-primary" /> Onboarding & Goals
          </h3>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest pl-0.5">Target Domain Focus</span>
              {isEditing ? (
                <select
                  value={editDomain}
                  onChange={(e) => setEditDomain(e.target.value)}
                  className="w-full bg-zinc-100/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/5 h-12 px-4 text-zinc-900 dark:text-white focus:border-primary/50 transition-colors rounded-xl text-sm outline-none"
                >
                  <option value="Frontend">Frontend</option>
                  <option value="Backend">Backend</option>
                  <option value="Full Stack">Full Stack</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Mobile UI">Mobile UI</option>
                </select>
              ) : (
                <div className="h-12 flex items-center px-4 rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-100/30 dark:bg-zinc-900/20 text-zinc-800 dark:text-zinc-300 font-medium text-sm">
                  {user?.target_domain || "Not specified during onboarding"}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest pl-0.5">Current Role Baseline</span>
              {isEditing ? (
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full bg-zinc-100/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/5 h-12 px-4 text-zinc-900 dark:text-white focus:border-primary/50 transition-colors rounded-xl text-sm outline-none"
                >
                  <option value="Fresher">Fresher</option>
                  <option value="Working Professional">Working Professional</option>
                </select>
              ) : (
                <div className="h-12 flex items-center px-4 rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-100/30 dark:bg-zinc-900/20 text-zinc-800 dark:text-zinc-300 font-medium text-sm">
                  {user?.role || "Not specified during onboarding"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
