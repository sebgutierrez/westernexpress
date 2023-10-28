const http = require('http');
const fs = require('fs');
const path = require('path');
const { StringDecoder } = require('string_decoder');
const handleSignUp = require('./signup'); // Replace './signup' with the path to your signup.js file

const server = http.createServer((req, res) => {
    const { method, url } = req;
    const baseURL = 'http://' + req.headers.host + '/';
    const requestURL = new URL(url, baseURL);
    const routePath = requestURL.pathname;

    if (method === 'POST' && routePath === '/C:/Users/iStar/Desktop/UH/Database/WesternExpress/Code/index/sign_up.html') {
        const decoder = new StringDecoder('utf-8');
        let requestData = '';

        req.on('data', (data) => {
            requestData += decoder.write(data);
        });

        req.on('end', () => {
            requestData += decoder.end();

            handleSignUp(req, res, requestData); // Call the handleSignUp function with the request data
        });
    } else {
        // Handle other routes or methods here
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
