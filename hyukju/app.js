const dotent = require("dotenv"); // dotent = env 파일로 부터 환경변수 읽어옴
dotent.config(); //dotent 라이브러리 실행

const express = require("express");
const cors = require("cors");
const app = express();
const logger = require("morgan"); // morgan = 로깅(네트워크 통신기록)을 관리
const { DataSource } = require(`typeorm`);

app.use(logger("dev"));
app.use(cors());

const myDataSource = new DataSource({
  type: process.env.TYPEORM_CONNECTION,
  host: process.env.TYPEORM_HOST,
  port: process.env.TYPEORM_PORT,
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  database: process.env.TYPEORM_DATABASE,
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
