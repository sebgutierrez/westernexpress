const express = require('express');
const bodyParser = require('body-parser');
const sql = require('mssql');
const app = express();

// Configure the database connection
// Configuring the database
const config = {
    user: 'WesternExpressUser',
    password: 'westernexpresslogistics2023#',
    server: 'westernexpresslogistics-database.database.windows.net',
    database: 'WesternExpressLogisticsServer',
    port: 5501,
    options: {
      encrypt: true,
      trustServerCertificate: false
    }
  };

// Set up body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/customer'));
// Handling routes
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/customer/cust_forgot_pass.html');
});

// Login route
app.post('/forgot_pass', async (req, res) => {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query`SELECT * FROM customer WHERE username = ${req.body.username}`;
        if (result.recordset.length > 0) {
            res.sendFile(__dirname + '/index/customer/cust_reset_pass.html');
        } else {
            res.send('Invalid username');
        }
    } catch (err) {
        console.error('Error while connecting to the database:', err);
        res.send('Error while connecting to the database');
    }
});
app.listen(5501, () => {
    console.log(`Server is running on http://localhost:5501`);
});