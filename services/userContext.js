import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { useRouter } from "next/router";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [cookies, setCookie, removeCookie] = useCookies(["user"]);
  const [token, setToken] = useState(cookies.pain);
  const router = useRouter();

  const version = "v1";

  const isLoggedIn = async () => {
    console.log(token);

    if (!token) {
      console.log("Token not found", token);
      router.push("/login");
      return;
    }
    try {
      const response = await axios.post(
        `/api/${version}/auth/isLoggedIn`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 200) {
        setUser(response.data.user);
      }
    } catch (error) {
      router.push("/login");
      setLoading(false);
    }
  };

  const login = async (email) => {
    if (email) {
      try {
        const response = await axios.post(`/api/${version}/auth/login`, {
          email: email,
        });
        if (response.status === 200) {
          setUser(response.data.user);
          setCookie("pain", response.data.token);
          setToken(response.data.token);
          router.push("/");
        }
      } catch (error) {
        console.error("Login failed:", error);
      }
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`/api/${version}/users`);
      return response.data.data.users;
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, [token]);

  const logout = () => {
    setUser(null);
    setToken(null);
    removeCookie("pain");
    router.push("/login");
  };

  const fetchTweets = async (page) => {
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
    try {
      const response = await axios.post(`/api/${version}/tweets`, formData, {
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

  const sendLike = async (tweetId) => {
    try {
      const response = await axios.post(
        `/api/${version}/tweets/${tweetId}/like`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = response.data;
      return data.data.tweet;
    } catch (error) {
      console.error("Error creating tweet:", error);
    }
  };

  const handleGoogleLogin = async () => {
    // try {
    //   const response = await axios.get("/api/v1/auth/google");
    //   console.log(response.data);
    // } catch (error) {
    //   // Handle error
    //   console.error("An error occurred", error);
    // }

    router.push("/api/v1/auth/google");
  };

  const contextValue = {
    user,
    login,
    logout,
    loading,
    fetchUsers,
    fetchTweets,
    addPost,
    sendLike,
    handleGoogleLogin,
  };

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};
