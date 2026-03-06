import Domo from "ryuu.js";

export const startDeveloperWorkflow = async (payload) => {
  try {
    const res = await Domo.post(
      "/domo/workflow/v1/models/SubmissionWorkflow/start",
      payload
    );

    return res;
  } catch (err) {
    console.error("Workflow start failed:", err);
    throw err;
  }
};