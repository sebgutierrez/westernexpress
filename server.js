const config = require('./server/config.js');
const tracking = require('./server/backend_files/tracking.js');
const shift = require('./server/backend_files/shifts.js');
const support = require('./server/backend_files/support.js');
const overview = require('./server/backend_files/overview.js');
const salaryOverview = require("./server/admin_backend/salaryOverview.js");
const salesOverview = require("./server/admin_backend/salesOverview.js");

require('dotenv').config();

const express = require('express');
const sql = require('mssql');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
//const crypto = require('crypto');

const app = express();
const router = express.Router();
const PORT = process.env.PORT;

app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json());
app.use(cors());

/* server static files */
const path = require('path')
app.use(express.static(path.join(__dirname, 'public')))

// Middleware to handle CORS headers
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS, POST, GET");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-Requested-With,content-type"
    );
    res.setHeader("Access-Control-Allow-Credentials", true);
    next();
});

  //////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////////////////
  // Add this middleware to enable sessions
  app.use(session({
    secret: 'adsfadsreqwrsdfdsafdsfete', // Change this to a secure random key
    resave: false,
    saveUninitialized: false,
    cookie: {
        sameSite: true,
        secure: false, //make sure to make this true when deploying
        expires: false
      }
  }));
  
app.get('/track/history/:id', (req, res) => {
    tracking.customerTracking(req.params.id)
    .then(result => {
        res.send(result);
    })
});

app.post('/track/update', (req, res) => {
    tracking.employeePackageUpdate(req.body)
    .then(result => {
        res.send(result);
    })
});

app.get('/track/package/:id', (req, res) => {
    tracking.customerPackage(req.params.id)
    .then(result => {
        res.send(result);
    })
});

app.post('/employee-support', (req, res) => {
  console.log(req.body.password);
    support.getSupportTickets(req.body.password)
    .then(result => {
        res.send(result);
    })
});

app.post('/viewTicket', (req, res) => {
    support.viewTicket(req.body.ticket_number)
    .then(result => {
        res.send(result);
    })
});

app.post('/updateTicket', (req, res) => {
    support.updateTicket(req.body.status, req.body.reply, req.body.ticket_number)
    .then(result => {
        res.send(result);
    })
});

app.post('/clockin', (req, res) => {
    console.log(req.body.username, req.body.password);
    shift.clockIn(req.body.username, req.body.password)
    .then(result => {
        res.send(result);
    })
});


app.post('/clockout', (req, res) => {
    console.log(req.body.username, req.body.password);
    shift.clockOut(req.body.username, req.body.password)
    .then(result => {
        res.send(result);
    })
});

