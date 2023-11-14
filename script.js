const http = require('http');
const sql = require('./server/node_modules/mssql');

require('dotenv').config()

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
    }
});

// return json of package tracking history
function getStatusHistory(tracking_id) {
    // Creating a connection pool
    sql.connect(config, (err) => {
        if (!err) {
            // Create a request instance
            const request = new sql.Request();

            // Query to the database
            request.query(`SELECT P.status, P.date, A.address, A.city, A.state, A.zip, P.notes FROM package_status_history AS P, addresses as A WHERE P.tracking_number=${tracking_id} AND A.address_id = P.address_id;`, (err, recordset) => {
                if (!err) {
                    // Print the recordset
                    let records = []
                    recordset.recordset.forEach((row) => {
                        records.push(row)
                        console.log(row); // This will print each row in the recordset
                    });
                    sql.close(); // Close the connection pool
                    return records
                } 
                else{
                    console.log('Package status history query failed');
                }

            });
        }
        else{
            console.log('Failed to connect to database');
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
        response.on('end', () => {
            let tracking_num = Buffer.concat(body).toString();
            console.log(tracking_num)
            let tracking_data = getStatusHistory(tracking_num)
            response.writeHead(200, {'Content-Type': 'application/json'})
            response.end(tracking_data)
        })
	}
});

server.listen(process.env.PORT, process.env.HOST, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
