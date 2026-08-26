import axios from 'axios';
import { BASE_URL } from '../config/baseURL';


const signupAPI = async (data) => {
    try {
        const response = await axios.post(`${BASE_URL}/user/signup`, data, {
            withCredentials: true, headers: {
                "Content-Type": "multipart/form-data"
            }
        });
        return response?.data;
    } catch (error) {
        return error.response.data;
    }
}

const loginAPI = async (data) => {
    try {
        const response = await axios.post(`${BASE_URL}/user/login`, data, { withCredentials: true });
        if (response?.data?.user?._id) {
            const userId = response.data.user._id;
            // Check if guestId cookie exists (means guest cart might exist)
            const hasGuestCart = document.cookie.split('; ').find(row => row.startsWith('guestId='));
            console.log("hasGuestCart------>", hasGuestCart);

            if (hasGuestCart) {
                // Merge guest cart into user cart
              const mergeResponse =   await axios.post(`${BASE_URL}/cart/merge`, { userId }, { withCredentials: true });
              console.log("mergeResponse------>", mergeResponse);
            }
        }

        return response?.data;
    } catch (error) {
        return error?.response?.data;
    }
};

const logoutAPI = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/user/logout`, {
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

const getUserAPI = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/user/current`, {
            withCredentials: true
        });
        return response?.data;
    } catch (error) {
        return error.response?.data;
    }
}

const getAllUsers = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/user/getAll`, { withCredentials: true })
        return response?.data
    } catch (error) {
        console.log("Error in fetching all users.", error)
    }
}

const updateUserRole = async (id, newRole) => {
    try {
        const response = await axios.put(`${BASE_URL}/user/update-role/${id}`, {newRole }, { withCredentials: true })
        return response?.data
    } catch (error) {
        console.log("Eror in updating user role ", error)
    }
}

const deleteUser = async (id) => {
    try {
        const response = await axios.delete(`${BASE_URL}/user/${id}`, { withCredentials: true });
        return response?.data;
    } catch (error) {
        console.log("Error in deleting user", error);
        return error?.response?.data;
    }
};

export { signupAPI, loginAPI, logoutAPI, getUserAPI, getAllUsers, updateUserRole, deleteUser };