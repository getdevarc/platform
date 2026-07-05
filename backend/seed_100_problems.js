require("dotenv").config();
const db = require("./src/config/db");

async function seed() {
    console.log("Seeding 100 mixed problems in database...");

    const topics = ["Array", "String", "Hash Table", "Dynamic Programming", "Math", "Sorting", "Two Pointers", "Sliding Window", "Graph", "Binary Tree", "Stack", "Recursion", "Binary Search", "Linked List", "Greedy"];
    const difficulties = ["easy", "medium", "hard"];

    try {
        // Count existing problems
        const currentCountRes = await db.query("SELECT COUNT(*) FROM problems");
        const currentCount = parseInt(currentCountRes.rows[0].count, 10);

        const targetCount = 100;
        const needed = targetCount - currentCount;

        if (needed <= 0) {
            console.log(`Database already has ${currentCount} problems. No additional seeding needed.`);
            process.exit(0);
        }

        console.log(`Currently has ${currentCount} problems. Seeding ${needed} more to make it 100 problems...`);

        for (let i = 1; i <= needed; i++) {
            const index = currentCount + i;
            const topic = topics[i % topics.length];
            const difficulty = difficulties[i % difficulties.length];

            const title = `${topic} Challenge #${index}`;
            const example_input = `nums = [1, 2, ${3 + i}], target = ${5 + i}`;
            const example_output = `[0, 1]`;
            const test_cases = [
                { input: `[1, 2, ${3 + i}]\n${5 + i}`, expected_output: `[0, 1]` },
                { input: `[3, 4, 5]\n9`, expected_output: `[1, 2]` }
            ];

            const description = `### ${title}
            
Given an input set matching the pattern of **${topic}**, design an optimal solution under high constraints.

**Example 1:**
* **Input:** \`${example_input}\`
* **Output:** \`[0, 1]\`
* **Rules:** Optimize logic for time O(N) complexity constraints.`;

            await db.query(
                `INSERT INTO problems(title, difficulty, description, example_input, example_output, test_cases)
                 VALUES($1, $2, $3, $4, $5, $6)`,
                [title, difficulty, description, example_input, example_output, JSON.stringify(test_cases)]
            );
        }

        console.log("Successfully seeded 100 mixed problems total!");
        process.exit(0);
    } catch (err) {
        console.error("Seeding 100 problems failed:", err);
        process.exit(1);
    }
}

seed();
