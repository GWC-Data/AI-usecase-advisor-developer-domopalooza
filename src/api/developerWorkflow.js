import axios from "axios";

const API = axios.create({
  // baseURL: "http://localhost:5000",
  baseURL: "https://domo-workflow-product-api.onrender.com",
});

export const getTickets = async () => {
  const res = await API.get("/tickets");
  return res.data;
};

export const submitDeveloperSolution = async (payload) => {
  const res = await API.post("/developer-solution", payload);
  return res.data;
};
