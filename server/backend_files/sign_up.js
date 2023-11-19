// signup.js

const url = require('url');
const { StringDecoder } = require('string_decoder');
const sql = require('mssql');

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true, 
        trustServerCertificate: true 
    }
};

// Function to handle sign-up requests
const handleSignUp = (req, res, requestData) => {
    const data = JSON.parse(requestData);
    const firstName = data.firstName;
    const lastName = data.lastName;
    const phone = data.phone;
    const email = data.email;
    const username = data.username;
    const password = data.password;
    const address = data.address;
    const city = data.city;
    const state = data.state;
    const zip = data.zip;

    sql.connect(config, (err) => {
        if (err) {
            console.error('Error connecting to the database', err);
            res.end('Error connecting to the database');
        }

        const request = new sql.Request();
        request.query(`INSERT INTO customer (firstName, lastName, phone, email, username, password, address, city, state, zip) VALUES ('${firstName}', '${lastName}', '${phone}', '${email}', '${username}', '${password}', '${address}', '${city}', '${state}', '${zip}')`, (err, result) => {
            if (err) {
                console.error('Error querying the database', err);
                res.end('Error querying the database');
            }

            console.log('User signed up successfully!');
            res.end('User signed up successfully!');
            sql.close();
        });
    });
};

module.exports = handleSignUp;