"use client";

import { useEffect, useState } from 'react';
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

export default function SharePage({ params }: { params: Promise<{ slug: string }> }) {
  const [data, setData] = useState<MeetingData | null>(null);
  const [transcriptionContent, setTranscriptionContent] = useState<string>('');
  const [summaryContent, setSummaryContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
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
              <div className={`collapsible-content ${isTranscriptionCollapsed ? 'collapsed' : ''}`}>
                <div className="card-description">
                  <div className="location-icon">
                    <Image src="/assets/41b48aed0a734514f471271c3b2f04f8ef808dd3.svg" alt="Location" width={16} height={16} />
                  </div>
                  <pre className="description-text">{transcriptionContent}</pre>
                </div>
              </div>
            </div>
            <div className="card-image">
              <Image src="/assets/60092f071a6ca4334df62c5065160922d3eafeb7.png" alt="Voice" width={86} height={86} />
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
              <div className={`collapsible-content ${isSummaryCollapsed ? 'collapsed' : ''}`}>
                <div className="card-description">
                  <div className="meeting-icon">
                    <Image src="/assets/f46695159d547b43fd3b827aa4a5d7399961fe6a.svg" alt="Meeting" width={16} height={16} />
                  </div>
                  <pre className="description-text">{summaryContent}</pre>
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