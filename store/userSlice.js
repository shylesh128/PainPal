import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import Cookies from "js-cookie";

// Define the API version
const version = "v1";

// Thunk for user login
export const loginUser = createAsyncThunk(
  "user/loginUser",
  async ({ email }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/api/${version}/auth/login`, {
        email,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Thunk for checking if the user is logged in
export const checkIsLoggedIn = createAsyncThunk(
  "user/checkIsLoggedIn",
  async (token, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `/api/v1/auth/isLoggedIn`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState: {
    user: null,
    token: null,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.error = null;
      Cookies.remove("pain");
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Handle isLoggedIn check
      .addCase(checkIsLoggedIn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkIsLoggedIn.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(checkIsLoggedIn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout } = userSlice.actions;
export default userSlice.reducer;
