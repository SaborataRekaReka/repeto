const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  const r = await p.user.findFirst({
    where: { yandexDiskToken: { not: null } },
    select: { yandexDiskToken: true, yandexDiskRootPath: true, email: true },
  });
  console.log('user:', r?.email, 'rootPath:', r?.yandexDiskRootPath);

  // Check DB file records
  const count = await p.fileRecord.count({ where: { userId: r?.email ? undefined : undefined } });
  const allCount = await p.fileRecord.count();
  console.log('Total fileRecords in DB:', allCount);
  
  const files = await p.fileRecord.findMany({ take: 5, select: { name: true, type: true, parentId: true, cloudProvider: true } });
  console.log('Sample files:', JSON.stringify(files, null, 2));
  const tok = r?.yandexDiskToken;
  if (!tok || typeof tok !== 'object') {
    console.log('no token');
    return;
  }
  const at = tok.access_token;
  console.log('token:', String(at).slice(0, 15) + '...');

  // Try the exact URL that sync uses
  const syncUrl = new URL('https://cloud-api.yandex.net/v1/disk/resources');
  syncUrl.searchParams.set('path', 'disk:/');
  syncUrl.searchParams.set('limit', '5');
  syncUrl.searchParams.set('offset', '0');
  syncUrl.searchParams.set('fields', [
    'path','name','type','size','mime_type','modified','file',
    '_embedded.total','_embedded.items.path','_embedded.items.name',
    '_embedded.items.type','_embedded.items.size','_embedded.items.mime_type',
    '_embedded.items.modified','_embedded.items.file',
  ].join(','));

  const res2 = await fetch(syncUrl.toString(), {
    headers: { Authorization: 'OAuth ' + at },
  });
  console.log('\\nSync-style API status:', res2.status);
  const b2 = await res2.text();
  console.log(b2.slice(0, 500));
  await p.$disconnect();
})();
