import axios from 'axios'
import { BASE_URL } from '../config/baseURL'


export const createTag = async (data) => {
    try {
        const response = await axios.post(`${BASE_URL}/tag/create`, data, {
            withCredentials: true,
        })
        return response?.data;
    } catch (error) {
        console.log("Error in creating category")
    }
}

export const getAllTags = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/tag/getAll`, { withCredentials: true })
        return response?.data
    } catch (error) {
        console.log("Error in fetching all categories.")
    }
}

export const deleteTag = async (id) => {
    try {
        const response = await axios.delete(`${BASE_URL}/tag/${id}`, { withCredentials: true })
        return response?.data
    } catch (error) {
        console.log("Error in deleting category")
    }
}

export const updateTag = async (id, data) => {
    try {
        const response = await axios.put(`${BASE_URL}/tag/${id}`, data, { withCredentials: true })
        return response?.data
    } catch (error) {
        throw error;
    }
}