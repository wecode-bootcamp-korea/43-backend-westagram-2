const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const cors = require("cors");
const logger = require("morgan");
const { DataSource } = require(`typeorm`);

const app = express();

app.use(logger("dev"));
app.use(cors());

const myDataSource = new DataSource({
  type: process.env.DB_CONNECTION,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

myDataSource.initialize().then(() => {
  console.log("Data Source has been initialized!");
});

const PORT = process.env.PORT;

const start = async () => {
  app.listen(3000, () => {
    console.log("Running on port 3000");
  });
};
start();
