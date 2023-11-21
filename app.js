const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const sql = require('mssql');
const app = express();
const crypto = require('crypto');
const session = require('express-session');



// Function to generate a random number between min and max (inclusive)
const getRandomInt = (min, max) => {
    const range = max - min + 1;
    return Math.floor(Math.random() * range) + min;
};


// Add this middleware to enable sessions
app.use(session({
    secret: 'adsfadsreqwrsdfdsafdsfete', // Change this to a secure random key
    resave: false,
    saveUninitialized: true,
  }));






const bcrypt = require('bcrypt');
// Configure the database connection
const config = {
    user: 'WesternExpressUser',
    password: 'WesternExpressLogistics_2023#',
    server: 'westernexpresslogistics-database.database.windows.net',
    database: 'WesternExpressLogisticsServerImport',
    port: 1433, // Replace with the correct port
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};


// Initialize the SQL client
sql.connect(config).catch((err) => console.error('Error while connecting to the database:', err));



// Middleware to parse incoming JSON requests
app.use(express.json());




// Set up body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));



// 1. Serve static files from the 'htmlfiles' directory
app.use(express.static(path.join(__dirname, 'index')));

// 2. Serve static files from the 'htmlfiles' directory
app.use('/css', express.static(path.join(__dirname, 'css')));




app.use('/images', express.static(path.join(__dirname, 'images')));


// Serve static files from the 'css' directory
//app.use('/index', express.static(path.join(__dirname, '/index/employees/employee_home')));








///////////////////////////////////////////////////////////////////////////// routes start only for customers only

// This the homepage when you get into localhost:5500
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index', 'homepage.html'));
});

///////////////////////////////////////////////////////////////////////////// routes start only for customers only






///////////////////////////////////////////////////////////////////////////// routes start only for customers only
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


///////////////////////////////////////////////////////////////////////////// routes end





///////////////////////////////////////////////////////////////////////////// routes start only for customers only
// Login route testing new one below
/*
app.post('/login', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('username', sql.VarChar, req.body.username)
            .input('password', sql.VarChar, req.body.password)
            .query('SELECT * FROM customer WHERE login = @username AND password_ = @password');
        if (result.recordset.length > 0) {
            res.sendFile(path.join(__dirname, 'index', 'customer','customer.html'));
        } else {
            res.send('Invalid username or password');
        }
    } catch (err) {
        console.error('Error while connecting to the database:', err);
        res.send('Error while connecting to the database');
    }
});
///////////////////////////////////////////////////////////////////////////// routes start only for customers only
///////////////////////////////////////////////////////////////////////////// routes start only for customers only
*/

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
        .query('SELECT emp_id FROM employees_new WHERE login_emp = @username AND password_emp = @password');

        // Check if there is at least one record
        if (employeeResult.recordset.length > 0) {
        const emp_id = employeeResult.recordset[0].emp_id;

        // Store employerIDNumber in the session
        req.session.emp_id = emp_id;

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

///////////////////////////////////////////////////////////////////////////// routes end only for customers only
///////////////////////////////////////////////////////////////////////////// routes end only for customers only





///////////////////////////////////////////////////////////////////////////// customer homepage track information
// Set EJS as the view engine
// Set EJS as the view engine
// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'index', 'customer')); // Specify the correct views directory
/////////////////////////////////////////////////////////////////////////////
// Route to handle tracking
// Route to handle tracking
app.get('/track', async (req, res) => {
    const trackingNumber = req.query.trackingNumber;

    if (!trackingNumber) {
        return res.status(400).send('Tracking number is required.');
    }

    try {
        const pool = await sql.connect(config);
        const request = pool.request();

        const result = await request
        .input('trackingNumber', sql.VarChar, trackingNumber)
        .query(`
            SELECT
                p.tracking_number,
                p.send_date,
                p.receiving_date,
                a_receiver.address as receiver_address,
                a_receiver.city as receiver_city,
                a_receiver.state as receiver_state,
                a_receiver.zip as receiver_zip,
                p.weight,
                p.class,
                p.postoffice_id,
                a_postoffice.address as postoffice_address,
                a_postoffice.city as postoffice_city,
                a_postoffice.state as postoffice_state,
                a_postoffice.zip as postoffice_zip,
                p.status
            FROM
                package p
            JOIN
                receiver r ON p.receiver_id = r.receiver_id
            JOIN
                addresses a_receiver ON r.FK_address_id = a_receiver.address_id
            JOIN
                post_office_details pod ON p.postoffice_id = pod.postoffice_id
            JOIN
                addresses a_postoffice ON pod.address_id = a_postoffice.address_id
            WHERE
                p.tracking_number = @trackingNumber;
        `);
    

        
    

        if (result.recordset.length > 0) {
            const trackingDetails = result.recordset[0];
            res.render(path.join(__dirname, 'index', 'customer', 'tracking_status'), { trackingDetails });
        } else {
            console.warn(`No tracking information found for tracking number: ${trackingNumber}`);
            res.status(404).send('No tracking information found for the provided tracking number.');
        }
    } catch (err) {
        console.error('Error executing the query:', err);
        res.status(500).send('Error executing the query.');
    }
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////



/////////////////////////////////////////////////////////////////////////////
// Handle GET request for creating a label
const { v4: uuidv4 } = require('uuid');
app.post('/createlabel', async (req, res) => {
    try {
      // Connect to the database
      const pool = await sql.connect(config);
  
      // Begin a database transaction
      const transaction = new sql.Transaction();
      await transaction.begin();
  
      try {
        // Generate primary keys IDs
        const addressId = getRandomInt(2000, 3000);
        const senderId = getRandomInt(2000, 3000);
        const addressId_rec = getRandomInt(2000, 3000);
        const receiver_id_uui = getRandomInt(2000, 3000);

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
         tracking=getRandomInt(100000000000000,900000000000000)
         //const sendDate = new Date();
        // Insert data into package
        const packageResult = await pool
        .request()
        .input('trackingNumber',sql.BigInt,tracking)
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
        Shipping label data saved successfully!

        Tracking Number: ${tracking} \n
        Description: ${req.body.description}
        Dimensions: ${req.body.dimensions}
        Weight: ${req.body.weight}
        Cost: ${req.body.cost}
        Class: ${req.body.class}


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
  


















///////////////////////////////////////////////////////////////////////////// routes start only for customers only
// Start the servern
const port = 5500; // Or any other port you want to use
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
///////////////////////////////////////////////////////////////////////////// routes start only for customers only