app.get('/employeeData', async (req, res) => {
  try {
    console.log(req.session);
    console.log(req.session.emp_username);
    const user = req.session.emp_username;
    const searchQuery = req.query.search || ''; // Extract the search query from the URL

    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('username', sql.VarChar, user)
      .input('search', sql.VarChar, `%${searchQuery}%`) // Use the search query in the SQL query
      .query(`
        SELECT
          E.postoffice_id AS [Post Office ID],
          S.emp_id AS [Employee ID],
          CONCAT(E.first_name,' ', E.last_name) AS [Name],
          S.tracking_number AS [Tracking Number],
          S.sale_date AS [Sale Date],
          S.amount AS [Amount]
        FROM dbo.sales AS S
        INNER JOIN dbo.employees_new AS E ON E.emp_id = S.emp_id
        WHERE E.username = @username
        AND (E.first_name LIKE @search OR E.last_name LIKE @search OR S.tracking_number LIKE @search OR S.amount LIKE @search OR S.sale_date LIKE @search)
        ORDER BY [Sale Date] ASC`);
   console.log(result.recordset);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/alerts', (req, res) => {
    console.log(req.session);
    if(typeof req.session.customer_username != 'undefined'){
        shift.sendAlertMessage(req.session.customer_username)
        .then(result => {
            res.send(result);
        })
    }
    else if(typeof req.session.emp_username != 'undefined'){
        shift.sendAlertMessage(req.session.emp_username)
        .then(result => {
            res.send(result);
        })
    }
});

app.post("/generateReport", async (req, res) => {
  console.log(req.body);
 
 
  // Assuming your generateReportOverview function is in salesOverview.js and returns a promise
  salesOverview
    .generateSalesOverview(
      req.body.amount,
      req.body.amountComparison,
      req.body.location,
      req.body.date,
      req.body.dateComparison,
      req.body.employeeId
    )
    .then((result) => {
      res.send(result);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send({ error: "Internal Server Error" });
    });
 });
 

 app.post("/generateSalaryReport", async (req, res) => {
  console.log(req.body);
 
 
  // Assuming your generateSalaryOverview function is in salaryOverview.js and returns a promise
  salaryOverview
    .generateSalaryOverview(
      req.body.employeeId,
      req.body.amountComparison,
      req.body.amount,
      req.body.role,
      req.body.location
    )
    .then((result) => {
      res.send(result);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send({ error: "Internal Server Error" });
    });
 });

 
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// user authen + create label AJ CODE START
// Function to generate a random number between min and max (inclusive)
const getRandomInt = (min, max) => {
    const range = max - min + 1;
    return Math.floor(Math.random() * range) + min;
  };
  
  
  //////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////////////////
  // Signup route
  app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'index', 'signup.html'));
  });
  
  
  app.post('/signup', async (req, res) => {
    try {

        const pool = await sql.connect(config);
  
        // Generate a unique customer ID
        const lastCustomerIdResult = await pool.request().query('SELECT MAX(customer_id) AS max_customer_id FROM customer');
        const lastCustomerId = lastCustomerIdResult.recordset[0].max_customer_id || 99; // Set to 99 to start from 100
        const customerId = parseInt(lastCustomerId) + 1;
  
        // Generate a unique address ID
        const lastAddressIdResult = await pool.request().query('SELECT MAX(address_id) AS max_address_id FROM addresses');
        const lastAddressId = lastAddressIdResult.recordset[0].max_address_id || 100;
        const addressId = lastAddressId + 1;  
  
        // Insert into the address table
        await pool.request()
            .input('addressId', sql.Int, addressId)
            .input('address', sql.VarChar, req.body.address)
            .input('city', sql.VarChar, req.body.city)
            .input('state', sql.Char, req.body.state)
            .input('zipcode', sql.Int, req.body.zipcode)
            .query('INSERT INTO addresses (address_id, address, city, state, zip) VALUES (@addressId, @address, @city, @state, @zipcode)');
  
        await pool.request()
            .input('customerId', sql.BigInt, customerId)
            .input('firstname', sql.VarChar, req.body.firstname)
            .input('lastname', sql.VarChar, req.body.lastname)
            .input('username', sql.NVarChar, req.body.username)
            .input('password', sql.NVarChar, req.body.password)
            .input('phoneNumber', sql.VarChar, req.body.phoneNumber)
            .input('email', sql.VarChar, req.body.email)
            .input('addressId', sql.Int, addressId)
            .query('INSERT INTO customer (customer_id, first_name, last_name, login, password_, phone, email, address_id) VALUES (@customerId, @firstname, @lastname, @username, @password, @phoneNumber, @email, @addressId)');
        
        res.redirect('./sign_in.html');
    } catch (err) {
        console.error('Error occurred:', err);
        res.status(500).send('Error while processing your request');
    } 
  });
  
  //////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////////////////
  // login route
  app.post('/login', async (req, res) => {
    try {

        const pool = await sql.connect(config);
  
        ///////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////// Check for customer login
        const customerResult = await pool.request()
        .input('username', sql.VarChar, req.body.username)
        .input('password', sql.VarChar, req.body.password)
        .query('SELECT customer_id, username FROM customer WHERE login = @username AND password_ = @password');
  
        console.log(customerResult.recordsets);

        // Check if there is at least one record
        if (customerResult.recordset.length > 0) {
            const customer_id = customerResult.recordset[0].customer_id;
            const username = customerResult.recordset[0].username;
    
            // Store customer_id in the session
            req.session.customer_id = customer_id;
            // Stor customer_username in the session
            req.session.customer_username = username;

            // Customer login
            // res.sendFile(path.join(__dirname, 'public', 'index', 'customer', 'customer.html'));
            res.redirect('https://westernexpresspostal.azurewebsites.net/index/customer/customer.html');
            return;
        }  
  
        //////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////// Check for employee login
        const employeeResult = await pool.request()
        .input('username', sql.VarChar, req.body.username)
        .input('password', sql.VarChar, req.body.password)
        .query('SELECT emp_id, username, postoffice_id FROM employees_new WHERE login_emp = @username AND password_emp = @password');
  
        // Check if there is at least one record
        if (employeeResult.recordset.length > 0) {
            const emp_id = employeeResult.recordset[0].emp_id;
            const username = employeeResult.recordset[0].username;
            const postoffice_id = employeeResult.recordset[0].postoffice_id;

            // Store employerIDNumber in the session
            req.session.emp_id = emp_id;
            req.session.emp_username = username;
            req.session.postoffice_id = postoffice_id;

            // Employee login
            //res.sendFile(path.join(__dirname, 'public', 'index', 'employees', 'employee_home.html'));
            
            res.redirect('https://westernexpresspostal.azurewebsites.net/index/employees/employee_home.html');
            return;
        }
  
        //////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////// Check for admin login
        const adminResult = await pool.request()
        .input('username', sql.VarChar, req.body.username)
        .input('password', sql.VarChar, req.body.password)
        .query('SELECT ad_id FROM admins WHERE login_ad = @username AND password_ad = @password');
  
        console.log(adminResult.recordsets);
        // Check if there is at least one record
        if (adminResult.recordset.length > 0) {
            const ad_id = adminResult.recordset[0].ad_id;
    
            // Store adminIDNumber in the session
            req.session.ad_id = ad_id;
    
            // Admin login
            // res.sendFile(path.join(__dirname, 'public', 'index', 'admin', 'admin_home.html'));
            res.redirect('https://westernexpresspostal.azurewebsites.net/index/admin/admin_home.html');
            return;
        }
  
        /////////////////////////////////////////////////////////
        // If none of the above conditions match, it's an invalid username or password
        res.send('Invalid username or password');
    } catch (err) {
        console.error('Error while connecting to the database:', err);
        res.send('Error while connecting to the database');
    }
});  
  
