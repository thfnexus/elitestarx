const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://neondb_owner:npg_1XcSn5JfhryH@ep-bitter-pond-anisuo8y-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require' });

client.connect().then(() => {
  return client.query("UPDATE users SET balance='3.408', total_earnings='0.558', has_active_plan=true WHERE username='EliteStarX';");
}).then((res) => {
  console.log('Update successful', res.rowCount);
  return client.end();
}).catch(console.error);
