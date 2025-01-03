import { useContext, useEffect, useState, useCallback } from "react";
import { UserContext } from "../../services/userContext";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  IconButton,
} from "@mui/material";
import { getColorForUsername } from "../../utils/alphaToColors";
import { MdClose } from "react-icons/md";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { LoadingButton } from "@mui/lab";
import { useRouter } from "next/router";

const SuggestionSection = () => {
  const router = useRouter();
  const { getSuggestions, addFriend } = useContext(UserContext);

  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [addFriendLoading, setAddFriendLoading] = useState(null);

  const fetchFriends = useCallback(
    async (page, limit = 3) => {
      setLoading(true);
      try {
        const response = await getSuggestions(page, limit);

        if (response?.data?.friends?.length > 0) {
          setFriends((prevFriends) => {
            const updatedFriends = [...prevFriends, ...response.data.friends];
            setHasMore(updatedFriends.length < response.total);
            return updatedFriends;
          });
        }
      } catch (error) {
        console.error("Error fetching friends:", error);
      } finally {
        setLoading(false);
      }
    },
    [getSuggestions]
  );

  const handleAddFriend = async (friend) => {
    try {
      setAddFriendLoading(friend._id);
      const response = await addFriend(friend._id);

      console.log("Add friend response:", response);
      if (response.status === "success") {
        console.log(`Friend ${friend.name} added successfully`);
        // Remove friend from local state
        setFriends((prevFriends) =>
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
    setFriends((prevFriends) =>
      prevFriends.filter((friend) => friend._id !== friendId)
    );
  };

  const handleViewProfile = (friend) => {
    console.log("View profile:", friend);
    router.push(`/friends/${friend._id}`);
  };

  useEffect(() => {
    fetchFriends(page);
  }, [page, fetchFriends]);

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
        {friends.map((friend) => (
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
              <Avatar
                src={friend.photo || "/default-avatar.png"}
                sx={{ width: 60, height: 60, marginBottom: "10px" }}
              />
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
