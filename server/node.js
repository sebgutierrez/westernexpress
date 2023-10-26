const sql = require('mssql');

// Configuring the database connection
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
