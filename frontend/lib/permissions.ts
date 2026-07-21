export interface UserProfile {
    id: string;
    name: string;
    email: string;
    role?: string;
    target_domain?: string;
    resume_text?: string;
    career_answers?: Record<string, unknown>;
}

export function canAccessAdminPortal(user: UserProfile | null | undefined): boolean {
    if (!user) return false;
    return user.role === "admin";
}
