import { useCallback, useContext, useEffect, useState } from "react";
import {
  List as MUIList,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  CircularProgress,
} from "@mui/material";
import { UserContext } from "../services/userContext";
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
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <h1>Friends</h1>
      <MUIList>
        {friends.map((friend) => (
          <ListItem
            key={friend._id}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px",
              borderBottom: "1px solid #ddd",
            }}
            onClick={() => router.push(`/chats/${friend._id}`)}
          >
            <ListItemAvatar>
              <Avatar
                alt={friend.name}
                src={friend.avatarUrl || "/default-avatar.png"}
              />
            </ListItemAvatar>
            <ListItemText primary={friend.name} />
          </ListItem>
        ))}
      </MUIList>
      {loading && (
        <div style={{ textAlign: "center" }}>
          <CircularProgress />
        </div>
      )}
      {!hasMore && (
        <p style={{ textAlign: "center", color: "gray" }}>
          No more friends to load
        </p>
      )}
    </div>
  );
}
