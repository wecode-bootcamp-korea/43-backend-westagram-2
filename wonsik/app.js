const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

require("dotenv").config();

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
app.post("/users", async (req, res, next) => {
  const { name, email, profileImage, password } = req.body;

  await appDataSource.query(
    `INSERT INTO users(
      name,
      email,
      profile_image,
      password
    )VALUES (?, ?, ?, ?);
    `,
    [name, email, profileImage, password]
  );

  res.status(201).json({ message: "userCreated" });
});

const PORT = process.env.PORT;

const start = async () => {
  app.listen(PORT, () => console.log(`server is listening on ${PORT}`));
};

start();
