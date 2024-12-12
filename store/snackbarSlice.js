import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  openSnackbar: false,
};

const snackbarSlice = createSlice({
  name: "snackbar",
  initialState,
  reducers: {
    setOpenSnackbar: (state, action) => {
      state.openSnackbar = action.payload;
    },
  },
});

export const { setOpenSnackbar } = snackbarSlice.actions;

export default snackbarSlice.reducer;
