import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000",
  // baseURL: "https://domo-ai-usecase-product-api-462434048008.asia-south1.run.app",
});

export const getTickets = async () => {
  const res = await API.get("/tickets");
  return res.data;
};

export const submitDeveloperSolution = async (payload) => {
  const res = await API.post("/developer-solution", payload);
  return res.data;
};

export const getDevelopers = async () => {
  const res = await API.get("/developers");
  return res.data;
};

export const addDeveloper = async ({ email }) => {
  const res = await API.post("/developers", { email });
  return res.data;
};

export const deleteDeveloper = async (id) => {
  const res = await API.delete(`/developers/${id}`);
  return res.data;
};

export const toggleDeveloperSelected = async (id, { email, isSelected }) => {
  const res = await API.put(`/developers/${id}/select`, { email, isSelected });
  return res.data;
};

export const uploadImage = async (formData) => {
  const res = await API.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export const deleteImageFromCloudinary = async (public_id) => {
  const res = await API.post("/delete-image", { public_id });
  return res.data;
};
