"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ProgressBar, calculateSpeed } from './ProgressBar';

interface DownloadButtonProps {
  url: string;
  filename?: string;
  className?: string;
  children: React.ReactNode;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({ 
  url, 
  filename, 
  className = "",
  children 
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState('');
  const [error, setError] = useState('');

  const handleDownload = async () => {
    setIsDownloading(true);
    setProgress(0);
    setSpeed('');
    setError('');

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP错误! 状态: ${response.status}`);
      }

      const contentLength = response.headers.get('Content-Length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      
      if (!response.body) {
        throw new Error('响应体为空');
      }

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let receivedLength = 0;
      const startTime = Date.now();

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        receivedLength += value.length;
        
        if (total > 0) {
          const progressPercent = (receivedLength / total) * 100;
          setProgress(progressPercent);
          
          const timeElapsed = (Date.now() - startTime) / 1000;
          if (timeElapsed > 0) {
            const currentSpeed = calculateSpeed(receivedLength, timeElapsed);
            setSpeed(currentSpeed);
          }
        }
      }

      // 合并所有数据块
      const blob = new Blob(chunks);
      
      // 创建下载链接
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || url.split('/').pop() || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      setProgress(100);
    } catch (err) {
      console.error('下载失败:', err);
      setError(err instanceof Error ? err.message : '下载失败');
    } finally {
      setTimeout(() => {
        setIsDownloading(false);
        setProgress(0);
        setSpeed('');
      }, 1000);
    }
  };

  const handleCancel = () => {
    setIsDownloading(false);
    setProgress(0);
    setSpeed('');
    setError('');
  };

  if (isDownloading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">下载中...</span>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-gray-100 rounded"
            title="取消下载"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        <ProgressBar 
          progress={progress} 
          speed={speed} 
          status="下载中..." 
        />
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleDownload}
      className={className}
      disabled={isDownloading}
    >
      {children}
    </button>
  );
}; 