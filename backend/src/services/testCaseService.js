const executionService = require("./executionService");

exports.runTestCases = async (code, languageId, testCases, sessionId) => {
  const results = [];
  let allPassed = true;

  const cases = testCases || [];

  for (const testCase of cases) {
    const result = await executionService.executeCode(
      code,
      languageId,
      testCase.input,
      sessionId
    );

    const output = (result.stdout || "").trim();
    const expected = (testCase.expected_output || "").trim();
    const passed = output === expected;

    if (!passed) {
      allPassed = false;
    }

    results.push({
      input: testCase.input,
      expected: testCase.expected_output,
      output: output || "Empty output",
      passed
    });
  }

  return {
    status: allPassed ? "accepted" : "wrong_answer",
    testCases: results
  };
};