// Signup route customer
app.post('/employee/signup', async (req, res) => {
  try {
    const pool = await sql.connect(config);

    // Generate a unique emp ID
    const lastemp_idIdResult = await pool.request().query('SELECT MAX(emp_id) AS max_emp_id FROM employees_new');
    const lastemp_idId = lastemp_idIdResult.recordset[0].max_emp_id || 99; // Set to 99 to start from 100
    const empId = parseInt(lastemp_idId) + 1;

    // Generate a unique emp address ID
    const lastAddressIdResult = await pool.request().query('SELECT MAX(address_id) AS max_address_id FROM addresses');
    const lastAddressId = lastAddressIdResult.recordset[0].max_address_id || 100;
    const addressId = lastAddressId + 1;

    // Insert into the address table
    await pool.request()
      .input('addressId', sql.Int, addressId)
      .input('address', sql.VarChar, req.body.address)
      .input('city', sql.VarChar, req.body.city)
      .input('state', sql.Char, req.body.state)
      .input('zipcode', sql.Int, req.body.zipcode)
      .query('INSERT INTO addresses (address_id, address, city, state, zip) VALUES (@addressId, @address, @city, @state, @zipcode)');

    // Insert into the employees_new table
    
    await pool.request()
      .input('empId', sql.BigInt, empId)
      .input('firstname', sql.VarChar(255), req.body.firstname)
      .input('lastname', sql.VarChar(255), req.body.lastname)
      .input('username', sql.NVarChar(255), req.body.username)
      .input('password', sql.NVarChar(255), req.body.password)
      .input('phoneNumber', sql.VarChar(20), req.body.phoneNumber) // Adjust the length based on your needs
      .input('email', sql.VarChar(255), req.body.email)
      .input('addressId', sql.Int, addressId)
      .input('postalOfficeId', sql.Int, req.body.postOfficeLocation)
      .query(`
        INSERT INTO employees_new 
        (emp_id, first_name, last_name, login_emp, password_emp, number, email, address_id,postoffice_id) 
        VALUES 
        (@empId, @firstname, @lastname, @username, @password, @phoneNumber, @email, @addressId,@postalOfficeId)
      `);

    alert('Successfully created user!');
  } catch (err) {
    console.error('Error occurred:', err);
    res.status(500).send('Error while processing your request');
  }
});
  //////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////////// 
  // Handle GET request for creating a label for customer view
  const { v4: uuidv4 } = require('uuid');
  app.post('/createlabel', async (req, res) => {
      try {
        // Connect to the database
        const pool = await sql.connect(config);
    
        // Begin a database transaction
        const transaction = new sql.Transaction();
        await transaction.begin();
    
        try {
          // Generate primary keys IDs // using this because database was not set up to auto-increment :(
          const addressId = getRandomInt(7000, 8000);
          const senderId = getRandomInt(8000, 9000);
          const addressId_rec = getRandomInt(4000, 8000);
          const receiver_id_uui = getRandomInt(1000, 7000);
  
          //test print
          console.log('addressId_rec:', addressId_rec);
          console.log('address',addressId)
    
          ////////////////////////////////////////////////////////////////////////////////////////
          //////////////////////////////////////////// Insert data into the addresses table for sender
          const senderAddressResult = await pool
            .request()
            .input('addressId', sql.Int, addressId)
            .input('fromAddress', sql.NVarChar, req.body.fromAddress)
            .input('fromCity', sql.NVarChar, req.body.fromCity)
            .input('fromState', sql.Char, req.body.fromState)
            .input('fromZip', sql.Int, req.body.fromZip)
            .query(`
              INSERT INTO addresses (address_id, address, city, state, zip)
              VALUES (@addressId, @fromAddress, @fromCity, @fromState, @fromZip)
            `);
    
          // Retrieve customerID from the session
          const customerID = req.session.customer_id;
          console.log('customerID:', customerID);
          console.log(req.session)
           
          ////////////////////////////////////////////////////////////////////////////////////////
          ////////////////////////////////////////////// Insert data into the sender table
          const senderResult = await pool
            .request()
            .input('senderId', sql.Int, senderId)
            .input('fromFirstName', sql.NVarChar, req.body.fromFirstName)
            .input('fromLastName', sql.NVarChar, req.body.fromLastName)
            .input('fromEmail', sql.NVarChar, req.body.fromEmail)
            .input('senderAddressId', sql.Int, addressId)
            .input('customerID', sql.Int, customerID)
            .query(`
              INSERT INTO sender (sender_id, first_name, last_name, email, FK_address_id, FK_customer_id)
              VALUES (@senderId, @fromFirstName, @fromLastName, @fromEmail, @senderAddressId, @customerID)
            `);
             
            ////////////////////////////////////////////////////////////////////////////////////////
          // Insert address for the receiver table
          const receiverAddressResult = await pool
            .request()
            .input('addressId_rec', sql.Int, addressId_rec)
            .input('toAddress', sql.NVarChar, req.body.toAddress)
            .input('toCity', sql.NVarChar, req.body.toCity)
            .input('toState', sql.Char, req.body.toState)
            .input('toZip', sql.Int, req.body.toZip)
            .query(`
              INSERT INTO addresses (address_id, address, city, state, zip)
              VALUES (@addressId_rec, @toAddress, @toCity, @toState, @toZip)
            `);
    
          // Check if there is at least one record
          let receiverAddressId;
          if (receiverAddressResult.rowsAffected.length > 0) {
            // Get the inserted address_id for the receiver
            receiverAddressId = addressId_rec;
          } else {
            // Handle the case where no records were inserted
          }
             
          ////////////////////////////////////////////////////////////////////////////////////////
          // Insert data into the receiver table
          const receiverResult = await pool
            .request()
            .input('receiver_id_uui', sql.Int, receiver_id_uui)
            .input('toFirstName', sql.NVarChar, req.body.toFirstName)
            .input('toLastName', sql.NVarChar, req.body.toLastName)
            .input('toEmail', sql.NVarChar, req.body.toEmail)
            .input('FK_address_id', sql.Int, receiverAddressId)
            .input('customerID', sql.Int, customerID)
            .query(`
              INSERT INTO receiver (receiver_id, first_name, last_name, email, FK_address_id,FK_customer_id)
              VALUES (@receiver_id_uui, @toFirstName, @toLastName, @toEmail, @FK_address_id,@customerID)
            `);   
          
           ////////////////////////////////////////////////////////////////////////////////////////
           //generate tracking number
           tracking_ready=getRandomInt(10000000,90000000)
           //const sendDate = new Date();
          // Insert data into package
          const packageResult = await pool
          .request()
          .input('trackingNumber',sql.BigInt,tracking_ready)
          .input('senderID',sql.Int,senderId)
          .input('receiverID',sql.Int,receiver_id_uui)
          .input('description',sql.VarChar,req.body.description)
          .input('fkdimension',sql.Int,req.body.dimensions)
          .input('weight',sql.Int,req.body.weight)
          .input('cost',sql.Decimal(10,2),req.body.cost)
          .input('class',sql.VarChar,req.body.class)
          .input('createdBy',sql.Int,customerID)
          .query(`
              INSERT INTO package (tracking_number, sender_id, receiver_id, description, FK_dimensions, weight, cost, class,package_createdby)
              VALUES (@trackingNumber, @senderID, @receiverID, @description, @fkdimension, @weight, @cost, @class, @createdBy);
            `); 
          
          // Commit the transaction
          await transaction.commit();
    
           // Create a user-friendly success message
          const successMessage = `
          Shipping label created successfully!\n
  
          Tracking Number: ${tracking_ready} \n
          Description: ${req.body.description}\n
          Dimensions: ${req.body.dimensions}\n
          Weight: ${req.body.weight}\n
          Cost: ${req.body.cost}\n
          Class: ${req.body.class}\n
  
  
          Thank you for choosing Western Express Logistics
          
          `;
    
          // Send a success response
          res.send(successMessage);
        } catch (err) {
          // Rollback the transaction in case of an error
          await transaction.rollback();
          throw err;
        }
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Internal Server Error');
      } finally {
        // Close the database connection
        await sql.close();
      }
    });
  
  //////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////////// 
  // Handle GET request for creating a label for emp view
  app.post('/employee/createlabel', async (req, res) => {
      try {
        // Connect to the database
        const pool = await sql.connect(config);
    
        // Begin a database transaction
        const transaction = new sql.Transaction();
        await transaction.begin();
    
        try {
          // Generate primary keys IDs // using this because database was not set up to auto-increment :(
          const addressId = getRandomInt(2000, 3000);
          const senderId = getRandomInt(3000, 4000);
          const addressId_rec = getRandomInt(5000, 10000);
          const receiver_id_uui = getRandomInt(6000, 7000);
  
          //test print
          console.log('addressId_rec:', addressId_rec);
          console.log('address',addressId)
    
          ////////////////////////////////////////////////////////////////////////////////////////
          //////////////////////////////////////////// Insert data into the addresses table for sender
          const senderAddressResult = await pool
            .request()
            .input('addressId', sql.Int, addressId)
            .input('fromAddress', sql.NVarChar, req.body.fromAddress)
            .input('fromCity', sql.NVarChar, req.body.fromCity)
            .input('fromState', sql.Char, req.body.fromState)
            .input('fromZip', sql.Int, req.body.fromZip)
            .query(`
              INSERT INTO addresses (address_id, address, city, state, zip)
              VALUES (@addressId, @fromAddress, @fromCity, @fromState, @fromZip)
            `);
    
          // Retrieve customerID from the session
          const empID = req.session.emp_id;
          console.log('empID:', empID);
          console.log(req.session)
       
          ////////////////////////////////////////////////////////////////////////////////////////
          ////////////////////////////////////////////// Insert data into the sender table
          const senderResult = await pool
            .request()
            .input('senderId', sql.Int, senderId)
            .input('fromFirstName', sql.NVarChar, req.body.fromFirstName)
            .input('fromLastName', sql.NVarChar, req.body.fromLastName)
            .input('fromEmail', sql.NVarChar, req.body.fromEmail)
            .input('senderAddressId', sql.Int, addressId)
            .input('empID', sql.Int, empID)
            .query(`
              INSERT INTO sender (sender_id, first_name, last_name, email, FK_address_id, emp_id)
              VALUES (@senderId, @fromFirstName, @fromLastName, @fromEmail, @senderAddressId, @empID)
            `);    
          
            ////////////////////////////////////////////////////////////////////////////////////////
          // Insert address for the receiver table
          const receiverAddressResult = await pool
            .request()
            .input('addressId_rec', sql.Int, addressId_rec)
            .input('toAddress', sql.NVarChar, req.body.toAddress)
            .input('toCity', sql.NVarChar, req.body.toCity)
            .input('toState', sql.Char, req.body.toState)
            .input('toZip', sql.Int, req.body.toZip)
            .query(`
              INSERT INTO addresses (address_id, address, city, state, zip)
              VALUES (@addressId_rec, @toAddress, @toCity, @toState, @toZip)
            `);
    
          // Check if there is at least one record
          let receiverAddressId;
          if (receiverAddressResult.rowsAffected.length > 0) {
            // Get the inserted address_id for the receiver
            receiverAddressId = addressId_rec;
          } else {
            // Handle the case where no records were inserted
          }
          
          ////////////////////////////////////////////////////////////////////////////////////////
          // Insert data into the receiver table
          const receiverResult = await pool
            .request()
            .input('receiver_id_uui', sql.Int, receiver_id_uui)
            .input('toFirstName', sql.NVarChar, req.body.toFirstName)
            .input('toLastName', sql.NVarChar, req.body.toLastName)
            .input('toEmail', sql.NVarChar, req.body.toEmail)
            .input('FK_address_id', sql.Int, receiverAddressId)
            .input('empID', sql.Int, empID)
            .query(`
              INSERT INTO receiver (receiver_id, first_name, last_name, email, FK_address_id,emp_id)
              VALUES (@receiver_id_uui, @toFirstName, @toLastName, @toEmail, @FK_address_id,@empID)
            `);
     
           ////////////////////////////////////////////////////////////////////////////////////////
           //generate tracking number
           tracking_ready=getRandomInt(10000000,90000000)
           //const sendDate = new Date();
          // Insert data into package
          const packageResult = await pool
          .request()
          .input('trackingNumber',sql.BigInt,tracking_ready)
          .input('senderID',sql.Int,senderId)
          .input('receiverID',sql.Int,receiver_id_uui)
          .input('description',sql.VarChar,req.body.description)
          .input('fkdimension',sql.Int,req.body.dimensions)
          .input('weight',sql.Int,req.body.weight)
          .input('cost',sql.Decimal(10,2),req.body.cost)
          .input('class',sql.VarChar,req.body.class)
          .input('createdBy',sql.Int,empID)
          .query(`
              INSERT INTO package (tracking_number, sender_id, receiver_id, description, FK_dimensions, weight, cost, class,package_createdby)
              VALUES (@trackingNumber, @senderID, @receiverID, @description, @fkdimension, @weight, @cost, @class, @createdBy);
            `);
          
          // Commit the transaction
          await transaction.commit();
  
           // Create a user-friendly success message
           const successMessage = `
           Shipping label created successfully!\n
   
           Tracking Number: ${tracking_ready} \n
           Description: ${req.body.description}\n
           Dimensions: ${req.body.dimensions}\n
           Weight: ${req.body.weight}\n
           Cost: ${req.body.cost}\n
           Class: ${req.body.class}\n
   
           Thank you for choosing Western Express Logistics
           Created by: ${empID}
          `;

          // Send a success response
          res.send(successMessage);
        } catch (err) {
          // Rollback the transaction in case of an error
          await transaction.rollback();
          throw err;
        }
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Internal Server Error');
      } finally {
        // Close the database connection
        await sql.close();
      }
    });

