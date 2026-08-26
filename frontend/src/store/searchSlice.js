import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { searchProduct } from '../functions/search';

export const fetchSearchResults = createAsyncThunk(
    'search/fetchSearchResults',
    async (query, { rejectWithValue }) => {
        // console.log('Query passed to fetchSearchResults------------->', query);
        try {
            const response = await searchProduct({ query }); 
            return response?.products || [];
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const searchSlice = createSlice({
    name: 'search',
    initialState: {
        query: '',
        results: [],
        loading: false,
        error: null,
    },
    reducers: {
        setSearchQuery(state, action) {
            state.query = action.payload;
        },
        clearSearchResults(state) {
            state.results = [];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSearchResults.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSearchResults.fulfilled, (state, action) => {
                state.loading = false;
                state.results = action.payload;
            })
            .addCase(fetchSearchResults.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { setSearchQuery, clearSearchResults } = searchSlice.actions;
export default searchSlice.reducer;
