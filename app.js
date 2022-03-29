const express = require("express");
const app = express();

app.use(express.json());
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const dbPath = path.join(__dirname, "userData.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`DB Error:${error.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const selectExistingUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const existedUser = await db.get(selectExistingUserQuery);
  if (existedUser === undefined) {
    //no user exists so create new user
    if (password.length > 4) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const createNewUserQuery = `
                INSERT INTO user(username,name,password,gender)
                VALUES('${username}','${name}','${hashedPassword}','${gender}');`;
      await db.run(createNewUserQuery);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API 2 login
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectExistingUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const existedUser = await db.get(selectExistingUserQuery);

  if (existedUser === undefined) {
    response.send(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      existedUser.password
    );
    if (isPasswordMatched === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const existedUser = await db.get(selectUserQuery);

  if (existedUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isOldPwdMatched = await bcrypt.compare(
      oldPassword,
      existedUser.password
    );
    const isNewPwdGreaterThan5 = newPassword.length > 4 ? true : false;
    if (isOldPwdMatched === true) {
      if (isNewPwdGreaterThan5 === true) {
        const hashedNewPwd = await bcrypt.hash(newPassword, 10);
        const updatePwdQuery = `UPDATE user SET password = '${hashedNewPwd}' WHERE username = '${username}';`;
        const user = await db.run(updatePwdQuery);
        response.send("Password updated");
      } else {
        response.send = 400;
        response.send("Password is too short");
      }
    } else {
      response.status = 400;
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
