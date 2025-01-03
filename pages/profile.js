import { useState, useContext, useEffect } from "react";
import { Box } from "@mui/material";
import { useRouter } from "next/router";
import { UserContext } from "../services/userContext";
import AnalyticsSection from "../components/profile/AnalyticsSection";
import ProfileHeader from "../components/profile/ProfileHeader";
import SliderCards from "../components/friends/FriendsSlider";
import SuggestionSection from "../components/friends/SuggestionSection";

const Profile = () => {
  const [user, setUser] = useState(null);
  const router = useRouter();
  const { fetchUserDetails, getSuggestions, getFriends } =
    useContext(UserContext);
  const [profilePic, setProfilePic] = useState("");
  const [likes, setLikes] = useState([]);
  const [tweets, setTweets] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUser = async () => {
    setLoading(true);
    const data = await fetchUserDetails();

    setUser(data.userDetails);
    setTweets(data.tweets);
    setLikes(data.likedTweets);
    setComments(data.userComments);
    setLoading(false);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = () => {
    console.log("Updated Profile:", { name, email, profilePic });
    router.push("/profile-updated");
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px",
        maxWidth: "800px",
        margin: "auto",
      }}
    >
      <ProfileHeader
        user={user}
        profilePic={user?.photo}
        handleProfilePicChange={handleProfilePicChange}
        handleUpdateProfile={handleUpdateProfile}
        loading={loading}
      ></ProfileHeader>

      {/* Stats Section */}
      <AnalyticsSection
        tweets={tweets}
        likes={likes}
        comments={comments}
        loading={loading}
      />

      {/* Friends Section */}
      <SliderCards />

      {/* Suggestions */}
      <SuggestionSection />
    </Box>
  );
};

export default Profile;
