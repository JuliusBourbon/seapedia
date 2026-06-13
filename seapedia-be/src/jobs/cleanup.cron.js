const cron = require('node-cron');
const prisma = require('../config/db');

const startCleanupCron = () => {
    // Setiap hari jam 00:00
    cron.schedule('0 0 * * *', async () => {
        try {
            const result = await prisma.revokedToken.deleteMany({
                where: { expiresAt: { lt: new Date() } },
            });

            if (result.count > 0) {
                console.log(`[cleanup-cron] Removed ${result.count} expired revoked token(s)`);
            }
        } catch (err) {
            console.error('[cleanup-cron] Error cleaning up revoked tokens:', err);
        }
    });

    console.log('[cleanup-cron] Scheduler started (runs daily at midnight)');
};

module.exports = { startCleanupCron };