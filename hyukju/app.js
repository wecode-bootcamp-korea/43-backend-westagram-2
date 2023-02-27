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

const start = async () => {
  app.listen(3001, () => {
    console.log("Running on port 3001");
  });
};
start();
