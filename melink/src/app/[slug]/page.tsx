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



export default function SharePage({ params }: { params: Promise<{ slug: string }> }) {
  const [data, setData] = useState<MeetingData | null>(null);
  const [transcriptionContent, setTranscriptionContent] = useState<string>('');
  const [summaryContent, setSummaryContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
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

  // 主要数据加载 - 优化：快速显示基本内容
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
        
        // 快速显示页面，然后异步加载文本内容
        setLoading(false);
        
        // 异步获取文本内容
        const [transcription, summary] = await Promise.all([
          fetchTextContent(meetingData.transcriptionUrl),
          fetchTextContent(meetingData.summaryUrl)
        ]);
        
        setTranscriptionContent(transcription);
        setSummaryContent(summary);
        
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

  const handleDownload = async () => {
    if (!data?.videoUrl) return;
    
    try {
      // 显示下载提示
      const downloadText = document.createElement('div');
      downloadText.innerHTML = '正在准备下载...';
      downloadText.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 9999;
        font-size: 14px;
      `;
      document.body.appendChild(downloadText);
      
      // 获取视频数据
      const response = await fetch(data.videoUrl);
      if (!response.ok) throw new Error('下载失败');
      
      // 创建blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // 创建下载链接
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.title || '会议录制'}.mp4`;
      a.style.display = 'none';
      
      // 强制下载
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // 清理URL对象
      window.URL.revokeObjectURL(url);
      
      // 更新提示信息
      downloadText.innerHTML = '下载完成！';
      setTimeout(() => {
        document.body.removeChild(downloadText);
      }, 2000);
      
    } catch (error) {
      console.error('下载失败:', error);
      
      // 如果blob下载失败，回退到简单下载方式
      const a = document.createElement('a');
      a.href = data.videoUrl;
      a.download = `${data.title || '会议录制'}.mp4`;
      a.target = '_blank';
      a.setAttribute('download', `${data.title || '会议录制'}.mp4`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // 显示错误提示
      const errorText = document.createElement('div');
      errorText.innerHTML = '下载可能需要在新窗口中手动保存';
      errorText.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 0, 0, 0.8);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 9999;
        font-size: 14px;
      `;
      document.body.appendChild(errorText);
      setTimeout(() => {
        document.body.removeChild(errorText);
      }, 3000);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', paddingTop: '30%' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #007AFF',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#666', fontSize: '16px' }}>加载中...</p>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', paddingTop: '30%' }}>
          <h1 style={{ color: '#ff4444', marginBottom: '16px' }}>{error || '页面未找到'}</h1>
          <p style={{ color: '#666' }}>请检查链接是否正确或联系管理员。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="nav-bar">
        <div className="publisher">{data?.createdAt ? new Date(data.createdAt).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }) : '未知'}</div>
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
                  {transcriptionContent ? (
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
                  ) : (
                    <div style={{ 
                      textAlign: 'center', 
                      color: '#999', 
                      padding: '20px',
                      fontSize: '14px'
                    }}>
                      正在加载转录内容...
                    </div>
                  )}
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
                  {summaryContent ? (
                    <div className="description-text markdown-content" style={{
                      fontFamily: 'inherit',
                      fontSize: viewportHeight < 600 ? '13px' : '14px',
                      lineHeight: '1.6',
                      color: '#333',
                      padding: '2px 0 8px 0',
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#ccc transparent'
                    }}>
                      {parseMarkdownToJSX(summaryContent)}
                    </div>
                  ) : (
                    <div style={{ 
                      textAlign: 'center', 
                      color: '#999', 
                      padding: '20px',
                      fontSize: '14px'
                    }}>
                      正在加载会议纪要...
                    </div>
                  )}
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