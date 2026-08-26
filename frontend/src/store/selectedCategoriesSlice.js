import { createSlice } from '@reduxjs/toolkit';

// Load initial state from local storage
const storedCategories = JSON.parse(localStorage.getItem('selectedCategories')) || [];

const initialState = {
    selectedCategories: storedCategories,
};

const selectedCategoriesSlice = createSlice({
    name: 'selectedCategories',
    initialState,
    reducers: {
        setSelectedCategories: (state, action) => {
            state.selectedCategories = action.payload;
            localStorage.setItem('selectedCategories', JSON.stringify(state.selectedCategories));
        },
    },
});

export const { setSelectedCategories } = selectedCategoriesSlice.actions;
export default selectedCategoriesSlice.reducer;
