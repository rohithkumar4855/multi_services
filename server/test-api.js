const axios = require('axios');
const client = axios.create({ baseURL: 'http://localhost:5000/api' });
async function run() {
  const res = await client.get('/tenants');
  const returnedRes = res.data;
  
  console.log("returnedRes:", Array.isArray(returnedRes) ? "array" : typeof returnedRes, returnedRes !== null ? Object.keys(returnedRes) : null);
  console.log("returnedRes.data is array?", Array.isArray(returnedRes.data));
  
  if (returnedRes && returnedRes.data && Array.isArray(returnedRes.data) && returnedRes.data.length > 0) {
    console.log("Condition met! Data length:", returnedRes.data.length);
  } else {
    console.log("Condition NOT met!");
  }
}
run();
