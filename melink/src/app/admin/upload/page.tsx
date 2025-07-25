"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ProgressBar, calculateSpeed } from "../../../lib/ProgressBar";

export default function UploadPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalUrl, setFinalUrl] = useState("");
  const [error, setError] = useState("");
  const [fileInfo, setFileInfo] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState("");

  // 处理文件选择
  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      const sizeInMB = file.size / 1024 / 1024;
      setFileInfo(`📁 文件大小: ${sizeInMB.toFixed(1)}MB`);
      setError("");
    } else {
      setFileInfo("");
      setError("");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setFinalUrl("");
    setUploadProgress(0);
    setUploadSpeed("");

    const formData = new FormData(event.currentTarget);

    try {
      // 使用 XMLHttpRequest 以便监控上传进度
      const xhr = new XMLHttpRequest();
      const startTime = Date.now();
      let uploadedBytes = 0;

      const response = await new Promise<Response>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            setUploadProgress(percentComplete);
            
            uploadedBytes = e.loaded;
            const timeElapsed = (Date.now() - startTime) / 1000;
            if (timeElapsed > 0) {
              const speed = calculateSpeed(uploadedBytes, timeElapsed);
              setUploadSpeed(speed);
            }
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(new Response(xhr.responseText, {
              status: xhr.status,
              statusText: xhr.statusText,
              headers: new Headers({
                'Content-Type': 'application/json'
              })
            }));
          } else {
            reject(new Error(`HTTP错误! 状态: ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('网络错误'));
        });

        xhr.open('POST', '/api/upload');
        xhr.send(formData);
      });

      if (!response.ok) {
        // 尝试解析JSON错误信息，如果失败则使用HTTP状态文本
        let errorMessage = "上传失败";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || "服务器返回未知错误";
        } catch {
          // 如果响应不是JSON格式，使用状态码和状态文本
          const responseText = await response.text();
          errorMessage = `服务器错误 (${response.status}): ${responseText.substring(0, 100)}...`;
        }
        throw new Error(errorMessage);
      }

      const { url } = await response.json();
      // Construct the full URL for display and QR code
      const fullUrl = new URL(url, window.location.origin).toString();
      setFinalUrl(fullUrl);
      setUploadProgress(100);
    } catch (err: Error | unknown) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8">
      <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-3xl font-bold text-gray-800">
          上传会议内容
        </h1>
        
        {!finalUrl ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                标题 (用于URL，请使用英文字符，不能有空格)
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="例如: project-kickoff-q3"
                pattern="^[a-zA-Z0-9_-]+$"
                title="只允许字母、数字、连字符和下划线。"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="video" className="block text-sm font-medium text-gray-700">
                视频文件
              </label>
              <input
                type="file"
                id="video"
                name="video"
                required
                accept="video/*"
                onChange={handleFileChange}
                disabled={isSubmitting}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-600 hover:file:bg-indigo-100 disabled:opacity-50"
              />
              {fileInfo && <p className="mt-2 text-sm text-gray-600">{fileInfo}</p>}
            </div>

            <div>
              <label htmlFor="transcription" className="block text-sm font-medium text-gray-700">
                语音转录
              </label>
              <textarea
                id="transcription"
                name="transcription"
                required
                rows={8}
                disabled={isSubmitting}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:opacity-50"
                placeholder="在此粘贴完整的转录内容..."
              />
            </div>

            <div>
              <label htmlFor="summary" className="block text-sm font-medium text-gray-700">
                会议摘要
              </label>
              <textarea
                id="summary"
                name="summary"
                required
                rows={5}
                disabled={isSubmitting}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:opacity-50"
                placeholder="在此粘贴会议摘要..."
              />
            </div>

            {isSubmitting && uploadProgress > 0 && (
              <div className="mt-4">
                <ProgressBar 
                  progress={uploadProgress} 
                  speed={uploadSpeed} 
                  status="上传中..." 
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-indigo-600 px-4 py-2 text-lg font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isSubmitting ? "上传中..." : "上传"}
            </button>
            
            {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
          </form>
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-green-600">上传成功！</h2>
            <p className="mt-2 text-gray-600">您的文件可在以下链接访问：</p>
            <a
              href={finalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-indigo-600 hover:underline break-all"
            >
              {finalUrl}
            </a>
            <div className="mt-6 flex flex-col items-center">
                <p className="text-gray-600">扫描二维码访问链接：</p>
                <div className="p-4 mt-2 bg-white inline-block rounded-lg shadow-md">
                    <QRCodeSVG value={finalUrl} size={256} />
                </div>
            </div>
            <button
              onClick={() => setFinalUrl("")}
              className="mt-8 rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              上传新文件
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
