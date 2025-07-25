import { kv } from '@vercel/kv';
import { notFound } from 'next/navigation';
import { Download, FileText, Video } from 'lucide-react'; // Using lucide-react for icons

interface PageProps {
  params: {
    slug: string;
  };
}

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
    } catch (error) {
        return "Error: Could not fetch content.";
    }
}


export default async function DownloadPage({ params }: PageProps) {
  const { slug } = params;
  const data = await kv.get<MeetingData>(slug);

  if (!data) {
    notFound();
  }

  // Fetch text content in parallel
  const [transcriptionContent, summaryContent] = await Promise.all([
    fetchTextContent(data.transcriptionUrl),
    fetchTextContent(data.summaryUrl)
  ]);

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
                        Uploaded on {new Date(data.createdAt).toLocaleDateString()}
                    </p>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* Left Column for Video */}
                    <div className="md:col-span-2">
                        <div className="aspect-w-16 aspect-h-9">
                            <video controls className="w-full h-full rounded-lg shadow-md" src={data.videoUrl} poster="">
                                Your browser does not support the video tag.
                            </video>
                        </div>
                        <a
                            href={data.videoUrl}
                            download
                            className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white shadow-sm transition-transform transform hover:scale-105 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            <Download className="mr-3 h-6 w-6" />
                            Download Video
                        </a>
                    </div>

                    {/* Right Column for Downloads */}
                    <div className="space-y-4">
                        <a
                            href={data.transcriptionUrl}
                            download
                            className="group flex w-full items-center rounded-lg border border-gray-200 bg-white p-4 transition hover:bg-gray-50 hover:shadow-sm"
                        >
                            <FileText className="h-8 w-8 text-indigo-500 mr-4" />
                            <div>
                                <p className="font-semibold text-gray-700">Transcription</p>
                                <p className="text-sm text-gray-500">Download .txt</p>
                            </div>
                        </a>
                        <a
                            href={data.summaryUrl}
                            download
                            className="group flex w-full items-center rounded-lg border border-gray-200 bg-white p-4 transition hover:bg-gray-50 hover:shadow-sm"
                        >
                            <FileText className="h-8 w-8 text-green-500 mr-4" />
                            <div>
                                <p className="font-semibold text-gray-700">Summary</p>
                                <p className="text-sm text-gray-500">Download .txt</p>
                            </div>
                        </a>
                    </div>
                </div>

                {/* Transcription and Summary Sections */}
                <div className="mt-12 space-y-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-indigo-100 pb-2 mb-4">Transcription</h2>
                        <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg text-gray-700 font-mono text-sm leading-relaxed">{transcriptionContent}</pre>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-green-100 pb-2 mb-4">Summary</h2>
                        <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg text-gray-700 font-mono text-sm leading-relaxed">{summaryContent}</pre>
                    </div>
                </div>

            </div>
        </div>
    </main>
  );
}
