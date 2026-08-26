import axios from "axios";
import { BASE_URL } from "../config/baseURL";

export const addText = async (data) => {
  try {
    const response = await axios.post(`${BASE_URL}/topbar/add`, data);
    return response?.data;
  } catch (error) {
    console.log("Error in addning topbar text.", error);
  }
};

export const updateTopBar = async (data, id) => {
  try {
    const response = await axios.put(`${BASE_URL}/topbar/${id}`, data);
    return response?.data;
  } catch (error) {
    console.log("Error in updating topBar", error);
  }
};

export const gettAllTexts = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/topbar/all`);
    return response?.data;
  } catch (error) {
    console.log("Error in fetching texts.");
  }
};

export const deleteBarText = async (id) => {
  try {
    const response = await axios.delete(`${BASE_URL}/topbar/${id}`);
    return response?.data;
  } catch (error) {
    console.log("Error in deleting text.");
  }
};

export const getActiveBars = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/topbar/actives`);
    return response?.data;
  } catch (error) {
    console.log("Error in fecthing active texts.");
  }
};
