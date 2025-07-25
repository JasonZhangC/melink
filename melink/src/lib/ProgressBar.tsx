import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  speed?: string; // 速度字符串，如 "1.2 MB/s"
  status?: string; // 状态信息，如 "下载中..." 或 "上传中..."
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  speed, 
  status = "处理中...", 
  className = "" 
}) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{status}</span>
        <div className="text-sm text-gray-500">
          {speed && <span className="mr-2">{speed}</span>}
          <span>{Math.round(progress)}%</span>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(progress, 100)}%` }}
        ></div>
      </div>
    </div>
  );
};

// 格式化字节大小
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// 计算下载/上传速度
export const calculateSpeed = (bytes: number, timeInSeconds: number): string => {
  if (timeInSeconds === 0) return '0 B/s';
  const bytesPerSecond = bytes / timeInSeconds;
  return formatBytes(bytesPerSecond) + '/s';
}; 