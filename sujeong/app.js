const http = require("http");

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { DataSource, AbstractRepository, And } = require("typeorm");
app = express();

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

app.use(express.json());
app.use(cors());
app.use(morgan("tiny"));

app.get("/ping", (req, res) => {
  res.status(200).json({ message: "pong" });
});

app.post("/users", async (req, res) => {
  const { name, email, profileImage, password } = req.body;

  await appDataSource.query(
    `INSERT INTO users (
      name,
      email,
      profile_image,
      password )
      VALUES (?, ?, ?, ?) ;`,
    [name, email, profileImage, password]
  );
  res.status(201).json({ message: "userCreated" });
});

app.post("/posts", async (req, res) => {
  const { title, content, userId, postImageUrl } = req.body;

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
  res.status(201).json({ data: update[0] });
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
