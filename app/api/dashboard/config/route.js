import { NextResponse } from 'next/server';
import { 
  getDashboardsData, 
  createDashboardTab, 
  renameDashboardTab, 
  deleteDashboardTab, 
  addDashboardItem, 
  updateDashboardItem, 
  deleteDashboardItem,
  moveDashboardItem,
  duplicateDashboardItem,
  importDashboardsConfig
} from '../../../lib/config-store';

export async function GET() {
  try {
    const config = getDashboardsData();
    return NextResponse.json({ 
      success: true, 
      config,
      dashboards: config.dashboards, 
      activeDashboardId: config.activeDashboardId 
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    // 1. Dashboard Tab Actions
    if (body.action === 'create_dashboard') {
      const { newDash, config } = createDashboardTab(body.name, body.icon);
      return NextResponse.json({
        success: true,
        message: `Created dashboard "${newDash.name}".`,
        dashboard: newDash,
        dashboards: config.dashboards,
        activeDashboardId: config.activeDashboardId
      });
    }

    if (body.action === 'rename_dashboard') {
      const res = renameDashboardTab(body.dashboardId, body.name, body.icon);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        dashboards: res.config.dashboards,
        activeDashboardId: res.config.activeDashboardId
      });
    }

    if (body.action === 'delete_dashboard') {
      const res = deleteDashboardTab(body.dashboardId);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        dashboards: res.config.dashboards,
        activeDashboardId: res.config.activeDashboardId
      });
    }

    // 1b. Move Widget between Dashboards
    if (body.action === 'move_widget') {
      const { itemId, fromDashboardId, toDashboardId } = body;
      const res = moveDashboardItem(itemId, fromDashboardId, toDashboardId);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: 'Widget moved successfully.',
        dashboards: res.config.dashboards,
        activeDashboardId: res.config.activeDashboardId
      });
    }

    // 1c. Duplicate Widget
    if (body.action === 'duplicate_widget') {
      const { itemId, dashboardId } = body;
      const res = duplicateDashboardItem(itemId, dashboardId);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: `Duplicated widget "${res.duplicatedItem.name}".`,
        item: res.duplicatedItem,
        dashboards: res.config.dashboards,
        activeDashboardId: res.config.activeDashboardId
      });
    }

    // 1d. Import Full configs.json
    if (body.action === 'import_config') {
      const res = importDashboardsConfig(body.configData);
      return NextResponse.json({
        success: true,
        message: 'Configuration imported successfully.',
        dashboards: res.config.dashboards,
        activeDashboardId: res.config.activeDashboardId
      });
    }

    // 2. Add Widget Item Action
    const { 
      dashboardId, 
      name, 
      type, 
      chartType, 
      icon, 
      prefix, 
      suffix, 
      subtitle, 
      size, 
      dbPath, 
      sql, 
      color,
      fontSize,
      sectionStyle,
      xAxisCol,
      yAxisCols,
      chartMode,
      dualAxis
    } = body;

    if (!name || (!sql && type !== 'section_divider')) {
      return NextResponse.json(
        { success: false, error: 'Widget Title (name) and SQL Statement are required.' },
        { status: 400 }
      );
    }

    const res = addDashboardItem({ 
      name, 
      type, 
      chartType, 
      icon, 
      prefix, 
      suffix, 
      subtitle, 
      size: size || (type === 'section_divider' ? 'full' : 'half'), 
      dbPath, 
      sql: type === 'section_divider' ? '' : sql, 
      color,
      fontSize,
      sectionStyle,
      xAxisCol,
      yAxisCols,
      chartMode,
      dualAxis
    }, dashboardId);

    return NextResponse.json({
      success: true,
      message: `Added widget "${res.item.name}".`,
      item: res.item,
      dashboards: res.config.dashboards,
      activeDashboardId: res.config.activeDashboardId
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { 
      id, 
      dashboardId, 
      name, 
      type, 
      chartType, 
      icon, 
      prefix, 
      suffix, 
      subtitle, 
      size, 
      dbPath, 
      sql, 
      color,
      fontSize,
      sectionStyle,
      xAxisCol,
      yAxisCols,
      chartMode,
      dualAxis
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Widget ID is required for editing.' }, { status: 400 });
    }

    const res = updateDashboardItem(id, { 
      name, 
      type, 
      chartType, 
      icon, 
      prefix, 
      suffix, 
      subtitle, 
      size, 
      dbPath, 
      sql, 
      color,
      fontSize,
      sectionStyle,
      xAxisCol,
      yAxisCols,
      chartMode,
      dualAxis
    }, dashboardId);

    if (!res) {
      return NextResponse.json({ success: false, error: 'Widget not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Updated widget "${res.item.name}".`,
      item: res.item,
      dashboards: res.config.dashboards,
      activeDashboardId: res.config.activeDashboardId
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const dashboardId = searchParams.get('dashboardId');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Widget ID is required.' }, { status: 400 });
    }

    const res = deleteDashboardItem(id, dashboardId);

    return NextResponse.json({
      success: res.success,
      message: res.success ? 'Widget removed successfully.' : 'Widget not found.',
      dashboards: res.config.dashboards,
      activeDashboardId: res.config.activeDashboardId
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
