import axios from 'axios'
import { BASE_URL } from '../config/baseURL'


export const createBrand = async (brand) => {
    try {
        const response = await axios.post(`${BASE_URL}/brand/create`, brand, {
            withCredentials: true,
            headers: {
                'Content-Type': "muliipart/form-data",
            }
        })
        return response?.data;
    } catch (error) {
        console.log("Error in creating brand", error)
        return error.response.data
    }
}

export const getAllBrands = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/brand/get-all`)
        return response?.data
    } catch (error) {
        console.log("Error in getting all brands", error)
        return error.response.data
    }
}


export const updateBrand = async (id, brand) => {
    try {
        const response = await axios.put(`${BASE_URL}/brand/${id}`, brand, {
            withCredentials: true,
            headers: {
                'Content-Type': "multipart/form-data",
            }
        })
        return response?.data;
    } catch (error) {
        console.log("Error in updating brand", error)
        return error.response.data
    }
}

export const deleteBrand = async (id) => {
    try {
        const response = await axios.delete(`${BASE_URL}/brand/${id}`, {
            withCredentials: true
        })
        return response?.data
    } catch (error) {
        console.log("Error in deleting brand", error)
        return error.response.data
    }
}