//////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////// 
// Route when a package is receved at a postal office by customer, this modifes the status
app.post('/incomingpackages', async (req, res) => {

  try {

    // Create a SQL Server connection pool
    const pool = await sql.connect(config);

    // Begin a new transaction
    const transaction = await pool.transaction();


    // get the postal_id- employee is working in
    const postalID = req.session.postoffice_id;
    const empID = req.session.emp_id;
    console.log(empID)
    console.log(postalID)

    // Use the transaction for both queries
    await transaction.begin();
    

    // Insert the new package into the incoming_packages table
    await pool.request()
        .input('trackingNumber', sql.BigInt, req.body.trackingNumberInput)
        .input('postalId', sql.Int, postalID)
        .input('empID', sql.Int, empID)
        .query('INSERT INTO incoming_packages (tracking_number, postoffice_id, emp_id) VALUES (@trackingNumber, @postalId, @empID)');


    // Update the status of the package in the package table to "In Transit"
    await pool.request()
        .input('trackingNumber', sql.BigInt, req.body.trackingNumberInput)
        .query('UPDATE package SET status = \'ARRIVED AT FACILITY\' WHERE tracking_number = @trackingNumber');

    // Commit the transaction
    await transaction.commit(); 



    // Send a success response to the client
    res.json({ success: true, message: 'Package information saved successfully!!' });

} catch (error) {
    console.error('Error saving package information:', error);
    res.status(500).send('Internal server error');
}
});

