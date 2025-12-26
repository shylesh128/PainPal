import { useEffect, useState } from "react";
import { useSuggestions, useAddFriend } from "../../services/hooks/useUser";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
} from "@mui/material";
import { getColorForUsername } from "../../utils/alphaToColors";
import { MdClose } from "react-icons/md";
import { Swiper, SwiperSlide } from "swiper/react";
import { UserAvatar } from "../common/UserAvatar";
import "swiper/css";
import { LoadingButton } from "@mui/lab";
import { useRouter } from "next/router";

const SuggestionSection = () => {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [allSuggestions, setAllSuggestions] = useState([]);
  const [addFriendLoading, setAddFriendLoading] = useState(null);
  
  const { data: suggestionsData, isLoading: loading } = useSuggestions(page, 3);
  const addFriendMutation = useAddFriend();

  useEffect(() => {
    if (suggestionsData?.data?.suggestions) {
      if (page === 1) {
        setAllSuggestions(suggestionsData.data.suggestions);
      } else {
        setAllSuggestions((prev) => [...prev, ...suggestionsData.data.suggestions]);
      }
    } else if (suggestionsData?.data?.friends) {
      // Handle case where API returns 'friends' instead of 'suggestions'
      if (page === 1) {
        setAllSuggestions(suggestionsData.data.friends);
      } else {
        setAllSuggestions((prev) => [...prev, ...suggestionsData.data.friends]);
      }
    }
  }, [suggestionsData, page]);

  const hasMore = allSuggestions.length < (suggestionsData?.total || 0);

  const handleAddFriend = async (friend) => {
    try {
      setAddFriendLoading(friend._id);
      const response = await addFriendMutation.mutateAsync(friend._id);

      console.log("Add friend response:", response);
      if (response?.status === "success") {
        console.log(`Friend ${friend.name} added successfully`);
        // Remove friend from local state
        setAllSuggestions((prevFriends) =>
          prevFriends.filter((f) => f._id !== friend._id)
        );
      } else {
        console.error(`Failed to add friend ${friend.name}`);
      }
    } catch (error) {
      console.error("Error adding friend:", error);
    } finally {
      setAddFriendLoading(null);
    }
  };

  const handleCancelSuggestion = (friendId) => {
    setAllSuggestions((prevFriends) =>
      prevFriends.filter((friend) => friend._id !== friendId)
    );
  };

  const handleViewProfile = (friend) => {
    console.log("View profile:", friend);
    router.push(`/friends/${friend._id}`);
  };

  return (
    <Box sx={{ width: "100%", marginTop: "30px" }}>
      <Typography
        variant="h6"
        sx={{ marginBottom: "20px", fontWeight: "bold", color: "text.primary" }}
      >
        Suggestions
      </Typography>
      <Swiper
        slidesPerView={1}
        spaceBetween={20}
        onReachEnd={() => {
          if (hasMore && !loading) {
            setPage((prevPage) => prevPage + 1);
          }
        }}
        breakpoints={{
          768: {
            slidesPerView: 3,
          },
        }}
      >
        {allSuggestions.map((friend) => (
          <SwiperSlide key={friend._id}>
            <Card
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "20px",
                borderRadius: "8px",
                boxShadow: 2,
              }}
            >
              <Box sx={{ position: "absolute", top: 10, right: 10 }}>
                <IconButton onClick={() => handleCancelSuggestion(friend._id)}>
                  <MdClose />
                </IconButton>
              </Box>
              <Box sx={{ mb: "10px" }}>
                <UserAvatar
                  user={friend}
                  size={60}
                  showActions={true}
                />
              </Box>
              <CardContent sx={{ padding: 0, textAlign: "center" }}>
                <Typography
                  variant="body1"
                  fontWeight="bold"
                  color={getColorForUsername(friend.name)}
                  sx={{ cursor: "pointer" }}
                  onClick={() => handleViewProfile(friend)}
                >
                  @{friend.name}
                </Typography>
                <Typography variant="body2" color="#d0d0d0">
                  {friend.email}
                </Typography>
              </CardContent>
              <LoadingButton
                variant="contained"
                sx={{ marginTop: "10px" }}
                onClick={() => handleAddFriend(friend)}
                loading={addFriendLoading === friend._id}
              >
                Add Friend
              </LoadingButton>
            </Card>
          </SwiperSlide>
        ))}
      </Swiper>
    </Box>
  );
};

export default SuggestionSection;
