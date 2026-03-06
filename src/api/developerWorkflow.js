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

// Workflow completion checker utility
export const waitForWorkflowCompletion = async (instanceId) => {
let status = "IN_PROGRESS";

while (status === "IN_PROGRESS") {

const res = await Domo.get(
  `/domo/workflow/v1/models/SubmissionWorkflow/instance/${instanceId}`
);

status = res.status;

 console.log("Workflow status:", res.status);

if (status === "COMPLETED") return res;
if (status === "FAILED") throw new Error("Workflow failed");

await new Promise((r) => setTimeout(r, 2000));

}
};
