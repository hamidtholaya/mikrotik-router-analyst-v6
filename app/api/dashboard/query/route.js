import { NextResponse } from 'next/server';
import { executeSqlQuery } from '../../../lib/sqlite-runner';

export async function POST(request) {
  try {
    const body = await request.json();
    const { sql, dbPath } = body;

    if (!sql) {
      return NextResponse.json(
        { success: false, error: 'SQL statement is required.' },
        { status: 400 }
      );
    }

    const queryResult = await executeSqlQuery(sql, dbPath);

    return NextResponse.json(queryResult);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || 'Execution error' },
      { status: 500 }
    );
  }
}
