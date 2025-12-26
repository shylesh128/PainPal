import { useEffect, useState, useCallback } from "react";
import { useFriends, useAddFriend } from "../../services/hooks/useUser";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
} from "@mui/material";
import { getColorForUsername } from "../../utils/alphaToColors";
import { MdClose } from "react-icons/md";
import { Swiper, SwiperSlide } from "swiper/react";
import { UserAvatar } from "../common/UserAvatar";
import "swiper/css";

const FriendsSlider = () => {
  const [page, setPage] = useState(1);
  const [allFriends, setAllFriends] = useState([]);
  const { data: friendsData, isLoading: loading } = useFriends(page, 3);
  const addFriendMutation = useAddFriend();

  useEffect(() => {
    if (friendsData?.data?.friends) {
      if (page === 1) {
        setAllFriends(friendsData.data.friends);
      } else {
        setAllFriends((prev) => [...prev, ...friendsData.data.friends]);
      }
    }
  }, [friendsData, page]);

  const hasMore = allFriends.length < (friendsData?.total || 0);

  const handleCancelSuggestion = (friendId) => {
    setAllFriends(allFriends.filter((friend) => friend._id !== friendId));
  };

  const handleAddFriend = async (friend) => {
    console.log(`Add friend with ID: `, friend);
    await addFriendMutation.mutateAsync(friend._id);
  };

  const handleSlideChange = (swiper) => {
    const isEnd = swiper.isEnd;
    console.log("isEnd", isEnd);
  };

  return (
    <>
      {allFriends.length > 0 && (
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
            {allFriends.map((friend) => (
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
                    <IconButton onClick={() => handleCancelSuggestion(friend._id)}>
                      <MdClose color="#f3f3f3" />
                    </IconButton>
                  </Box>
                  <UserAvatar
                    user={friend}
                    size={60}
                    showActions={true}
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
                    disabled={addFriendMutation.isPending}
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
