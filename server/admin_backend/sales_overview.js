const config = require("../config.js");
const sql = require("mssql"); // Make sure this line is present


async function generateReport(requestData) {
 try {
   let pool = await sql.connect(config);


   // Construct the SQL query based on the requestData
   let query = `
     SELECT s.amount, s.sale_date, f.emp_id, f.first_name, f.last_name
     FROM dbo.sales s
     INNER JOIN dbo.employees_new f ON s.emp_id = f.emp_id
   `;


   let whereClauses = [];


   if (requestData.amount !== "") {
     whereClauses.push(
       `s.amount ${requestData.amountComparison} ${requestData.amount}`
     );
   }


   if (requestData.location !== "") {
     query += ` INNER JOIN dbo.post_office_details pd ON s.address_id = pd.address_id`;
     whereClauses.push(`pd.postoffice_id = ${requestData.location}`);
   }


   if (requestData.date !== null) {
     whereClauses.push(
       `s.sale_date ${requestData.dateComparison} '${requestData.date}'`
     );
   }


   if (requestData.employeeId !== "") {
     whereClauses.push(`f.emp_id = '${requestData.employeeId}'`);
   }


   if (whereClauses.length > 0) {
     query += ` WHERE ${whereClauses.join(" AND ")}`;
   }


   console.log("Generated SQL query:", query);
   let result = await pool.request().query(query);
   pool.close();


   console.log("Query result:", result);


   return result.recordset;
 } catch (error) {
   console.error(error);
   return { error: "An error occurred" };
 }
}


module.exports = {
 generateReport: generateReport,
};


