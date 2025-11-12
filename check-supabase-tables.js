// Quick script to check existing Supabase tables
const https = require('https');

const SUPABASE_URL = 'https://dddttlnrkwaddzjvkacp.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkZHR0bG5ya3dhZGR6anZrYWNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTI0NzM1MCwiZXhwIjoyMDc2ODIzMzUwfQ.jAB1sm1k_dMECK4x_yVK8Uy_v1996DQH0TSEi4PTNKw';

// Query to get all tables in public schema
const query = `
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
`;

const options = {
  hostname: 'dddttlnrkwaddzjvkacp.supabase.co',
  path: '/rest/v1/rpc/exec_sql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
  }
};

// Try direct SQL query endpoint
const sqlQuery = encodeURIComponent(query);
https.get(`${SUPABASE_URL}/rest/v1/rpc/exec_sql?sql=${sqlQuery}`, {
  headers: {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Tables in your Supabase database:');
    console.log(data);
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
  
  // Fallback: Try to query pg_catalog directly
  console.log('\nTrying alternative method...');
  const { exec } = require('child_process');
  const pgQuery = `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' ORDER BY tablename;`;
  
  // We'll need to use psql or another method
  console.log('Please run this SQL query in your Supabase SQL Editor:');
  console.log(pgQuery);
});
