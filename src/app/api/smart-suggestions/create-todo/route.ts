import { NextRequest, NextResponse } from 'next/server';
import { TodoService } from '@/lib/db/service';
import { z } from 'zod';

const createTodoFromSuggestionSchema = z.object({
  suggestionId: z.string(),
  eventId: z.string(),
  eventTitle: z.string(),
  title: z.string().min(1, 'Titel ist erforderlich'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  estimatedHours: z.number().optional(),
  reasoning: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createTodoFromSuggestionSchema.parse(body);

    console.log('📝 Erstelle Todo aus Smart Suggestion:', data.title);

    // Erweiterte Beschreibung mit Smart Suggestion Kontext
    const enhancedDescription = [
      data.description || '',
      '',
      '🧠 Smart Suggestion Details:',
      `• Basierend auf Event: "${data.eventTitle}"`,
      `• Suggestion ID: ${data.suggestionId}`,
      ...(data.reasoning ? [`• Begründung: ${data.reasoning}`] : []),
    ].join('\\n');

    const todo = await TodoService.createTodo({
      title: data.title,
      description: enhancedDescription,
      priority: data.priority,
      estimatedHours: data.estimatedHours,
      completed: false,
      dueDate: null,
      tags: JSON.stringify(['smart-suggestion', 'meeting-followup']),
    });

    console.log('✅ Todo aus Smart Suggestion erstellt:', todo.id);

    return NextResponse.json({
      success: true,
      todo,
    });

  } catch (error) {
    console.error('❌ Fehler beim Erstellen des Todos aus Smart Suggestion:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ungültige Daten',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create todo from suggestion',
      },
      { status: 500 }
    );
  }
}
