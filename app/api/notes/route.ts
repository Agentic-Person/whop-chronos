import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/notes
 *
 * Fetch notes for a specific lesson and student
 *
 * Query params:
 * - lesson_id: UUID of the lesson (video)
 * - student_id: UUID of the student
 *
 * Returns:
 * - 200: { success: true, note: { id, content, updated_at } }
 * - 404: { success: false, error: 'Note not found' }
 * - 500: { success: false, error: 'Error message' }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lesson_id');
    const studentId = searchParams.get('student_id');

    if (!lessonId || !studentId) {
      return NextResponse.json(
        { success: false, error: 'Missing lesson_id or student_id' },
        { status: 400 }
      );
    }

    // Fetch note from database
    const { data, error } = await supabase
      .from('lesson_notes')
      .select('*')
      .eq('lesson_id', lessonId)
      .eq('student_id', studentId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = not found, which is OK
      console.error('[API /notes GET] Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch note' },
        { status: 500 }
      );
    }

    if (!data) {
      // No note found - return empty note
      return NextResponse.json({
        success: true,
        note: null,
      });
    }

    return NextResponse.json({
      success: true,
      note: {
        id: data.id,
        content: data.content,
        updated_at: data.updated_at,
      },
    });
  } catch (err) {
    console.error('[API /notes GET] Unexpected error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notes
 *
 * Create or update notes for a lesson
 *
 * Body:
 * - lesson_id: UUID of the lesson (video)
 * - student_id: UUID of the student
 * - content: Note content (text)
 *
 * Returns:
 * - 200: { success: true, note: { id, content, updated_at } }
 * - 500: { success: false, error: 'Error message' }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lesson_id, student_id, content } = body;

    if (!lesson_id || !student_id) {
      return NextResponse.json(
        { success: false, error: 'Missing lesson_id or student_id' },
        { status: 400 }
      );
    }

    // Content can be empty (allow deletion)
    const noteContent = content || '';

    // Upsert note (insert or update)
    const { data, error } = await supabase
      .from('lesson_notes')
      .upsert(
        {
          lesson_id,
          student_id,
          content: noteContent,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'lesson_id,student_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('[API /notes POST] Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to save note' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      note: {
        id: data.id,
        content: data.content,
        updated_at: data.updated_at,
      },
    });
  } catch (err) {
    console.error('[API /notes POST] Unexpected error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notes
 *
 * Delete notes for a lesson
 *
 * Query params:
 * - lesson_id: UUID of the lesson
 * - student_id: UUID of the student
 *
 * Returns:
 * - 200: { success: true }
 * - 500: { success: false, error: 'Error message' }
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lesson_id');
    const studentId = searchParams.get('student_id');

    if (!lessonId || !studentId) {
      return NextResponse.json(
        { success: false, error: 'Missing lesson_id or student_id' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('lesson_notes')
      .delete()
      .eq('lesson_id', lessonId)
      .eq('student_id', studentId);

    if (error) {
      console.error('[API /notes DELETE] Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete note' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API /notes DELETE] Unexpected error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
