const { Client } = require('pg');
const client = new Client('postgresql://neondb_owner:npg_1XcSn5JfhryH@ep-bitter-pond-anisuo8y-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require');

async function update() {
  try {
    await client.connect();
    console.log('Connected to DB');

    const adminHash = '176a89475b8bb1e119394848cb25ab6fc94d0786ddc7e6fe626c626283c77dc2';
    const userHash = '1b8b8614dbc29dd5de1e5cfeabd3c9f04b39e79947f2d0ad5113e11c57dd8b23';

    await client.query('UPDATE "users" SET "password_hash" = $1 WHERE "email" = $2', [adminHash, 'admin@elitestarx.com']);
    console.log('Admin updated');

    await client.query('UPDATE "users" SET "password_hash" = $1 WHERE "email" = $2', [userHash, 'user@elitestarx.com']);
    console.log('User updated');

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

update();
