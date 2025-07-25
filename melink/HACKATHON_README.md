# 黑客松交流页面 - Next.js集成版

## 📋 项目概述

这是将原始HTML/CSS黑客松交流页面集成到Next.js项目中的版本，保持了原有的设计风格和功能，同时利用了Next.js的优势。

## 🚀 快速开始

### 1. 启动开发服务器
```bash
npm run dev
```

### 2. 访问页面
- 主页：http://localhost:3000
- 黑客松页面：http://localhost:3000/hackathon

## 📁 文件结构

```
src/app/
├── hackathon/
│   ├── page.tsx          # 黑客松页面组件
│   └── hackathon.css     # 页面样式
├── api/
│   ├── page-data/        # 页面数据API
│   ├── banner/close/     # 关闭横幅API
│   ├── share/            # 分享功能API
│   └── action/           # 操作按钮API
└── page.tsx              # 主页（已添加导航链接）
```

## 🎨 功能特性

### ✅ 已实现功能
- **完整页面布局**: 状态栏、导航栏、头像、标题、卡片、横幅、按钮
- **响应式设计**: 支持移动端适配
- **交互功能**: 
  - 关闭横幅
  - 分享功能（支持原生分享API和剪贴板）
  - 操作按钮
- **API集成**: 完整的后端API接口
- **图片优化**: 使用Next.js Image组件
- **TypeScript支持**: 完整的类型定义

### 🔧 技术特点
- **Next.js 15**: 使用最新的App Router
- **React 19**: 使用最新的React特性
- **TypeScript**: 完整的类型安全
- **CSS模块**: 独立的样式文件
- **API路由**: 内置的后端API

## 📊 API接口

### 1. 获取页面数据
```http
GET /api/page-data
```

### 2. 关闭横幅
```http
POST /api/banner/close
```

### 3. 分享功能
```http
POST /api/share
Content-Type: application/json

{
  "title": "页面标题",
  "url": "页面URL"
}
```

### 4. 操作按钮
```http
POST /api/action
Content-Type: application/json

{
  "action": "button_click",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🎯 设计规范

### 颜色系统
- **主文本**: #191D30
- **次要文本**: #8C8E97
- **背景**: #FFFFFF
- **边框**: #ECEDEF
- **绿色**: #67B779
- **橙色**: #F95721
- **品牌色**: #074244

### 字体系统
- **主标题**: SF Pro Display Bold, 34px
- **卡片标题**: SF Pro Display Bold, 24px
- **正文**: SF Pro Display Regular, 16px
- **时间**: SF Pro Text Semibold, 15px

### 布局规范
- **容器宽度**: 375px
- **卡片圆角**: 24px
- **内边距**: 24px
- **间距**: 16px-24px

## 🔧 配置说明

### Next.js配置
```typescript
// next.config.ts
images: {
  remotePatterns: [
    {
      protocol: 'http',
      hostname: 'localhost',
      port: '3845',
      pathname: '/assets/**',
    },
  ],
}
```

### 图片资源
所有图片资源托管在：`http://localhost:3845/assets/`
- 头像、活动图片、图标等
- 支持PNG和SVG格式
- 响应式图片加载

## 🚀 部署说明

### 1. 构建项目
```bash
npm run build
```

### 2. 启动生产服务器
```bash
npm start
```

### 3. 环境变量配置
```env
# 图片资源地址
NEXT_PUBLIC_IMAGE_BASE_URL=http://localhost:3845/assets
# API基础地址
NEXT_PUBLIC_API_BASE_URL=/api
```

## 🔄 与原版对比

### 优势
- ✅ **更好的性能**: Next.js的优化和缓存
- ✅ **SEO友好**: 服务端渲染支持
- ✅ **开发体验**: TypeScript + 热重载
- ✅ **部署简单**: Vercel一键部署
- ✅ **扩展性强**: 易于添加新功能

### 保持的特性
- ✅ **设计还原**: 100%还原原始设计
- ✅ **交互功能**: 所有交互功能完整保留
- ✅ **响应式**: 移动端适配
- ✅ **动画效果**: 悬停和过渡动画

## 🛠️ 开发指南

### 添加新功能
1. 在 `src/app/hackathon/page.tsx` 中添加组件
2. 在 `src/app/hackathon/hackathon.css` 中添加样式
3. 在 `src/app/api/` 中添加API路由

### 修改数据
1. 编辑 `src/app/api/page-data/route.ts` 中的数据
2. 或连接数据库实现动态数据

### 自定义样式
1. 修改 `src/app/hackathon/hackathon.css`
2. 使用CSS变量管理主题色彩
3. 支持深色模式适配

## 📞 技术支持

如有问题，请查看：
- Next.js文档：https://nextjs.org/docs
- React文档：https://react.dev
- TypeScript文档：https://www.typescriptlang.org/docs

## 📄 许可证

本项目基于原始HTML/CSS版本开发，仅供学习和开发参考使用。 