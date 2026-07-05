require("dotenv").config();
const db = require("./src/config/db");

async function seed() {
    console.log("Starting DB migration & seeding...");

    try {
        // 1. Alter table to ensure frontend expected columns exist
        await db.query(`
      ALTER TABLE problems 
      ADD COLUMN IF NOT EXISTS example_input TEXT,
      ADD COLUMN IF NOT EXISTS example_output TEXT,
      ADD COLUMN IF NOT EXISTS test_cases JSONB;
    `);
        console.log("Schema expanded to support example_input, example_output, and test_cases.");

        // 2. Count existing problems
        const existing = await db.query("SELECT COUNT(*) FROM problems");
        if (parseInt(existing.rows[0].count, 10) > 0) {
            console.log("Database already contains problems. Wiping for clean seed...");
            await db.query("DELETE FROM problems CASCADE");
        }

        // 3. Define the 6 problems
        const problems = [
            {
                title: "Two Sum",
                difficulty: "easy",
                example_input: "nums = [2,7,11,15], target = 9",
                example_output: "[0,1]",
                test_cases: [
                    { input: "[2,7,11,15]\n9", expected_output: "[0,1]" },
                    { input: "[3,2,4]\n6", expected_output: "[1,2]" }
                ],
                description: `### Two Sum

Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to \`target\`*.

You may assume that each input would have **exactly one solution**, and you may not use the *same* element twice.

You can return the answer in any order.

**Example 1:**
* **Input:** \`nums = [2,7,11,15]\`, \`target = 9\`
* **Output:** \`[0,1]\`
* **Explanation:** Because \`nums[0] + nums[1] == 9\`, we return \`[0, 1]\`.`
            },
            {
                title: "Valid Anagram",
                difficulty: "easy",
                example_input: "s = \"anagram\", t = \"nagaram\"",
                example_output: "true",
                test_cases: [
                    { input: "anagram\nnagaram", expected_output: "true" },
                    { input: "rat\ncar", expected_output: "false" }
                ],
                description: `### Valid Anagram

Given two strings \`s\` and \`t\`, return \`true\` *if \`t\` is an anagram of \`s\`, and \`false\` otherwise*.

An **Anagram** is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.

**Example 1:**
* **Input:** \`s = "anagram"\`, \`t = "nagaram"\`
* **Output:** \`true\``
            },
            {
                title: "Longest Substring Without Repeating Characters",
                difficulty: "medium",
                example_input: "s = \"abcabcbb\"",
                example_output: "3",
                test_cases: [
                    { input: "abcabcbb", expected_output: "3" },
                    { input: "bbbbb", expected_output: "1" }
                ],
                description: `### Longest Substring Without Repeating Characters

Given a string \`s\`, find the length of the **longest substring** without repeating characters.

**Example 1:**
* **Input:** \`s = "abcabcbb"\`
* **Output:** \`3\`
* **Explanation:** The answer is "abc", with the length of 3.`
            },
            {
                title: "Container With Most Water",
                difficulty: "medium",
                example_input: "height = [1,8,6,2,5,4,8,3,7]",
                example_output: "49",
                test_cases: [
                    { input: "1,8,6,2,5,4,8,3,7", expected_output: "49" },
                    { input: "1,1", expected_output: "1" }
                ],
                description: `### Container With Most Water

You are given an integer array \`height\` of length \`n\`. There are \`n\` vertical lines drawn such that the two endpoints of the \`i\`-th line are \`(i, 0)\` and \`(i, height[i])\`.

Find two lines that together with the x-axis form a container, such that the container contains the most water.

Return *the maximum amount of water a container can store*.

**Example 1:**
* **Input:** \`height = [1,8,6,2,5,4,8,3,7]\`
* **Output:** \`49\`
* **Explanation:** The above vertical lines are represented by array \`[1,8,6,2,5,4,8,3,7]\`. In this case, the max area of water the container can contain is 49.`
            },
            {
                title: "Median of Two Sorted Arrays",
                difficulty: "hard",
                example_input: "nums1 = [1,3], nums2 = [2]",
                example_output: "2.00000",
                test_cases: [
                    { input: "1,3\n2", expected_output: "2.00000" },
                    { input: "1,2\n3,4", expected_output: "2.50000" }
                ],
                description: `### Median of Two Sorted Arrays

Given two sorted arrays \`nums1\` and \`nums2\` of size \`m\` and \`n\` respectively, return **the median** of the two sorted arrays.

The overall run time complexity should be \`O(log (m+n))\`.

**Example 1:**
* **Input:** \`nums1 = [1,3]\`, \`nums2 = [2]\`
* **Output:** \`2.00000\`
* **Explanation:** merged array = [1,2,3] and median is 2.`
            },
            {
                title: "Edit Distance",
                difficulty: "hard",
                example_input: "word1 = \"horse\", word2 = \"ros\"",
                example_output: "3",
                test_cases: [
                    { input: "horse\nros", expected_output: "3" },
                    { input: "intention\nexecution", expected_output: "5" }
                ],
                description: `### Edit Distance

Given two strings \`word1\` and \`word2\`, return *the minimum number of operations required to convert \`word1\` to \`word2\`*.

You have the following three operations permitted on a word:
1. Insert a character
2. Delete a character
3. Replace a character

**Example 1:**
* **Input:** \`word1 = "horse"\`, \`word2 = "ros"\`
* **Output:** \`3\`
* **Explanation:** 
  * horse -> rorse (replace 'h' with 'r')
  * rorse -> rose (remove 'r')
  * rose -> ros (remove 'e')`
            }
        ];

        // 4. Seed to database
        for (const p of problems) {
            await db.query(
                `INSERT INTO problems(title, difficulty, description, example_input, example_output, test_cases)
         VALUES($1, $2, $3, $4, $5, $6)`,
                [p.title, p.difficulty, p.description, p.example_input, p.example_output, JSON.stringify(p.test_cases)]
            );
            console.log(`Seeded: ${p.title} (${p.difficulty})`);
        }

        console.log("Problems successfully seeded!");
        process.exit(0);

    } catch (error) {
        console.error("Migration/Seeding failed:", error);
        process.exit(1);
    }
}

seed();
