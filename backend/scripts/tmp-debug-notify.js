const { PrismaClient } = require('@prisma/client');

(async () => {
  const p = new PrismaClient();
  try {
    const users = await p.user.findMany({
      select: { id: true, name: true, notificationSettings: true },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });
    console.log('USERS', JSON.stringify(users, null, 2));

    const students = await p.student.findMany({
      select: {
        id: true,
        name: true,
        userId: true,
        telegramChatId: true,
        maxChatId: true,
        portalToken: true,
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
    console.log('STUDENTS', JSON.stringify(students, null, 2));

    const bookings = await p.bookingRequest.findMany({
      select: {
        id: true,
        userId: true,
        clientName: true,
        status: true,
        telegramChatId: true,
        maxChatId: true,
        comment: true,
        createdAt: true,
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
    console.log('BOOKINGS', JSON.stringify(bookings, null, 2));
  } finally {
    await p.$disconnect();
  }
})();
