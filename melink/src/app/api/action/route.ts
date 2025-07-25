import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, timestamp } = body;

    // 这里可以实现具体的操作逻辑
    // 比如记录用户行为、触发特定功能等
    console.log('用户操作:', { action, timestamp });

    return NextResponse.json({ 
      success: true, 
      message: '操作成功',
      data: { action, timestamp }
    });
  } catch (error) {
    console.error('操作失败:', error);
    return NextResponse.json(
      { error: '操作失败' },
      { status: 500 }
    );
  }
} 