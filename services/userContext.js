import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import Cookies from "js-cookie";
import { useSelector } from "react-redux";
import { checkIsLoggedIn, logout } from "../store/userSlice";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const router = useRouter();
  const { user, loading, error } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const version = "v1";

  useEffect(() => {
    const token = Cookies.get("pain");

    if (token && !user) {
      dispatch(checkIsLoggedIn(token))
        .unwrap()
        .catch(() => {
          dispatch(logout());
          router.replace("/login");
        });
    } else if (!token) {
      router.replace("/login");
    }
  }, [dispatch, user]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`/api/${version}/users`);
      return response.data.data.users;
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchTweets = async (page) => {
    const token = Cookies.get("pain");
    try {
      const response = await axios.get(`/api/${version}/tweets?page=${page}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;
      return [...data.data.tweets];
    } catch (error) {
      console.error("Error fetching tweets:", error);
    }
  };

  const addPost = async (formData) => {
    const token = Cookies.get("pain");
    try {
      const response = await axios.post(`/api/v2/tweets`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;
      return data.data.tweet;
    } catch (error) {
      console.error("Error creating tweet:", error);
    }
  };

  const handleGoogleLogin = async () => {
    router.push("/api/v1/auth/google");
  };

  const contextValue = {
    user,
    loading,
    fetchUsers,
    fetchTweets,
    addPost,
    handleGoogleLogin,
  };

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};
