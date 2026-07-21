/**
 * Service to encapsulate matching logic between User Onboarding information
 * and Learning Tracks catalog.
 */

exports.getRecommendations = (user, allTracks, enrolledTracks) => {
    const targetDomain = (user.target_domain || "").trim();
    const role = (user.role || "").trim();
    const answers = typeof user.career_answers === "string"
        ? JSON.parse(user.career_answers)
        : user.career_answers || {};

    const goal = (answers.goal || "").trim();
    const rawDreamCompany = (answers.dream_company || "").trim();

    // If onboarding is incomplete, return false (will trigger frontend empty state)
    if (!targetDomain && !goal) {
        return {
            isOnboarded: false,
            recommendations: []
        };
    }

    // Parse target role and dream company from user inputs
    let targetRole = goal;
    let dreamCompany = rawDreamCompany;

    if (goal.toLowerCase().includes(" at ")) {
        const parts = goal.split(/\s+at\s+/i);
        targetRole = parts[0].trim();
        if (!dreamCompany) {
            dreamCompany = parts[1]?.trim() || "";
        }
    }

    if (!targetRole) {
        targetRole = targetDomain ? `${targetDomain} Specialist` : "Software Engineer";
    }
    if (!dreamCompany) {
        dreamCompany = "Top Tech Companies";
    }

    const normalizedDomain = targetDomain.toLowerCase();
    const normalizedGoal = goal.toLowerCase();

    // Dynamic recommendations filter rules
    const recommendedTracks = allTracks.filter(track => {
        const slug = track.slug.toLowerCase();
        const title = track.title.toLowerCase();

        // DSA is recommended for everyone targeting algorithms / programming
        if (slug === "dsa-algorithms") {
            return true;
        }

        // Full Stack matched keys
        if (normalizedDomain.includes("full stack") || normalizedDomain.includes("fullstack") ||
            normalizedGoal.includes("full stack") || normalizedGoal.includes("fullstack")) {
            return ["frontend-architecture", "backend-engineering", "react-advanced", "system-design"].includes(slug);
        }

        // Frontend matched keys
        if (normalizedDomain.includes("frontend") || normalizedDomain.includes("front-end") || normalizedDomain.includes("ui") || normalizedDomain.includes("mobile") ||
            normalizedGoal.includes("frontend") || normalizedGoal.includes("front-end") || normalizedGoal.includes("ui") || normalizedGoal.includes("mobile")) {
            return ["frontend-architecture", "react-advanced"].includes(slug);
        }

        // Backend matched keys
        if (normalizedDomain.includes("backend") || normalizedDomain.includes("back-end") ||
            normalizedGoal.includes("backend") || normalizedGoal.includes("back-end")) {
            return ["backend-engineering", "system-design", "devops-docker"].includes(slug);
        }

        // DevOps / Cloud / Infrastructure matched keys
        if (normalizedDomain.includes("devops") || normalizedDomain.includes("cloud") || normalizedDomain.includes("docker") || normalizedDomain.includes("aws") ||
            normalizedGoal.includes("devops") || normalizedGoal.includes("cloud") || normalizedGoal.includes("docker") || normalizedGoal.includes("aws")) {
            return ["backend-engineering", "devops-docker", "cloud-aws", "system-design"].includes(slug);
        }

        // In case no direct category matches, filter by string containment
        return title.includes(normalizedDomain) || normalizedDomain.includes(slug);
    });

    // Map enrolled status from user_enrolled_tracks
    const enrolledMap = new Map();
    if (Array.isArray(enrolledTracks)) {
        for (const record of enrolledTracks) {
            enrolledMap.set(record.track_id, record.status);
        }
    }

    const recommendations = recommendedTracks.map(track => {
        // Determine status state: "Not Started", "Active", or "Completed"
        let status = "Not Started";
        const dbStatus = enrolledMap.get(track.id) || track.enrollment_status;
        if (dbStatus) {
            if (dbStatus === "ACTIVE") status = "Active";
            if (dbStatus === "COMPLETED") status = "Completed";
        }

        const whyExplanation = `${track.title} is recommended because it is one of the core skills required for your target role of ${targetRole} at ${dreamCompany}.`;

        return {
            id: track.id,
            slug: track.slug,
            title: track.title,
            description: track.description,
            difficulty: track.difficulty,
            estimated_hours: track.estimated_hours,
            icon: track.icon,
            status,
            whyExplanation
        };
    });

    return {
        isOnboarded: true,
        targetRole,
        dreamCompany,
        recommendations
    };
};
