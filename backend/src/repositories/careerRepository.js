const db = require("../config/db");

// Career Plans
exports.getCareerPlan = async (userId) => {
    const result = await db.query(
        "SELECT * FROM career_plans WHERE user_id = $1",
        [userId]
    );
    return result.rows[0];
};

exports.upsertCareerPlan = async (userId, summary, estimatedTimeline) => {
    const result = await db.query(
        `INSERT INTO career_plans (user_id, summary, estimated_timeline, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (user_id) 
     DO UPDATE SET summary = EXCLUDED.summary, estimated_timeline = EXCLUDED.estimated_timeline, updated_at = NOW()
     RETURNING *`,
        [userId, summary, estimatedTimeline]
    );
    return result.rows[0];
};

// Roadmap Steps
exports.getRoadmapSteps = async (userId) => {
    const result = await db.query(
        "SELECT * FROM roadmap_steps WHERE user_id = $1 ORDER BY sort_order ASC",
        [userId]
    );
    return result.rows;
};

exports.getStepById = async (stepId) => {
    const result = await db.query(
        "SELECT * FROM roadmap_steps WHERE id = $1",
        [stepId]
    );
    return result.rows[0];
};

exports.createRoadmapSteps = async (userId, steps) => {
    // Clear any existing steps first (so we can regenerate or rebuild roadmaps cleanly)
    await db.query("DELETE FROM roadmap_steps WHERE user_id = $1", [userId]);

    const inserted = [];
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const result = await db.query(
            `INSERT INTO roadmap_steps (user_id, title, description, type, status, duration, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
            [
                userId,
                step.title,
                step.description,
                step.type || "skill",
                step.status || "NOT_STARTED",
                step.duration || 4,
                i + 1
            ]
        );
        inserted.push(result.rows[0]);
    }
    return inserted;
};

// Study Guides
exports.getStudyGuide = async (userId, stepId) => {
    const result = await db.query(
        "SELECT * FROM study_guides WHERE user_id = $1 AND step_id = $2",
        [userId, stepId]
    );
    return result.rows[0];
};

exports.upsertStudyGuide = async (userId, stepId, stepTitle, content) => {
    const result = await db.query(
        `INSERT INTO study_guides (user_id, step_id, step_title, content, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (user_id, step_id)
     DO UPDATE SET step_title = EXCLUDED.step_title, content = EXCLUDED.content, updated_at = NOW()
     RETURNING *`,
        [userId, stepId, stepTitle, content]
    );
    return result.rows[0];
};

// Resources
exports.getResources = async (stepId) => {
    const result = await db.query(
        "SELECT * FROM study_guide_resources WHERE step_id = $1",
        [stepId]
    );
    return result.rows;
};

exports.saveResources = async (userId, stepId, resources) => {
    await db.query("DELETE FROM study_guide_resources WHERE step_id = $1", [stepId]);
    const inserted = [];
    for (const res of resources) {
        const result = await db.query(
            `INSERT INTO study_guide_resources (user_id, step_id, title, url, source, reason)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (step_id, title) DO UPDATE
       SET url = EXCLUDED.url, source = EXCLUDED.source, reason = EXCLUDED.reason
       RETURNING *`,
            [userId, stepId, res.title, res.url, res.source, res.reason]
        );
        inserted.push(result.rows[0]);
    }
    return inserted;
};

// Practice Projects
exports.getPracticeProjects = async (stepId) => {
    const result = await db.query(
        "SELECT * FROM practice_projects WHERE step_id = $1",
        [stepId]
    );
    return result.rows;
};

exports.savePracticeProjects = async (userId, stepId, projects) => {
    await db.query("DELETE FROM practice_projects WHERE step_id = $1", [stepId]);
    const inserted = [];
    for (const proj of projects) {
        // Format tasks so they have a stable id and a sort_order
        const formattedTasks = (proj.tasks || []).map((t, idx) => {
            if (typeof t === "string") {
                return {
                    id: `task-${idx + 1}`,
                    title: t,
                    completed: false,
                    difficulty: "beginner",
                    estimatedTime: "30 mins",
                    sort_order: idx + 1
                };
            }
            return {
                id: t.id || `task-${idx + 1}`,
                title: t.title,
                completed: !!t.completed,
                difficulty: t.difficulty || "beginner",
                estimatedTime: t.estimatedTime || "30 mins",
                sort_order: t.sort_order || (idx + 1)
            };
        });

        const result = await db.query(
            `INSERT INTO practice_projects (user_id, step_id, title, description, difficulty, estimated_time, tasks)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (step_id, title) DO UPDATE
       SET description = EXCLUDED.description, difficulty = EXCLUDED.difficulty, estimated_time = EXCLUDED.estimated_time, tasks = EXCLUDED.tasks
       RETURNING *`,
            [userId, stepId, proj.title, proj.description, proj.difficulty || "beginner", proj.estimated_time || "4 hours", JSON.stringify(formattedTasks)]
        );
        inserted.push(result.rows[0]);
    }
    return inserted;
};

exports.updateProjectTask = async (stepId, projectTitle, taskId, completed) => {
    // Read existing project rows
    const projectsRes = await db.query(
        "SELECT id, tasks FROM practice_projects WHERE step_id = $1 AND title = $2",
        [stepId, projectTitle]
    );
    if (projectsRes.rows.length === 0) return null;

    const project = projectsRes.rows[0];
    const updatedTasks = (project.tasks || []).map((t) => {
        if (t.id === taskId) {
            return { ...t, completed };
        }
        return t;
    });

    const updateResult = await db.query(
        `UPDATE practice_projects 
     SET tasks = $1 
     WHERE id = $2 
     RETURNING *`,
        [JSON.stringify(updatedTasks), project.id]
    );
    return updateResult.rows[0];
};

// Interview Preps
exports.getInterviewPreps = async (stepId) => {
    const result = await db.query(
        "SELECT * FROM interview_preps WHERE step_id = $1 ORDER BY created_at ASC",
        [stepId]
    );
    return result.rows;
};

exports.saveInterviewPreps = async (userId, stepId, preps) => {
    await db.query("DELETE FROM interview_preps WHERE step_id = $1", [stepId]);
    const inserted = [];
    for (const item of preps) {
        const result = await db.query(
            `INSERT INTO interview_preps (user_id, step_id, difficulty, question_text, expected_answer, tags, estimated_duration)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
            [userId, stepId, item.difficulty, item.question_text, item.expected_answer || "", item.tags || [], item.estimated_duration || 15]
        );
        inserted.push(result.rows[0]);
    }
    return inserted;
};

// Revision Checklists
exports.getRevisionChecklists = async (stepId) => {
    const result = await db.query(
        "SELECT * FROM revision_checklists WHERE step_id = $1 ORDER BY created_at ASC",
        [stepId]
    );
    return result.rows;
};

exports.saveRevisionChecklists = async (userId, stepId, checklists) => {
    await db.query("DELETE FROM revision_checklists WHERE step_id = $1", [stepId]);
    const inserted = [];
    for (const item of checklists) {
        const title = typeof item === "string" ? item : item.title;
        const completed = typeof item === "string" ? false : !!item.completed;
        const result = await db.query(
            `INSERT INTO revision_checklists (user_id, step_id, title, completed)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (step_id, title) DO UPDATE SET completed = EXCLUDED.completed
       RETURNING *`,
            [userId, stepId, title, completed]
        );
        inserted.push(result.rows[0]);
    }
    return inserted;
};

exports.updateRevisionItem = async (stepId, title, completed) => {
    const result = await db.query(
        `UPDATE revision_checklists 
     SET completed = $1 
     WHERE step_id = $2 AND title = $3 
     RETURNING *`,
        [completed, stepId, title]
    );
    return result.rows[0];
};
