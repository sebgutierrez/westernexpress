/***************************************** REPORTS PAGE **********************************************************/
/* will send the POST Request once generate report button is clicked based off of user input SQL query based on user input  */

if (typeof require !== "undefined") {
  const path = require("path");
  require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
}

function generateReport() {
  const amountChecked = document.getElementById("fieldAmount").checked;
  const locationChecked = document.getElementById("fieldLocation").checked;
  const dateChecked = document.getElementById("fieldDate").checked;
  const employeeIdChecked = document.getElementById("fieldEmployeeId").checked;

  // Check if none of the checkboxes are checked
  if (!(amountChecked || locationChecked || dateChecked || employeeIdChecked)) {
    // You can display a message to the user or simply return
    console.log("Please select at least one filter to generate a report.");
    return;
  }

  const requestData = {
    amount: document.getElementById("amount").value,
    amountComparison: document.getElementById("amountComparison").value,
    location: document.getElementById("location").value,
    date: document.getElementById("date").value,
    dateComparison: document.getElementById("dateComparison").value,
    employeeId: document.getElementById("employeeId").value,
  };

  let query = `
  SELECT s.amount, s.sale_date, f.emp_id, f.first_name, f.last_name
  FROM dbo.sales s
  INNER JOIN dbo.employees_new f ON s.emp_id = f.emp_id
`;

  let whereClauses = [];

  if (
    document.getElementById("fieldAmount").checked &&
    requestData.amount !== undefined
  ) {
    const sqlOperator =
      requestData.amountComparison === "greater than"
        ? ">"
        : requestData.amountComparison;
    whereClauses.push(`s.amount ${sqlOperator} ${requestData.amount}`);
  }

  // modify location
  if (document.getElementById("fieldLocation").checked) {
    query += ` INNER JOIN dbo.post_office_details pd ON s.address_id = pd.address_id`;
    whereClauses.push(`pd.postoffice_id = ${requestData.location}`);
  }

  if (document.getElementById("fieldDate").checked) {
    whereClauses.push(
      `s.sale_date ${requestData.dateComparison} '${requestData.date}'`
    );
  }

  if (document.getElementById("fieldEmployeeId").checked) {
    whereClauses.push(`f.emp_id = '${requestData.employeeId}'`);
  }

  // Combine WHERE clauses if there are any
  if (whereClauses.length > 0) {
    query += ` WHERE ${whereClauses.join(" AND ")}`;
  }

  //See SQL Query
  console.log("Generated SQL query:", query);

  fetch("http://localhost:3000/generateReport", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }), // Sending the constructed query to the backend
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      const reportList = document.getElementById("reportList");
      reportList.innerHTML = "";

      // Inside the data.forEach loop where list items are created
      data.forEach((item) => {
        const listItem = document.createElement("li");

        // Format the date to display only the date part
        const formattedDate = new Date(item.sale_date)
          .toISOString()
          .split("T")[0];

        // Include emp_id in the list item text content
        listItem.textContent = `Amount: ${item.amount}, Date: ${formattedDate}, Employee ID: ${item.emp_id}, Employee Name: ${item.first_name} ${item.last_name}`;
        reportList.appendChild(listItem);
      });

      const resultContainer = document.getElementById("result");
      resultContainer.style.display = "block";
    })
    .catch((error) => {
      console.error(error);
    });
}
