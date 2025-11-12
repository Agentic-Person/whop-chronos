// Simple script to list Supabase tables via REST API OpenAPI schema
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkZHR0bG5ya3dhZGR6anZrYWNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTI0NzM1MCwiZXhwIjoyMDc2ODIzMzUwfQ.jAB1sm1k_dMECK4x_yVK8Uy_v1996DQH0TSEi4PTNKw';

const response = await fetch('https://dddttlnrkwaddzjvkacp.supabase.co/rest/v1/', {
  headers: {
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`
  }
});

const schema = await response.json();

// Extract table names from OpenAPI paths
const tables = Object.keys(schema.paths || {})
  .filter(path => !path.includes('rpc/'))
  .map(path => path.replace('/', ''))
  .filter(name => name.length > 0)
  .sort();

console.log('=== TABLES IN YOUR SUPABASE DATABASE ===\n');
console.log(`Total tables found: ${tables.length}\n`);

tables.forEach((table, i) => {
  console.log(`${i + 1}. ${table}`);
});

console.log('\n=== DETAILED SCHEMA ===');
console.log(JSON.stringify(schema.definitions, null, 2));
