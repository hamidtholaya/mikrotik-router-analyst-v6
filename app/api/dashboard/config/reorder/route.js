import { NextResponse } from 'next/server';
import { reorderDashboardItems } from '../../../../lib/config-store';

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderedIds } = body;

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json(
        { success: false, error: 'orderedIds array is required.' },
        { status: 400 }
      );
    }

    const items = reorderDashboardItems(orderedIds);

    return NextResponse.json({
      success: true,
      message: 'Dashboard items reordered successfully.',
      items
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
