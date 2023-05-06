const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const path = require("path");

app.use(express.json());

let db = null;

const dbPath = path.join(__dirname, "userData.db");
const initializeDBAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB error:${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//selectUserQuery API 1
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  //selectUserQuery

  const selectQuery = `
  SELECT * 
  FROM user 
  WHERE username = '${username}';`;

  const dbUser = await db.get(selectQuery);

  if (password.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    if (dbUser === undefined) {
      //create user in user table

      let createUserQuery = `
    INSERT INTO
        user (username, name, password, gender, location)
    VALUES
        (
        '${username}',
        '${name}',
        '${hashedPassword}',
        '${gender}',
        '${location}'
        );`;
      await db.run(createUserQuery);
      response.send("User created successfully");
    } else {
      //send invalid username as response
      response.status(400);
      response.send("User already exists");
    }
  }
});

//logins API 2

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;

  const selectQuery = `
    SELECT
        *
    FROM
        user
    WHERE
        username = "${username}";`;

  const dbUser = await db.get(selectQuery); // await is not present error arrises :- Error: data and hash arguments required

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// //Login User API
// app.post("/login/", async (request, response) => {
//   const { username, password } = request.body;

//   // SelectUserQuery

//   const selectUserQuery = `
//     SELECT
//         *
//     FROM
//         user
//     WHERE
//         username = '${username}';`;
//   const dbUser = await db.get(selectUserQuery);

//   if (dbUser === undefined) {
//     //user doesn't exist
//     response.status(400);
//     response.send("Invalid User");
//   } else {
//     //compare password, hashed password
//     const isPasswordMatched = await bcrypt.compare(password, dbUser.password);

//     if (isPasswordMatched === true) {
//       response.send("Login success!");
//     } else {
//       response.status(400);
//       response.send("Invalid Password");
//     }
//   }
// });

//API 3

app.put("/change-password", async (request, response) => {
  let { username, oldPassword, newPassword } = request.body;

  const selectQuery = `
    SELECT * 
    FROM user 
    WHERE 
        username = '${username}';`;

  const dbUser = await db.get(selectQuery);

  const passWord = await bcrypt.compare(oldPassword, dbUser.password);
  console.log(passWord);
  console.log(oldPassword.length < 5);

  if (newPassword.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    if (passWord === true) {
      const newPass = await bcrypt.hash(newPassword, 10);
      const updateQuery = `
          UPDATE user
          SET 
            username = '${username}',
            

            password = '${newPass}' 
        WHERE 
            username = '${username}'; `;
      const updatePassword = await db.run(updateQuery);
      response.send("Password updated");
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
