const config = require('../config.js');
const sql = require('mssql');

async function overviewCheck(req,res){
    try{
        let startDate = req.query.startDate;
        let endDate = req.query.endDate;
        let status = req.query.status || ''; 
        let packageType = req.query.packageType || '';
        let pool = await sql.connect(config);
        let query = await pool.request()
        .query(`SELECT 1
                FROM package as P
                WHERE P.sending_date BETWEEN ${startDate} AND ${endDate}
                OR P.status = ${status}
                OR P.class =${packageType};`)
        let exist = query.recordsets[0].length
        pool.close();
        return exists;
    }
    catch (error){
        console.log(error);
    }
}

async function employeePackageOverview(req, res){
    try{
        let exists = await overviewCheck(req);
        if(exists === 1){
            let startDate = req.query.startDate;
            let endDate = req.query.endDate;
            let status = req.query.status || ''; 
            let packageType = req.query.packageType || '';
            let pool = await sql.connect(config);
            let query = await pool.request()
            .query(`SELECT P.tracking_number, P.class, P.status, CONVERT(VARCHAR(10), P.date, 1) AS Date
                    FROM package AS P
                    WHERE P.sending_date BETWEEN ${startDate} AND ${endDate}
                    AND P.status = ${status}
                    AND P.class =${packageType};`)
                    pool.close();
                    return history.recordsets;
        }
        else{
            return {'alert' : 'The tracking ID you entered does not exist'}
        }
    }
    catch (error){
        console.log(error);
    }
}

module.exports ={
    employeePackageOverview : employeePackageOverview
}