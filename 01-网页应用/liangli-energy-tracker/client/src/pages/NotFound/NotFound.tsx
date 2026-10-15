import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '60vh', padding: 24,
      fontFamily: 'system-ui, sans-serif',
    }}>
      <h1 style={{ fontSize: 72, fontWeight: 700, margin: 0, color: '#52B788' }}>404</h1>
      <p style={{ color: '#666', margin: '12px 0 24px' }}>页面不存在或已被移动</p>
      <Link to="/" style={{
        padding: '8px 20px', borderRadius: 8,
        background: '#52B788', color: '#fff', textDecoration: 'none',
      }}>
        返回首页
      </Link>
    </div>
  );
};

export default NotFound;
