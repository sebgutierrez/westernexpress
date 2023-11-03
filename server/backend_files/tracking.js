// Importing https module 
const http = require('http'); 
  
// Setting the configuration for 
// the request 
const options = { 
    hostname: 'jsonplaceholder.typicode.com', 
    path: '/tracking', 
    method: 'POST'
}; 
    
// Sending the request 
const req = http.request(options, (res) => { 
    let data = ''
     
    res.on('data', (chunk) => { 
        data += chunk; 
    }); 
    
    // Ending the response  
    res.on('end', () => { 
        console.log('Body:', JSON.parse(data)) 
    }); 
       
}).on("error", (err) => { 
    console.log("Error: ", err) 
}).end()