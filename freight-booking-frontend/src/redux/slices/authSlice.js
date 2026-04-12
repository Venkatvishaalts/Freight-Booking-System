import { createSlice } from '@reduxjs/toolkit';

// Safely parse user from localStorage
const parseUser = () => {
  try {
    const raw = localStorage.getItem('user');
    // Reject any invalid stored value
    if (!raw || raw === 'undefined' || raw === 'null' || raw === '[object Object]') {
      localStorage.removeItem('user');
      return null;
    }
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};

const storedUser = parseUser();
const storedToken = localStorage.getItem('token') || null;

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: storedUser,
    token: storedToken,
    isAuthenticated: !!storedToken && !!storedUser,
  },
  reducers: {
    loginSuccess: (state, action) => {
      const user = action.payload.user;
      const token = action.payload.token;

      state.user = user;
      state.token = token;
      state.isAuthenticated = true;

      // Always stringify properly before storing
      try {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      } catch {
        console.error('Failed to save auth to localStorage');
      }
    },
    logoutSuccess: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      try {
        localStorage.setItem('user', JSON.stringify(state.user));
      } catch {
        console.error('Failed to update user in localStorage');
      }
    },
  },
});

export const { loginSuccess, logoutSuccess, updateUser } = authSlice.actions;
export default authSlice.reducer;