// Setup Neon database for DeerTrack
const { execSync } = require('child_process');

process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_Ea0MmUVWRcD4@ep-misty-king-any1otnm.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require';

try {
  console.log('Pushing schema to Neon...');
  const result = execSync('npx prisma db push --skip-generate', { 
    cwd: '/Users/brody/.openclaw/workspace/deertrack/backend',
    env: process.env,
    stdio: 'pipe'
  });
  console.log(result.toString().split('\n').filter(l => l.includes('✔') || l.includes('sync') || l.includes('done')).join('\n'));
  console.log('Schema pushed!');
} catch(e) {
  console.error('Schema push error:', e.message);
}
