// const { verify } = require("jsonwebtoken");

// const validateToken = (req, res, next) => {
//   const accessToken = req.headers.authorization;
//   console.log("Middleware- ", accessToken);

//   if (!accessToken) return res.json({ error: "User not logged in..." });
//   // verify method takes two args, one is the access token which we get from the header
//   // and the other is the Secret key which we passed while creating the token
//   try {
//     const validToken = verify(accessToken, "SecretKey");
//     if (validToken) {
//       return next();
//     }
//   } catch (err) {
//     return res.json({ error: err.message });
//   }
// };

// module.exports = { validateToken };

const { verify } = require("jsonwebtoken");
const config = require("../config");

const validateToken = (req, res, next) => {
  // Get the Authorization header
  const authHeader = req.headers.authorization;
  console.log("M authHeader ", authHeader);

  // Check if the header is present
  if (!authHeader) {
    return res.status(401).json({ error: "Authorization header missing" });
  }

  // Split the header into parts
  const tokenParts = authHeader.split(" ");
  console.log("M tokenParts ", tokenParts);

  // Check if the header is in the expected format: Bearer <token>
  if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
    return res
      .status(401)
      .json({ error: "Invalid Authorization header format" });
  }

  // Get the actual token from the second part
  const accessToken = tokenParts[1];
  console.log("M accessToken ", accessToken);

  try {
    // Verify and decode the token
    const decodedToken = verify(accessToken, config.SECRET_KEY);
    console.log("M decodedToken ", decodedToken);

    // Attach the decoded user data to the request object
    req.user = decodedToken;
    console.log("AuthM req.user - ", req.user);

    // Continue to the next middleware or route handler
    next();
  } catch (err) {
    // Token verification failed
    return res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = { validateToken };

//! req.user = decodedToken;
// The line req.user = decodedToken; is commonly used to attach the decoded user information from the JWT
// (JSON Web Token) to the req (request) object.
// This allows subsequent middleware functions or route handlers to access information
// about the authenticated user easily.

// When a user logs in and obtains an access token,
// the token typically contains information about the user,
// such as their user ID, username, roles, or any other relevant information.
// This information is embedded in the JWT payload during the token creation process.
