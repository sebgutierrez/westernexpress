const config = require("../config.js");
const sql = require("mssql");

async function generateReportCheck(
  amount,
  amountComparison,
  location,
  date,
  dateComparison,
  employeeId
) {
  try {
    let pool = await sql.connect(config);
    let query = pool.request();

    let sqlQuery = `
      SELECT 1 FROM dbo.sales AS s
      INNER JOIN dbo.employees_new AS e ON s.emp_id = e.emp_id
    `;

    if (amountComparison && amount) {
      query.input("amount", amount);
      sqlQuery += ` WHERE s.amount ${amountComparison} @amount`;
    }

    if (location) {
      query.input("location", location);
      if (sqlQuery.includes("WHERE")) {
        sqlQuery += ` AND e.postoffice_id = @location`;
      } else {
        sqlQuery += ` WHERE e.postoffice_id = @location`;
      }
    }

    if (dateComparison && date) {
      query.input("date", date);
      if (sqlQuery.includes("WHERE")) {
        sqlQuery += ` AND s.sale_date ${dateComparison} @date`;
      } else {
        sqlQuery += ` WHERE s.sale_date ${dateComparison} @date`;
      }
    }

    if (employeeId) {
      query.input("employeeId", employeeId);
      if (sqlQuery.includes("WHERE")) {
        sqlQuery += ` AND s.emp_id = @employeeId`;
      } else {
        sqlQuery += ` WHERE s.emp_id = @employeeId`;
      }
    }

    query = await query.query(sqlQuery);

    let exist = query.recordset.length > 0 ? 1 : 0; // Checking if records exist

    pool.close();
    return exist;
  } catch (error) {
    console.log(error);
    return 0; // Return 0 if an error occurs
  }
}

async function generateSalesOverview(
  amount,
  amountComparison,
  location,
  date,
  dateComparison,
  employeeId
) {
  try {
    let pool = await sql.connect(config);
    let query = pool.request();

    let whereClause = "WHERE 1=1";

    if (amountComparison && amount !== null && !isNaN(amount)) {
      query.input("amount", amount);
      whereClause += ` AND s.amount ${amountComparison} @amount`;
    }

    if (location) {
      query.input("location", location);
      whereClause += ` AND e.postoffice_id = @location`;
    }

    if (dateComparison && date) {
      console.log("Date Comparison:", dateComparison);
      console.log("Selected Date:", date);
      query.input("date", date);
      whereClause += ` AND CONVERT(DATE, s.sale_date) ${dateComparison} CONVERT(DATE, @date)`;
    }

    if (employeeId) {
      query.input("employeeId", employeeId);
      whereClause += ` AND s.emp_id = @employeeId`;
    }

    console.log(query);
    query = await query.query(`
          SELECT s.amount, s.sale_date, e.emp_id, e.first_name, e.last_name
          FROM dbo.sales s
          INNER JOIN dbo.employees_new e ON s.emp_id = e.emp_id
          ${whereClause}
      `);

    pool.close();
    console.log(query);
    return query.recordset;
  } catch (error) {
    console.log(error);
    return { error: "An error occurred" };
  }
}

module.exports = {
  generateSalesOverview: generateSalesOverview,
};
