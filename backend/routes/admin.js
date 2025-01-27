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
// 1. ADDING COURSES
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

// 2. SHOW ALL COURSES 

router.get("/show-courses", authorizeRole(["admin"]), (request, response) => {
  const statement = `SELECT course_id, course_name FROM ${COURSE_TABLE}`;

  console.log("statement", statement);

  db.execute(statement, (error, results) => {
    if(error) {
      const errorMessage = "Failed to fetch courses";
      response.send(utils.createErrorResponse(errorMessage));
      return;
    }
    if (results.length === 0) {
      const errorMessage = "No courses found ";
      response.send(utils.createErrorResponse(errorMessage));
      return;
    }
    console.log("admin res ", results);

    response.send(utils.createSuccessResponse(results));
  });
});

// 3. ADDING SUBJECT TO A COURSE
router.post("/add-subject", authorizeRole(["admin"]), (request, response) => {
  const { subject_name, course_name } = request.body;

  // Query to find the course_id based on course_name
  const findCourseStatement = `SELECT course_id FROM ${COURSE_TABLE} WHERE course_name = ?`;

  db.execute(findCourseStatement, [course_name], (error, courseResults) => {
    if (error) {
      console.error("Error finding course:", error);
      response.status(500).send(utils.createErrorResponse(error.message));
      return;
    }

    if (courseResults.length === 0) {
      // If course not found, send an appropriate response
      response.status(404).send(utils.createErrorResponse("Course not found"));
      return;
    }

    const course_id = courseResults[0].course_id;

    // Query to insert the subject with the retrieved course_id
    const insertStatement = `INSERT INTO ${SUBJECT_TABLE} 
        (subject_name, course_id)
        VALUES  (?, ?)`;

    db.execute(insertStatement, [subject_name, course_id], (error, result) => {
      if (error) {
        console.error("Error adding subject:", error);
        response.status(500).send(utils.createErrorResponse(error.message));
      } else {
        response.send(
          utils.createSuccessResponse("Subject added successfully")
        );
      }
    });
  });
});

// 4. SHOW ALL SUBJECTS OF A COURSE

router.get("/show-subjects/:course_name", authorizeRole(["admin"]),(request, response) => {
  const course_name = request.params.course_name;

  const findCourseStatement = `SELECt course_id FROM ${COURSE_TABLE} WHERE course_name = ?`;

  db.execute(findCourseStatement, [course_name], (error, courseResults) => {
    if(error) {
      console.error("Error finding course :", error)
      response.status(500).send(utils.createErrorResponse(error.message))
      return;
    }

    if(courseResults.length === 0) {
      response
        .status(404)
        .send(utils.createErrorResponse("Course not found"));
        return;
    }

    const course_id = courseResults[0].course_id;

    const statement = `SELECT subject_id, subject_name FROM ${SUBJECT_TABLE} WHERE course_id = ?`;

    db.execute(statement, [course_id], (error, subjectResults) => {
      if(error) {
        console.error("Error fetching subjects: ", error);
        response.status(500).send(utils.createErrorResponse(error.message));
      }
      else {
        response.send(utils.createSuccessResponse(subjectResults));
      }
    });
  });
});

// 4. Add Group
router.post(
  "/add-group",
  authorizeRole(["admin"]),
  async (request, response) => {
    const { course_name, group_name } = request.body;

    // Find course_id corresponding to the given course_name
    const findCourseIdStatement = `SELECT course_id FROM ${COURSE_TABLE} WHERE course_name = ?`;
    db.execute(findCourseIdStatement, [course_name], async (error, results) => {
      if (error) {
        response.send(utils.createErrorResponse(error));
        return;
      }

      if (results.length === 0) {
        response.send(utils.createErrorResponse("Course not found"));
        return;
      }

      const course_id = results[0].course_id;

      // Insert the group into the group_table
      const insertGroupStatement = `INSERT INTO ${GROUP_TABLE} (course_id, group_name) VALUES (?, ?)`;
      db.execute(
        insertGroupStatement,
        [course_id, group_name],
        (error, result) => {
          if (error) {
            response.send(utils.createErrorResponse(error));
          } else {
            response.send(
              utils.createSuccessResponse("Group added successfully!")
            );
          }
        }
      );
    });
  }
);

// 5. SHOW ALL GROUPS OF THE COURSES

router.get("/show-groups", authorizeRole(["admin"]), (request, response) =>{
  
  const { course_name} = request.query;

  let query;
  let params;

  if(course_name) {
    query =
     `SELECT ${COURSE_TABLE}.
     couser_name, ${GROUP_TABLE}. group_name
     FROM ${COURSE_TABLE}
     JOIN ${GROUP_TABLE}
     ON ${COURSE_TABLE}.course_id = ${GROUP_TABLE}.course_id WHERE ${COURSE_TABLE}. course_name = ?;
    `;
    params = [course_name];
  }
  else {
    query = `
      SELECT ${COURSE_TABLE}.
      course_name, ${GROUP_TABLE}.group_name 
      FROM ${COURSE_TABLE}
      JOIN ${GROUP_TABLE}
      ON ${COURSE_TABLE}.course_id = ${GROUP_TABLE}.course_id;
    `;
    params = [];
  }

  db.execute(query, params, (error, results) => {
    if(error) {
      response.send(utils.createErrorResponse(error));
    }
    else {
      response.send(utils.createSuccessResponse(results));
    }
  });
});

//! STUDENT RELATED APIs
// SHOW ALL STUDENTS (WHICH ARE NOT PRESENT IN ANY COURSE AND ANY GROUP)
router.get(
  "/show-all-students",
  authorizeRole(["admin"]),
  (request, response) => {
    const statement = `
  SELECT student_id, roll_number, student_name, email 
  FROM ${STUDENT_TABLE} 
  WHERE course_id IS NULL AND group_id IS NULL
`;

    db.execute(statement, (error, result) => {
      if (error) {
        response.status(500).send(utils.createErrorResponse(error.message));
      } else {
        response.send(utils.createSuccessResponse(result));
      }
    });
  }
);

  module.exports = router;