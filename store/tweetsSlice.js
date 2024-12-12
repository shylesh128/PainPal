import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import Cookies from "js-cookie";

export const fetchTweets = createAsyncThunk(
  "tweets/fetchTweets",
  async (page) => {
    const token = Cookies.get("pain");
    try {
      const response = await axios.get(`/api/v2/tweets?page=${page}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.data.tweets;
    } catch (error) {
      console.error("Error fetching tweets:", error);
    }
  }
);

export const addPost = createAsyncThunk("tweets/addPost", async (formData) => {
  const token = Cookies.get("pain");
  try {
    const response = await axios.post(`/api/v2/tweets`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.data.tweet;
  } catch (error) {
    console.error("Error creating tweet:", error);
  }
});

const initialState = {
  tweets: [],
  loading: false,
  error: null,
};

const tweetsSlice = createSlice({
  name: "tweets",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTweets.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTweets.fulfilled, (state, action) => {
        state.loading = false;
        const newTweets = action.payload.filter(
          (tweet) =>
            !state.tweets.some(
              (existingTweet) => existingTweet._id === tweet._id
            )
        );
        state.tweets = [...state.tweets, ...newTweets];
      })
      .addCase(fetchTweets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(addPost.fulfilled, (state, action) => {
        if (!state.tweets.some((tweet) => tweet._id === action.payload._id)) {
          state.tweets = [action.payload, ...state.tweets];
        }
      });
  },
});

export default tweetsSlice.reducer;
