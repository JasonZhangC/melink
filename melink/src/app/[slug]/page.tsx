"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import './SharePage.css';

// 定义会议数据结构
interface MeetingData {
  title: string;
  videoUrl: string;
  transcriptionUrl: string;
  summaryUrl: string;
  createdAt: string;
}

// 异步获取文本内容的辅助函数
async function fetchTextContent(url: string): Promise<string> {
    try {
        const response = await fetch(url);
        if (!response.ok) return `错误：无法加载内容 (状态: ${response.status})`;
        return await response.text();
    } catch {
        return "错误：无法获取内容。";
    }
}

// 简单的markdown转换函数
function parseMarkdownToJSX(text: string): React.ReactElement {
  if (!text) return <span>暂无内容</span>;
  
  const lines = text.split('\n');
  const elements: React.ReactElement[] = [];
  let currentListItems: string[] = [];
  let key = 0;
  
  const flushList = () => {
    if (currentListItems.length > 0) {
      elements.push(
        <ul key={`list-${key++}`} style={{ marginLeft: '16px', marginBottom: '12px' }}>
          {currentListItems.map((item, idx) => (
            <li key={idx} style={{ marginBottom: '4px', color: '#666' }}>
              {parseInlineMarkdown(item)}
            </li>
          ))}
        </ul>
      );
      currentListItems = [];
    }
  };
  
  const parseInlineMarkdown = (line: string): React.ReactElement => {
    // 处理加粗文本 **text**
    let result = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // 处理代码 `text`
    result = result.replace(/`(.*?)`/g, '<code style="background-color: #f5f5f5; padding: 2px 4px; border-radius: 3px; font-size: 0.9em;">$1</code>');
    
    return <span dangerouslySetInnerHTML={{ __html: result }} />;
  };
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    if (trimmedLine === '') {
      flushList();
      if (elements.length > 0) {
        elements.push(<br key={`br-${key++}`} />);
      }
      return;
    }
    
    // 处理标题
    if (trimmedLine.startsWith('### ')) {
      flushList();
      const title = trimmedLine.replace('### ', '').replace(/\*\*/g, '');
      elements.push(
        <h3 key={`h3-${key++}`} style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          marginBottom: '8px', 
          marginTop: index > 0 ? '16px' : '0',
          color: '#333'
        }}>
          {title}
        </h3>
      );
      return;
    }
    
    // 处理列表项
    if (trimmedLine.startsWith('- ')) {
      const listItem = trimmedLine.replace('- ', '');
      currentListItems.push(listItem);
      return;
    }
    
    // 处理普通段落
    flushList();
    if (trimmedLine) {
      elements.push(
        <p key={`p-${key++}`} style={{ 
          marginBottom: '8px', 
          lineHeight: '1.6',
          color: '#555'
        }}>
          {parseInlineMarkdown(trimmedLine)}
        </p>
      );
    }
  });
  
  flushList(); // 处理最后的列表项
  
  return <div>{elements}</div>;
}

