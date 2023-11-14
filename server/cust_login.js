const http = require('http');
const fs = require('fs');
const sql = require('mssql');

const server = http.createServer((req, res) => {
    if (req.method === '' && req.url === '/') {
        // Serve the login form
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(fs.readFilegetSync('/index/customer/cust_login.html'));
    } else if (req.method === 'post' && req.url === '/server/cust_login.js') {
        // Handle login requests
        let body = '';

        req.on('data', (chunk) => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            const formData = new URLSearchParams(body);
            const username = formData.get('username');
            const password = formData.get('password');

            // Azure SQL Database connection configuration
            const config = {
                user: 'systemauthor',
                password: 'westernexpress2023_',
                server: 'westernexpressserver',
                database: 'westernexpressdb',
                port: 1433,
                options: {
                  encrypt: true,
                  trustServerCertificate: false
                }
              };
            

            try {
                await sql.connect(config);
                const request = new sql.Request();
                const query = `SELECT * FROM customer WHERE username_ = '${username}' AND password_ = '${password}'`;

                const result = await request.query(query);
                if (result.recordset.length === 1) {
                    // Successful login
                    res.writeHead(302, { 'Location': '/index/customer/customer.html' });
                    res.end('Login successful');
                } else {
                    // Failed login
                    res.writeHead(401, { 'Content-Type': 'text/plain' });
                    res.end('Login failed');
                }
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('An error occurred');
            } finally {
                sql.close();
            }
        });
    } 
    else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

const port = process.env.PORT || 3000;

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});