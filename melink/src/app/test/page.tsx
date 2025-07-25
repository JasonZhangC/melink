'use client';

import { useState } from 'react';

export default function TestPage() {
  const [message, setMessage] = useState('');

  const testAPI = async () => {
    try {
      const response = await fetch('/api/page-data');
      const data = await response.json();
      setMessage(`API测试成功: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setMessage(`API测试失败: ${error}`);
    }
  };

  const testShare = async () => {
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: '测试分享',
          url: window.location.href
        })
      });
      const data = await response.json();
      setMessage(`分享测试成功: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setMessage(`分享测试失败: ${error}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>黑客松页面功能测试</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testAPI}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          测试页面数据API
        </button>
        
        <button 
          onClick={testShare}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          测试分享API
        </button>
      </div>
      
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '15px', 
        borderRadius: '5px',
        whiteSpace: 'pre-wrap',
        fontFamily: 'monospace',
        fontSize: '12px'
      }}>
        {message || '点击按钮开始测试...'}
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h3>测试链接:</h3>
        <ul>
          <li><a href="/hackathon">黑客松页面</a></li>
          <li><a href="/">主页</a></li>
        </ul>
      </div>
    </div>
  );
} 