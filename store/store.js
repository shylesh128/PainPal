import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "./counterSlice";
import userReducer from "./userSlice";
import tweetsReducer from "./tweetsSlice";

export default configureStore({
  reducer: {
    counter: counterReducer,
    user: userReducer,
    tweets: tweetsReducer,
  },
});
