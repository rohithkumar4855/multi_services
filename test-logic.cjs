const axios = require('axios');
const INITIAL_TENANTS = [
  {
    id: 'tenant-1',
    name: 'UrbanFix Home Services',
    status: 'active',
  },
  {
    id: 'tenant-2',
    name: 'CleanPro Solutions',
    status: 'active',
  }
];

async function run() {
  const prev = INITIAL_TENANTS;
  
  const client = axios.create({ baseURL: 'http://localhost:5000/api' });
  const axiosRes = await client.get('/tenants');
  // In api.ts it returns res.data
  const res = axiosRes.data;
  
  if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
    const map = new Map(prev.map(t => [t.id, t]));
    for (const dbT of res.data) {
      const existing = map.get(dbT.id);
      const dbCfg = (dbT.config || {}) ;
      const mergedCfg = {
        ...(existing?.config || {}),
        ...dbCfg
      };
      
      map.set(dbT.id, {
        id: dbT.id,
        name: dbT.name || existing?.name || 'Business',
        ownerName: mergedCfg.ownerName || (dbT.users && dbT.users[0] && dbT.users[0].name) || existing?.ownerName || dbT.name,
        ownerEmail: mergedCfg.ownerEmail || (dbT.users && dbT.users[0] && dbT.users[0].email) || existing?.ownerEmail || '',
        ownerPhone: mergedCfg.ownerPhone || mergedCfg.phone || existing?.ownerPhone || '',
        subdomain: dbT.subdomain || existing?.subdomain || dbT.id.replace(/^tenant-/, ''),
        status: dbT.status || mergedCfg.status || existing?.status || 'active',
        plan: dbT.plan || existing?.plan || 'starter',
        industries: mergedCfg.industries || existing?.industries || ['Electrician'],
        theme: mergedCfg.theme || existing?.theme || 'modern',
        config: mergedCfg,
        features: mergedCfg.features || existing?.features || { crm: true, ai: false, quotation: true, emergencyBooking: true, analytics: false, marketing: false, inventory: false },
        registeredAt: dbT.createdAt ? new Date(dbT.createdAt).toISOString().split('T')[0] : existing?.registeredAt || new Date().toISOString().split('T')[0]
      });
    }
    const merged = Array.from(map.values());
    console.log("Merged Tenants Count:", merged.length);
    console.log(JSON.stringify(merged, null, 2));
  } else {
    console.log("Condition failed");
  }
}
run().catch(console.error);
