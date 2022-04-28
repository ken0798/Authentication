const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "goodreads.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// Get Books API
app.get("/books/", async (request, response) => {
  const getBooksQuery = `
  SELECT
    *
  FROM
    book
  ORDER BY
    book_id;`;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});

//Register User
app.post("/users/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    const createUserQuery = `
      INSERT INTO 
        user (username, name, password, gender, location) 
      VALUES 
        (
          '${username}', 
          '${name}',
          '${hashedPassword}', 
          '${gender}',
          '${location}'
        )`;
    const dbResponse = await db.run(createUserQuery);
    const newUserId = dbResponse.lastID;
    response.send(`Created new user with ${newUserId}`);
  } else {
    response.status = 400;
    response.send("User already exists");
  }
});
// app.post("/users/", async (req, res) => {
//   const { username, password, name, gender, location } = req.body;
//   const checkUserQuery = `SELECT * FROM user ;`;
//   try {
//     const dbUser = await db.get(checkUserQuery);
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);
//     if (!dbUser) {
//       const createUserQuery = `
//         INSERT INTO
//             user (username, name, password, gender, location)
//         VALUES
//             (
//             '${username}',
//             '${name}',
//             '${hashedPassword}',
//             '${gender}',
//             '${location}'
//             );`;

//       const addUser = await db.run(createUserQuery);

//       res.send({ msg: "added successfully" });
//     } else {
//       console.log(dbUser);
//       res
//         .status(400)
//         .send({ msg: "You are registered please Login ", data: dbUser });
//     }
//   } catch (err) {
//     console.error(err.message);
//   }
// });

//Login User
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    console.log(isPasswordMatched);
    if (isPasswordMatched === true) {
      response.send("Login Success!");
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});

// app.post("/login/", async (req, res) => {
//   const { username, password } = req.body;
//   const checkUserQuery = `SELECT * FROM user WHERE username="${username}";`;
//   try {
//     const dbUser = await db.get(checkUserQuery);

//     if (!dbUser) {
//       res.status(400).send({ msg: "please Signup" });
//     } else {
//       const confirmPassword = await bcrypt.compare(password, dbUser.password);
//       console.log(confirmPassword);
//       res.status(200).send({ msg: "Login success" });
//     }
//   } catch (error) {
//     console.error(error);
//     res.send("Invalid");
//   }
// });

//All Users
app.get("/users/", async (req, res) => {
  const usersQuery = `SELECT * FROM user ;`;
  const users = await db.all(usersQuery);
  res.status(200).send(users);
});

//remove User
app.delete("/:userID", async (imp, exp) => {
  const { userID } = imp.params;
  const getUserQuery = `SELECT * FROM user WHERE username="${userID}"`;
  try {
    const dbUser = await db.get(getUserQuery);
    console.log(dbUser);
    if (!dbUser) {
      throw Error("user Not found");
    } else {
      const deleteQuery = `DELETE FROM user WHERE username="${userID}";`;
      await db.run(deleteQuery);
      exp.status(200).send("Removed Successfully");
    }
  } catch (error) {
    exp.status(400).send(error.message);
  }
});
