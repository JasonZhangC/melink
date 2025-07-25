"use client";

import { useEffect, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { DownloadButton } from '../../lib/DownloadButton';

interface MeetingData {
  title: string;
  videoUrl: string;
  transcriptionUrl: string;
  summaryUrl: string;
  createdAt: string;
}

// Helper to fetch text content from a URL
async function fetchTextContent(url: string): Promise<string> {
    try {
        const response = await fetch(url);
        if (!response.ok) return `Error: Could not load content (status: ${response.status})`;
        return response.text();
    } catch {
        return "Error: Could not fetch content.";
    }
}

export default function DownloadPage({ params }: { params: Promise<{ slug: string }> }) {
  const [data, setData] = useState<MeetingData | null>(null);
  const [transcriptionContent, setTranscriptionContent] = useState<string>('');
  const [summaryContent, setSummaryContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      try {
        const resolvedParams = await params;
        const response = await fetch(`/api/data/${resolvedParams.slug}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('页面未找到');
            return;
          }
          throw new Error(`HTTP错误! 状态: ${response.status}`);
        }
        
        const meetingData = await response.json();
        setData(meetingData);
        
        // Fetch text content in parallel
        const [transcription, summary] = await Promise.all([
          fetchTextContent(meetingData.transcriptionUrl),
          fetchTextContent(meetingData.summaryUrl)
        ]);
        
        setTranscriptionContent(transcription);
        setSummaryContent(summary);
        
      } catch (err) {
        console.error('Failed to load data:', err);
        setError(err instanceof Error ? err.message : '加载数据失败');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [params]);

  if (loading) {
    return (
      <main className="bg-gray-50 font-sans min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="bg-gray-50 font-sans min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {error || '页面未找到'}
          </h1>
          <p className="text-gray-600">请检查链接是否正确或联系管理员。</p>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-gray-50 font-sans">
        <div className="container mx-auto max-w-4xl px-4 py-12">
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
                
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-800 tracking-tight">
                        {data.title}
                    </h1>
                    <p className="text-gray-500 mt-2">
                        上传时间: {new Date(data.createdAt).toLocaleDateString('zh-CN')}
                    </p>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* Left Column for Video */}
                    <div className="md:col-span-2">
                        <div className="aspect-w-16 aspect-h-9">
                            <video controls className="w-full h-full rounded-lg shadow-md" src={data.videoUrl} poster="">
                                您的浏览器不支持视频标签。
                            </video>
                        </div>
                        <div className="mt-4">
                          <DownloadButton
                            url={data.videoUrl}
                            filename={`${data.title}.mp4`}
                            className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white shadow-sm transition-transform transform hover:scale-105 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                          >
                            <Download className="mr-3 h-6 w-6" />
                            下载视频
                          </DownloadButton>
                        </div>
                    </div>

                    {/* Right Column for Downloads */}
                    <div className="space-y-4">
                        <DownloadButton
                          url={data.transcriptionUrl}
                          filename={`${data.title}-transcription.txt`}
                          className="group flex w-full items-center rounded-lg border border-gray-200 bg-white p-4 transition hover:bg-gray-50 hover:shadow-sm"
                        >
                          <FileText className="h-8 w-8 text-indigo-500 mr-4" />
                          <div>
                              <p className="font-semibold text-gray-700">语音转录</p>
                              <p className="text-sm text-gray-500">下载 .txt</p>
                          </div>
                        </DownloadButton>
                        
                        <DownloadButton
                          url={data.summaryUrl}
                          filename={`${data.title}-summary.txt`}
                          className="group flex w-full items-center rounded-lg border border-gray-200 bg-white p-4 transition hover:bg-gray-50 hover:shadow-sm"
                        >
                          <FileText className="h-8 w-8 text-green-500 mr-4" />
                          <div>
                              <p className="font-semibold text-gray-700">会议摘要</p>
                              <p className="text-sm text-gray-500">下载 .txt</p>
                          </div>
                        </DownloadButton>
                    </div>
                </div>

                {/* Transcription and Summary Sections */}
                <div className="mt-12 space-y-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-indigo-100 pb-2 mb-4">语音转录</h2>
                        <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg text-gray-700 font-mono text-sm leading-relaxed">{transcriptionContent}</pre>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-green-100 pb-2 mb-4">会议摘要</h2>
                        <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg text-gray-700 font-mono text-sm leading-relaxed">{summaryContent}</pre>
                    </div>
                </div>

            </div>
        </div>
    </main>
  );
}
