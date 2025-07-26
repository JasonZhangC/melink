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

// 截取视频首帧的函数
const captureVideoFrame = (videoUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      reject(new Error('无法获取canvas上下文'));
      return;
    }
    
    video.crossOrigin = 'anonymous';
    video.muted = true; // 静音以避免自动播放限制
    video.preload = 'metadata';
    
    let attemptTimes = [2, 5, 8, 1, 10]; // 尝试多个时间点（秒）
    let currentAttempt = 0;
    
    const attemptCapture = () => {
      if (currentAttempt >= attemptTimes.length) {
        reject(new Error('无法获取有效的视频帧'));
        return;
      }
      
      video.currentTime = attemptTimes[currentAttempt];
      currentAttempt++;
    };
    
    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;
      
      // 确保视频有足够长度
      if (video.duration > 0) {
        attemptCapture();
      } else {
        setTimeout(() => attemptCapture(), 500);
      }
    };
    
    video.onseeked = () => {
      // 稍等一下确保帧渲染完成
      setTimeout(() => {
        try {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // 检查是否为纯黑图片
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          let isBlack = true;
          
          // 检查前1000个像素点是否都是黑色
          for (let i = 0; i < Math.min(1000 * 4, data.length); i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // 如果RGB值大于30，认为不是纯黑
            if (r > 30 || g > 30 || b > 30) {
              isBlack = false;
              break;
            }
          }
          
          if (isBlack && currentAttempt < attemptTimes.length) {
            // 如果是黑屏，尝试下一个时间点
            console.log(`时间点 ${attemptTimes[currentAttempt-1]}s 为黑屏，尝试下一个时间点`);
            attemptCapture();
          } else {
            // 不是黑屏或者已经尝试完所有时间点
            const dataURL = canvas.toDataURL('image/jpeg', 0.8);
            resolve(dataURL);
          }
        } catch (err) {
          console.error('截取帧时出错:', err);
          if (currentAttempt < attemptTimes.length) {
            attemptCapture();
          } else {
            reject(err);
          }
        }
      }, 100);
    };
    
    video.onerror = (e) => {
      console.error('视频加载错误:', e);
      reject(new Error('视频加载失败'));
    };
    
    video.ontimeupdate = () => {
      // 当时间更新时，确保视频已经寻址到正确位置
    };
    
    // 设置超时
    const timeout = setTimeout(() => {
      reject(new Error('视频截取超时'));
    }, 15000);
    
    video.addEventListener('loadeddata', () => {
      clearTimeout(timeout);
    });
    
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
    const shareData = {
      title: data?.title || '黑客松交流',
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('分享错误:', err);
      }
    } else {
      navigator.clipboard.writeText(shareData.url)
        .then(() => alert('链接已复制到剪贴板'))
        .catch(err => console.error('无法复制文本: ', err));
    }
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
        <div className="brand">MELINK</div>
      </div>

      <div className="content-section">
        {/* 语音转录卡片 */}
        <div className="voice-card">
          <div className="card-content">
            <div className="card-text">
              <div className="card-header" onClick={() => setIsTranscriptionCollapsed(!isTranscriptionCollapsed)}>
                <h2 className="card-title">语音转录</h2>
              </div>
              <div className={`collapsible-content ${isTranscriptionCollapsed ? 'collapsed' : ''}`} style={{
                maxHeight: isTranscriptionCollapsed ? '0' : '300px',
                overflowY: isTranscriptionCollapsed ? 'hidden' : 'auto',
                transition: 'max-height 0.3s ease-in-out'
              }}>
                <div className="card-description">
                  <div className="location-icon">
                    <Image src="/assets/41b48aed0a734514f471271c3b2f04f8ef808dd3.svg" alt="Location" width={16} height={16} />
                  </div>
                  <pre className="description-text" style={{
                    margin: 0,
                    padding: '0 8px 8px 0',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#ccc transparent'
                  }}>{transcriptionContent}</pre>
                </div>
              </div>
            </div>
            <div className="card-image">
              {videoThumbnail ? (
                <img 
                  src={videoThumbnail} 
                  alt="Video Thumbnail" 
                  width={86} 
                  height={86}
                  style={{
                    borderRadius: '8px',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <Image src="/assets/60092f071a6ca4334df62c5065160922d3eafeb7.png" alt="Voice" width={86} height={86} />
              )}
            </div>
          </div>
        </div>

        {/* 会议纪要卡片 */}
        <div className="meeting-card">
          <div className="card-content">
            <div className="card-text">
              <div className="card-header" onClick={() => setIsSummaryCollapsed(!isSummaryCollapsed)}>
                <h2 className="card-title">会议纪要</h2>
              </div>
              <div className={`collapsible-content ${isSummaryCollapsed ? 'collapsed' : ''}`} style={{
                maxHeight: isSummaryCollapsed ? '0' : '300px',
                overflowY: isSummaryCollapsed ? 'hidden' : 'auto',
                transition: 'max-height 0.3s ease-in-out'
              }}>
                <div className="card-description">
                  <div className="meeting-icon">
                    <Image src="/assets/f46695159d547b43fd3b827aa4a5d7399961fe6a.svg" alt="Meeting" width={16} height={16} />
                  </div>
                  <div className="description-text markdown-content" style={{
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: '#333',
                    padding: '0 8px 8px 0',
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
    </div>
  );
}