//////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////// 
// Route to retrieve past shipments for customer page
async function queryPastShipments(customerID) {
  let pool;
  try {
    // Request a connection from the pool using the global config
    pool = await sql.connect(config);

    // Begin a database transaction
    const transaction = new sql.Transaction();
    await transaction.begin();

    
    // Log the customerID to the console
    console.log('Customer ID shippments:', customerID);


    const result = await pool
      .request(transaction)
      .input('customeriD', sql.Int, customerID)
      .query(`
      SELECT
        p.sendDate,
        p.tracking_number,
        a.address AS sender_address,
        p.postoffice_id,
        p.package_status
      FROM
          package p
      INNER JOIN
          sender s ON p.sender_id = s.sender_id
      INNER JOIN
          customer c ON s.FK_customer_id = c.customer_id
      INNER JOIN
          addresses a ON c.address_id = a.address_id
      WHERE
          s.FK_customer_id = @customeriD
      ORDER BY
          p.sendDate DESC;
      `);

    // Commit the transaction
    await transaction.commit();


    
 

    // Return the result set
    return result.recordset;
  } catch (err) {
    // Handle errors during the query
    console.error('Error querying past shipments:', err.message);
    throw err;
  } finally {
    // Release the connection back to the pool
    if (pool) {
      await pool.close();
    }
  }
}

