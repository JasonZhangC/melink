import { NextResponse } from 'next/server';

// 默认页面数据
const defaultPageData = {
  user: {
    avatar: 'http://localhost:3845/assets/59c703059763c215467f37e29240383bbd8eda59.png',
    publisher: '发布者：'
  },
  activity: {
    title: '湖畔客创中心',
    time: '7月27号下午3点15分到4点10分',
    image: 'http://localhost:3845/assets/60092f071a6ca4334df62c5065160922d3eafeb7.png'
  },
  meeting: {
    title: '会议纪要',
    content: [
      '李华提出优化产品界面，提升用户体验。',
      '王明分享AI投资趋势，强调落地逻辑。',
      '张伟分析市场竞争，建议差异化策略。'
    ]
  },
  banner: {
    visible: true,
    content: '横幅内容'
  }
};

export async function GET() {
  try {
    // 这里可以从数据库获取数据
    // 目前返回默认数据
    return NextResponse.json(defaultPageData);
  } catch (error) {
    console.error('获取页面数据失败:', error);
    return NextResponse.json(
      { error: '获取数据失败' },
      { status: 500 }
    );
  }
} 