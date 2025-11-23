import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function publishCourse() {
  const courseId = '861188ad-47c4-4603-ba21-f8b232b410a1';

  console.log('Publishing course:', courseId);

  const { data, error } = await supabase
    .from('courses')
    .update({ is_published: true })
    .eq('id', courseId)
    .select('title, is_published');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Course published successfully!');
  console.log('Result:', data);
}

publishCourse();
