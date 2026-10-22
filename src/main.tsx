import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
// 触发算法模块注册（必须在渲染前完成，供侧边栏/路由读取）
import './algorithms';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
