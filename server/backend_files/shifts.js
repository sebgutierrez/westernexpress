const { sensitiveHeaders } = require('http2');
const config = require('../config.js');
const sql = require('mssql');

async function checkCredentials(username, password){
	try {
		let pool = await sql.connect(config);
        let query = await pool.request()
        .query(`SELECT COUNT(1)
                FROM credentials
                WHERE usernames='${username}' AND passwords='${password}';`);
        pool.close();
		let exists = query.recordset[0][''];
		if (exists === 1){
			return true;
		} 
		else{
			return false;
		} 

	} catch (error) {
		console.log(error);
	}
}

async function checkCredentialsCustomer(username, password){
	try {
		let pool = await sql.connect(config);
        let query = await pool.request()
        .query(`SELECT COUNT(1)
                FROM customer
                WHERE login='${username}' AND password_='${password}';`);
        pool.close();
		let exists = query.recordset[0][''];
		if (exists === 1){
			return true;
		} 
		else{
			return false;
		} 

	} catch (error) {
		console.log(error);
	}
}

async function checkCredentialsEmployee(username, password){
	try {
		let pool = await sql.connect(config);
        let query = await pool.request()
        .query(`SELECT COUNT(1)
                FROM employees_new
                WHERE login_emp='${username}' AND password_emp='${password}';`);
        pool.close();
		let exists = query.recordset[0][''];
		if (exists === 1){
			return true;
		} 
		else{
			return false;
		} 

	} catch (error) {
		console.log(error);
	}
}

async function checkCredentialsAdmin(username, password){
	try {
		let pool = await sql.connect(config);
        let query = await pool.request()
        .query(`SELECT COUNT(1)
                FROM admins
                WHERE login_ad='${username}' AND password_ad='${password}';`);
        pool.close();
		let exists = query.recordset[0][''];
		if (exists === 1){
			return true;
		} 
		else{
			return false;
		} 

	} catch (error) {
		console.log(error);
	}
}

async function getEmployeeId(username){
	try {
		let pool = await sql.connect(config);
        let record = await pool.request()
        .query(`SELECT emp_id
                FROM employees_new 
                WHERE username='${username}';`);
        pool.close();
		return record.recordset[0].emp_id;
	} catch (error) {
		console.log(error);
	}
}

async function clockIn(username, password){
	try {
		let exists = await checkCredentials(username, password);
		if(exists === true){
			let employee_id = await getEmployeeId(username);
			let pool = await sql.connect(config);
			let query = await pool.request()
			.query(`DECLARE @record_id INT;
					SELECT @record_id = COUNT(*) + 1 FROM employee_hours;
					DECLARE @date DATE;
                    DECLARE @time TIME;
					DECLARE @clock_in_time TIME;
                    SET @date = CAST(SYSDATETIME() AS DATE);
			        SET @clock_in_time = CAST(SYSDATETIME() AS TIME);

					INSERT INTO employee_hours(record_id, FK_employee_id, clock_in, clock_out, date, total_hours)
					VALUES (@record_id, '${employee_id}', @clock_in_time, @clock_in_time, @date, 0);`);
			pool.close();
			return {'success' : 'clockIn was successful'};
		}
		else{
			return {'alert' : 'The username and/or password is incorrect!'}
		}
	} catch (error) {
		console.log(error);
	}
}

async function clockOut(username, password){
	try {
		console.log('username');
		console.log(username);
		let exists = await checkCredentials(username, password);
		if(exists === true){
			let employee_id = await getEmployeeId(username);
			let pool = await sql.connect(config);
			let query = await pool.request()
			.query(`DECLARE @date DATE;
					SET @date = CAST(SYSDATETIME() AS DATE);
					DECLARE @clock_in TIME(7);
					DECLARE @clock_out TIME(7);
					SET @clock_out = CAST(SYSDATETIME() AS TIME);
					DECLARE @total_hours decimal(4,2);

					SELECT @clock_in = clock_in, @total_hours = (DATEDIFF(mi, @clock_in, @clock_out)/CAST(60 AS FLOAT))
					FROM employee_hours
					WHERE FK_employee_id='${employee_id}' AND date=@date;
					
					SELECT @total_hours AS total_hours;`);
			pool.close();
			let total_hours = query.recordset[0].total_hours;
			let exists = await checkWeeklyHoursExists(employee_id);
			if (exists){
				console.log('update');
				updateWeeklyHours(employee_id, total_hours);
			} 
			else{
				console.log('insert');
				insertWeeklyHours(employee_id, total_hours);
			} 
			return {'success' : 'clockOut was successful'}
		}
		else{
			return {'alert' : 'The username and/or password is incorrect!'};
		}
	} catch (error) {
		console.log(error);
	}
}


