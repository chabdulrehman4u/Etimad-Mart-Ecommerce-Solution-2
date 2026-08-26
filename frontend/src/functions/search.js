import axios from 'axios'
import { BASE_URL } from '../config/baseURL'

export const searchProduct = async (data) => {
    if (typeof data !== 'object' || data === null) {
        console.error('Invalid data passed to searchProduct:', data);
        return;
    }
    try {
        const response = await axios.get(`${BASE_URL}/search`, {
            params: data,
            withCredentials: true
        });
        return response?.data;
    } catch (error) {
        console.log("Error in searching products", error);
        throw error;
    }
}

export const filterByPrice = async ({ price, page = 1, limit = 16 }) => {
    console.log("Page and limit in filterByPrice api function--------->", page, limit);
    try {
        // Ensure the key is 'sort' as expected by the backend
        const formattedData = { sort: price === 'high' ? 'desc' : 'asc' };
        const response = await axios.get(`${BASE_URL}/search/filter/price?page=${page}&limit=${limit}`, {
            params: formattedData,
            withCredentials: true,
        });
        return response?.data;
    } catch (error) {
        console.log("Error in filtering by price", error);
    }
};

export const filterByCategory = async ({ categories, subcategory, page = 1, limit = 16 }) => {
    try {
        const response = await axios.get(`${BASE_URL}/search/filter/category?page=${page}&limit=${limit}`, {
            params: { categoryName: categories, subcategory },
            withCredentials: true,
            timeout: 10000, // 10 second timeout
            paramsSerializer: (params) => new URLSearchParams(params).toString(),
        });
        return response?.data;
    } catch (error) {
        console.error("Error in filtering by category", error);
        // Return empty result instead of undefined to prevent crashes
        return { products: [], totalPages: 0, currentPage: page };
    }
};

export const filterBySubcategory = async (subcategoryName, page = 1, limit = 16) => {
    try {
        const response = await axios.get(`${BASE_URL}/search/filter/subcategory?page=${page}&limit=${limit}`, {
            params: { subcategoryName },
            withCredentials: true
        });
        return response?.data;
    } catch (error) {
        console.log("Error in filtering by subcategory", error);
    }
};

export const filterByRating = async (data, page = 1, limit = 16) => {
    // console.log("Data in filterByRating-------->", data)
    try {
        const response = await axios.get(`${BASE_URL}/search/filter/rating?page=${page}&limit=${limit}`, {
            params: data,
            withCredentials: true
        });
        return response?.data;
    } catch (error) {
        console.log("Error in filtering by rating", error)
    }
}

export const getMinMaxPrice = async (page = 1, limit = 16) => {
    try {
        const response = await axios.get(`${BASE_URL}/search/filter/min-max-price?page=${page}&limit=${limit}`);
        return response?.data;
    } catch (error) {
        console.log("Error in fetching min and max price", error)
    }
}

export const filterByPriceRange = async (data, page = 1, limit = 16) => {
    try {
        const response = await axios.get(`${BASE_URL}/search/filter/price-range?page=${page}&limit=${limit}`, {
            params: { minPrice: data.min, maxPrice: data.max }, // Ensure correct keys
            withCredentials: true
        });
        return response?.data;
    } catch (error) {
        console.log("Error in filtering by price range", error);
    }
};

export const filterProductsByBrand = async (brand, page = 1, limit = 16) => {
    try {
        const response = await axios.get(`${BASE_URL}/search/filter/${brand}?page=${page}&limit=${limit}`);
        return response?.data;
    } catch (error) {
        console.log("Error in filtering by brand", error);
    }
}


// Combined filter endpoint (no query required)
export const filterCombined = async (params) => {
    try {
        const response = await axios.get(`${BASE_URL}/search/filter/combined`, {
            params,
            withCredentials: true,
            paramsSerializer: (p) => new URLSearchParams(p).toString(),
        });
        return response?.data;
    } catch (error) {
        console.log('Error in combined filter request', error);
        throw error;
    }
}


