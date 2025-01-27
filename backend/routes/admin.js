const express = require("express");
const router = express.Router();
const db = require("../db");
const utils = require("../utils");
const crypto = require("crypto-js");
const jwt = require("jsonwebtoken");
const config = require("../config");
const authorizeRole = require("../middlewares/AuthorizeRole");

const STAFF_TABLE = config.STAFF_TABLE_NAME;
const COURSE_TABLE = config.COURSE_TABLE_NAME;
const SUBJECT_TABLE = config.SUBJECT_TABLE_NAME;
const SCHEMA_TABLE = config.SCHEME_TABLE_NAME;
const GROUP_TABLE = config.GROUP_TABLE_NAME;
const STUDENT_TABLE = config.STUDENT_TABLE_NAME;
const MARKS_ENTRY_TABLE = config.MARK_ENTER_TABLE_NAME;

// ADMIN REGISTER 

router.post("/register", (request, response) =>{
  const {email, password, employee_number, staff_name, role} = request.body;

  const statement = `INSERT INTO ${STAFF_TABLE} (email, password,employee_number, staff_name, role)
  VALUES (?, ?, ?, ?, ?)`;

  const encryptedPassword = String(crypto.SHA256(password));

  db.execute(
    statement, [email, encryptedPassword, employee_number, staff_name, role],
    (error, result) => {
      if(error){
        console.log("error", error)
      }
      response.send(utils.createResponse(error, result));
    }
  );
});

// Admin Login API
router.post("/login", (request, response) => {
  // Destructuring email and password from the request body
  const { email, password } = request.body;

  const statement = `SELECT staff_name, email, role 
      FROM ${STAFF_TABLE} 
      WHERE email = ? AND password = ?`;

  // Encrypting the provided
  const encryptedPassword = String(crypto.SHA256(password));

  // Executing the SQL query with user-provided email and encrypted password
  db.execute(statement, [email, encryptedPassword], (error, users) => {
    if (error) {
      response.send(utils.createErrorResponse(error));
    } else {
      if (users.length == 0) {
        response.send(utils.createErrorResponse("user not found!"));
      } else {
        const staff = users[0];
        console.log("admin staff", staff);

        // Creating a payload with user information for JWT token
        const payload = {
          email: staff["email"],
          staff_name: staff["staff_name"],
          role: staff["role"],
        };

        console.log("admin payload ", payload);

        // Generating a JWT token with the payload and a secret key
        const token = jwt.sign(payload, config.SECRET_KEY);

        response.send(
          utils.createSuccessResponse({
            token,
            // username: user["username"], or
            staff_name: staff.staff_name,
          })
        );
      }
    }
  });
});

// GET ALL STAFF MEMBERS
router.get("/all-staff", authorizeRole(["admin"]), (request, response) => {
  const statement = `SELECT * FROM ${STAFF_TABLE}`;

  db.execute(statement, (error, result) => {
    response.send(utils.createResponse(error, result));
  });
});

// UPDATE STAFF ROLE

router.put("/update-staff-details", authorizeRole(["admin"]), (request, response) => {
  const {course_name, role, email} = request.body;

  const updateQuery = `UPDATE STAFF SET course_name = ?, role = ? WHERE email = ?`;
  
  db.execute(updateQuery, [course_name, role, email], (error, result) =>{
    if(error) {
      response.status(500).json(utils.createErrorResponse(error.message));
    }
    else {
      response.json(utils.createSuccessResponse("Staff details successfully")
    );
    };
  });
});

//! COURSE RELATED APIs
// ADDING COURSES
router.post("/add-course", authorizeRole(["admin"]), (request, response) => {
  const { course_name } = request.body;
  console.log("adding course: ", course_name);

  const statement = `INSERT INTO ${COURSE_TABLE} 
    (course_name)
    VALUES  (?)`;

  db.execute(statement, [course_name], (error, result) => {
    response.send(utils.createResponse(error, result));
  });
});

  module.exports = router;