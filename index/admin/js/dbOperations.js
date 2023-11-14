// dbOperations.js

const mssql = require("mssql");

async function connect() {
  await mssql.connect({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    encrypt: true,
  });
}

async function close() {
  await mssql.close();
}

async function generateReport() {
  try {
    await connect();

    const result = await mssql.query(/* Your SQL query */);

    return result.recordset;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    await close();
  }
}

module.exports = {
  generateReport,
};
