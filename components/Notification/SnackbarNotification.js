import React from "react";
import { Snackbar, Alert } from "@mui/material";

export const SnackbarNotification = ({ open, handleClose }) => (
  <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
    <Alert onClose={handleClose} severity="warning" sx={{ width: "100%" }}>
      Please enter at least 10 characters for your tweet.
    </Alert>
  </Snackbar>
);
