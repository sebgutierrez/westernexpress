const sql = require('mssql');
const config = require('./server/config.js');
const tracking = require('./server/backend_files/tracking.js');
const shift = require('./server/backend_files/shifts.js');
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const router = express.Router();
const PORT = process.env.PORT;

console.log(PORT);
/* server static files */
const path = require('path')
app.use(express.static(path.join(__dirname, 'index')))
app.use(express.static(path.join(__dirname, 'images')))
app.use(express.static(path.join(__dirname, 'css')))

app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json());
app.use(cors());


app.get('/track/history/:id', (req, res) => {
    tracking.customerTracking(req.params.id)
    .then(result => {
        res.send(result);
    })
})

app.post('/track/update', (req, res) => {
    tracking.employeePackageUpdate(req.body)
    .then(result => {
        res.send(result);
    })
})

app.get('/track/package/:id', (req, res) => {
    tracking.customerPackage(req.params.id)
    .then(result => {
        res.send(result);
    })
})

app.post('/clockin', (req, res) => {
    console.log(req.body.username, req.body.password);
    shift.clockIn(req.body.username, req.body.password)
    .then(result => {
        res.send(result);
    })
})


app.post('/clockout', (req, res) => {
    shift.clockOut(req.body.username, req.body.password)
    .then(result => {
        res.send(result);
    })
})


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
})

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'));
});

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});