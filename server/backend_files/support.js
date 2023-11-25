const config = require('../config.js');
const sql = require('mssql');

async function getEmployeeId(password){
	try {
		let pool = await sql.connect(config);
        let record = await pool.request()
        .query(`SELECT E.emp_id
                FROM employees_new AS E, credentials AS C
                WHERE E.username = C.usernames AND C.passwords = '${password}';`);
        pool.close();
		return record.recordset[0].emp_id;
	} catch (error) {
		console.log(error);
	}
}

async function checkSupportCredentials(employee_id){
	try {
		let pool = await sql.connect(config);
        let query = await pool.request()
        .query(`SELECT COUNT(1)
                FROM customer_support
                WHERE emp_id=${employee_id};`);
        pool.close();
		let exists = query.recordset[0][''];
		if (exists >= 0){
			return true;
		} 
		else{
			return false;
		} 

	} catch (error) {
		console.log(error);
	}
}

async function getSupportTickets(password){
    try {
		// should only allow update if there's no match with old and new package status
		let employee_id = await getEmployeeId(password);
		let exists = await checkSupportCredentials(employee_id);
		if(exists === true){
			let pool = await sql.connect(config);
			let query = await pool.request()
			.query(`SELECT S.ticket_number AS "Ticket #", S.department AS Department, S.priorit AS Priority, S.title AS Title, S.status AS Status, CONVERT(VARCHAR(20), S.date, 107) AS "Last Updated"
					FROM customer_support AS S, customer AS C
					WHERE S.emp_id = ${employee_id} AND C.customer_id = S.customer_id;`);
			pool.close();
			return query.recordsets;
		}
		else{
			return {'alert' : 'Not a support agent'};
		}
    }
	 catch (error) {
        console.log(error);
    }
}

async function viewTicket(ticket_number){
    try {
		let pool = await sql.connect(config);
		let query = await pool.request()
		.query(`SELECT S.title, C.email, CONVERT(VARCHAR(20), S.date, 0) AS date, S.description
				FROM customer_support AS S, customer AS C
				WHERE S.ticket_number=${ticket_number} AND C.customer_id = S.customer_id;`);
		pool.close();
		return query.recordsets;
    }
	 catch (error) {
        console.log(error);
    }
}

async function updateTicket(status, reply, ticket_number){
    try {
		let pool = await sql.connect(config);
		let query = await pool.request()
		.query(`DECLARE @date DATE;
				SET @date = CAST(SYSDATETIME() AS DATETIME);

				UPDATE customer_support
				SET status='${status}', reply='${reply}', date=@date
				WHERE ticket_number=${ticket_number};`);
		pool.close();
		return query.recordsets;
    }
	 catch (error) {
        console.log(error);
    }
}

module.exports = {
    getSupportTickets : getSupportTickets,
	viewTicket : viewTicket,
	updateTicket : updateTicket
};