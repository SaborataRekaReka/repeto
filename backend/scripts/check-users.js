const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const users = await p.user.findMany({ select: { id: true, email: true, yandexDiskToken: true, yandexDiskRootPath: true, yandexDiskEmail: true } });
  for (const u of users) {
    console.log('id:', u.id, 'email:', u.email, 'ydToken:', u.yandexDiskToken ? 'SET' : 'null', 'ydRoot:', u.yandexDiskRootPath, 'ydEmail:', u.yandexDiskEmail);
  }
  await p.$disconnect();
})();
