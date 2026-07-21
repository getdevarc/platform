"use client";

import { useTheme } from "next-themes";

export function useThemeTransition() {
    const { theme, setTheme } = useTheme();

    const toggleTheme = (targetTheme?: string) => {
        const currentTheme = theme || "light";
        const nextTheme = targetTheme || (currentTheme === "dark" ? "light" : "dark");

        // Check if View Transition API is supported
        if (!document.startViewTransition) {
            setTheme(nextTheme);
            return;
        }

        const isDarkTarget = nextTheme === "dark";

        // Day -> Night starts from top-right, Night -> Day starts from bottom-left
        document.documentElement.classList.add(
            isDarkTarget ? "theme-transition-to-dark" : "theme-transition-to-light"
        );

        const transition = document.startViewTransition(() => {
            setTheme(nextTheme);
        });

        transition.finished.finally(() => {
            document.documentElement.classList.remove(
                "theme-transition-to-dark",
                "theme-transition-to-light"
            );
        });
    };

    return { theme, toggleTheme, setTheme };
}
