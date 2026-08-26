import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import cartReducer from './cartSlice'
import searchReducer from './searchSlice'
import selectedCategoriesReducer from './selectedCategoriesSlice'
import lcsCitiesReducer from './lcsCitiesSlice'

const store = configureStore({
    reducer: {
        auth: authReducer,
        cart: cartReducer,
        search: searchReducer,
        selectedCategories: selectedCategoriesReducer,
        lcsCities: lcsCitiesReducer,
    }
})

export default store;