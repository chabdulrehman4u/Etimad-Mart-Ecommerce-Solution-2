import axios from 'axios'
import { BASE_URL } from '../config/baseURL'

export const validateCoupon = async ({ code, cartSummary, subtotal, deliveryCharges, userId, guestId }) => {
  try {
    const res = await axios.post(`${BASE_URL}/coupon/validate`, { code, cartSummary, subtotal, deliveryCharges, userId, guestId }, {
      withCredentials: true,
    })
    return res?.data
  } catch (e) {
    throw e?.response?.data || e
  }
}

// Admin: list coupons with filters/pagination 
export const adminListCoupons = async (params = {}) => {
  try {
    const res = await axios.get(`${BASE_URL}/coupon/admin`, {
      withCredentials: true,
      params,
    })
    return res?.data
  } catch (e) {
    throw e?.response?.data || e
  }
}

// Admin: create coupon
export const adminCreateCoupon = async (data) => {
  try {
    const res = await axios.post(`${BASE_URL}/coupon/admin`, data, { withCredentials: true })
    return res?.data
  } catch (e) {
    throw e?.response?.data || e
  }
}

// Admin: update coupon
export const adminUpdateCoupon = async (id, data) => {
  try {
    const res = await axios.patch(`${BASE_URL}/coupon/admin/${encodeURIComponent(id)}`, data, { withCredentials: true })
    return res?.data
  } catch (e) {
    throw e?.response?.data || e
  }
}

// Admin: toggle coupon active state
export const adminToggleCoupon = async (id) => {
  try {
    const res = await axios.patch(`${BASE_URL}/coupon/admin/${encodeURIComponent(id)}/toggle`, {}, { withCredentials: true })
    return res?.data
  } catch (e) {
    throw e?.response?.data || e
  }
}

// Admin: delete coupon
export const adminDeleteCoupon = async (id) => {
  try {
    const res = await axios.delete(`${BASE_URL}/coupon/admin/${encodeURIComponent(id)}`, { withCredentials: true })
    return res?.data
  } catch (e) {
    throw e?.response?.data || e
  }
}
