const executionService = require("./executionService");

exports.runTestCases = async (code, languageId, testCases) => {

  for (const testCase of testCases) {

    const result = await executionService.executeCode(
      code,
      languageId,
      testCase.input
    );

    const output = result.stdout?.trim();

    if (output !== testCase.expected_output) {
      return {
        status: "wrong_answer",
        output
      };
    }
  }

  return {
    status: "accepted"
  };
}; 