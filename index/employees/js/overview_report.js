if (typeof require !== "undefined") {
  const path = require("path");
  require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
}

function formSubmission(){

  // https://main.d2xbxyr9nuopel.amplifyapp.com
  //https://westernexpresspostal.azurewebsites.net
  let startDate = document.getElementById('startDate');
  let endDate = document.getElementById('endDate');
  let packageType = document.getElementById('startDate');
  let package_status = document.getElementById('startDate');
  
  let url = 'http://127.0.0.1:5500//package/overview/';
  
  if (startDate){url += '${startDate}/'};
  if (endDate){url += '${endDate}/'};
  if (packageType){url += '${packageType}/'};
  if (package_status){url += '${package_status}'};
  
  fetch(url)
    .then(response => response.json())
    .then(data => {
      if(typeof data.alert === 'undefined'){
        JSONToHTMLTable(data[0], "package_overview");
      }
      else{
        alert('Invalid!'); 
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