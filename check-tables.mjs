import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dddttlnrkwaddzjvkacp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkZHR0bG5ya3dhZGR6anZrYWNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTI0NzM1MCwiZXhwIjoyMDc2ODIzMzUwfQ.jAB1sm1k_dMECK4x_yVK8Uy_v1996DQH0TSEi4PTNKw'
);

async function checkTables() {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `
    });

    if (error) {
      console.error('Error querying tables:', error.message);
      
      // Try alternative: List using REST API by querying a known table
      console.log('\nAttempting to detect tables from REST API...');
      
      // Get schema from REST API
      const response = await fetch('https://dddttlnrkwaddzjvkacp.supabase.co/rest/v1/', {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkZHR0bG5ya3dhZGR6anZrYWNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTI0NzM1MCwiZXhwIjoyMDc2ODIzMzUwfQ.jAB1sm1k_dMECK4x_yVK8Uy_v1996DQH0TSEi4PTNKw'
        }
      });
      
      const schema = await response.json();
      console.log('\nAvailable tables from REST API:');
      console.log(JSON.stringify(schema, null, 2));
    } else {
