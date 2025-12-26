import { useEffect, useState } from "react";
import {
  List as MUIList,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  CircularProgress,
} from "@mui/material";
import { useFriends } from "../services/hooks/useUser";
import { useRouter } from "next/router";

export default function List() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [allFriends, setAllFriends] = useState([]);
  
  const { data: friendsData, isLoading: loading } = useFriends(page, 10);

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
  }, [hasMore, loading]);

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <h1>Friends</h1>
      <MUIList>
        {allFriends.map((friend) => (
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
