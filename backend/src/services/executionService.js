const axios = require("axios");

const JUDGE0_URL =
  "https://rapidapi.com/judge0-official/api/judge0-ce/playground/apiendpoint_489fe32c-7191-4db3-b337-77d0d3932807";

const headers = {
  "content-type": "application/json",
  "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
  "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com"
};

exports.executeCode = async (source_code, language_id) => {
  const response = await axios.post(
    JUDGE0_URL,
    {
      source_code,
      language_id,
      stdin: ""
    },
    { headers }
  );

  return response.data;
};