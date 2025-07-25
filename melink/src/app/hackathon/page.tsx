'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import './hackathon.css';

// 配置
const CONFIG = {
  API_BASE_URL: '/api', // 后端API地址
  IMAGE_BASE_URL: '/assets' // 使用本地图片资源
};

// 页面数据类型
interface PageData {
  user: {
    avatar: string;
    publisher: string;
  };
  activity: {
    title: string;
    time: string;
    image: string;
  };
  meeting: {
    title: string;
    content: string[];
  };
  banner: {
    visible: boolean;
    content: string;
  };
}

// 默认数据
const defaultData: PageData = {
  user: {
    avatar: `${CONFIG.IMAGE_BASE_URL}/59c703059763c215467f37e29240383bbd8eda59.png`,
    publisher: '发布者：'
  },
  activity: {
    title: '湖畔客创中心',
    time: '7月27号下午3点15分到4点10分',
    image: `${CONFIG.IMAGE_BASE_URL}/60092f071a6ca4334df62c5065160922d3eafeb7.png`
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

export default function HackathonPage() {
  const [pageData, setPageData] = useState<PageData>(defaultData);
  const [bannerVisible, setBannerVisible] = useState(true);

  // 加载页面数据
  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/page-data`);
      if (response.ok) {
        const data = await response.json();
        setPageData(data);
      }
    } catch (error) {
      console.warn('API未连接，使用默认数据');
    }
  };

  // 关闭横幅
  const closeBanner = async () => {
    try {
      await fetch(`${CONFIG.API_BASE_URL}/banner/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      setBannerVisible(false);
    } catch (error) {
      console.error('关闭横幅失败:', error);
      setBannerVisible(false);
    }
  };

  // 处理分享
  const handleShare = async () => {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: pageData.activity?.title || '黑客松交流',
          url: window.location.href
        })
      });
      
      if (response.ok) {
        showMessage('分享成功', 'success');
      } else {
        throw new Error('分享失败');
      }
    } catch (error) {
      console.error('分享失败:', error);
      // 使用原生分享API作为备选
      if (navigator.share) {
        try {
          await navigator.share({
            title: pageData.activity?.title || '黑客松交流',
            url: window.location.href
          });
        } catch (shareError) {
          showMessage('分享失败', 'error');
        }
      } else {
        // 复制链接到剪贴板
        copyToClipboard(window.location.href);
        showMessage('链接已复制到剪贴板', 'success');
      }
    }
  };

  // 处理操作按钮
  const handleAction = async () => {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'button_click',
          timestamp: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        showMessage('操作成功', 'success');
      } else {
        throw new Error('操作失败');
      }
    } catch (error) {
      console.error('操作失败:', error);
      showMessage('操作失败，请重试', 'error');
    }
  };

  // 复制到剪贴板
  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  // 显示消息
  const showMessage = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.textContent = message;
    messageEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      z-index: 10000;
      animation: slideIn 0.3s ease;
      background-color: ${type === 'success' ? '#67B779' : type === 'error' ? '#F95721' : '#1892FA'};
    `;
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
      messageEl.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        if (messageEl.parentNode) {
          messageEl.parentNode.removeChild(messageEl);
        }
      }, 300);
    }, 3000);
  };

  return (
    <div className="hackathon-container">
      {/* 状态栏 */}
      <div className="status-bar">
        <div className="status-content">
          <div className="time">9:41</div>
          <div className="status-icons">
            <div className="cellular-connection">
              <Image 
                src={`${CONFIG.IMAGE_BASE_URL}/2846143dc2dc00bed1a91a5384860bf8b2599502.svg`} 
                alt="Cellular" 
                width={16.5} 
                height={10.5}
              />
            </div>
            <div className="wifi">
              <Image 
                src={`${CONFIG.IMAGE_BASE_URL}/8482aa204629ccd4099eb30e433db7b85e2563fd.svg`} 
                alt="WiFi" 
                width={15.33} 
                height={11}
              />
            </div>
            <div className="battery">
              <div className="battery-border"></div>
              <div className="battery-capacity"></div>
              <div className="battery-cap">
                <Image 
                  src={`${CONFIG.IMAGE_BASE_URL}/1410e067db006763bb40c04ef79cdc1692c03cb2.svg`} 
                  alt="Cap" 
                  width={1.33} 
                  height={4}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 导航栏 */}
      <div className="nav-bar">
        <div className="publisher">{pageData.user.publisher}</div>
      </div>

      {/* 头像 */}
      <div className="avatar">
        <Image 
          src={pageData.user.avatar} 
          alt="Avatar" 
          width={79} 
          height={79}
        />
      </div>

      {/* 标题区域 */}
      <div className="title-section">
        <h1 className="main-title">黑客松交流</h1>
        <div className="arrow-down">
          <Image 
            src={`${CONFIG.IMAGE_BASE_URL}/f7481fc2238f527543122988b5b213d7895fa419.svg`} 
            alt="Arrow Down" 
            width={18} 
            height={18}
          />
        </div>
        <div className="brand">MELINK</div>
      </div>

      {/* 活动卡片 */}
      <div className="activity-card">
        <div className="card-content">
          <div className="card-text">
            <h2 className="card-title">{pageData.activity.title}</h2>
            <div className="card-description">
              <div className="location-icon">
                <Image 
                  src={`${CONFIG.IMAGE_BASE_URL}/41b48aed0a734514f471271c3b2f04f8ef808dd3.svg`} 
                  alt="Location" 
                  width={12} 
                  height={12}
                />
              </div>
              <span className="description-text">{pageData.activity.time}</span>
            </div>
          </div>
          <div className="card-image">
            <Image 
              src={pageData.activity.image} 
              alt="Activity" 
              width={86} 
              height={86}
            />
          </div>
        </div>
      </div>

      {/* 会议纪要卡片 */}
      <div className="meeting-card">
        <div className="card-content">
          <div className="card-text">
            <h2 className="card-title">{pageData.meeting.title}</h2>
            <div className="card-description">
              <div className="meeting-icon">
                <Image 
                  src={`${CONFIG.IMAGE_BASE_URL}/f46695159d547b43fd3b827aa4a5d7399961fe6a.svg`} 
                  alt="Meeting" 
                  width={12} 
                  height={12}
                />
              </div>
              <div className="description-text">
                {pageData.meeting.content.map((item, index) => (
                  <p key={index}>{item}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 横幅 */}
      {bannerVisible && (
        <div className="banner">
          <div className="banner-bg"></div>
          <div className="banner-gradient">
            <Image 
              src={`${CONFIG.IMAGE_BASE_URL}/b86ba7b0980fd16a846c53b387b64045dd26a3ed.svg`} 
              alt="Gradient" 
              width={327} 
              height={88}
            />
          </div>
          <div className="banner-close" onClick={closeBanner}>
            <Image 
              src={`${CONFIG.IMAGE_BASE_URL}/a966a2db7bb2814a3c8a8dff239ceccc1207817a.svg`} 
              alt="Close" 
              width={43} 
              height={43}
            />
          </div>
        </div>
      )}

      {/* 背景图片区域 */}
      <div className="background-section">
        <div className="bg-image">
          <Image 
            src={pageData.activity.image} 
            alt="Background" 
            width={331} 
            height={144}
          />
        </div>
      </div>

      {/* 底部按钮 */}
      <div className="bottom-buttons">
        <div className="round-button share-button" onClick={handleShare}>
          <div className="button-bg">
            <Image 
              src={`${CONFIG.IMAGE_BASE_URL}/8ff3946837ad7b95d0f895dfb64a739a5b9d60b9.svg`} 
              alt="Button Background" 
              width={48} 
              height={48}
            />
          </div>
          <div className="button-icon">
            <Image 
              src={`${CONFIG.IMAGE_BASE_URL}/d69c41f95049fd47b70084db9a5184a28cc780f9.png`} 
              alt="Share" 
              width={39} 
              height={39}
            />
          </div>
        </div>
        <div className="round-button action-button" onClick={handleAction}>
          <Image 
            src={`${CONFIG.IMAGE_BASE_URL}/c2511ae3bcacd8e27bd2ae8e2bacf57f7d001ed1.svg`} 
            alt="Action" 
            width={48} 
            height={48}
          />
        </div>
      </div>

      {/* 底部图标 */}
      <div className="bottom-icon">
        <Image 
          src={`${CONFIG.IMAGE_BASE_URL}/d69c41f95049fd47b70084db9a5184a28cc780f9.png`} 
          alt="Bottom Icon" 
          width={100} 
          height={100}
        />
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
} 