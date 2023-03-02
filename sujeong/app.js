const http = require("http");

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { DataSource } = require("typeorm");
app = express();

const bcrypt = require("bcrypt");
const password = "password";
const saltRounds = 10;
const jwt = require("jsonwebtoken");
const { getFips } = require("crypto");
const { decode } = require("punycode");
const secretKey = process.env.JWT_SECRET;

const appDataSource = new DataSource({
  type: process.env.DB_CONNECTION,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

appDataSource
  .initialize()
  .then(() => {
    console.log("Data Source has been initialized!");
  })
  .catch((err) => {
    console.log("Error during Data Source iniailization", err);
    myDataSource.destroy();
  });

const makeHash = async (password, saltRounds) => {
  return await bcrypt.hash(password, saltRounds);
};

app.use(express.json());
app.use(cors());
app.use(morgan("tiny"));

app.get("/ping", (req, res) => {
  res.status(200).json({ message: "pong" });
});

app.post("/users", async (req, res) => {
  const { name, email, profileImage, password } = req.body;

  const hashedPassword = await makeHash(password, saltRounds);

  await appDataSource.query(
    `INSERT INTO users (
      name,
      email,
      profile_image,
      password )
      VALUES (?, ?, ?, ?) ;`,
    [name, email, profileImage, hashedPassword]
  );
  res.status(201).json({ message: "userCreated" });
});

app.post("/users/login", async (req, res) => {
  const { email, password } = req.body;

  const [userData] = await appDataSource.query(
    `SELECT
    id,
    email,
    password
    FROM users
    WHERE email=?`,
    [email]
  );

  // console.log("userData", userData);
  // console.log(password, userData.password);

  const payLoad = { id: userData.id };
  const isChecked = await checkHash(password, userData.password);
  const jwtToken = jwt.sign(payLoad, secretKey);

  if (isChecked === true) {
    res.status(201).json({ accessToken: jwtToken });
  } else {
    res.status(400).json({ message: "Invalid User" });
  }
});

app.post("/posts/login", async (req, res) => {
  const jwtToken = req.headers.authorization;
  const { title, content, userId, postImageUrl } = req.body;
  const decoded = jwt.verify(jwtToken, secretKey);
  const { userID } = req.params;
  console.log(decoded);

  const obj = decoded.hasOwnProperty("id");
  await appDataSource.query(
    `INSERT INTO posts (
        title,
        content,
        user_id,
        image_url )
        VALUES (?, ?, ?, ?) ;`,
    [title, content, userId, postImageUrl]
  );
  // const [user] = await appDataSource.query(
  //   `SELECT
  //       id
  //       FROM users
  //       WHERE
  //       users.id=?;
  //     `[userID]
  // ); console

  if (decoded.id === user) {
    res.status(201).json({ message: "postCreated" });
  } else {
    res.status(401).json({ message: "Invalid Access Token" });
  }
});

const server = http.createServer(app);
const PORT = process.env.PORT;

const start = async () => {
  try {
    server.listen(PORT, () => console.log(`server is listening on ${PORT}`));
  } catch (err) {
    console.log(err);
  }
};
start();

const checkHash = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

const main = async () => {
  const hashedPassword = await makeHash("password", 10);
  const result = await checkHash("password", hashedPassword);
  console.log("result", result);
};

main();
