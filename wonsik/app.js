const http = require("http");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const dotenv = require("dotenv");
dotenv.config();

const { DataSource } = require("typeorm");

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

const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

//health check
app.get("/ping", (req, res) => {
  res.status(200).json({ message: "pong" });
});

//Create a book
app.post("/books", async (req, res, next) => {
  const { title, description, coverImage } = req.body;

  await myDataSource.query(
    `INSERT INTO books(
      title,
      description,
      cover_image
    )VALUES (?, ?, ?);
    `,
    [title, description, coverImage]
  );

  res.status(201).json({ message: "successfully created" });
});

//Create a author
app.post("/authors", async (req, res) => {
  const { first_name, last_name, age } = req.body;

  await myDataSource.query(
    `INSERT INTO authors(
      first_name,
      last_name,
      age
    )VALUES (?, ?, ?);
    `,
    [first_name, last_name, age]
  );
  res.status(201).json({ message: "successfully created" });
});

//Get all books
app.get("/books", async (req, res) => {
  // await myDataSource.manager.query(
  //   `SELECT
  //   b.id,
  //   b.title,
  //   b.description,
  //   b.cover_image
  //   FROM books b`,
  //   (err, rows) => {
  //     res.status(200).json(rows);
  //   }
  // );
  const result = await myDataSource.manager.query(
    `SELECT
    b.id,
    b.title,
    b.description,
    b.cover_image
    FROM books b`
  );

  res.status(200).json(result);
});

//Get all books along with authors
app.get("/books-with-authors", async (req, res) => {
  await myDataSource.manager.query(
    `SELECT
    books.id,
    books.title,
    books.description,
    books.cover_image,
    authors.first_name,
    authors.last_name,
    authors.age
    FROM books_authors ba
    INNER JOIN authors ON ba.author_id = authors.id
    INNER JOIN books ON ba.book_id = books.id`,
    (err, rows) => {
      res.status(200).json(rows);
    }
  );
});

// Update a single book by its primary key
app.patch("/books", async (req, res) => {
  const { title, description, cover_image, bookId } = req.body;

  await myDataSource.query(
    `UPDATE books
    SET
    title = ?,
    description =?,
    cover_image = ?
    WHERE id = ?
    `,
    [title, description, cover_image, bookId]
  );
  res.status(201).json({ message: "successfully updated" });
});

const server = http.createServer(app);
const PORT = process.env.PORT;

const start = async () => {
  server.listen(PORT, () => console.log(`server is listening on ${PORT}`));
};

start();
