import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, url } = body;

    // 这里可以实现分享逻辑
    // 比如记录分享次数、生成分享链接等
    console.log('分享内容:', { title, url });

    return NextResponse.json({ 
      success: true, 
      message: '分享成功',
      data: { title, url }
    });
  } catch (error) {
    console.error('分享失败:', error);
    return NextResponse.json(
      { error: '分享失败' },
      { status: 500 }
    );
  }
} 