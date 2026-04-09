const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  try {
    const files = await p.fileRecord.count();
    const shares = await p.fileShare.count();
    console.log('FileRecords:', files, 'FileShares:', shares);

    const shareDetails = await p.fileShare.findMany({
      include: { file: { select: { id: true, name: true, type: true, cloudUrl: true } }, student: { select: { id: true, name: true } } },
    });
    console.log('Share details:');
    for (const s of shareDetails) {
      console.log('  Student:', s.student.name, '| File:', s.file.name, '(', s.file.type, ') cloudUrl:', s.file.cloudUrl ? s.file.cloudUrl.slice(0, 60) + '...' : 'EMPTY');
    }

    // Check students with portal tokens
    const students = await p.student.findMany({
      where: { portalToken: { not: null } },
      select: { id: true, name: true, portalToken: true, subject: true },
    });
    console.log('\nStudents with portal tokens:');
    for (const st of students) {
      console.log('  ', st.name, 'token:', st.portalToken?.slice(0, 10) + '...', 'subject:', st.subject);
    }
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await p.$disconnect();
  }
})();
