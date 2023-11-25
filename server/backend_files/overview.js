const config = require('../config.js');
const sql = require('mssql');

async function overviewCheck(date1, date2, classVal, statusVal) {
    try {
        let pool = await sql.connect(config);
        let query = pool.request();

        let sqlQuery = `SELECT 1 FROM package as P WHERE 1 = 1`;

        if (date1 && date2) {
            query.input('date1', date1);
            query.input('date2', date2);
            sqlQuery += ` AND (CONVERT(VARCHAR(10), P.send_date, 23) BETWEEN @date1 AND @date2)`;
        } else if (date1 || date2) {
            const date = date1 || date2;
            query.input('date', date);
            sqlQuery += ` AND CONVERT(VARCHAR(10), P.send_date, 23) = @date`;
        }

        if (statusVal) {
            query.input('status', statusVal);
            sqlQuery += ` AND P.status = @status`; // Changed 'OR' to 'AND'
        }

        if (classVal) {
            query.input('class', classVal);
            sqlQuery += ` AND P.class = @class`; // Changed 'OR' to 'AND'
        }

        query = await query.query(sqlQuery);

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
        let exists = await overviewCheck(date1, date2, classVal, statusVal);

        if (exists === 1) {
            let pool = await sql.connect(config);
            let query = pool.request();

            let whereClause = 'WHERE 1=1';

            if (date1 && date2) {
                query.input('date1', date1);
                query.input('date2', date2);
                whereClause += ` AND (P.send_date BETWEEN @date1 AND @date2)`;
            } else if (date1 || date2) {
                const pdate = date1 || date2;
                query.input('pdate', pdate);
                whereClause += ` AND P.send_date = @pdate`;
            }

            if (statusVal) {
                query.input('pstatus', statusVal);
                whereClause += ` AND P.status = @pstatus`;
            }

            if (classVal) {
                query.input('pclass', classVal);
                whereClause += ` AND P.class = @pclass`;
            }

            query = await query.query(`
                SELECT 
                    P.tracking_number AS [Tracking Number], 
                    CONCAT(S.first_name, ' ', S.last_name) AS [Sender Name], 
                    CONCAT(R.first_name, ' ', R.last_name) AS [Receiver ID], 
                    P.class AS [Class], 
                    P.status AS [Status], 
                    CAST(P.send_date AS DATE) AS [Send Date],
                    CAST(P.receiving_date AS DATE) AS [Receive Date]
                    FROM dbo.package AS P 
                    INNER JOIN dbo.sender AS S ON S.sender_id = P.sender_id
                    INNER JOIN dbo.receiver AS R ON R.receiver_id = P.receiver_id
                    ${whereClause}
                    ORDER BY [Send Date] ASC
                `);


            pool.close();
            console.log(query);
            return query.recordset;
        } else {
            return { 'alert': 'overview error' };
        }
    } catch (error) {
        console.log(error);
        return { 'error': 'An error occurred' };
    }
}


module.exports = {
    employeePackageOverview : employeePackageOverview
}


