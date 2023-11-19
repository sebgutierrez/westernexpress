/***************************************** REPORTS PAGE **********************************************************/
/* will send the POST Request once generate report button is clicked based off of user input SQL query based on user input  */

if (typeof require !== "undefined") {
  const path = require("path");
  require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
}

function generateReport() {
  const requestData = {
    amount: document.getElementById("amount").value,
    amountComparison: document.getElementById("amountComparison").value,
    location: document.getElementById("location").value,
    dateComparison: document.getElementById("dateComparison").value,
    date: document.getElementById("date").value,
    employeeId: document.getElementById("employeeId").value,
  };

  let query =
    "SELECT s.amount, s.sale_date, s.tracking_number, s.emp_id FROM dbo.sales s";
  let whereClauses = [];

  if (
    document.getElementById("fieldAmount").checked &&
    requestData.amount !== ""
  ) {
    const sqlOperator =
      requestData.amountComparison === "greater than"
        ? ">"
        : requestData.amountComparison;
    whereClauses.push(`s.amount ${sqlOperator} ${requestData.amount}`);
  }

  if (
    document.getElementById("fieldLocation").checked &&
    requestData.location !== ""
  ) {
    whereClauses.push(
      `s.address_id IN (SELECT address_id FROM dbo.post_office_details WHERE postoffice_id = ${requestData.location})`
    );
  }

  if (document.getElementById("fieldDate").checked && requestData.date !== "") {
    whereClauses.push(
      `s.sale_date ${requestData.dateComparison} '${requestData.date}'`
    );
  }

  if (
    document.getElementById("fieldEmployeeId").checked &&
    requestData.employeeId !== ""
  ) {
    whereClauses.push(`s.emp_id = '${requestData.employeeId}'`);
  }

  if (whereClauses.length > 0) {
    query += ` WHERE ${whereClauses.join(" AND ")}`;
  }

  // Add this line before making the fetch request to see SQL Query
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
        listItem.textContent = `Amount: ${item.amount}, Date: ${formattedDate}, Tracking Number: ${item.tracking_number}, Employee ID: ${item.emp_id}`;
        reportList.appendChild(listItem);
      });

      const resultContainer = document.getElementById("result");
      resultContainer.style.display = "block";
    })
    .catch((error) => {
      console.error(error);
      // Handle errors and provide feedback to the user
    });
}
