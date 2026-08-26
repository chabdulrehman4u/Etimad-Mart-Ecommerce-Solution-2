import axios from 'axios'
import { BASE_URL } from '../config/baseURL'

export const addBanner = async (data) => {
    try {
        const response = await axios.post(`${BASE_URL}/banner/add`, data, {
            withCredentials: true, headers: {
                "Content-Type": "multipart/form-data"
            }
        })
        return response?.data
    } catch (error) {
        console.log("Error in adding banner", error)
    }
}

export const getBanners = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/banner/all`)
        return response?.data;
    } catch (error) {
        console.log("Error in getting all banners", error)
    }
}
export const getAdminBanners = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/banner/admin/all`)
        return response?.data;
    } catch (error) {
        console.log("Error in getting all banners", error)
    }
}

export const updateBanner = async (data, id) => {
    console.log("Id before sending to backend------>", id);
    console.log("data before sending to backend------>", data);
    
    try {
        const response = await axios.put(`${BASE_URL}/banner/${id}`, data, {
            withCredentials: true,
        });
        return response?.data;
    } catch (error) {
        console.log("Error in updating banner", error);
    }
};


export const deleteBanner = async (id) => {
    try {
        const response = await axios.delete(`${BASE_URL}/banner/${id}`, {
            withCredentials: true
        })
        return response?.data
    } catch (error) {
        console.log("Error in deleting banner", error)
    }
}