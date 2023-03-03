require("dotenv").config();
const express = require("express");
const cors = require("cors");
const logger = require("morgan");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { DataSource } = require(`typeorm`);

const app = express();

app.use(cors());
app.use(express.json());
app.use(logger("dev"));

const dbDataSource = new DataSource({
  type: process.env.DB_CONNECTION,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

dbDataSource.initialize().then(() => {
  console.log("Data Source has been initialized!");
});

const PORT = process.env.PORT;

app.post("/users", async (req, res) => {
  const { name, email, profileImage, password } = req.body;
  const saltRounds = 12;
  const makeHash = async (password, saltRounds) => {
    return await bcrypt.hash(password, saltRounds);
  };
  const passwordHash = await makeHash(password, saltRounds);

  await dbDataSource.query(
    `INSERT INTO users(
      name, 
      email,
      profile_image,
      password
      ) VALUES (?, ?, ?, ?);
    `,
    [name, email, profileImage, passwordHash]
  );

  res.status(201).json({ message: "successfully created" });
});

app.get("/users/login", async (req, res) => {
  const { email, password } = req.body;
  const [userData] = await dbDataSource.query(
    `
      SELECT id, email, password
      FROM users
      WHERE email = ?
    `,
    [email]
  );
  const checkHash = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
  };
  const payload = { foo: "bar" };
  const secretkey = "mySecretKey";
  const jwtToken = jwt.sign(payload, secretkey);
  const isChecked = await checkHash(password, userData.password);
  if (isChecked == true) {
    res.status(200).json({ accessToken: jwtToken });
  } else {
    res.status(400).json({ message: "INVALID USER" });
  }
  return jwtToken;
});

app.post("/posts/userWithToken", async (req, res) => {
  const { title, content, userId } = req.body;
  const jwtToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIiLCJpYXQiOjE2Nzc4MDkzMTF9.-idCKsJUD3-ciPdlwoxSO6gOMtxLMScPEoJ3UuisUR8";
  const mysecretkey = "mySecretKey";

  const checkToken = await jwt.verify(jwtToken, mysecretkey);
  console.log("~~~~~~~~~~~~~~");
  console.log(checkToken);
  console.log("~~~~~~~~~~~~~~");
  try {
    await jwt.verify(jwtToken, mysecretkey);
    await dbDataSource.query(
      `INSERT INTO posts(
        title, 
        content,
        user_id
        ) VALUES (?, ? ,?)
      `,
      [title, content, userId]
    );
  } catch (e) {
    res.status(400).json({ message: "INVALID ACCESS TOKEN" });
  }
});

app.post("/posts", async (req, res) => {
  const { title, content, userId } = req.body;
  await dbDataSource.query(
    `INSERT INTO posts(
      title, 
      content,
      user_id
      ) VALUES (?, ? ,?)
    `,
    [title, content, userId]
  );
  res.status(201).json({ message: "successfully created" });
});

app.get("/users/everyone/posts", async (req, res) => {
  const users = await dbDataSource.query(
    `SELECT 
    users.id as userId,
    users.profile_image as userProfileImage,
    posts.id as postingId,
    posts.image_url as postingImageUrl,
    posts.content as postingContent
    FROM users
    INNER JOIN posts
    ON users.id = posts.user_id
    `
  );
  res.status(200).json({ data: users });
});

app.get("/users/:userId/posts", async (req, res) => {
  const { userId } = req.params;
  const result = await dbDataSource.query(
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
  const { postId } = req.body;

  await dbDataSource.query(
    `
    UPDATE posts
    SET content=? 
    WHERE id=?
    `,
    [content, postId]
  );
  const result = await dbDataSource.query(
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

app.delete("/posts/:postId/delete", async (req, res) => {
  const { postId } = req.params;
  const result = await dbDataSource.query(
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
  const [isLiked] = await dbDataSource.query(
    `
    SELECT id 
    FROM likes
    WHERE user_id = ?
    AND post_id = ?
    `,
    [userId, postId]
  );

  if (!isLiked) {
    await dbDataSource.query(
      `
      INSERT INTO likes (user_id, post_id)
      VALUES (?, ?)
    `,
      [userId, postId]
    );
    return res.status(200).json({ message: "LIKE_CREATED" });
  } else {
    await dbDataSource.query(
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
