require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const { DataSource } = require("typeorm");

const appDataSource = new DataSource({
  type: process.env.DB_CONNECTION,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

appDataSource.initialize().then(() => {
  console.log("Data Source has been initialized!");
});

const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

//health check
app.get("/ping", (req, res) => {
  res.status(200).json({ message: "pong" });
});

//Create a user
app.post("/users", async (req, res) => {
  const { name, email, profileImage, password } = req.body;

  await appDataSource.query(
    `INSERT INTO users(
      name,
      email,
      profile_image,
      password
    )VALUES(?, ?, ?, ?);
    `,
    [name, email, profileImage, password]
  );

  res.status(201).json({ message: "userCreated" });
});

//Create a post
app.post("/posts", async (req, res) => {
  const { title, content, imageUrl, userId } = req.body;

  await appDataSource.query(
    `INSERT INTO posts(
      title,
      content,
      image_url,
      user_id
    )VALUES (?, ?, ?, ?);
    `,
    [title, content, imageUrl, userId]
  );

  res.status(201).json({ message: "postCreated" });
});

// assignment 4
app.get("/postlist", async (req, res) => {
  const result = await appDataSource.query(
    `
    SELECT
      u.id            as userId,
      u.profile_image as userProfileImage,
      p.id            as postId,
      p.image_url     as postImageUrl,
      p.title         as postTitle,
      p.content       as postContent
    FROM posts as p
    JOIN users as u ON u.id = p.user_id
  `
  );

  return res.status(200).json({ data: result });
});

// 5번
app.get("/users/:userId/posts", async (req, res) => {
  const { userId } = req.params;

  const result = await appDataSource.query(
    `
  SELECT
  u.id as userId,
  u.profile_image as userProfileImage,
  JSON_ARRAYAGG(
    JSON_OBJECT(
      "postingId", p.id,
      "postingImageUrl", p.image_url,
      "postingTitle", p.title,
      "postingContent", p.content
    )
  ) as postings
  FROM users as u
  JOIN posts as p ON p.user_id = u.id
  WHERE u.id = ?
  GROUP BY u.id
  `,
    [userId]
  );

  return res.status(200).json({ data: result });
});

// 6번
app.patch("/posts/:postId", async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;

  await appDataSource.query(
    `
    UPDATE posts
    SET content = ?
    WHERE id = ?
    `,
    [content, postId]
  );

  const [result] = await appDataSource.query(
    `
    SELECT
     u.id      as userId,
     u.name    as userName,
     p.id      as postId,
     p.title   as postTitle,
     p.content as postContent
    FROM posts p
    JOIN users u ON u.id = p.user_id
    WHERE p.id = ?
    `,
    [postId]
  );

  return res.status(200).json({ data: result });
});

// 7번
app.delete("/posts/:postId", async (req, res) => {
  const { postId } = req.params;

  await appDataSource.query(
    `
    DELETE FROM posts
    WHERE id = ?
    `,
    [postId]
  );

  return res.status(200).json({ message: "POST_DELETED" });
});

//8번
app.post("/likes", async (req, res) => {
  const { userId, postId } = req.body;
  const [isLiked] = await appDataSource.query(
    `
  SELECT
   id
   FROM  likes
   WHERE user_id = ?
   AND   post_id = ?
  `,
    [userId, postId]
  );

  if (!isLiked) {
    await appDataSource.query(
      `
      INSERT INTO likes(
        user_id,
        post_id
      ) VALUES (
        ?,
        ?
      )
      `,
      [userId, postId]
    );

    return res.status(201).json({ message: "LIKE_CREATED" });
  } else {
    await appDataSource.query(
      `
      DELETE FROM likes
      WHERE user_id = ?
      AND   post_id = ?
      `,
      [userId, postId]
    );

    return res.status(201).json({ message: "LIKE_DELETED" });
  }
});

const PORT = process.env.PORT;

const start = async () => {
  app.listen(PORT, () =>
    console.log(`💡💡💡 server is listening on ${PORT} 💡💡💡`)
  );
};

start();