// 2. Your route handler
app.get('/past-shipments', async (req, res) => {
  try {
    const customerID_past_shippment1 = req.session.customer_id;
    const pastShipmentsData = await queryPastShipments(customerID_past_shippment1);
    res.json(pastShipmentsData);
  } catch (err) {
    console.error('Error handling request:', err.message);
    res.status(500).send('Internal Server Error');
  }
});



//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
// Route customer page/edit profile
app.post('/user/update', async (req, res) => {
  try {
    await sql.connect(config);

    const customerID_editprofile = req.session.customer_id;

    // Log the form data
    console.log("Request Body:", req.body);

    // Construct the SQL query based on the form data
    const query = `
      -- Update the address details in the addresses table
      UPDATE addresses
      SET
        address = COALESCE(@address, address),
        city = COALESCE(@city, city),
        state = COALESCE(@state, state),
        zip = COALESCE(@zip, zip)
      WHERE
        address_id = (SELECT address_id FROM customer WHERE customer_id = @customer_id);

      -- Update customer information
      UPDATE customer
      SET
        first_name = COALESCE(@firstname, first_name),
        last_name = COALESCE(@lastname, last_name),
        phone = COALESCE(@phone, phone),
        email = COALESCE(@email, email)
      WHERE
        customer_id = @customer_id;
    `;

    // Define input parameters
    const params = new sql.Request();
    params.input('firstname', sql.VarChar, req.body.firstname);
    params.input('lastname', sql.VarChar, req.body.lastname);
    params.input('phone', sql.VarChar, req.body.phone);
    params.input('email', sql.VarChar, req.body.email);
    params.input('customer_id', sql.Int, customerID_editprofile);
    params.input('address', sql.VarChar, req.body.address);
    params.input('city', sql.VarChar, req.body.city);
    params.input('state', sql.Char(2), req.body.state);
    params.input('zip', sql.Int, req.body.zip);

    // Log for error if the SQL query and parameters
    //console.log("SQL Query:", query);
    //console.log("Parameters:", params);

    // Execute the query with parameters
    await params.query(query);

    res.send('Profile updated successfully');


  } catch (err) {
    console.error(err);

  } finally {
    sql.close();
  }
});




