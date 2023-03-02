const http = require("http");

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { DataSource } = require("typeorm");
app = express();

const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");
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

  const payLoad = { id: userData.id };
  const isChecked = await checkHash(password, userData.password);
  const jwtToken = jwt.sign(payLoad, secretKey);

  if (isChecked === true) {
    res.status(201).json({ accessToken: jwtToken });
  } else {
    res.status(400).json({ message: "Invalid User" });
  }
});

app.post("/posts", async (req, res) => {
  const jwtToken = req.headers.authorization;
  const { title, content, userId, postImageUrl } = req.body;
  const decoded = jwt.verify(jwtToken, secretKey);

  await appDataSource.query(
    `INSERT INTO posts (
        title,
        content,
        user_id,
        image_url )
        VALUES (?, ?, ?, ?) ;`,
    [title, content, userId, postImageUrl]
  );

  res.status(201).json({ message: "postCreated" });

  if (!decoded) {
    res.status(401).json({ message: "Invalid Access Token" });
  }
});

app.get("/search", async (req, res) => {
  const search = await appDataSource.manager.query(
    `SELECT
    users.id AS userId,
    users.profile_image AS userProfileImage, 
    posts.id AS postingId,
    posts.image_url AS postingImageUrl,
    posts.content AS postingContent
    FROM posts
    INNER JOIN users ON posts.user_id=users.id`
  );
  res.status(200).json({ data: search });
});

app.get("/users/:userId/posts", async (req, res) => {
  const { userId } = req.params;
  const result = await appDataSource.query(
    `SELECT
    users.id AS userId,
    users.profile_image AS userProfileImage, 
    JSON_ARRAYAGG(
    JSON_OBJECT(
    "postingId", posts.id,
    "postingImageUrl", posts.image_url,
    "postingContent", posts.content ))
    AS postings
    FROM users
    JOIN posts ON posts.user_id=users.id
    WHERE
    users.id=?
    GROUP BY users.id
  `,
    [userId]
  );

  return res.status(200).json({ data: result[0] });
});

app.patch("/posting_update/:postId", async (req, res) => {
  const { postId } = req.params;
  const { postingContent } = req.body;

  await appDataSource.query(
    `UPDATE posts
    SET
    content=?
    WHERE id=?
    `,
    [postingContent, postId]
  );

  const update = await appDataSource.query(
    `SELECT
      u.id AS userId,
      u.name AS userName,
      p.id AS postingId,
      p.title AS postingTitle,
      p.content AS postingContent
      FROM posts AS p
      JOIN users AS u ON p.user_id=u.id
      WHERE p.id=?
      `,
    [postId]
  );
  res.status(200).json({ data: update });
});

app.delete("/posts_delete/:postId", async (req, res) => {
  const { postId } = req.params;

  await appDataSource.query(
    `DELETE
    FROM posts
    WHERE posts.id = ?
    `,
    [postId]
  );
  res.status(200).json({ message: "postingDeleted" });
});

app.post("/posting_likes", async (req, res) => {
  const { userId, postId } = req.body;

  await appDataSource.query(
    `INSERT INTO likes(
    user_id,
    post_id)
    VALUES (?,?);`,
    [userId, postId]
  );

  res.status(201).json({ message: "likeCreated" });
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
