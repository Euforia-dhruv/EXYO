import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-exyo-dark px-4">
      <div className="text-center">
        <h1 className="text-exyo-red text-8xl font-bold mb-4">404</h1>
        <h2 className="text-3xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-exyo-gray mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-exyo-red text-white px-8 py-3 rounded font-semibold hover:bg-red-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Back to Home
        </Link>
      </div>
    </div>
  );
}
