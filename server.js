const config = require('./server/config.js');
const tracking = require('./server/backend_files/tracking.js');
const shift = require('./server/backend_files/shifts.js');
const overview = require('./server/backend_files/overview.js');

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

  //////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////////////////
  // Add this middleware to enable sessions
  app.use(session({
    secret: 'adsfadsreqwrsdfdsafdsfete', // Change this to a secure random key
    resave: false,
    saveUninitialized: false,
    cookie: {
        sameSite: true,
        secure: false,
        expires: false
      }
  }));

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
    try {
      const requestData = req.body;
      await mssql.connect(config);
      const result = await mssql.query(requestData.query); // Using the received SQL query
      res.json(result.recordset);
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    } finally {
      await mssql.close();
    }
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
            res.sendFile(path.join(__dirname, 'public', 'index', 'customer', 'customer.html'));
            return;
        }  
  
        //////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////// Check for employee login
        const employeeResult = await pool.request()
        .input('username', sql.VarChar, req.body.username)
        .input('password', sql.VarChar, req.body.password)
        .query('SELECT emp_id, username FROM employees_new WHERE login_emp = @username AND password_emp = @password');
  
        console.log(employeeResult.recordsets);
        // Check if there is at least one record
        if (employeeResult.recordset.length > 0) {
            const emp_id = employeeResult.recordset[0].emp_id;
            const username = employeeResult.recordset[0].username;

            // Store employerIDNumber in the session
            req.session.emp_id = emp_id;
            req.session.emp_username = username;

    
            // Employee login
            res.sendFile(path.join(__dirname, 'public', 'index', 'employees', 'employee_home.html'));
            return;
        }
  
        //////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////// Check for admin login
        const adminResult = await pool.request()
        .input('username', sql.VarChar, req.body.username)
        .input('password', sql.VarChar, req.body.password)
        .query('SELECT ad_id, username FROM admins WHERE login_ad = @username AND password_ad = @password');
  
        console.log(adminResult.recordsets);
        // Check if there is at least one record
        if (adminResult.recordset.length > 0) {
            const ad_id = adminResult.recordset[0].ad_id;
            const username = adminResult.recordset[0].username;
    
            // Store adminIDNumber in the session
            req.session.ad_id = ad_id;
            req.session.ad_username = username;
    
            // Admin login
            res.sendFile(path.join(__dirname, 'public', 'index', 'admin', 'admin_home.html'));
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
           tracking_ready=getRandomInt(100000000000000,900000000000000)
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
//////////////package overview///////////////////
app.post('/login/overview', (req, res) => {
  overview.employeePackageOverview(req.body.startDate,req.body.endDate,req.body.packageType,req.body.packageStatus)
  .then(result => {
      res.send(result);
  })
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});