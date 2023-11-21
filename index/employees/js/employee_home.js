/*               JAVASCRIPT FOR EMPLOYEE HOME PAGE                */

/************************** HORIZONTAL LINE ***************************************************************/
//mkaes the shadow appear when scrolling
const horizontalLine = document.querySelector(".horizontal-line");

const BASE_URL = '';
//const BASE_URL = 'https://westernexpresspostal.azurewebsites.net';

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
function viewTracking(){
  let tracking_id = document.getElementById('view-tracking-input').value;
  const tracking_id_span = document.getElementById('tracking-id');
  tracking_id_span.innerHTML = tracking_id;
  // https://main.d2xbxyr9nuopel.amplifyapp.com
  fetch(`${BASE_URL}/track/history/${tracking_id}`)
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

  let tracking_id = document.getElementById('update-tracking-input').value;
  let employee_id = document.getElementById('update-tracking-employee').value;
  let status = document.getElementById('update-tracking-status').value;

  const data = {
    'tracking_id': tracking_id,
    'employee_id': employee_id,
    'status': status
  };

  console.log(data);
  fetch(`${BASE_URL}/track/update`, {
    headers : {
      "Content-type": "application/json; charset=UTF-8"
    },
    method : 'POST',
    body : JSON.stringify(data)
  })
  .then(response => response.json())
  .then(data => {
    if(typeof data.alert === 'undefined'){
      console.log(data)
      alert(`Tracking for #${tracking_id} was successfully updated!`);
    }
    else{
      console.log(data)
      alert('The tracking ID you sent does not exist!'); 
    }
  })
  .catch(error => (console.error('Fetch error:', error)));	
}

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

  //This Code getsrows for header creator above.
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

/*const view_tracking_form = document.getElementById('view-tracking-form');
const update_tracking_form= document.getElementById('update-tracking-form');
const view_tracking_btn = document.getElementById('view-tracking-btn');
const update_tracking_btn = document.getElementById('update-tracking-btn');*/

/**************************** EMPLOYEE CLOCKIN / CLOCKOUT **********************************************************/

function clockIn(){
  let username = document.getElementById('clockin-user-input').value;
  let password = document.getElementById('clockin-pass-input').value;

  const data = {
    'username': username,
    'password': password
  };

  console.log(data);
  fetch(`${BASE_URL}/clockin`, {
    headers : {
      "Content-type": "application/json; charset=UTF-8"
    },
    method : 'POST',
    body : JSON.stringify(data)
  })
  .then(response => response.json())
  .then(data => {
    if(typeof data.alert === 'undefined'){
      console.log(data)
      alert(`You successfully clocked in!`);
    }
    else{
      console.log(data)
      alert('The username and/or password is incorrect!'); 
    }
  })
  .catch(error => (console.error('Fetch error:', error)));	
}

function clockOut(){
  let username = document.getElementById('clockout-user-input').value;
  let password = document.getElementById('clockout-pass-input').value;

  const data = {
    'username': username,
    'password': password
  };

  console.log(data);
  fetch(`${BASE_URL}/clockout`, {
    headers : {
      "Content-type": "application/json; charset=UTF-8"
    },
    method : 'POST',
    body : JSON.stringify(data)
  })
  .then(response => response.json())
  .then(data => {
    if(typeof data.alert === 'undefined'){
      console.log(data)
      alert(`You successfully clocked out!`);
    }
    else{
      console.log(data)
      alert('The username and/or password is incorrect!'); 
    }
  })
  .catch(error => (console.error('Fetch error:', error)));	
}