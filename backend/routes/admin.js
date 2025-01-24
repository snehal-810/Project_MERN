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


  module.exports = router;