const CREATOR_ID = 'e5f9d8c7-4b3a-4e2d-9f1a-8c7b6a5d4e3f';
const API_URL = `http://localhost:3000/api/analytics/usage/operations?creatorId=${CREATOR_ID}`;

console.log('Testing Operation Breakdown API...\n');
console.log(`URL: ${API_URL}\n`);

fetch(API_URL)
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      console.log('✅ API call successful!\n');
      console.log('SUMMARY:');
      console.log(`  Total Cost: $${data.data.summary.total_cost}`);
      console.log(`  Transcription: ${data.data.summary.by_operation.transcription_percent.toFixed(2)}%`);
      console.log(`  Embeddings: ${data.data.summary.by_operation.embeddings_percent.toFixed(2)}%`);
      console.log(`  Storage: ${data.data.summary.by_operation.storage_percent.toFixed(2)}%`);
      console.log(`  Chat: ${data.data.summary.by_operation.chat_percent.toFixed(2)}%`);
      console.log('\nDETAILS:');
      console.log(`  Transcription Videos: ${data.data.transcription.videos.length}`);
      console.log(`  Embedding Videos: ${data.data.embeddings.videos.length}`);
      console.log(`  Storage Videos: ${data.data.storage.videos.length}`);
      console.log(`  Chat Sessions: ${data.data.chat.total_sessions}`);
      console.log('\n✅ All data structures look correct!');
    } else {
      console.error('❌ API call failed:', data);
    }
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    console.error('Make sure the dev server is running: npm run dev');
  });
