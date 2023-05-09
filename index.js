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

//API register a user

app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const userLogin = `SELECT * FROM user WHERE username = '${username}';`;

  const dbUser = await db.get(userLogin);
  console.log(dbUser);

  //scenario 2

  if (password.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    //scenario 1
    if (dbUser !== undefined) {
      response.send("User already exists");
      response.status(400);
    } else {
      //scenario 3
      const insertNewUser = `
      INSERT INTO user (username,name, password,gender, location)
      VALUES ('${username}', '${name}', '${hashedPassword}',"${gender}","${location}"); `;
      await db.run(insertNewUser);
      response.send("User created Successfully");
    }
  }
});

//API 2 lOGIN USER
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;

  const selectUser = `
    SELECT * FROM user WHERE username ="${username}";`;
  console.log(selectUser);
  const dbUser = await db.get(selectUser);
  console.log(dbUser);

  //scenario 1

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    //scenario 2
    const verifyPassword = await bcrypt.compare(password, dbUser.password);
    console.log(verifyPassword);

    if (verifyPassword === true) {
      response.send("Login success!");
    } else {
      //scenario 3
      response.status(400);
      response.send("Invalid Password");
    }
  }
});

//API 3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;

  const sqlQuery = `
  SELECT * FROM user WHERE username = "${username}";`;

  const dbUser = await db.get(sqlQuery);
  console.log(dbUser);

  // scenario 2
  if (newPassword.length < 5) {
    response.send("Password is too short");
  } else {
    const verifyPassword = await bcrypt.compare(oldPassword, dbUser.password);
    //scenario 1
    console.log(verifyPassword);
    if (verifyPassword !== true) {
      response.status(400);
      response.send("Invalid current Password");
    } else {
      //scenario 3
      const updatedNewPassword = await bcrypt.hash(newPassword, 10);
      const updatePassword = `
      UPDATE user 
        SET password = "${updatedNewPassword}"
        WHERE username = "${username}";`;

      await db.run(updatePassword);
      response.send("Password Updated successfully");
      console.log(dbUser);
    }
  }
});
