const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function fetchYandexResource(accessToken, providerPath, limit, offset) {
  const url = new URL('https://cloud-api.yandex.net/v1/disk/resources');
  url.searchParams.set('path', providerPath);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('offset', String(offset));
  url.searchParams.set('fields', [
    'path','name','type','size','mime_type','modified','file',
    '_embedded.total','_embedded.items.path','_embedded.items.name',
    '_embedded.items.type','_embedded.items.size','_embedded.items.mime_type',
    '_embedded.items.modified','_embedded.items.file',
  ].join(','));

  const res = await fetch(url.toString(), {
    headers: { Authorization: 'OAuth ' + accessToken },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error('Yandex API ' + res.status + ': ' + body.slice(0, 200));
  }
  return res.json();
}

(async () => {
  try {
    const user = await p.user.findFirst({
      where: { yandexDiskToken: { not: null } },
      select: { id: true, email: true, yandexDiskToken: true, yandexDiskRootPath: true },
    });

    if (!user || !user.yandexDiskToken) {
      console.log('No user with Yandex token');
      await p.$disconnect();
      return;
    }

    const at = user.yandexDiskToken.access_token;
    const rootPath = user.yandexDiskRootPath || 'disk:/';
    console.log('User:', user.email, 'Root:', rootPath);
    console.log('Token:', String(at).slice(0, 15) + '...');

    // Quick test
    console.log('Testing API...');
    const testRes = await fetch('https://cloud-api.yandex.net/v1/disk/resources?path=disk:/&limit=1', {
      headers: { Authorization: 'OAuth ' + at },
    });
    console.log('Test status:', testRes.status);
    if (!testRes.ok) {
      console.log('Test failed:', await testRes.text());
      await p.$disconnect();
      return;
    }

    // Collect all resources via BFS
    const resources = [];
    const queue = [rootPath];

    resources.push({
      providerPath: rootPath,
      parentProviderPath: null,
      name: rootPath === 'disk:/' ? 'Мой диск' : rootPath.split('/').pop(),
      type: 'FOLDER',
    });

    console.log('Starting BFS...');
    while (queue.length > 0) {
      const current = queue.shift();
      console.log('  Scanning:', current);
      let offset = 0;
      while (true) {
        const data = await fetchYandexResource(at, current, 200, offset);
        const items = data._embedded?.items || [];
        const total = data._embedded?.total || items.length;

        for (const item of items) {
          const isFolder = item.type === 'dir';
          resources.push({
            providerPath: item.path,
            parentProviderPath: current,
            name: item.name,
            type: isFolder ? 'FOLDER' : 'FILE',
            extension: isFolder ? null : (item.name.includes('.') ? item.name.split('.').pop().toLowerCase() : null),
            size: item.size ? (item.size > 1024*1024 ? (item.size/(1024*1024)).toFixed(1)+' МБ' : Math.round(item.size/1024)+' КБ') : null,
            cloudUrl: isFolder ? ('https://disk.yandex.ru/client/disk' + item.path.replace('disk:', '')) : (item.file || ''),
          });
          if (isFolder) queue.push(item.path);
        }

        offset += items.length;
        if (items.length === 0 || offset >= total) break;
      }
    }

    console.log('Collected', resources.length, 'resources');

    // Write to DB
    console.log('Deleting old records...');
    await p.fileRecord.deleteMany({
      where: { userId: user.id, cloudProvider: 'YANDEX_DISK' },
    });

    console.log('Inserting records...');
    const idByPath = new Map();
    for (const r of resources) {
      const parentId = r.parentProviderPath ? (idByPath.get(r.parentProviderPath) || null) : null;
      const created = await p.fileRecord.create({
        data: {
          userId: user.id,
          name: r.name,
          type: r.type,
          extension: r.extension || null,
          size: r.size || null,
          cloudProvider: 'YANDEX_DISK',
          cloudUrl: r.cloudUrl || '',
          parentId,
        },
      });
      idByPath.set(r.providerPath, created.id);
    }

    const finalCount = await p.fileRecord.count({ where: { userId: user.id } });
    console.log('Done! DB now has', finalCount, 'file records');
  } catch (err) {
    console.error('ERROR:', err.message);
    console.error(err.stack);
  } finally {
    await p.$disconnect();
  }
})();
