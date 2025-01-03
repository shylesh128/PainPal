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

const FriendsSlider = () => {
  const { getFriends, addFriend } = useContext(UserContext);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalFriends, setTotalFriends] = useState(0);

  const fetchFriends = useCallback(
    async (page, limit = 3) => {
      setLoading(true);
      try {
        const response = await getFriends(page, limit);

        if (response?.data?.friends?.length > 0) {
          setFriends((prevFriends) => {
            const updatedFriends = [...prevFriends, ...response.data.friends];
            const moreFriendsAvailable = updatedFriends.length < response.total;
            setHasMore(moreFriendsAvailable);
            return updatedFriends;
          });
          setTotalFriends(response.total);
        }
      } catch (error) {
        console.error("Error fetching friends:", error);
      } finally {
        setLoading(false);
      }
    },
    [getFriends]
  );

  const handleCancelSuggestion = (friendId) => {
    setFriends(friends.filter((friend) => friend.id !== friendId));
  };

  const handleAddFriend = async (friend) => {
    console.log(`Add friend with ID: `, friend);
    const response = await addFriend(friend._id);
  };

  const handleSlideChange = (swiper) => {
    const isEnd = swiper.isEnd;
    console.log("isEnd", isEnd);
  };

  useEffect(() => {
    fetchFriends(page);
  }, [page, fetchFriends]);

  return (
    <>
      {friends.length > 0 && (
        <Box sx={{ width: "100%", marginTop: "30px" }}>
          <Typography
            variant="h6"
            sx={{
              marginBottom: "20px",
              fontWeight: "bold",
              color: "text.primary",
            }}
          >
            Friends
          </Typography>
          <Swiper
            slidesPerView={1}
            spaceBetween={20}
            onSlideChange={handleSlideChange}
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
                    flexShrink: 0,
                  }}
                >
                  <Box sx={{ position: "absolute", top: 10, right: 10 }}>
                    <IconButton onClick={() => handleCancelSuggestion(friend)}>
                      <MdClose color="#f3f3f3" />
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
                    >
                      @{friend.name}
                    </Typography>
                    <Typography variant="body2" color="#d0d0d0">
                      {friend.email}
                    </Typography>
                  </CardContent>
                  <Button
                    variant="contained"
                    sx={{ marginTop: "10px" }}
                    onClick={() => handleAddFriend(friend)}
                  >
                    Add Friend
                  </Button>
                </Card>
              </SwiperSlide>
            ))}
          </Swiper>
        </Box>
      )}
    </>
  );
};

export default FriendsSlider;
