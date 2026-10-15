import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center">
        <div className="text-7xl font-bold text-primary mb-4">404</div>
        <h1 className="text-xl font-semibold text-foreground mb-2">页面不存在</h1>
        <p className="text-sm text-muted-foreground mb-6">
          你访问的页面可能已被移除或链接有误
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 h-10 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          <Home className="w-4 h-4" />
          返回首页
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
