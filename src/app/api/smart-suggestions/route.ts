import { NextRequest, NextResponse } from 'next/server';
import { SmartSuggestionsService } from '@/lib/smart-suggestions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lookbackDays = searchParams.get('lookbackDays');
    const includeToday = searchParams.get('includeToday');
    const includeFuture = searchParams.get('includeFuture');
    const futureDays = searchParams.get('futureDays');

    console.log('🧠 Smart Suggestions API aufgerufen');

    const suggestions = await SmartSuggestionsService.generateSuggestions({
      lookbackDays: lookbackDays ? parseInt(lookbackDays) : 0,
      includeToday: includeToday === 'true',
      includeFuture: includeFuture === 'true',
      futureDays: futureDays ? parseInt(futureDays) : 4,
    });

    return NextResponse.json({
      success: true,
      suggestions,
      count: suggestions.length,
    });
  } catch (error) {
    console.error('❌ Smart Suggestions API Fehler:', error);
    
    // Liefere leere Vorschläge statt Fehler
    return NextResponse.json({
      success: true,
      suggestions: [],
      count: 0,
      warning: 'Could not generate suggestions - Google Calendar may not be authenticated',
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { events } = await request.json();

    console.log('🧠 Smart Suggestions API aufgerufen (POST) mit', events.length, 'Events');

    const suggestions = await SmartSuggestionsService.generateSuggestionsFromEvents(events);

    return NextResponse.json({
      success: true,
      suggestions,
      count: suggestions.length,
    });
  } catch (error) {
    console.error('❌ Smart Suggestions API Fehler:', error);
    
    return NextResponse.json({
      success: true,
      suggestions: [],
      count: 0,
      warning: 'Could not generate suggestions from provided events',
    });
  }
}
