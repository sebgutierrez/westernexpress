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

// return json of package tracking history
function getTrackingData(tracking_id) {
    // Creating a connection pool
    sql.connect(config, (err) => {
        if (!err) {
            // Create a request instance
            const request = new sql.Request();

            // Query to the database
            /*
            request.query(`select * from addresses`, (err, recordset) => {
                if (!err) {
                    console.log(err);
                    // Print the recordset
                    recordset.recordset.forEach((row) => {
                        console.log(row); // This will print each row in the recordset
                    });

                    sql.close(); // Close the connection pool
                } 
                else{
                    console.log(err);
                }

            });
            */
        }
        else{
            console.log(err);
        }
    });
}

server.on('request', (request, response) => {
	request.on('error', (err) => {
		console.error('error', (err) => {
            console.log(err)
        });
	});
	response.on('error', (err) => {
		console.error('error', (err) => {
            console.log(err)
        });
	});
	const { method, url } = request
	if(method === 'POST' && url === '/track'){
        let body = [];
		request.on('data', (chunk) => {
            console.log(chunk)
			body.push(chunk)
		});
        request.on('end', () => {
            var tracking_id = Buffer.concat(body).toString();
            console.log(tracking_id)
        })
        response.on('end', () => {
            let tracking_data = getTrackingData(tracking_id)
            response.writeHead(200, {'Content-Type': 'application/json'})
            response.end({text: " query successful"})
        })
	}
	else{
        response.on('end', () => {
            response.writeHead(404, { 'Content-Type': 'text/plain' });
            response.end('Track Page Not Found');
        })
	}
});

port = 5500
hostname = '127.0.0.1'

server.listen(5500, hostname, () => {
    console.log(`Server is running on port ${port}`);
});

module.exports.server = server