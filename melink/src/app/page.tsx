import Link from 'next/link';
import { UploadCloud } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-indigo-50 to-white p-8 text-center">
      <div className="max-w-2xl">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-7xl">
          MeLink
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          The simplest way to share your meeting recordings. Upload a video,
          transcription, and summary to get a single, shareable link.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            href="/admin/upload"
            className="rounded-md bg-indigo-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 inline-flex items-center gap-2"
          >
            <UploadCloud className="h-5 w-5" />
            Get Started
          </Link>
          <p className="text-sm font-semibold leading-6 text-gray-900">
            No sign-up required.
          </p>
        </div>
      </div>
      <footer className="absolute bottom-8 text-gray-500">
        <p>Built for the MVP. Ready to deploy on Vercel.</p>
      </footer>
    </main>
  );
}
