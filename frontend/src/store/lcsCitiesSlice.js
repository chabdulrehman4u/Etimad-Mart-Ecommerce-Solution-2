import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'

export const fetchLcsCities = createAsyncThunk('lcsCities/fetch', async (arg, { getState, rejectWithValue }) => {
  const state = getState();
  const force = arg && (arg.force === true || arg === true)
  const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
  const already = state?.lcsCities;
  if (!force && Array.isArray(already?.items) && already.items.length > 0) {
    const fresh = Date.now() - (already.loadedAt || 0) < TTL_MS;
    if (fresh) return already.items;
  }
  try {
    const res = await axios.get(`/lcs_cities.json`, { withCredentials: false })
    const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.cities) ? res.data.cities : [])
    return data
  } catch (e) {
    return rejectWithValue(e?.response?.data || { message: e.message })
  }
})

const initialState = {
  items: [],
  loading: false,
  error: null,
  loadedAt: 0,
}

const lcsCitiesSlice = createSlice({
  name: 'lcsCities',
  initialState,
  reducers: {
    clearLcsCities(state) {
      state.items = []
      state.loadedAt = 0
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLcsCities.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchLcsCities.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload || []
        state.loadedAt = Date.now()
      })
      .addCase(fetchLcsCities.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload?.message || 'Failed to load LCS cities'
      })
  }
})

export const { clearLcsCities } = lcsCitiesSlice.actions
export default lcsCitiesSlice.reducer
