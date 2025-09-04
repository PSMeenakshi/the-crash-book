import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for Render
});

client.connect()
  .then(() => console.log("Database connected!"))
  .catch(err => console.error("Database connection error:", err));

const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.set("views", "./views"); 

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {
  try {
    const sort = req.query.sort || "date_read";
    let orderBy = sort === "rating" ? "rating DESC" : 
                  sort === "title" ? "title ASC" : 
                  "date_read DESC";

    const result = await db.query(`SELECT * FROM books ORDER BY ${orderBy}`);
    res.render("index", { books: result.rows });
  } catch (err) {
    console.error("Error loading books:", err);
    res.status(500).render("error", { message: "Could not load books. Please try again." });
  }
});

app.get("/books/new", (req, res) => {
  res.render("new.ejs");
});

app.get("/books/:id/edit", async (req, res) => {
  const { id } = req.params;
  const result = await db.query("SELECT * FROM books WHERE id=$1", [id]);
  res.render("edit.ejs", { book: result.rows[0] });
});

app.post("/books", async (req, res) => {
  try {
    const { title, author, isbn, rating, notes, date_read } = req.body;
    const sql = `INSERT INTO books (title, author, isbn, rating, notes, date_read)
                 VALUES ($1,$2,$3,$4,$5,$6);`;
    const values = [title, author || null, isbn || null, rating || null, notes || null, date_read || null];
    await db.query(sql, values);
    res.redirect("/");
  } catch (err) {
    console.error("Insert error:", err);
    res.status(500).send("Error adding book");
  }
});


app.post("/books/:id", async (req, res) => {
  const { id } = req.params;
  const { title, author, rating, notes, date_read } = req.body;
  await db.query(
    "UPDATE books SET title=$1, author=$2, rating=$3, notes=$4, date_read=$5 WHERE id=$6",
    [title, author, rating, notes, date_read || null, id]
  );
  res.redirect("/");
});

app.post("/books/:id/delete", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM books WHERE id=$1", [id]);
    res.redirect("/");
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).send("Error deleting book");
  }
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).render("error", { message: "Something went wrong. Please try again later." });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

