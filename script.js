const sql = require('mssql');
const config = require('./server/config.js');
const tracking = require('./server/backend_files/tracking.js');
const pOverview= require('./server/backend_files/emp_package_overview.js')
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const router = express.Router();

/* server static pages */
const path = require('path')
app.use(express.static(path.join(__dirname, 'public')))

app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json());
app.use(cors());


app.get('/track/history/:id', (req, res) => {
    tracking.customerTracking(req.params.id)
    .then(result => {
        res.send(result);
    })
})

app.get('/track/update/:id', (req, res) => {
    tracking.employeeTrackingUpdate(req.params.id)
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

//My function 
app.get('/generate-overview/:id', (rep, res) => {
    pOverview.employeePackageOverview(req.params.id)
    .then(result => {
        res.send(result);
    })
})

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'));
})

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});