const app = require('./app');
const { PORT } = require('./config/env');

app.listen(PORT, () => {
    console.log(`SEAPEDIA API running on http://localhost:${PORT}`);
});