const http = require('http');
const fs = require('fs');
const url = require('url');
const sql = require('mssql');
const config = require('../../config.js');

const PORT = process.env.PORT;

http.createServer(function (req, res) {
    const { pathname, query } = url.parse(req.url, true);

    if (pathname === 'https://westernexpresspostal.azurewebsites.net/signup' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            const data = JSON.parse(body);

            try {
                const pool = await sql.connect(config);
                const transaction = new sql.Transaction(pool);
                await transaction.begin();

                const customerRequest = new sql.Request(transaction);
                customerRequest.input('firstName', sql.NVarChar, data.firstName);
                customerRequest.input('lastName', sql.NVarChar, data.lastName);
                customerRequest.input('phone', sql.NVarChar, data.phone);
                customerRequest.input('email', sql.NVarChar, data.email);
                await customerRequest.query(
                    `INSERT INTO customer (first_name, last_name, phone, email) 
                    VALUES (@firstName, @lastName, @phone, @email)`
                );

                const addressRequest = new sql.Request(transaction);
                addressRequest.input('address', sql.NVarChar, data.address);
                addressRequest.input('city', sql.NVarChar, data.city);
                addressRequest.input('state', sql.NVarChar, data.state);
                addressRequest.input('zip', sql.NVarChar, data.zip);
                await addressRequest.query(
                    `INSERT INTO addresses (address, city, state, zip) 
                    VALUES (@address, @city, @state, @zip)`
                );

                const credentialsRequest = new sql.Request(transaction);
                credentialsRequest.input('username', sql.NVarChar, data.username);
                credentialsRequest.input('password', sql.NVarChar, data.password);
                await credentialsRequest.query(
                    `INSERT INTO credentials_user_pass (usernames, passwords) 
                    VALUES (@username, @password)`
                );

                await transaction.commit();
                res.writeHead(302, {
                    'Location': 'https://westernexpresspostal.azurewebsites.net/index/customer/customer.html',
                    // add other headers here...
                  });
                  res.end();
                  
            } catch (err) {
                console.error('Database error', err);
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end('Internal Server Error');
            }
        });
    } else {
        // Serve the sign_up.html file here
        fs.readFile('https://westernexpresspostal.azurewebsites.net/index/sign_up.html', function (err, data) {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                return res.end('404 Not Found');
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(data);
            return res.end();
        });
    }
}).listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
