import { NextResponse } from 'next/server';
import { getDashboardItems, addDashboardItem, updateDashboardItem, deleteDashboardItem } from '../../../lib/config-store';

export async function GET() {
  try {
    const items = getDashboardItems();
    return NextResponse.json({ success: true, items });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, type, chartType, size, dbPath, sql, color } = body;

    if (!name || !sql) {
      return NextResponse.json(
        { success: false, error: 'Widget Title (name) and SQL Statement are required.' },
        { status: 400 }
      );
    }

    const newItem = addDashboardItem({ name, type, chartType, size, dbPath, sql, color });
    const items = getDashboardItems();

    return NextResponse.json({
      success: true,
      message: `Added widget "${newItem.name}" to dashboard.`,
      item: newItem,
      items
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, name, type, chartType, size, dbPath, sql, color } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Widget ID is required for editing.' }, { status: 400 });
    }

    const updatedItem = updateDashboardItem(id, { name, type, chartType, size, dbPath, sql, color });
    if (!updatedItem) {
      return NextResponse.json({ success: false, error: 'Widget not found.' }, { status: 404 });
    }

    const items = getDashboardItems();
    return NextResponse.json({
      success: true,
      message: `Updated widget "${updatedItem.name}".`,
      item: updatedItem,
      items
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Widget ID is required.' }, { status: 400 });
    }

    const deleted = deleteDashboardItem(id);
    const items = getDashboardItems();

    return NextResponse.json({
      success: deleted,
      message: deleted ? 'Widget removed successfully.' : 'Widget not found.',
      items
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
