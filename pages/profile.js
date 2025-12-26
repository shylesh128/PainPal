import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { useRouter } from "next/router";
import { useUserDetails } from "../services/hooks/useUser";
import AnalyticsSection from "../components/profile/AnalyticsSection";
import ProfileHeader from "../components/profile/ProfileHeader";
import SliderCards from "../components/friends/FriendsSlider";
import SuggestionSection from "../components/friends/SuggestionSection";

const Profile = () => {
  const router = useRouter();
  const { data: userDetailsData, isLoading: loading } = useUserDetails();
  
  const [profilePic, setProfilePic] = useState("");

  const user = userDetailsData?.userDetails || null;
  const tweets = userDetailsData?.tweets || [];
  const likes = userDetailsData?.likedTweets || [];
  const comments = userDetailsData?.userComments || [];

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
    console.log("Updated Profile:", { profilePic });
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
