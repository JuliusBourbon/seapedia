const app = require('./app');
const { PORT } = require('./config/env');
const { startOverdueCron } = require('./jobs/overdue.cron');

app.listen(PORT, () => {
    console.log(`SEAPEDIA API running on http://localhost:${PORT}`);
    startOverdueCron();
});