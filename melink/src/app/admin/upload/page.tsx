"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function UploadPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalUrl, setFinalUrl] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setFinalUrl("");

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Something went wrong");
      }

      const { url } = await response.json();
      // Construct the full URL for display and QR code
      const fullUrl = new URL(url, window.location.origin).toString();
      setFinalUrl(fullUrl);
    } catch (err: Error | unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8">
      <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-3xl font-bold text-gray-800">
          Upload Your Meeting
        </h1>
        
        {!finalUrl ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title (for URL, use English characters, no spaces)
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="e.g., project-kickoff-q3"
                pattern="^[a-zA-Z0-9_-]+$"
                title="Only letters, numbers, hyphens, and underscores are allowed."
              />
            </div>

            <div>
              <label htmlFor="video" className="block text-sm font-medium text-gray-700">
                Video File
              </label>
              <input
                type="file"
                id="video"
                name="video"
                required
                accept="video/*"
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-600 hover:file:bg-indigo-100"
              />
            </div>

            <div>
              <label htmlFor="transcription" className="block text-sm font-medium text-gray-700">
                Voice Transcription
              </label>
              <textarea
                id="transcription"
                name="transcription"
                required
                rows={8}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Paste the full transcription here..."
              />
            </div>

            <div>
              <label htmlFor="summary" className="block text-sm font-medium text-gray-700">
                Meeting Summary
              </label>
              <textarea
                id="summary"
                name="summary"
                required
                rows={5}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Paste the meeting summary here..."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-indigo-600 px-4 py-2 text-lg font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isSubmitting ? "Uploading..." : "Upload"}
            </button>
            
            {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
          </form>
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-green-600">Success!</h2>
            <p className="mt-2 text-gray-600">Your files are available at:</p>
            <a
              href={finalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-indigo-600 hover:underline break-all"
            >
              {finalUrl}
            </a>
            <div className="mt-6 flex flex-col items-center">
                <p className="text-gray-600">Scan the QR code to access the link:</p>
                <div className="p-4 mt-2 bg-white inline-block rounded-lg shadow-md">
                    <QRCodeSVG value={finalUrl} size={256} />
                </div>
            </div>
            <button
              onClick={() => setFinalUrl("")}
              className="mt-8 rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              Upload Another
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
