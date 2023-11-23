const sql = require('mssql');
const config = require('./server/config.js');
const tracking = require('./server/backend_files/tracking.js');
const shift = require('./server/backend_files/shifts.js');
require('dotenv').config();
const session = require('express-session');
const crypto = require('crypto');
const bcrypt = require('bcrypt');


const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const router = express.Router();
const PORT = process.env.PORT;

console.log(PORT);
/* server static files */
const path = require('path')
app.use(express.static(path.join(__dirname, 'index')))
app.use(express.static(path.join(__dirname, 'images')))
app.use(express.static(path.join(__dirname, 'css')))


//////////////////////////////////////////////////////
// 1. Serve static files from the 'htmlfiles' directory
app.use(express.static(path.join(__dirname, 'index')));
app.use(express.static(path.join(__dirname, 'index', 'customer')));
app.use(express.static(path.join(__dirname, 'index', 'employees')));
app.use(express.static(path.join(__dirname, 'index', 'admin')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/images', express.static(path.join(__dirname, 'images')));
/////////////////////////////////////////////////////


app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json());
app.use(cors());

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
  app.get('/track/history/:id', (req, res) => {
    tracking.customerTracking(req.params.id)
    .then(result => {
        res.send(result);
    })
})



//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
app.post('/track/update', (req, res) => {
    tracking.employeePackageUpdate(req.body)
    .then(result => {
        res.send(result);
    })
})


//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
app.get('/track/package/:id', (req, res) => {
    tracking.customerPackage(req.params.id)
    .then(result => {
        res.send(result);
    })
})


//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
app.post('/clockin', (req, res) => {
    console.log(req.body.username, req.body.password);
    shift.clockIn(req.body.username, req.body.password)
    .then(result => {
        res.send(result);
    })
})



//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
app.post('/clockout', (req, res) => {
    shift.clockOut(req.body.username, req.body.password)
    .then(result => {
        res.send(result);
    })
})


//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
app.post("/generateReport", async (req, res) => {
    try {
      const requestData = req.body;
  
      await mssql.connect({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        server: String(process.env.DB_SERVER),
        database: process.env.DB_DATABASE,
        encrypt: true,
      });
  
      const result = await mssql.query(requestData.query); // Using the received SQL query
  
      res.json(result.recordset);
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    } finally {
      await mssql.close();
    }
  });



  ////////////////////////////////////////////////////////////////////////////////////////////// homepage start
//////////////////////////////////////////////////////////////////////////////////////////////
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'));
})


//////////////////////////////////////////////////////////////////////////////////////////////

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'));
});

//////////////////////////////////////////////////////////////////////////////////////////////homepage end
//////////////////////////////////////////////////////////////////////////////////////////////








// user authen + create label
//////////////////////////////////////////////////////////////////////////////////////////////AJ CODE START
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
// Function to generate a random number between min and max (inclusive)
const getRandomInt = (min, max) => {
  const range = max - min + 1;
  return Math.floor(Math.random() * range) + min;
};



//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
// Add this middleware to enable sessions
app.use(session({
  secret: 'adsfadsreqwrsdfdsafdsfete', // Change this to a secure random key
  resave: false,
  saveUninitialized: true,
}));


//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
// Middleware to parse incoming JSON requests
app.use(express.json());



//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
// Set up body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));



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
      
      res.redirect('/login.html');
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
      .query('SELECT customer_id FROM customer WHERE login = @username AND password_ = @password');

      // Check if there is at least one record
      if (customerResult.recordset.length > 0) {
      const customer_id = customerResult.recordset[0].customer_id;

      // Store customer_id in the session
      req.session.customer_id = customer_id;
      

      // Customer login
      res.sendFile(path.join(__dirname, 'index', 'customer', 'customer.html'));
      return;
      }



      //////////////////////////////////////////////////////////
      /////////////////////////////////////////////////////////// Check for employee login
      const employeeResult = await pool.request()
      .input('username', sql.VarChar, req.body.username)
      .input('password', sql.VarChar, req.body.password)
      .query('SELECT emp_id,postoffice_id FROM employees_new WHERE login_emp = @username AND password_emp = @password');

      // Check if there is at least one record
      if (employeeResult.recordset.length > 0) {
      const emp_id = employeeResult.recordset[0].emp_id;
      const postoffice_id = employeeResult.recordset[0].postoffice_id;
      req.session.emp_id = emp_id;
      req.session.postoffice_id = postoffice_id;


      // Employee login
      res.sendFile(path.join(__dirname, 'index', 'employees', 'employee_home.html'));
      return;
      }




      ///////////////////////////////////////////////////////////
      /////////////////////////////////////////////////////////// Check for admin login
      const adminResult = await pool.request()
      .input('username', sql.VarChar, req.body.username)
      .input('password', sql.VarChar, req.body.password)
      .query('SELECT ad_id FROM admins WHERE login_ad = @username AND password_ad = @password');

      // Check if there is at least one record
      if (adminResult.recordset.length > 0) {
      const ad_id = adminResult.recordset[0].ad_id;

      // Store adminIDNumber in the session
      req.session.ad_id = ad_id;

      // Admin login
      res.sendFile(path.join(__dirname, 'index', 'admin', 'admin_home.html'));
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
        .input('createdBy',sql.Int,customerID)
        .query(`
            INSERT INTO package (tracking_number,sender_id, receiver_id, description, FK_dimensions, weight, cost, class,package_createdby)
        VALUES (@trackingNumber,@senderID, @receiverID, @description, @fkdimension, @weight, @cost, @class, @createdBy);
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
        .query('UPDATE package SET package_status = \'In Transit\' WHERE tracking_number = @trackingNumber');

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
// Route customer page/user view past shippment
// Route to retrieve past shipments

// 1. Function to query past shipments
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
          p.sender_id,
          p.postoffice_id,
          p.package_status
        FROM
          package p
        INNER JOIN
          sender s ON p.sender_id = s.sender_id
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
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////AJ CODE END


// you were working on view shipment history customer, ensure every user see their only








//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});