const config = require('../config.js');
const sql = require('mssql');

async function overviewCheck(date1, date2, classVal, statusVal) {
    try {
        if (!date1 || !date2) {
            return 0; // Return 0 if date1 or date2 is missing
        }

        let pool = await sql.connect(config);
        let query = await pool.request()
            .input('date1', date1)
            .input('date2', date2)
            .input('status', statusVal || '')
            .input('class', classVal || '')
            .query(`SELECT 1
                    FROM package as P
                    WHERE (CONVERT(VARCHAR(10), P.date, 32) BETWEEN @date1 AND @date2)
                    OR P.status = @status
                    OR P.class = @class`);

        let exist = query.recordset.length > 0 ? 1 : 0; // Checking if records exist

        pool.close();
        return exist;
    } catch (error) {
        console.log(error);
        return 0; // Return 0 if an error occurs
    }
}



async function employeePackageOverview(date1, date2, classVal, statusVal) {
    try {
        let exists = await overviewCheck(date1,date2,classVal,statusVal);

        if (exists === 1) {
            let pool = await sql.connect(config);
            let query = pool.request();

            let whereClause = 'WHERE 1=1';

            if (date1 && date2) {
                query.input('date1', date1).input('date2', date2);
                whereClause += ` AND (P.send_date = @date1 OR P.send_date = @date2)`;
            } else if (date1 || date2) {
                const date = date1 || date2;
                query.input('date', date);
                whereClause += ` AND P.send_date = @date`;
            }

            if (statusVal) {
                query.input('status', statusVal);
                whereClause += ` AND P.status = @status`;
            }

            if (classVal) {
                query.input('class', classVal);
                whereClause += ` AND P.class = @class`;
            }

            query = await query.query(`SELECT P.tracking_number, P.class, P.status, CONVERT(VARCHAR(10), P.date, 32) AS Date
                FROM package AS P
                ${whereClause}`);

            pool.close();
            return query.recordsets;
        } else {
            return { 'alert': 'The tracking ID you entered does not exist' };
        }
    } catch (error) {
        console.log(error);
        return { 'error': 'An error occurred' };
    }
}



module.exports ={
    employeePackageOverview : employeePackageOverview
}


