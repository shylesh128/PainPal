// index.js
const express = require("express");
const next = require("next");
const http = require("http");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");

require("dotenv").config();

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");

const socketModule = require("./socket");
const { mongoConnect } = require("./utils/service");
const path = require("path");
const PORT = process.env.PORT;
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

mongoConnect();

app
  .prepare()
  .then(() => {
    const server = express();
    const httpServer = http.createServer(server);

    server.use(cors());
    server.use(bodyParser.json());
    server.use(cookieParser());
    server.use(express.text());

    const io = socketModule(httpServer);

    const version = "/api/v1";

    server.use(`${version}/`, require("./routes/statusRoutes"));
    server.use(`${version}/auth`, require("./routes/authRoutes"));
    server.use(`${version}/tweets`, require("./routes/tweetRoutes"));
    server.use(`${version}/users`, require("./routes/userRoutes"));
    server.use(`${version}/other`, require("./routes/otherRoutes"));
    server.use(`${version}/music`, require("./routes/musicRoutes"));

    server.get("*", (req, res) => {
      return handle(req, res);
    });

    server.all("*", (req, res, next) => {
      next(new AppError(`Can't find ${req.originalUrl} on the server`, 404));
    });

    server.use(globalErrorHandler);

    httpServer.listen(PORT, (err) => {
      if (err) throw err;
      console.log(`Running on port ${PORT}`);
    });
  })
  .catch((ex) => {
    console.error(ex.stack);
    process.exit(1);
  });
