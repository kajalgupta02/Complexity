import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { SEO } from '@/components/SEO';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="page-shell flex flex-col items-center justify-center p-6 text-center text-text-primary dark:text-text-primary-dark">
      <SEO
        title="404 — Page Not Found"
        description="The requested page was not found on Complexity."
      />
      <div className="max-w-md space-y-6">
        <div className="text-8xl mb-4 font-black text-indigo-500">404</div>
        <h1 className="text-3xl font-black">Page not found.</h1>
        <p className="text-gray-600 dark:text-gray-400">
          The page you're looking for doesn't exist or may have moved.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Button onClick={() => navigate('/')} variant="outline">
            Go Home
          </Button>
          <Button onClick={() => navigate('/analyzer')} variant="primary">
            Open Analyzer
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
