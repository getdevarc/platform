import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { canAccessAdminPortal } from "@/lib/permissions";

export function useRequireAdmin(redirectTo: string = "/admin/login") {
    const { user, isAuthenticated, loading } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated || !user || !canAccessAdminPortal(user)) {
                router.replace(redirectTo);
            }
        }
    }, [loading, isAuthenticated, user, router, redirectTo]);

    return { loading, user, isAuthenticated };
}
