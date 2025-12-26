import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Button,
  TextField,
  CircularProgress,
  Container,
  Typography,
  Box,
} from "@mui/material";

const Home = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [texts, setTexts] = useState([]);
  const [totalTexts, setTotalTexts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `/api/v1/users/test/users?&search=${search}&page=${page}&limit=${limit}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        setTexts(response.data.users);
        setTotalTexts(response.data.totalTexts);
        setTotalPages(response.data.totalPages);
        setHasNextPage(response.data.hasNextPage);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, limit, search]);

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          marginBottom: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography variant="h4" gutterBottom>
          Texts
        </Typography>
        <TextField
          variant="outlined"
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          sx={{ marginBottom: 3 }}
        />
        <Box
          sx={{ display: "flex", justifyContent: "center", marginBottom: 2 }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            sx={{ marginRight: 2 }}
          >
            Previous
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setPage(page + 1)}
            disabled={!hasNextPage}
          >
            Next
          </Button>
        </Box>

        {loading ? (
          <CircularProgress />
        ) : (
          <Box sx={{ marginBottom: 3 }}>
            <ul>
              {texts.map((text) => (
                <li key={text._id}>{text.name}</li>
              ))}
            </ul>
          </Box>
        )}

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            marginBottom: 3,
          }}
        >
          <Typography variant="body1">Page: {page}</Typography>
          <Typography variant="body1">Limit: {limit}</Typography>
        </Box>

        <Box
          sx={{ display: "flex", justifyContent: "center", marginBottom: 3 }}
        >
          <Button
            variant="outlined"
            onClick={() => setLimit(limit + 10)}
            sx={{ marginRight: 2 }}
          >
            Load More
          </Button>
          <Button
            variant="outlined"
            onClick={() => setLimit(limit - 10)}
            disabled={limit === 10}
          >
            Load Less
          </Button>
        </Box>

        <Button
          variant="text"
          onClick={() => setPage(1)}
          sx={{ display: "block", marginTop: 2 }}
        >
          Reset
        </Button>

        <Box sx={{ marginTop: 3 }}>
          <Typography variant="body2" color="textSecondary">
            Total Texts: {totalTexts}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Total Pages: {totalPages}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Has Next Page: {hasNextPage ? "Yes" : "No"}
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default Home;
