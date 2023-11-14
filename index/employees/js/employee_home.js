/*               JAVASCRIPT FOR EMPLOYEE HOME PAGE                */

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
function loadContent(contentId) {
  // Hide all content divs
  const contentDivs = document.querySelectorAll(".content > div");
  contentDivs.forEach((div) => {
    div.style.display = "none";
  });

  // Show the selected content
  document.getElementById(contentId).style.display = "block";
}

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