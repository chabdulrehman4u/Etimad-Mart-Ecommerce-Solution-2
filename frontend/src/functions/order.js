import axios from 'axios'
import { BASE_URL } from '../config/baseURL'

export const placeOrder = async (data, client = 'web') => {
    try {
        const response = await axios.post(
            `${BASE_URL}/order/create`,
            data,
            {
                withCredentials: true,
                headers: {
                    'X-Client': client,
                },
            }
        )
        return response?.data
    } catch (error) {
        console.log("Error in creating order", error)
        throw error;
    }
}

export const getMyOrders = async (userId, guestId) => {
    try {
        const url = `${BASE_URL}/order/${userId || 'guest'}`
        const response = await axios.get(url, {
            withCredentials: true,
            headers: guestId ? { 'X-Guest-Id': guestId } : undefined,
            params: {
                ...(guestId ? { guestId } : {}),
                _t: Date.now(), // cache-busting param to avoid 304/stale caches
            },
        })
        return response?.data
    } catch (error) {
        console.log("Error in fetching my orders", error)
        throw error;
    }
}
export const getAllOrders = async (page = 1, limit = 10) => {
    try {
        const response = await axios.get(`${BASE_URL}/order/all?page=${page}&limit=${limit}`, { withCredentials: true })
        return response?.data
    } catch (error) {
        console.log("Error in fetching all orders", error)
        throw error
    }
}

export const getRecentOrders = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/order/recents`, { withCredentials: true })
        return response?.data
    } catch (error) {
        console.log("Error in fetching all orders", error)
        throw error
    }
}

export const updateOrderStatus = async (orderId, status) => {
    try {
        const response = await axios.patch(`${BASE_URL}/order/${orderId}`, status, { withCredentials: true })
        return response?.data
    } catch (error) {
        console.log("Error in updating order status", error)
        throw error;
    }
}

// Admin: search orders with live query and status/sort filters
export const getOrdersSearch = async (params = {}) => {
    try {
        const response = await axios.get(`${BASE_URL}/order/search`, {
            withCredentials: true,
            params,
        })
        return response?.data
    } catch (error) {
        console.log("Error in searching orders", error)
        throw error
    }
}

// Admin: sort orders by status with optional filter and pagination
export const getOrdersSortedByStatus = async (params = {}) => {
    try {
        const response = await axios.get(`${BASE_URL}/order/sort`, {
            withCredentials: true,
            params,
        })
        return response?.data
    } catch (error) {
        console.log("Error in sorting orders by status", error)
        throw error
    }
}

// Admin: push selected orders to Leopard Courier Service (LCS)
export const pushOrdersToLCS = async (orderIds = []) => {
    try {
        const response = await axios.post(`${BASE_URL}/courier/lcs/push`, { orderIds }, {
            withCredentials: true,
        })
        return response?.data
    } catch (error) {
        console.log('Error pushing orders to LCS', error)
        throw error?.response?.data || error
    }
}

// Admin: resolve an order's LCS destination city manually
export const resolveOrderLcsCity = async ({ orderId, lcsCityId, lcsCityName }) => {
    try {
        const response = await axios.post(`${BASE_URL}/courier/lcs/resolve-city`, { orderId, lcsCityId, lcsCityName }, {
            withCredentials: true,
        })
        return response?.data
    } catch (error) {
        throw error?.response?.data || error
    }
}

// Admin: track LCS status for a consignment number (CN)
export const trackLcsStatus = async (cn) => {
    try {
        const response = await axios.get(`${BASE_URL}/courier/lcs/track/${encodeURIComponent(cn)}`, {
            withCredentials: true,
        })
        return response?.data
    } catch (error) {
        console.log('Error tracking LCS status', error)
        throw error
    }
}

// Admin: get LCS city suggestions by query for resolving cities
export const getLcsCitySuggestions = async (q, limit = 10) => {
    try {
        const response = await axios.get(`${BASE_URL}/courier/lcs/suggest`, {
            withCredentials: true,
            params: { q, limit }
        })
        return response?.data?.data || []
    } catch (error) {
        return []
    }
}

// Admin: update order details (shipping address + additionalInstructions)
export const updateOrderDetails = async ({ orderId, shippingAddress }) => {
    try {
        const response = await axios.patch(
            `${BASE_URL}/order/${orderId}/details`,
            { shippingAddress },
            { withCredentials: true }
        )
        return response?.data
    } catch (error) {
        console.log('Error updating order details', error)
        throw error?.response?.data || error
    }
}

// Admin: delete an order (only Pending & not pushed)
export const deleteOrderById = async (orderId) => {
    try {
        const response = await axios.delete(
            `${BASE_URL}/order/${orderId}`,
            { withCredentials: true }
        )
        return response?.data
    } catch (error) {
        console.log('Error deleting order', error)
        throw error?.response?.data || error
    }
}