//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
// Endpoint for deleting customer account
app.post('/user/delete', async (req, res) => {
  try {
    await sql.connect(config);

    const customerIDToDelete = req.session.customer_id;
    const passwordToDelete = req.body.password;

    // Verify the password before proceeding with the deletion
    const passwordCheckQuery = `
      SELECT customer_id
      FROM customer
      WHERE customer_id = @customer_id AND password_ = @password;
    `;

    const passwordCheckParams = new sql.Request();
    passwordCheckParams.input('customer_id', sql.Int, customerIDToDelete);
    passwordCheckParams.input('password', sql.VarChar, passwordToDelete);

    const passwordCheckResult = await passwordCheckParams.query(passwordCheckQuery);
    console.log(passwordCheckResult.recordset[0]);
    if (passwordCheckResult.recordset[0].length === 0) {
      // Incorrect password
      return res.status(401).send('Incorrect password. Account deletion failed.');
    }

    // Password is correct, proceed with deletion
    const deleteQuery = `
      DELETE FROM customer
      WHERE customer_id = @customer_id;
    `;

    const deleteParams = new sql.Request();
    deleteParams.input('customer_id', sql.Int, customerIDToDelete);

    await deleteParams.query(deleteQuery);

    // You can add additional queries here to delete related information in other tables

    
    res.redirect('/index.html');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting account.');
  } finally {
    sql.close();
  }
});





