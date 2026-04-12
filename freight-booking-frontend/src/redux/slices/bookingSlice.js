import { createSlice } from '@reduxjs/toolkit';

const bookingSlice = createSlice({
  name: 'booking',
  initialState: {
    list: [],
    selected: null,
    loading: false,
    error: null,
  },
  reducers: {
    setBookings: (state, action) => { state.list = action.payload; },
    setSelectedBooking: (state, action) => { state.selected = action.payload; },
    setBookingLoading: (state, action) => { state.loading = action.payload; },
    setBookingError: (state, action) => { state.error = action.payload; },
  },
});

export const { setBookings, setSelectedBooking, setBookingLoading, setBookingError } = bookingSlice.actions;
export default bookingSlice.reducer;