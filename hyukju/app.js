require("dotenv").config();
const express = require("express");
const cors = require("cors");
const logger = require("morgan");
const { DataSource } = require(`typeorm`);

const app = express();

app.use(cors());
app.use(express.json());
app.use(logger("dev"));

const DBDataSource = new DataSource({
  type: process.env.DB_CONNECTION,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

DBDataSource.initialize().then(() => {
  console.log("Data Source has been initialized!");
});

const PORT = process.env.PORT;

app.post("/users", async (req, res, next) => {
  const { name, email, profile_image, password } = req.body;
  await DBDataSource.query(
    `INSERT INTO users(
      name, 
      email,
      profile_image,
      password
      ) VALUES (?, ?, ?, ?);
    `,
    [name, email, profile_image, password]
  );

  res.status(201).json({ message: "successfully created" });
});

app.post("/posts", async (req, res, next) => {
  const { title, content, user_id } = req.body;
  await DBDataSource.query(
    `INSERT INTO posts(
      title, 
      content,
      user_id
      ) VALUES (?, ? ,?)
    `,
    [title, content, user_id]
  );
  res.status(201).json({ message: "successfully created" });
});

app.get("/users/posts/all", async (req, res) => {
  await DBDataSource.query(
    `SELECT 
    users.id as userId,
    users.profile_image as userProfileImage,
    posts.id as postingId,
    posts.image_url as postingImageUrl,
    posts.content as postingContent
    FROM users
    INNER JOIN posts
    ON users.id = posts.user_id
    `,
    (err, rows) => {
      res.status(200).json({ data: rows });
    }
  );
});

app.get("/users/posts/oneperson/:userId", async (req, res) => {
  const { userId } = req.params;
  const result = await DBDataSource.query(
    `SELECT users.id as userId, users.profile_image as userProfileImage, 
    JSON_ARRAYAGG(
      JSON_OBJECT(
        "postingId", posts.id,
        "postingImageUrl", posts.image_url,
        "postingTitle", posts.title,
        "postingContent", posts.content 
      )
    ) as postings
    FROM users
    JOIN posts
    ON users.id = posts.user_id
    where users.id = ?
    `,
    [userId]
  );

  return res.status(200).json({ data: result });
});

app.patch("/posts/alter", async (req, res) => {
  const { postId } = req.body; // /posts/:postId url부분에서 :postId부분만 내가 바꾸고 싶은 번호만 바꿔서 넣어주면 나중에 postId = "3" 이렇게 안해서 url상에 이미 정보가 있어서 결국 content 정보만 넣어주면 작동함
  const { content } = req.body; //

  await DBDataSource.query(
    `
    UPDATE posts
    SET content=? 
    WHERE id=?
    `,
    [content, postId]
  );
  const result = await DBDataSource.query(
    `
      SELECT users.id as userId, users.name as userName, posts.id as postingId, posts.title as postingTitle, posts.content as postingContent
      FROM users
      LEFT JOIN posts
      ON users.id = posts.user_id
      WHERE posts.id = ?
    `,
    [postId]
  );

  return res.status(200).json({ data: result });
});

app.patch("/posts/delete/:postId", async (req, res) => {
  const { postId } = req.params;

  const result = await DBDataSource.query(
    `
      DELETE FROM posts
      WHERE posts.id = ?
    `,
    [postId]
  );
  return res.status(200).json({ message: "successfully created" });
});

app.post("/likes", async (req, res) => {
  const { userId, postId } = req.body;
  const [isLiked] = await DBDataSource.query(
    `
    SELECT id 
    FROM likes
    WHERE user_id = ?
    AND post_id = ?
    `,
    [userId, postId]
  );

  if (!isLiked) {
    await DBDataSource.query(
      `
      INSERT INTO likes (user_id, post_id)
      VALUES (?, ?)
    `,
      [userId, postId]
    );
    return res.status(200).json({ message: "LIKE_CREATED" });
  } else {
    await DBDataSource.query(
      `
    DELETE FROM likes
    WHERE user_id = ?
    AND post_id = ?
    `,
      [userId, postId]
    );
    return res.status(200).json({ message: "LIKE_DELETED" });
  }
});

const start = async () => {
  app.listen(3001, () => {
    console.log("Running on port 3001");
  });
};
start();
