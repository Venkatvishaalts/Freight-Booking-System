import { createSlice } from '@reduxjs/toolkit';

const shipmentSlice = createSlice({
  name: 'shipment',
  initialState: {
    list: [],
    selected: null,
    loading: false,
    error: null,
    filters: { status: '', freight_type: '' },
  },
  reducers: {
    setShipments: (state, action) => {
      state.list = action.payload;
    },
    setSelectedShipment: (state, action) => {
      state.selected = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearSelected: (state) => {
      state.selected = null;
    },
  },
});

export const {
  setShipments, setSelectedShipment, setLoading,
  setError, setFilters, clearSelected
} = shipmentSlice.actions;
export default shipmentSlice.reducer;