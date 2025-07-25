import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // 这里可以更新数据库中的横幅状态
    // 目前只是返回成功响应
    return NextResponse.json({ success: true, message: '横幅已关闭' });
  } catch (error) {
    console.error('关闭横幅失败:', error);
    return NextResponse.json(
      { error: '关闭横幅失败' },
      { status: 500 }
    );
  }
} 