// 截取视频首帧的函数 - 智能适应版本
const captureVideoFrame = (videoUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      reject(new Error('无法获取canvas上下文'));
      return;
    }
    
    let isResolved = false;
    let timeoutId: NodeJS.Timeout;
    let attemptCount = 0;
    let timePoints: number[] = [];
    let capturedFrames: {time: number, dataURL: string, score: number}[] = [];
    
    // 清理函数
    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      try {
        video.pause();
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
        video.removeEventListener('seeked', onSeeked);
        video.removeEventListener('error', onError);
        video.removeEventListener('loadeddata', onLoadedData);
        video.src = '';
        video.load();
      } catch (e) {
        console.warn('清理视频时出错:', e);
      }
    };
    
    // 安全的resolve函数
    const safeResolve = (value: string) => {
      if (!isResolved) {
        isResolved = true;
        cleanup();
        resolve(value);
      }
    };
    
    // 安全的reject函数
    const safeReject = (error: Error) => {
      if (!isResolved) {
        isResolved = true;
        cleanup();
        reject(error);
      }
    };
    
    // 生成动态时间点（根据视频长度）- 增加更多尝试点
    const generateTimePoints = (duration: number) => {
      const points: number[] = [];
      
      if (duration <= 0) return [0.5];
      
      if (duration <= 3) {
        // 极短视频：密集采样
        points.push(0.5);
        points.push(duration * 0.3);
        points.push(duration * 0.6);
        points.push(Math.max(duration - 0.5, duration * 0.9));
      } else if (duration <= 10) {
        // 短视频：多点采样
        points.push(1);                    // 1秒
        points.push(duration * 0.2);       // 20%
        points.push(duration * 0.4);       // 40%
        points.push(duration * 0.6);       // 60%
        points.push(duration * 0.8);       // 80%
        points.push(Math.max(duration - 1, duration * 0.95)); // 接近结尾
      } else if (duration <= 60) {
        // 中等视频：均匀分布
        points.push(2);                    // 2秒
        points.push(duration * 0.15);      // 15%
        points.push(duration * 0.3);       // 30%
        points.push(duration * 0.5);       // 50%
        points.push(duration * 0.7);       // 70%
        points.push(duration * 0.85);      // 85%
        points.push(Math.max(duration - 5, duration * 0.95)); // 接近结尾
      } else {
        // 长视频：关键点采样
        points.push(5);                    // 5秒
        points.push(15);                   // 15秒
        points.push(duration * 0.2);       // 20%
        points.push(duration * 0.4);       // 40%
        points.push(duration * 0.6);       // 60%
        points.push(duration * 0.8);       // 80%
        points.push(Math.max(duration - 20, duration * 0.9)); // 接近结尾但不太晚
      }
      
      // 确保时间点不超过视频长度，且至少间隔0.5秒
      return points
        .map(t => Math.max(0.5, Math.min(t, duration - 0.5)))
        .filter((time, index, arr) => index === 0 || time - arr[index - 1] >= 0.5)
        .sort((a, b) => a - b); // 确保按时间顺序排列
    };
    
    // 检查帧是否为黑色或无效帧
    const isBlackOrInvalidFrame = (imageData: ImageData): boolean => {
      const data = imageData.data;
      let brightPixelCount = 0;
      let totalPixelCount = 0;
      let maxBrightness = 0;
      let hasColorVariation = false;
      
      // 检查像素
      for (let i = 0; i < data.length; i += 16) { // 采样检查
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        if (r !== undefined && g !== undefined && b !== undefined) {
          totalPixelCount++;
          const brightness = Math.max(r, g, b); // 使用最大值而不是平均值
          maxBrightness = Math.max(maxBrightness, brightness);
          
          // 如果像素亮度超过阈值，认为是有效像素
          if (brightness > 25) {
            brightPixelCount++;
          }
          
          // 检查颜色变化
          if (!hasColorVariation) {
            const colorDiff = Math.max(
              Math.abs(r - g),
              Math.abs(g - b),
              Math.abs(r - b)
            );
            if (colorDiff > 15) {
              hasColorVariation = true;
            }
          }
        }
      }
      
      if (totalPixelCount === 0) return true;
      
      const brightPixelRatio = brightPixelCount / totalPixelCount;
      
      // 判断是否为黑色或无效帧
      const isTooBlack = maxBrightness < 30; // 最亮像素都很暗
      const isMostlyBlack = brightPixelRatio < 0.05; // 95%以上都是暗像素
      const hasNoVariation = !hasColorVariation && maxBrightness < 50;
      
      return isTooBlack || isMostlyBlack || hasNoVariation;
    };
    
    // 计算帧的质量分数（越高越好）
    const calculateFrameScore = (imageData: ImageData): number => {
      // 首先检查是否为黑色帧
      if (isBlackOrInvalidFrame(imageData)) {
        return 0; // 黑色帧直接给0分
      }
      
      const data = imageData.data;
      let totalBrightness = 0;
      let pixelCount = 0;
      let variationScore = 0;
      let edgeCount = 0;
      let colorfulness = 0;
      
      // 计算亮度和变化
      for (let i = 0; i < data.length; i += 16) { // 采样
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        if (r !== undefined && g !== undefined && b !== undefined) {
          const brightness = (r + g + b) / 3;
          totalBrightness += brightness;
          pixelCount++;
          
          // 计算颜色丰富度
          const colorVar = Math.max(
            Math.abs(r - g),
            Math.abs(g - b),
            Math.abs(r - b)
          );
          colorfulness += colorVar;
          
          // 检查与周围像素的差异（简单边缘检测）
          if (i > 16) {
            const prevR = data[i - 16];
            const prevG = data[i - 15];
            const prevB = data[i - 14];
            const prevBrightness = (prevR + prevG + prevB) / 3;
            const diff = Math.abs(brightness - prevBrightness);
            
            if (diff > 20) edgeCount++;
            variationScore += Math.min(diff, 100);
          }
        }
      }
      
      if (pixelCount === 0) return 0;
      
      const avgBrightness = totalBrightness / pixelCount;
      const normalizedVariation = variationScore / pixelCount;
      const normalizedColorfulness = colorfulness / pixelCount;
      const edgeRatio = edgeCount / pixelCount;
      
      // 综合评分：
      let score = 0;
      
      // 亮度分数 (0-150) - 提高权重
      if (avgBrightness > 30 && avgBrightness < 240) {
        score += Math.min(150, avgBrightness / 1.6);
      }
      
      // 变化分数 (0-100)
      score += Math.min(100, normalizedVariation * 2);
      
      // 边缘分数 (0-100)
      score += Math.min(100, edgeRatio * 1000);
      
      // 颜色丰富度分数 (0-50)
      score += Math.min(50, normalizedColorfulness * 2);
      
      return score;
    };
    
    // 尝试截取帧
    const captureFrame = (): void => {
      try {
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          console.warn('视频尺寸为0，跳过此次截取');
          tryNextTimePoint();
          return;
        }
        
        // 设置画布尺寸
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // 绘制视频帧
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // 获取图像数据并计算分数
        const imageData = context.getImageData(0, 0, Math.min(300, canvas.width), Math.min(300, canvas.height));
        const score = calculateFrameScore(imageData);
        const dataURL = canvas.toDataURL('image/jpeg', 0.8);
        
        // 保存这一帧
        capturedFrames.push({
          time: video.currentTime,
          dataURL: dataURL,
          score: score
        });
        
        const isBlack = score === 0;
        console.log(`截取第${attemptCount}帧，时间: ${video.currentTime.toFixed(1)}秒，分数: ${score.toFixed(1)}${isBlack ? ' (黑色帧)' : ''}`);
        
        // 如果找到非黑色且高质量的帧，直接使用
        if (score > 80 && !isBlack) {
          console.log(`找到高质量非黑色帧，直接使用 (分数: ${score.toFixed(1)})`);
          safeResolve(dataURL);
          return;
        }
        
        // 继续尝试下一个时间点
        tryNextTimePoint();
        
      } catch (err) {
        console.error('截取帧时出错:', err);
        tryNextTimePoint();
      }
    };
    
    // 尝试下一个时间点
    const tryNextTimePoint = () => {
      if (attemptCount >= timePoints.length) {
        // 所有时间点都尝试完了，选择最好的帧
        if (capturedFrames.length > 0) {
          // 优先选择非黑色帧
          const nonBlackFrames = capturedFrames.filter(frame => frame.score > 0);
          
          let bestFrame;
          if (nonBlackFrames.length > 0) {
            // 有非黑色帧，选择分数最高的非黑色帧
            bestFrame = nonBlackFrames.reduce((best, current) => 
              current.score > best.score ? current : best
            );
            console.log(`使用最佳非黑色帧：时间 ${bestFrame.time.toFixed(1)}秒，分数: ${bestFrame.score.toFixed(1)}`);
          } else {
            // 所有帧都是黑色，选择相对最好的黑色帧
            bestFrame = capturedFrames.reduce((best, current) => 
              current.score > best.score ? current : best
            );
            console.log(`所有帧都是黑色，使用相对最佳帧：时间 ${bestFrame.time.toFixed(1)}秒，分数: ${bestFrame.score.toFixed(1)}`);
          }
          
          safeResolve(bestFrame.dataURL);
        } else {
          console.warn('未能截取任何帧，使用默认图片');
          safeReject(new Error('无法截取视频帧'));
        }
        return;
      }
      
      const timePoint = timePoints[attemptCount];
      console.log(`尝试时间点: ${timePoint.toFixed(1)}秒 (${attemptCount + 1}/${timePoints.length})`);
      
      attemptCount++;
      
      try {
        video.currentTime = timePoint;
      } catch (err) {
        console.error('设置视频时间失败:', err);
        tryNextTimePoint();
      }
    };
    
    // 当视频定位完成时触发
    const onSeeked = () => {
      if (isResolved) return;
      
      // 稍等一下确保帧已更新
      setTimeout(() => {
        if (!isResolved) {
          captureFrame();
        }
      }, 300);
    };
    
    // 当视频元数据加载完成时触发
    const onLoadedMetadata = () => {
      if (isResolved) return;
      
      console.log(`视频元数据加载完成，时长: ${video.duration.toFixed(1)}秒`);
      
      if (video.duration && video.duration > 0) {
        // 生成动态时间点
        timePoints = generateTimePoints(video.duration);
        console.log(`生成时间点:`, timePoints.map(t => t.toFixed(1)));
        
        // 开始尝试第一个时间点
        tryNextTimePoint();
      } else {
        console.error('视频时长无效');
        safeReject(new Error('视频时长无效'));
      }
    };
    
    // 当视频数据加载完成时触发（作为备用）
    const onLoadedData = () => {
      if (isResolved) return;
      
      // 如果元数据还没加载，等待一下再尝试
      if (attemptCount === 0 && (!video.duration || video.duration <= 0)) {
        setTimeout(() => {
          if (!isResolved && attemptCount === 0) {
            console.log('作为备用方案，直接截取当前帧');
            captureFrame();
          }
        }, 1500);
      }
    };
    
    // 错误处理
    const onError = (e: any) => {
      console.error('视频加载错误:', e);
      safeReject(new Error('视频加载失败'));
    };
    
    // 设置视频属性
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.preload = 'metadata';
    video.playsInline = true;
    
    // 添加事件监听器
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);
    video.addEventListener('loadeddata', onLoadedData);
    
    // 设置超时时间
    timeoutId = setTimeout(() => {
      if (capturedFrames.length > 0) {
        // 如果已经有一些帧，优先选择非黑色帧
        const nonBlackFrames = capturedFrames.filter(frame => frame.score > 0);
        
        let bestFrame;
        if (nonBlackFrames.length > 0) {
          bestFrame = nonBlackFrames.reduce((best, current) => 
            current.score > best.score ? current : best
          );
          console.log(`超时但有非黑色帧，使用最佳非黑色帧 (分数: ${bestFrame.score.toFixed(1)})`);
        } else {
          bestFrame = capturedFrames.reduce((best, current) => 
            current.score > best.score ? current : best
          );
          console.log(`超时且只有黑色帧，使用相对最佳帧 (分数: ${bestFrame.score.toFixed(1)})`);
        }
        
        safeResolve(bestFrame.dataURL);
      } else {
        console.error('视频截取超时且无可用帧');
        safeReject(new Error('视频截取超时'));
      }
    }, 30000); // 30秒超时
    
    // 开始加载视频
    console.log('开始加载视频:', videoUrl);
    video.src = videoUrl;
    video.load();
  });
};

