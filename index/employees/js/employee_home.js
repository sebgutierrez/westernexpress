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
/**************************** EMPLOYEE TRACKING PAGE**********************************************************/

const view_tracking_form = document.getElementById('view-tracking-form');
const update_tracking_form= document.getElementById('update-tracking-form');
const view_tracking_btn = document.getElementById('view-tracking-btn');
const update_tracking_btn = document.getElementById('update-tracking-btn');

function viewTracking(){

  let tracking_id = document.getElementById('tracking-input').value
  const tracking_id_span = document.getElementById('tracking-id');
  tracking_id_span.innerHTML = tracking_id;

  fetch(`/track/history/${tracking_id}`)
    .then(response => response.json())
    .then(data => {
      if(typeof data.alert === 'undefined'){
        JSONToHTMLTable(data[0], "tracking-table");
      }
      else{
        alert('The tracking ID you sent does not exist!'); 
      }
    })
    .catch(error => (console.error('Fetch error:', error)));	

}

function updateTracking(){

  let tracking_id = document.getElementById('tracking-input').value
  const tracking_id_span = document.getElementById('tracking-id');
  tracking_id_span.innerHTML = tracking_id;

  fetch(`/track/update/${tracking_id}`)
    .then(response => response.json())
    .then(data => {
      if(typeof data.alert === 'undefined'){
        alert(`Tracking for #${tracking_id} was successfully updated!`);
      }
      else{
        alert('The tracking ID you sent does not exist!'); 
      }
    })
    .catch(error => (console.error('Fetch error:', error)));	

}

/*Package overview*/
document.getElementById('package-overview-point').addEventListener('submit', function(event) {
  event.preventDefault(); // Prevent default form submission behavior

  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const packageType = document.getElementById('packageType').value;
  const status = document.getElementById('status').value;

  const queryParams = `?startDate=${startDate}&endDate=${endDate}&packageType=${packageType}&status=${status}`;

  fetch(`/generate-overview/${queryParams}`)
      .then(response => response.text())
      .then(htmlTable => {
        if(typeof data.alert === 'undefined'){
        JSONToHTMLTable(data[0], "packageOverview");
      }
      else{
        alert('Bad Input'); 
      }
      })
      .catch(error => console.error('Fetch error:', error));
});

function JSONToHTMLTable(data, elementToBind) {           
  var col = [];
  for (var i = 0; i < data.length; i++) {
    for (var key in data[i]) {
      if (col.indexOf(key) === -1) {
        col.push(key);
      }
    }
  }

  //This Code creates HTML table
  var table = document.createElement("table");

  //This Code getsrows for header creader above.
  var tr = table.insertRow(-1);

  for (var i = 0; i < col.length; i++) {
    var th = document.createElement("th");
    th.innerHTML = col[i];
    tr.appendChild(th);
  }

  //This Code adds data to table as rows
  for (var i = 0; i < data.length; i++) {

    tr = table.insertRow(-1);

    for (var j = 0; j < col.length; j++) {
      var tabCell = tr.insertCell(-1);
      tabCell.innerHTML = data[i][col[j]];
    }
  }

  //This Code gets the all columns for header
  var divContainer = document.getElementById(elementToBind);
  divContainer.appendChild(table);
}

function toggleForms() {
  if (view_tracking_form.classList.contains('hidden')) {
      view_tracking_form.classList.remove('hidden');
      update_tracking_form.classList.add('hidden');
  } else {
      view_tracking_form.classList.add('hidden');
      update_tracking_form.classList.remove('hidden');
  }
}
/*
view_tracking_btn.onclick = () => {
  var display_value = window.getComputedStyle(view_tracking_form).display;
  if(display_value === 'block'){
    view_tracking_form.style.display = 'none';
    update_tracking_form.style.display = 'block';
  }
  else{
     view_tracking_form.style.display = 'block';
     update_tracking_form.style.display = 'none';
  }
}

update_tracking_btn.onclick = () => {
  var display_value = window.getComputedStyle(update_tracking_form).display;
  if(display_value === 'block'){
    update_tracking_form.style.display = 'none';
    view_tracking_form.style.display = 'block';
  }
  else{
    update_tracking_form.style.display = 'block';
    view_tracking_form.style.display = 'none';
  }
}*/