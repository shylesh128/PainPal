import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  page: 1,
  tweets: [],
  newPost: "",
  loading: false,
};

const tweetSlice = createSlice({
  name: "tweets",
  initialState,
  reducers: {
    setPage: (state, action) => {
      state.page = action.payload;
    },
    setTweets: (state, action) => {
      state.tweets = action.payload;
    },
    addTweet: (state, action) => {
      state.tweets = [action.payload, ...state.tweets];
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setNewPost: (state, action) => {
      state.newPost = action.payload;
    },
  },
});

export const { setPage, setTweets, addTweet, setLoading, setNewPost } =
  tweetSlice.actions;

export default tweetSlice.reducer;