export default function SharePage({ params }: { params: Promise<{ slug: string }> }) {
  const [data, setData] = useState<MeetingData | null>(null);
  const [transcriptionContent, setTranscriptionContent] = useState<string>('');
  const [summaryContent, setSummaryContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [videoThumbnail, setVideoThumbnail] = useState<string>('');
  
  // 控制内容折叠的状态
  const [isTranscriptionCollapsed, setIsTranscriptionCollapsed] = useState(true);
  const [isSummaryCollapsed, setIsSummaryCollapsed] = useState(true);
  
  // 控制二维码弹窗显示
  const [showQRCode, setShowQRCode] = useState(false);
  
  // 视口高度状态
  const [viewportHeight, setViewportHeight] = useState(0);

  // 监听窗口大小变化
  useEffect(() => {
    const updateViewportHeight = () => {
      setViewportHeight(window.innerHeight);
    };

    // 初始设置
    updateViewportHeight();

    // 添加事件监听器
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);

    // 清理事件监听器
    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, []);

  // 计算动态高度
  const calculateContentHeight = () => {
    if (viewportHeight === 0) return '300px';
    
    // 展开时占用屏幕高度的80%，但最少200px，最多600px
    const expandedHeight = Math.max(200, Math.min(600, viewportHeight * 0.8));
    return `${expandedHeight}px`;
  };

  useEffect(() => {
    async function loadData() {
      try {
        // 解析异步的 params
        const resolvedParams = await params;
        const currentSlug = resolvedParams.slug;
        
        const response = await fetch(`/api/data/${currentSlug}`);
        
        if (!response.ok) {
          setError(response.status === 404 ? '页面未找到' : `HTTP错误! 状态: ${response.status}`);
          return;
        }
        
        const meetingData: MeetingData = await response.json();
        setData(meetingData);
        
        // 获取文本内容
        const [transcription, summary] = await Promise.all([
          fetchTextContent(meetingData.transcriptionUrl),
          fetchTextContent(meetingData.summaryUrl)
        ]);
        
        setTranscriptionContent(transcription);
        setSummaryContent(summary);
        
        // 截取视频首帧
        try {
          const thumbnail = await captureVideoFrame(meetingData.videoUrl);
          setVideoThumbnail(thumbnail);
        } catch (err) {
          console.error('截取视频首帧失败:', err);
          // 如果截取失败，使用默认图片
          setVideoThumbnail('/assets/60092f071a6ca4334df62c5065160922d3eafeb7.png');
        }
        
      } catch (err) {
        console.error('加载数据失败:', err);
        setError(err instanceof Error ? err.message : '加载数据失败');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [params]);

  const handleShare = async () => {
    setShowQRCode(true);
  };

  const handleDownload = () => {
    if (!data?.videoUrl) return;
    const a = document.createElement('a');
    a.href = data.videoUrl;
    a.download = `${data.title || 'video'}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', paddingTop: '50%' }}>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', paddingTop: '50%' }}>
          <h1>{error || '页面未找到'}</h1>
          <p>请检查链接是否正确或联系管理员。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="nav-bar">
        <div className="publisher">发布者：</div>
      </div>

      <div className="avatar">
        <Image src="/assets/59c703059763c215467f37e29240383bbd8eda59.png" alt="Avatar" width={79} height={79} />
      </div>

      <div className="title-section">
        <div className="title-content">
          <h1 className="main-title">{data?.title}</h1>
        </div>
      </div>

      <div className="content-section">
        {/* 语音转录卡片 */}
        <div className="voice-card">
          <div className="card-content">
            <div className="card-text">
              <div className="card-header" onClick={() => setIsTranscriptionCollapsed(!isTranscriptionCollapsed)} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <h2 className="card-title">语音转录</h2>
                <div className="location-icon" style={{
                  transform: isTranscriptionCollapsed ? 'rotate(270deg)' : 'rotate(180deg)',
                  transition: 'transform 0.4s cubic-bezier(0.68, -0.15, 0.265, 1.15)',
                  flexShrink: 0
                }}>
                  <Image src="/assets/41b48aed0a734514f471271c3b2f04f8ef808dd3.svg" alt="Location" width={16} height={16} />
                </div>
              </div>
              <div className={`collapsible-content ${isTranscriptionCollapsed ? 'collapsed' : ''}`} style={{
                maxHeight: isTranscriptionCollapsed ? '0' : calculateContentHeight(),
                overflowY: isTranscriptionCollapsed ? 'hidden' : 'auto',
                transition: 'max-height 0.3s ease-in-out, padding 0.3s ease-in-out',
                padding: isTranscriptionCollapsed ? '0' : '2px 0'
              }}>
                <div className="card-description" style={{ marginTop: '0' }}>
                  <pre className="description-text" style={{
                    margin: 0,
                    padding: '2px 0 8px 0',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#ccc transparent',
                    color: '#555'
                  }}>{transcriptionContent}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 会议纪要卡片 */}
        <div className="meeting-card">
          <div className="card-content">
            <div className="card-text">
              <div className="card-header" onClick={() => setIsSummaryCollapsed(!isSummaryCollapsed)} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <h2 className="card-title">会议纪要</h2>
                <div className="meeting-icon" style={{
                  transform: isSummaryCollapsed ? 'rotate(270deg)' : 'rotate(180deg)',
                  transition: 'transform 0.4s cubic-bezier(0.68, -0.15, 0.265, 1.15)',
                  flexShrink: 0
                }}>
                  <Image src="/assets/f46695159d547b43fd3b827aa4a5d7399961fe6a.svg" alt="Meeting" width={16} height={16} />
                </div>
              </div>
              <div className={`collapsible-content ${isSummaryCollapsed ? 'collapsed' : ''}`} style={{
                maxHeight: isSummaryCollapsed ? '0' : calculateContentHeight(),
                overflowY: isSummaryCollapsed ? 'hidden' : 'auto',
                transition: 'max-height 0.3s ease-in-out, padding 0.3s ease-in-out',
                padding: isSummaryCollapsed ? '0' : '2px 0'
              }}>
                <div className="card-description" style={{ marginTop: '0' }}>
                  <div className="description-text markdown-content" style={{
                    fontFamily: 'inherit',
                    fontSize: viewportHeight < 600 ? '13px' : '14px', // 小屏幕使用更小字体
                    lineHeight: '1.6',
                    color: '#333',
                    padding: '2px 0 8px 0',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#ccc transparent'
                  }}>
                    {parseMarkdownToJSX(summaryContent)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="video-section">
            <video controls className="video-bg" src={data?.videoUrl} style={{opacity: 1}}>
                您的浏览器不支持视频标签。
            </video>
        </div>
      </div>

      <div className="bottom-buttons">
        <div className="download-button" onClick={handleDownload}>
          <div className="button-container">
            <Image src="/assets/f162a9928022de1e735148855fafa1dc4ac37ed7.svg" alt="Download Button" width={48} height={48} />
            <div className="download-icon">
              <Image src="/assets/fa5f239705275577eb4947667f2d57c9ccfd5689.png" alt="Download" width={31} height={31} />
            </div>
          </div>
        </div>
        
        <div className="share-button" onClick={handleShare}>
          <div className="button-bg">
            <Image src="/assets/7b5968cd96dee67fcf408b767b9aff844e0294c3.svg" alt="Button Background" width={48} height={48} />
          </div>
          <div className="share-icon">
            <Image src="/assets/d69c41f95049fd47b70084db9a5184a28cc780f9.png" alt="Share" width={39} height={39} />
          </div>
        </div>
      </div>

      {/* 二维码弹窗 */}
      {showQRCode && (
        <div 
          className="qr-modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowQRCode(false)}
        >
          <div 
            className="qr-modal-content"
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '320px',
              width: '90%',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 关闭按钮 */}
            <button
              onClick={() => setShowQRCode(false)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                border: 'none',
                background: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>

            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '18px',
              fontWeight: '600',
              color: '#333'
            }}>
              分享链接
            </h3>

            {/* 二维码图片 */}
            <div style={{
              margin: '16px 0',
              padding: '16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              display: 'inline-block'
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                alt="分享二维码"
                style={{
                  width: '200px',
                  height: '200px',
                  border: 'none'
                }}
              />
            </div>

            {/* URL显示 */}
            <div style={{
              margin: '16px 0',
              padding: '12px',
              backgroundColor: '#f1f3f4',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#666',
              wordBreak: 'break-all',
              lineHeight: '1.4'
            }}>
              {typeof window !== 'undefined' ? window.location.href : ''}
            </div>

            {/* 复制链接按钮 */}
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  navigator.clipboard.writeText(window.location.href)
                    .then(() => {
                      alert('链接已复制到剪贴板');
                      setShowQRCode(false);
                    })
                    .catch(err => console.error('无法复制文本: ', err));
                }
              }}
              style={{
                width: '100%',
                padding: '12px 24px',
                backgroundColor: '#007AFF',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                marginTop: '8px'
              }}
            >
              复制链接
            </button>
          </div>
        </div>
      )}
    </div>
  );
}