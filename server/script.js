const http = require('http');
const sql = require('mssql');

const config = {
    user: 'systemauthor',
    password: 'westernexpress2023_',
    server: 'westernexpressserver.database.windows.net',
    database: 'westernexpressdb',
    options: {
        encrypt: true, // For Azure
        trustServerCertificate: true // For Azure
    }
};

const server = http.createServer((req, res) => {
    if (req.url === '/view-employees' && req.method === 'GET') {
        sql.connect(config, function (err) {
            if (err) {
                console.log(err);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error occurred while connecting to the database.');
            } else {
                const request = new sql.Request();

                // Query the database
                request.query('select * from employees_new', function (err, recordset) {
                    if (err) {
                        console.log(err);
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Error occurred while executing the query.');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(recordset.recordset)); // Send the recordset as the response
                    }

                    sql.close(); // Close the connection pool
                });
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
