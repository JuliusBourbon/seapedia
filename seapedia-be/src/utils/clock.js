const prisma = require('../config/db');

const SETTING_ID = 'singleton';

const getCurrentTime = async () => {
    const setting = await prisma.systemSetting.findUnique({ where: { id: SETTING_ID } });
    const offset = setting ? setting.timeOffsetMs : 0;
    return new Date(Date.now() + offset);
};

const getTimeOffset = async () => {
    const setting = await prisma.systemSetting.findUnique({ where: { id: SETTING_ID } });
    return setting ? setting.timeOffsetMs : 0;
};

// Menambah offset waktu (misal: +24 jam untuk "simulate next day")
const advanceTime = async (ms) => {
    const setting = await prisma.systemSetting.upsert({
        where: { id: SETTING_ID },
        update: { timeOffsetMs: { increment: ms } },
        create: { id: SETTING_ID, timeOffsetMs: ms },
    });

    return new Date(Date.now() + setting.timeOffsetMs);
};

module.exports = { getCurrentTime, getTimeOffset, advanceTime };