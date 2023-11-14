/*               JAVASCRIPT FOR ADMIN HOME PAGE                */
const http = require("http");
const url = require("url");
const mssql = require("mssql");
const dbOperations = require("./dbOperations");

/************************** HORIZONTAL LINE ***************************************************************/
//mkaes the shadow appear when scrolling
const horizontalLine = document.querySelector(".horizontal-line");

window.addEventListener("scroll", () => {
  // Check if the user has scrolled down a certain distance (e.g., 100px)
  if (window.scrollY > 100) {
    horizontalLine.classList.add("has-shadow");
  } else {
    horizontalLine.classList.remove("has-shadow");
  }
});

/*************************************************************************************************************/
const links = document.querySelectorAll(".side-nav a");

links.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault(); // Prevent the default link behavior (optional)

    // Remove the "clicked" class from all links
    links.forEach((otherLink) => {
      otherLink.classList.remove("clicked");
    });

    // Add the "clicked" class to the clicked link
    link.classList.add("clicked");
  });
});

function loadContent(contentId) {
  // Hide all content divs
  const contentDivs = document.querySelectorAll(".content > div");
  contentDivs.forEach((div) => {
    div.style.display = "none";
  });

  // Show the selected content
  document.getElementById(contentId).style.display = "block";
}
// Set the "Home" link to be lit up by default
const homeLink = document.querySelector(".side-nav a[href='#']");
homeLink.classList.add("clicked");
loadContent("dashboard");

/**********************************  DROP DOWN MENU  (NOT WORKING AS OF RIGHT NOW)******************************************************/
//Add your JavaScript code here (as previously provided)
const dropdown = document.querySelector(".dropdown");
const dropdownContent = dropdown.querySelector(".dropdown-content");

dropdown.addEventListener("click", () => {
  dropdownContent.style.display =
    dropdownContent.style.display === "block" ? "none" : "block";
});

// Close the dropdown when clicking outside of it
window.addEventListener("click", (event) => {
  if (!event.target.matches(".icon")) {
    dropdownContent.style.display = "none";
  }
});

/**************************** EMPLOYEE SUPPORT TICKET PAGE**********************************************************/
//Example ticket data (replace this with data from backend)
const ticketData = {
  ticketID: 1,
  name: "John Doe",
  email: "john@example.com",
  subject: "Issue with product",
  category: "Technical",
  status: "Open",
  created: "2023-11-03",
};

// Function to add a new row to the support table
function addTicketToTable(data) {
  const tableBody = document.querySelector("#supportTable tbody");
  const newRow = document.createElement("tr");

  newRow.innerHTML = `
    <td>${data.ticketID}</td>
    <td>${data.name}</td>
    <td>${data.email}</td>
    <td>${data.subject}</td>
    <td>${data.category}</td>
    <td>${data.status}</td>
    <td>${data.created}</td>
  `;
  tableBody.appendChild(newRow);
}
// Adding the sample ticket data to the table
addTicketToTable(ticketData);

/***************************************** REPORTS PAGE **********************************************************/
// REPORTS PAGE JS FUNCTION: will send the POST Request once generate report button is clicked based off of user input
// SQL query based off of user input

function generateReport() {
  // Sample data to be sent in the request body
  const requestData = {
    amount: document.getElementById("amount").value,
    location: document.getElementById("location").value,
    dateComparison: document.getElementById("dateComparison").value,
    date: document.getElementById("date").value,
    employeeId: document.getElementById("employeeId").value,
  };

  // Start building the SQL query
  let query = "SELECT s.amount FROM dbo.sales s";

  // Check if amount is selected
  if (document.getElementById("fieldAmount").checked) {
    query += ` WHERE s.amount ${requestData.amountComparison} ${requestData.amount}`;
  }

  // Check if location is selected
  if (document.getElementById("fieldLocation").checked) {
    // Assuming postoffice_id is the foreign key linking sales to postoffice_details
    query += ` INNER JOIN dbo.postoffice_details pd ON s.postoffice_id = pd.postoffice_id WHERE pd.address_id = ${requestData.location}`;
  }

  // Check if date is selected
  if (document.getElementById("fieldDate").checked) {
    query += ` AND s.sale_date ${requestData.dateComparison} '${requestData.date}'`;
  }

  // Check if employeeId is selected
  if (document.getElementById("fieldEmployeeId").checked) {
    // Assuming emp_id is the foreign key linking sales to employees_new
    query += ` INNER JOIN dbo.employees_new e ON s.emp_id = e.emp_id WHERE e.emp_id = ${requestData.employeeId}`;
  }

  // ... Continue building the query based on other user input ...

  // Make a POST request to the backend endpoint
  fetch("http://localhost:3000/generateReport", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }), // Send the constructed query to the backend
  })
    .then((response) => response.json())
    .then((data) => {
      // Process the data and update the frontend
      const reportList = document.getElementById("reportList");
      reportList.innerHTML = "";

      data.forEach((item) => {
        const listItem = document.createElement("li");
        listItem.textContent = JSON.stringify(item);
        reportList.appendChild(listItem);
      });

      // Show the result container
      const resultContainer = document.getElementById("result");
      resultContainer.style.display = "block";
    })
    .catch((error) => console.error(error));
}

/* CREATING A HTTP SERVER FOR REPORTS PAGE */
const server = http.createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/generateReport") {
    try {
      // Assuming you are sending data in the request body
      let requestBody = "";
      req.on("data", (chunk) => {
        requestBody += chunk.toString();
      });

      req.on("end", async () => {
        // Parse the JSON data from the request body
        const requestData = JSON.parse(requestBody);

        // Connect to the database
        await mssql.connect({
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          server: process.env.DB_SERVER,
          database: process.env.DB_DATABASE,
          encrypt: true,
        });

        // Execute a query (customize this query based on your needs)
        const result = await mssql.query(
          "SELECT * FROM YourTable WHERE someCondition = @param",
          {
            param: requestData.someParam,
          }
        );

        // Send the result to the frontend
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result.recordset));
      });
    } catch (error) {
      console.error(error);
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
    } finally {
      // Close the database connection
      await mssql.close();
    }
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
