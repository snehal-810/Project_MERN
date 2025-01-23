const express = require("express");
const router = express.Router();
const db = require("../db");
const utils = require("../utils");
const crypto = require("crypto-js");
const jwt = require("jsonwebtoken");
const config = require("../config");
const authorizeRole = require("../middlewares/AuthorizeRole");

const TABLE_NAME = config.STAFF_TABLE_NAME;

// REGISTER API
router.post("/register", (request, response) => {
    const { email, password, employee_number, staff_name } = request.body;
  
    // create a sql statement
    const statement = `INSERT INTO ${TABLE_NAME} 
      (email, password, employee_number, staff_name)
      VALUES (?, ?, ?, ?)`;
  
    // encrypt the password
    const encryptedPassword = String(crypto.SHA256(password));
  
    db.execute(
      statement,
      [email, encryptedPassword, employee_number, staff_name],
      (error, result) => {
        response.send(utils.createResponse(error, result));
      }
    );
  });

  module.exports = router;