const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const express = require("express");
const bodyParser = require("body-parser");
const mssql = require("mssql");

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// Middleware to handle CORS headers
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS, POST, GET");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

app.post("/generateReport", async (req, res) => {
  try {
    const requestData = req.body;

    await mssql.connect({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      server: String(process.env.DB_SERVER),
      database: process.env.DB_DATABASE,
      encrypt: true,
    });

    const result = await mssql.query(requestData.query); // Using the received SQL query

    res.json(result.recordset);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  } finally {
    await mssql.close();
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
