import axios from 'axios'
import { BASE_URL } from '../config/baseURL'

export const addItemToCart = async (userId, cart) => {
    try {
        const response = await axios.post(
            `${BASE_URL}/cart/add`, 
            { userId, cart }, 
            { withCredentials: true }
        );
        return response?.data;
    } catch (error) {
        console.log("Error in adding item to cart", error);
        throw error;
    }
};

export const getMyCart = async (userId) => {
    try {
        const response = await axios.get(`${BASE_URL}/cart/${userId}`, { withCredentials: true })
        return response?.data
    } catch (error) {
        console.log("Error in getting my cart")
        throw error;
    }
}

export const clearCart = async (userId) => {
    try {
        const response = await axios.delete(`${BASE_URL}/cart/empty/${userId}`, { withCredentials: true });
        return response?.data;
    } catch (error) {
        console.log("Error in clearing the cart", error);
        throw error;
    }
};
