const config = require('../config.js');
const sql = require('mssql');

// Setting the configuration for 
// the request 
 
async function overviewValidation(date1, date2, packageType, status){
    try {
        let pool = await sql.connect(config);
        let query = await pool.request()
            .input('date1', sql.DateTime, date1)
            .input('date2', sql.DateTime, date2)
            .input('status', sql.VarChar, packageType)
            .input('packageType', sql.VarChar, status)
            .query(`SELECT 1
                    FROM package AS P 
                    WHERE CONVERT(VARCHAR(10), P.date) BETWEEN @date1 AND @date2
                    OR P.package_type = @packageType
                    OR P.status = @status;`);
        
        let exists = query.recordset.length > 0; // Check if any records exist
        pool.close();
        return exists;
    } catch (error) {
        console.log(error);
        throw error; // Re-throw the error to be handled at a higher level
    }
}

async function packageOverview(date1, date2, packageType, status){
    try {
        let exists = await overviewValidation(date1, date2, packageType, status);
        if(exists === 1){
            let startDate = date1;
            let endDate = date2;
            let packageClass = packageType;
            let packageStatus = status;
            let pool = await sql.connect(config);
            let history = await pool.request()
            .query(`SELECT P.status AS Status, CONVERT(VARCHAR(10), P.date, 1) AS Date, FORMAT(CAST(P.time as DATETIME), 'hh:mm tt') AS Time, concat_ws(', ', A.address, A.city, A.state, A.zip) AS "Postal Office Address"
                    FROM package AS P, addresses as A 
                    WHERE CONVERT(VARCHAR(10), P.date) BETWEEN @date1 AND @date2 
                    OR P.package_type = @packageType
                    OR P.status = @status
                    ORDER BY date DESC;`);
            pool.close();
            return history.recordsets;
        }
        else{
            return {'alert' : 'The tracking ID you entered does not exist'}
        }
    } catch (error) {
        console.log(error);
    }
}

module.exports ={
    packageOverview : packageOverview
}