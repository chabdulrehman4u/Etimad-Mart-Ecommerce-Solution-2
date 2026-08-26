import axios from 'axios'
import { BASE_URL } from '../config/baseURL'


export const createProduct = async (data) => {
    try {
        const response = await axios.post(`${BASE_URL}/product/create`, data, {
            withCredentials: true, headers: {
                "Content-Type": "multipart/form-data"
            }
        })
        return response?.data;
    } catch (error) {
        console.log("Error in product creating ", error)
    }
}

export const getMyProducts = async (page = 1, limit = 8) => {
    try {
        const response = await axios.get(`${BASE_URL}/product/my-products?page=${page}&limit=${limit}`, { withCredentials: true })
        return response?.data;
    } catch (error) {
        console.log("Error in getting my products", error)
    }
}

export const getAllProducts = async (page = 1, limit = 16) => {
    try {
        const response = await axios.get(`${BASE_URL}/product/getAll`, {
            params: { page, limit },
            withCredentials: true
        });
        return response?.data;
    } catch (error) {
        console.log("Error in getting all products", error);
        throw error;
    }
}

export const deleteProduct = async (id) => {
    try {
        // console.log("Deleting product with ID:", id);
        const response = await axios.delete(`${BASE_URL}/product/${id}`, { withCredentials: true });
        // console.log("Response from delete product api-------->", response);
        return response?.data;
    } catch (error) {
        console.log("Error in deleting my product", error);
    }
}

export const updateProduct = async (slug, data) => {
    try {
        const response = await axios.put(`${BASE_URL}/product/${slug}`, data, {
            withCredentials: true,
            headers: {
                "Content-Type": "multipart/form-data"
            }
        })
        return response?.data
    } catch (error) {
        console.log("Error in updating product ", error)
    }
}

export const getProductBySlug = async (slug, { regionId } = {}) => {
    try {
        const response = await axios.get(`${BASE_URL}/product/${slug}`, {
            withCredentials: true,
            params: regionId ? { regionId } : undefined,
        });
        return response?.data;
    } catch (error) {
        console.log("Error in getting product by slug", error);
    }
}

export const createProductReview = async (productSlug, reviewerId, data) => {
    try {
        const response = await axios.post(`${BASE_URL}/review/create/${productSlug}/${reviewerId}`, data, {
            withCredentials: true,
            headers: {
                "Content-Type": "multipart/form-data"
            }
        })
        return response?.data;
    } catch (error) {
        console.log("Error in creating product review. ", error)
    }
}

export const getReviewsBySlug = async (slug) => {
    // console.log("Slug in reviews ------>", slug)
    try {
        const response = await axios.get(`${BASE_URL}/review/${slug}`)
        return response?.data;
    } catch (error) {
        console.log("Error in getting product review by slug.", error)
    }
}

export const getRelatedProducts = async (categoryId, excludeProductId) => {
    try {
        const response = await axios.get(`${BASE_URL}/product/related/${categoryId}/${excludeProductId}`)
        return response?.data;
    } catch (error) {
        console.log("Error in getting related products", error)
    }
}

// getBestSellers moved to homepage.js for better performance
// Use getBestSellers from '../functions/homepage' instead

export const getProductsBySub = async (subCategory, page = 1, limit = 10) => {
    try {
        const response = await axios.get(`${BASE_URL}/product/sub/${subCategory}`, {
            params: {
                page,
                limit
            }
        });
        return response?.data;
    } catch (error) {
        console.log("Error in getting products by subCategory ", error);
        throw error;
    }
}

export const getProductsByBrand = async (brand, page = 1, limit = 10) => {
    try {
        const response = await axios.get(`${BASE_URL}/search/filter/${brand}`, {
            params: {
                page,
                limit
            }
        });
        return response?.data;
    } catch (error) {
        console.log("Error in getting products by brand", error);
        throw error;
    }
}

// getFeaturedProducts moved to homepage.js for better performance
// Use getFeaturedProducts from '../functions/homepage' instead

// getNewArrivals moved to homepage.js for better performance  
// Use getNewProducts from '../functions/homepage' instead

export const uploadDescriptionImage = async (file) => {
    try {
        const formData = new FormData();
        formData.append('image', file);
        const response = await axios.post(`${BASE_URL}/product/upload-description-image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            withCredentials: true
        });
        return response?.data?.url;
    } catch (error) {
        console.log('Error uploading description image', error);
        throw error;
    }
};

export const getProductRedirects = async (slug) => {
    try {
        const response = await axios.get(`${BASE_URL}/product/redirects?to=${slug}`);
        return response?.data?.redirects || [];
    } catch (error) {
        console.log('Error fetching product redirects', error);
        return [];
    }
};






