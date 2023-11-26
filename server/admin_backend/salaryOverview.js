const config = require("../config.js");
const sql = require("mssql");

async function overviewCheck(
  employeeId,
  amountComparison,
  amount,
  role,
  location
) {
  try {
    let pool = await sql.connect(config);
    let query = pool.request();

    let sqlQuery = `SELECT 1 FROM dbo.employees_new AS e
                      INNER JOIN dbo.employee_roles er ON e.emp_id = er.emp_id
                      INNER JOIN dbo.roles r ON er.role_id = r.role_id
                      LEFT JOIN dbo.salaries s ON e.emp_id = s.emp_id
                      LEFT JOIN (
                          SELECT FK_employee_id, SUM(weekly_hours) AS total_hours
                          FROM dbo.weekly_hours
                          GROUP BY FK_employee_id
                      ) wh ON e.emp_id = wh.FK_employee_id
                      WHERE 1 = 1`;

    if (employeeId) {
      query.input("employeeId", employeeId);
      sqlQuery += ` AND e.emp_id = @employeeId`;
    }

    if (amountComparison && amount) {
      query.input("amount", amount);
      sqlQuery += ` AND s.salary ${amountComparison} @amount`;
    }

    if (role) {
      query.input("role", role);
      sqlQuery += ` AND r.role_id = @role`;
    }

    if (location) {
      query.input("location", location);
      sqlQuery += ` AND e.postoffice_id = @location`;
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

async function generateSalaryOverview(
  employeeId,
  amountComparison,
  amount,
  role,
  location
) {
  try {
    let pool = await sql.connect(config);
    let query = pool.request();

    let whereClause = "WHERE 1=1";

    if (employeeId) {
      query.input("employeeId", employeeId);
      whereClause += ` AND e.emp_id = @employeeId`;
    }

    if (amountComparison && amount) {
      query.input("amount", amount);
      whereClause += ` AND s.salary ${amountComparison} @amount`;
    }

    if (role) {
      query.input("role", role);
      whereClause += ` AND r.role_id = @role`;
    }

    if (location) {
      query.input("location", location);
      whereClause += ` AND e.postoffice_id = @location`;
    }

    console.log(query);
    query = await query.query(`
          SELECT e.emp_id AS "Employee #", e.first_name AS "First Name", e.last_name AS "Last Name", r.role_name AS "Role", s.salary AS "Salary", wh.total_hours AS "Total Hours"
          FROM dbo.employees_new e
          INNER JOIN dbo.post_office_details pd ON e.postoffice_id = pd.postoffice_id
          INNER JOIN dbo.employee_roles er ON e.emp_id = er.emp_id
          INNER JOIN dbo.roles r ON er.role_id = r.role_id
          LEFT JOIN dbo.salaries s ON e.emp_id = s.emp_id
          LEFT JOIN (
              SELECT FK_employee_id, SUM(weekly_hours) AS total_hours
              FROM dbo.weekly_hours
              GROUP BY FK_employee_id
          ) wh ON e.emp_id = wh.FK_employee_id
          INNER JOIN dbo.post_office_details pod ON e.postoffice_id = pod.postoffice_id
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
  generateSalaryOverview: generateSalaryOverview,
};