//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
// Customer support - create a ticket
app.post('/customer/support', async (req, res) =>{

  const { title, description, department, priority } = req.body;

  try {
    // Connect to the database
    const pool = await sql.connect(config);
    const customerSupportID = req.session.customer_id
    const ticket_status = 'Open'

    // Insert data into the database using parameters
    const result = await pool.request()
    .input("customerID", sql.Int, customerSupportID)
    .input('title', sql.NVarChar, title)
    .input('description', sql.NVarChar, description)
    .input('department', sql.NVarChar, department)
    .input('priority', sql.NVarChar, priority)
    .input('status', sql.NVarChar, ticket_status)
    .query(`
      INSERT INTO customer_support (customer_id,title, description, department, priorit,status)
      VALUES (@customerID,@title, @description, @department, @priority,@status)
    `);

    console.log('Ticket submitted successfully.');
    res.status(200).json({ success: true, message: 'Ticket submitted successfully' });
  } catch (error) {
    console.error('Error submitting ticket:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  } finally {
    // Close the SQL connection
    await sql.close();
  }

  



})


//////////////////////////////////////////////////////////////////////////////////////////////
// Customer support - view tickets
app.get('/customer/viewTickets', async (req, res) => {
  try {
    // Assuming you have a user ID in the request query
    const pool = await sql.connect(config);
    const customerid = req.session.customer_id;
    console.log('view tickets', customerid)

    // Perform a database query using the pool
    const result = await pool.request()
      .input('customer_id', sql.Int, customerid) // Corrected parameter name
      .query('SELECT ticket_number, description, department, priorit, title, status FROM customer_support WHERE customer_id = @customer_id'); // Corrected parameter name

    // Send the results back to the client
    res.json(result.recordset);
    console.log(result.recordset);
  } catch (error) {
    console.error('Error in /customer/viewTickets:', error);
    res.status(500).send('Internal Server Error');
  }
});


//////////////package overview///////////////////
app.post('/login/overview', (req, res) => {
  console.log(req.body);
  overview.employeePackageOverview(req.body.firstDate, req.body.secDate ,req.body.packageType, req.body.status)
  .then(result => {
      res.send(result);
  })
});

///////////////forget password and reset password////////////////
app.post('/forgot_pass', async (req, res) => {
  try {
    const inputUsername = req.body.username; // Extracting inputUsername from the request body

    const pool = await sql.connect(config);
    const request = pool.request();

    // Queries to check the username in each table
    const customerQuery = `SELECT * FROM dbo.customer WHERE login = @cInputUser`;
    const employeeQuery = `SELECT * FROM dbo.employees_new WHERE login_emp = @eInputUser`;
    const adminQuery = `SELECT * FROM dbo.admins WHERE login_ad = @aInputUser`;


    const [customerResult, employeeResult, adminResult] = await Promise.all([
      request.input('cInputUser', sql.VarChar, inputUsername).query(customerQuery),
      request.input('eInputUser', sql.VarChar, inputUsername).query(employeeQuery),
      request.input('aInputUser', sql.VarChar, inputUsername).query(adminQuery),
    ]);


    const foundUser = {
      customer: customerResult.recordset.length > 0,
      employee: employeeResult.recordset.length > 0,
      admin: adminResult.recordset.length > 0,
    };

    if (foundUser.customer || foundUser.employee || foundUser.admin) {
      req.session.username = inputUsername; // Store username in the session
      req.session.userType = foundUser;
      res.redirect('/index/reset_pass.html');
    } else {
      res.send('Invalid username. Please try again.');
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error while processing your request');
  }
});

app.post('/reset_pass', async (req, res) => {
  try {
    const newPassword = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    if (newPassword !== confirmPassword) {
      res.status(400).send('Passwords do not match. Please try again.');
      return;
    }

    const pool = await sql.connect(config);
    const request = pool.request();

    const username = req.session.username; // Retrieve stored username from session

    if (!username) {
      res.status(404).send('Username not found. Please try again.');
      return;
    }

    const { userType } = req.session; // Retrieve the user type from session

    let updateQuery = '';

    if (userType.customer) {
      updateQuery = `UPDATE dbo.customer SET password_ = @newPassword WHERE login = @cUpdateUser`;
    } else if (userType.employee) {
      updateQuery = `UPDATE dbo.employees_new SET password_emp = @newPassword WHERE login_emp = @eUpdateUser`;
    } else if (userType.admin) {
      updateQuery = `UPDATE dbo.admins SET password_ad = @newPassword WHERE login_ad = @aUpdateUser`;
    } else {
      res.status(404).send('User not found. Please try again.');
      return;
    }

    request.input('newPassword', sql.VarChar, newPassword);
    request.input('cUpdateUser', sql.VarChar, username);
    request.input('eUpdateUser', sql.VarChar, username);
    request.input('aUpdateUser', sql.VarChar, username);

    const result = await request.query(updateQuery);

    if (result.rowsAffected[0] > 0) {
      res.redirect('/index/sign_in.html'); // Redirect to the login page after password reset
    } else {
      res.status(404).send('Username not found. Please try again.');
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error while processing your request');
  }
});


app.get('/login/customerData', async (req,res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query('SELECT customer_id as "ID", first_name as "First Name", last_name as "Last Name", phone AS "Phone", email AS "Email", username AS "Username", address_id AS "Address ID" FROM dbo.customer');
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});