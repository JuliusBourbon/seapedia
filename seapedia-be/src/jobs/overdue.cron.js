const cron = require('node-cron');
const { runOverdueCheck } = require('../modules/overdue/overdue.service');

const startOverdueCron = () => {
    // Jadwal setiap menit (cocok untuk demo). Sesuaikan jika dibutuhkan, misal '0 * * * *' untuk per jam.
    cron.schedule('* * * * *', async () => {
        try {
            const result = await runOverdueCheck();
            if (result.totalProcessed > 0) {
                console.log(`[overdue-cron] Processed ${result.totalProcessed} overdue order(s):`, result.processedOrderIds);
            }
        } catch (err) {
            console.error('[overdue-cron] Error running overdue check:', err);
        }
    });

    console.log('[overdue-cron] Scheduler started (runs every minute)');
};

module.exports = { startOverdueCron };