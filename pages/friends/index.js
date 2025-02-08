import { useCallback, useContext, useEffect, useState } from "react";
import {
  List as MUIList,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  CircularProgress,
  Typography,
  Divider,
} from "@mui/material";
import { UserContext } from "../../services/userContext";
import { useRouter } from "next/router";

export default function List() {
  const router = useRouter();
  const { user, getFriends } = useContext(UserContext);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalFriends, setTotalFriends] = useState(0);

  const fetchFriends = useCallback(
    async (page, limit = 10) => {
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

  useEffect(() => {
    fetchFriends(page);
  }, [page, fetchFriends]);

  const loadMoreFriends = () => {
    if (hasMore && !loading) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop ===
        document.documentElement.offsetHeight
      ) {
        loadMoreFriends();
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadMoreFriends, hasMore, loading]);

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "16px" }}>
      <Typography
        variant="h6"
        style={{ fontWeight: "bold", marginBottom: "16px" }}
      >
        Friends
      </Typography>
      <MUIList style={{ padding: 0 }}>
        {friends.map((friend) => (
          <div key={friend._id}>
            <ListItem
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 16px",
                cursor: "pointer",
              }}
              onClick={() => router.push(`/chats/${friend._id}`)}
            >
              <ListItemAvatar>
                <Avatar
                  alt={friend.name}
                  src={friend.avatarUrl || "/default-avatar.png"}
                  style={{ width: "48px", height: "48px" }}
                />
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography style={{ fontWeight: "500", fontSize: "16px" }}>
                    {friend.name}
                  </Typography>
                }
              />
            </ListItem>
            <Divider style={{ marginLeft: "72px" }} />
          </div>
        ))}
      </MUIList>
      {loading && (
        <div style={{ textAlign: "center", padding: "16px" }}>
          <CircularProgress size={24} />
        </div>
      )}
      {!hasMore && (
        <Typography
          variant="body2"
          style={{ textAlign: "center", color: "gray", padding: "16px" }}
        >
          No more friends to load
        </Typography>
      )}
    </div>
  );
}
