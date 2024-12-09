const getClientIp = (req) => {
  return req.headers["x-forwarded-for"]
    ? req.headers["x-forwarded-for"].split(",")[0]
    : req.ip;
};

module.exports = {
  getClientIp,
};
