import axiosClient from "./axiosClient";

export async function getVariables() {
  const { data } = await axiosClient.get("/variables");
  return data;
}

export async function createVariable(payload) {
  const { data } = await axiosClient.post("/variables", payload);
  return data;
}

export async function runSimulation(payload) {
  const { data } = await axiosClient.post("/simulations/run", payload);
  return data;
}
