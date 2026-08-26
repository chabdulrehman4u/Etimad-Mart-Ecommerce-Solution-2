import { createSlice } from '@reduxjs/toolkit';

// Hydrate initial state from sessionStorage if available
const sessionUser = sessionStorage.getItem('user');
let parsedUser = null;
if (sessionUser && sessionUser !== 'undefined') {
    try {
        parsedUser = JSON.parse(sessionUser);
    } catch (e) {
        parsedUser = null;
    }
}
const initialState = {
    user: parsedUser,
    isAuthenticated: !!parsedUser,
};
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser(state, action) {
            state.user = action.payload;
            state.isAuthenticated = true;
            sessionStorage.setItem('user', JSON.stringify(action.payload));
        },
        logout(state) {
            state.user = null;
            state.isAuthenticated = false;
            sessionStorage.removeItem('user');
        }
    }
})

export const { setUser, login, logout } = authSlice.actions;
export default authSlice.reducer;