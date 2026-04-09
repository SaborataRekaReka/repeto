const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  try {
    // Get student's portal token
    const student = await p.student.findFirst({
      where: { name: { contains: 'Иванов' } },
      select: { id: true, name: true, portalToken: true },
    });
    console.log('Student:', student?.name, 'token:', student?.portalToken?.slice(0, 10) + '...');

    // Get the shared folder
    const shares = await p.fileShare.findMany({
      where: { studentId: student.id },
      include: { file: { select: { id: true, name: true, type: true, cloudUrl: true } } },
    });
    console.log('Shares:', shares.length);
    for (const s of shares) {
      console.log('  Shared:', s.file.name, '(', s.file.type, ')');
    }

    // Get folder children
    const folderId = shares[0]?.file.id;
    if (folderId) {
      const children = await p.fileRecord.findMany({
        where: { parentId: folderId },
        select: { id: true, name: true, type: true, cloudUrl: true },
        take: 10,
      });
      console.log('\nFolder children (' + children.length + '):');
      for (const c of children) {
        console.log('  ', c.name, '(', c.type, ') url:', c.cloudUrl ? c.cloudUrl.slice(0, 50) + '...' : 'EMPTY');
      }
    }
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await p.$disconnect();
  }
})();
