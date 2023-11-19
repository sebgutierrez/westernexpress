const config = require('../config.js');
const sql = require('mssql');

async function checkCredentials(username, password){
	try {
		console.log('check creds');
		console.log(username, password);
		let pool = await sql.connect(config);
        let exists = await pool.request()
        .query(`SELECT COUNT(1)
                FROM credentials
                WHERE usernames='${username}' AND passwords='${password}';`);
        pool.close();
		console.log(exists.recordset[0]['']);
		if (exists.recordset[0][''] === 1){
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
		console.log('employee');
		console.log(record.recordset[0]['emp_id']);
		console.log(record.recordsets);
		console.log(record.recordset[0].emp_id);
		console.log(record.recordset[0].emp_id);
		return record.recordset[0].emp_id;
	} catch (error) {
		console.log(error);
	}
}

async function clockIn(username, password){
	try {
		let exists = await checkCredentials(username, password);
		if(exists === true){
			console.log('cred exists')
			let employee_id = await getEmployeeId(username);
			console.log(`credentials exist ${employee_id}`);
			let pool = await sql.connect(config);
			let query = await pool.request()
			.query(`DECLARE @record_id INT;
					SELECT @record_id = COUNT(*) + 1 FROM employee_hours;
					DECLARE @date DATE;
                    DECLARE @time TIME;
					DECLARE @clock_in_time TIME;
                    SET @date = CAST(SYSDATETIME() AS date);
			        SET @clock_in_time = CAST(SYSDATETIME() AS time);

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
		let exists = await checkCredentials(username, password);
		if(exists === true){
			let employee_id = await getEmployeeId(username);
			console.log(`credentials exist ${employee_id}`);
			let pool = await sql.connect(config);
			let query = await pool.request()
			.query(`DECLARE @date DATE;
					SET @date = CAST(SYSDATETIME() AS DATE);
					DECLARE @clock_in TIME;
					DECLARE @clock_out TIME;
					DECLARE @total_hours decimal(4,2);

					SELECT @clock_in = clock_in, @total_hours = (DATEDIFF(mi, CAST(@clock_in AS TIME), CAST(@clock_out AS TIME))/CAST(60 AS FLOAT))
					FROM employee_hours
					WHERE FK_employee_id='${employee_id}' AND date='@date';

					PRINT @clock_in;
					
					SELECT @total_hours AS total_hours;`);
			pool.close();
			console.log('total hours');
			console.log(query.recordsets);
			console.log(query.recordset[0].total_hours);
			
			let exists = await checkWeeklyHoursExists(employee_id);
			console.log('check weekly');
			console.log(exists);
			if (exists.recordset[0][''] === 1 === 1){
				updateWeeklyHours(employee_id, query.recordset[0].total_hours);
			} 
			else{
				insertWeeklyHours(employee_id, query.recordset[0].total_hours);
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
        let exists = await pool.request()
        .query(`DECLARE @current_date DATE;
				SET @current_date = CAST(SYSDATETIME() AS DATE);

				DECLARE @week_start DATE;
				DECLARE @week_end DATE;
				SELECT @week_start = DATEADD(dd, 0 - (@@DATEFIRST + 5 + DATEPART(dw, @current_date)) % 7, @current_date),
				@week_end = DATEADD(dd, 5 - (@@DATEFIRST + 5 + DATEPART(dw, @current_date)) % 7, @current_date);

				SELECT COUNT(1)
				FROM weekly_hours
				WHERE FK_employee_id = '${employee_id}' AND week_start = '@week_start' AND week_end = '@week_end';`);
        pool.close();
		console.log(`weeklyhour record exist`);
		console.log(exists.recordset[0].length);
		if (exists.recordset[0].length === 1){
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
				SELECT @record_id = COUNT(*) + 1 FROM employee_hours;

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
				WHERE FK_employee_id = '${employee_id}' AND week_start = '@week_start' AND week_end = '@week_end';`);
        pool.close();

		return {'success' : 'updateWeeklyHours was successful'}
	} catch (error) {
		console.log(error);
	}
}

module.exports = {
	clockIn: clockIn,
	clockOut: clockOut
}