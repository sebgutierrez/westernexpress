const sql = require('mssql');

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

// Creating a connection pool
sql.connect(config, function (err) {
    if (err) console.log(err);

    // Create a request instance
    const request = new sql.Request();

    // Query to the database
    request.query('select * from addresses', function (err, recordset) {
        if (err) console.log(err);

        // Print the recordset
        recordset.recordset.forEach((row) => {
            console.log(row); // This will print each row in the recordset
        });

        sql.close(); // Close the connection pool
    });
});
