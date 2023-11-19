const config = require('../config.js');
const sql = require('mssql');

// Setting the configuration for 
// the request 
 
async function trackingIdValidation(request, response){
    try {
        let tracking_num = request;
        let pool = await sql.connect(config);
        let query = await pool.request()
        .query(`SELECT 1
                FROM package AS P 
                WHERE P.tracking_number=${tracking_num};`);
        let exists = query.recordsets[0].length
        pool.close();
        return exists;
    } catch (error) {
        console.log(error);
    }
}

async function customerTracking(request, response){
    try {
        let exists = await trackingIdValidation(request);
        if(exists === 1){
            let tracking_num = request;
            let pool = await sql.connect(config);
            let history = await pool.request()
            .query(`SELECT P.status AS Status, CONVERT(VARCHAR(10), P.date, 1) AS Date, FORMAT(CAST(P.time as DATETIME), 'hh:mm tt') AS Time, concat_ws(', ', A.address, A.city, A.state, A.zip) AS "Postal Office Address"
                    FROM package_status_history AS P, addresses as A 
                    WHERE P.tracking_number=${tracking_num} AND A.address_id = P.address_id
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

async function customerPackage(request, response){
    try {
        let exists = await trackingIdValidation(request);
        if(exists === 1){
            let tracking_num = request;
            let pool = await sql.connect(config);
            let package = await pool.request()
            .query(`SELECT P.description AS Description, P.class AS Class, P.cost AS Cost, CONVERT(VARCHAR(10), P.send_date, 1) AS "Send Date", CONVERT(VARCHAR(10), P.receiving_date, 1) AS "Expected Arrival"
                    FROM package AS P
                    WHERE P.tracking_number=${tracking_num};`);
            pool.close();
            return package.recordsets;
        }
        else{
            return {'alert' : 'The tracking ID you entered does not exist'}
        }
    } catch (error) {
        console.log(error);
    }
}

/*
// get post office address where the employee is working at
async function getEmployeeId(employee_id){
    try {
        let pool = await sql.connect(config);
        let address_id = await pool.request()
        .query(`SELECT D.address_id
                FROM post_office_details AS D, employees_new AS E
                WHERE D.postoffice_id = E.postoffice_id AND E.emp_id = ${employee_id};`);
        pool.close();
        console.log(address_id.recordsets)
        return address_id.recordsets;
    } catch (error) {
        console.log(error);
    }
}*/

// get post office address where the employee is working at
async function getPostOfficeAddress(employee_id){
    try {
        let pool = await sql.connect(config);
        let address_id = await pool.request()
        .query(`SELECT D.address_id
                FROM post_office_details AS D, employees_new AS E
                WHERE D.postoffice_id = E.postoffice_id AND E.emp_id = ${employee_id};`);
        pool.close();
        console.log(address_id.recordsets)
        return address_id.recordsets;
    } catch (error) {
        console.log(error);
    }
}

async function employeeTrackingUpdate(request, response){
    try {
        let exists = await trackingIdValidation(request);
        if(exists === 1){
            let tracking_num = request.tracking;
            let status = request.status;
            let datetime = request.datetime;
            let employee_id = getEmployeeId();
            let address_id = getPostOfficeAddress(employee_id)
            let pool = await sql.connect(config);
            let package = await pool.request()
            .query(`INSERT INTO package_status_history(status_id, tracking_number, status, date, time, address_id)
                    VALUES 
                    (8, ${tracking_num}, ${status}, ${datetime[0]}, ${datetime[1]}, ${address_id});`);
            pool.close();
            return package.recordsets;
        }
        else{
            return {'alert' : 'The tracking ID you entered does not exist'}
        }
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    customerTracking : customerTracking,
    customerPackage : customerPackage,
    employeeTrackingUpdate : employeeTrackingUpdate
};