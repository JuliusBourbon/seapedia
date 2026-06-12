const express = require('express');
const cors = require('cors');

const routes = require('./routes');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ success: true, message: 'SEAPEDIA API is running' });
});

app.use('/api/v1', routes);

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

module.exports = app;