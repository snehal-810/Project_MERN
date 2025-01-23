const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const utils = require("./utils");
const config = require("./config");
const jwt = require("jsonwebtoken");

const port = config.PORT_NO;

console.log(port);

// create a new express application
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("combined"));

// return version
app.get("/version", (req, res) => res.send(utils.createSuccessResponse("1.0")));

// configure protected routes
app.use((request, response, next) => {
  const skipUrls = [
    "/student/login",
    "/student/register",
    "/staff/login",
    "/staff/register",
    "/admin/login",
    "/admin/register",
  ];

  if (skipUrls.includes(request.url)) {
    // If the request URL is in skipUrls, skip token verification
    next();
  } else {
    // Check if Authorization header exists
    if (!request.headers.authorization) {
      response
        .status(401)
        .send(utils.createErrorResponse("missing authorization header"));
      return;
    }

    // Extract the token from the Authorization header
    const token = request.headers.authorization.split(" ")[1];

    console.log("backend token", token);

    if (!token) {
      response.status(401).send(utils.createErrorResponse("missing token"));
      return;
    } else {
      try {
        // Verify the token
        const payload = jwt.verify(token, config.SECRET_KEY);

        request.data = payload;
        next();
      } catch (ex) {
        // Handle invalid token
        console.log("ex", ex);

        response.status(401).send(utils.createErrorResponse("invalid token"));
        return;
      }
    }
  }
});

// add Routes
const staffRoutes = require("./routes/staff");
// const coordinatorRoutes = require("./routes/coordinator");
// const studentRoutes = require("./routes/student");
const adminRoutes = require("./routes/admin");

app.use("/staff", staffRoutes);
// app.use("/coordinator", coordinatorRoutes);
// app.use("/student", studentRoutes);
app.use("/admin", adminRoutes);

app.listen(port, () => console.log(`App listening on port ${port}!`));