async function checkWeeklyHoursExists(employee_id){
	try {
		let pool = await sql.connect(config);
        let query = await pool.request()
        .query(`DECLARE @current_date DATE;
				SET @current_date = CAST(SYSDATETIME() AS DATE);

				DECLARE @week_start DATE;
				DECLARE @week_end DATE;
				SELECT @week_start = DATEADD(dd, 0 - (@@DATEFIRST + 5 + DATEPART(dw, @current_date)) % 7, @current_date),
				@week_end = DATEADD(dd, 5 - (@@DATEFIRST + 5 + DATEPART(dw, @current_date)) % 7, @current_date);

				SELECT COUNT(1)
				FROM weekly_hours
				WHERE FK_employee_id = '${employee_id}' AND week_start = @week_start AND week_end = @week_end;`);
        pool.close();
		let exists = query.recordset[0][''];
		if (exists === 1){
			return true;
		} 
		else{
			return false;
		} 
	} catch (error) {
		console.log(error);
	}
}

async function insertWeeklyHours(employee_id, total_hours){
	try {
		let pool = await sql.connect(config);
        let query = await pool.request()
        .query(`DECLARE @record_id INT;
				SELECT @record_id = COUNT(*) + 1 FROM weekly_hours;

				DECLARE @current_date DATE;
				SET @current_date = CAST(SYSDATETIME() AS DATE);

				DECLARE @week_start DATE;
				DECLARE @week_end DATE;
				SELECT @week_start = DATEADD(dd, 0 - (@@DATEFIRST + 5 + DATEPART(dw, @current_date)) % 7, @current_date),
				@week_end = DATEADD(dd, 5 - (@@DATEFIRST + 5 + DATEPART(dw, @current_date)) % 7, @current_date);

				INSERT INTO weekly_hours(record_id, FK_employee_id, week_start, week_end, weekly_hours)
				VALUES (@record_id, '${employee_id}', @week_start, @week_end, ${total_hours});`);
        pool.close();
		return {'success' : 'insertWeeklyHours was successful'}
	} catch (error) {
		console.log(error);
	}
}

async function updateWeeklyHours(employee_id, total_hours){
	try {
		let pool = await sql.connect(config);
        let query = await pool.request()
        .query(`
				DECLARE @current_date DATE;
				SET @current_date = CAST(SYSDATETIME() AS DATE);
				DECLARE @week_start DATE;
				DECLARE @week_end DATE;
				SELECT @week_start = DATEADD(dd, 0 - (@@DATEFIRST + 5 + DATEPART(dw, @current_date)) % 7, @current_date),
				@week_end = DATEADD(dd, 5 - (@@DATEFIRST + 5 + DATEPART(dw, @current_date)) % 7, @current_date);
		
				UPDATE weekly_hours
				SET weekly_hours.weekly_hours = weekly_hours.weekly_hours + ${total_hours}
				WHERE FK_employee_id = '${employee_id}' AND week_start = @week_start AND week_end = @week_end;`);
        pool.close();
		return {'success' : 'updateWeeklyHours was successful'}
	} catch (error) {
		console.log(error);
	}
}

async function sendAlertMessage(username){
	try {
		console.log('alert message pinged');
		let pool = await sql.connect(config);
        let query = await pool.request()
        .query(`
				SELECT alert_id, alert_message, date, FORMAT(CAST(time as DATETIME), 'hh:mm tt') AS time
				FROM alerts
				WHERE FK_username = '${username}' AND alert_sent = 0;`);
        pool.close();

		console.log(query.recordset[0].trigger_name);
		let alert_message = query.recordset[0].alert_message;
		let date = query.recordset[0].date;
		let time = query.recordset[0].time;
		let trigger_message = `${alert_message} (Sent on ${date} at ${time})`;
		console.log(trigger_message);
		let mark_sent = await markAlertSent(query.recordset[0].alert_id);
		return {'trigger_message' : trigger_message}
	} catch (error) {
		console.log(error);
	}
}

async function markAlertSent(alert_id){
	try {
		let pool = await sql.connect(config);
        let query = await pool.request()
        .query(`
				UPDATE alerts
				SET alert_sent = 1
				WHERE alert_id = ${alert_id};`);
        pool.close();
		
		return {'alert message' : 'alert marked as sent'}
	} catch (error) {
		console.log(error);
	}
}

module.exports = {
	clockIn: clockIn,
	clockOut: clockOut,
	sendAlertMessage : sendAlertMessage,
	markAlertSent : markAlertSent
}