const app = require('./app');
const http = require('http');
const connectDB = require('./config/db');
require('dotenv').config();

const port = process.env.PORT || 3000;

connectDB();

const server = http.createServer(app);

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});