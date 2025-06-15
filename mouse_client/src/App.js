import { observer } from 'mobx-react-lite';
import './App.css';
import Footer from './components/Footer';
import AppRouter from './components/AppRouter';
import Navbar from './components/Navbar';
import { Context } from './index';
import { useContext, useEffect, useState } from 'react';
import { Spin } from 'antd';
import './css/variables.css';
import './css/custom-antd.css';

export const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:7000";

// Функция для получения CSS-переменной по статусу
export const getStatusColorVar = (statusTitle) => {
  const map = {
    'Создан': '--status-created',
    'В очереди': '--status-queued',
    'В ожидании': '--status-pending',
    'В процессе': '--status-processing',
    'Извлечение кадров': '--status-extracting-frames',
    'Анализ': '--status-analyzing',
    'Генерация результатов': '--status-generating-results',
    'Успешно завершено': '--status-completed',
    'Ошибка': '--status-failed',
    'Отменено': '--status-cancelled',
    'Частично успешно': '--status-partial-success',
    'Проверено': '--status-reviewed',
    'Неподдерживаемый формат': '--status-invalid-format'
  };

  const cssVar = map[statusTitle] || '--status-created';
  return `var(${cssVar})`;
};

const App = observer(() => {
  const { user } = useContext(Context);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserSession = async () => {
      await user.checkSession(); // Ждём завершения проверки сессии
      setLoading(false); // Устанавливаем загрузку в false после завершения
    };
    const token = localStorage.getItem('token');
    if (token) {
      checkUserSession();
    }
    else {
      setLoading(false);
    }
  }, [user]); // Зависимость от user, чтобы следить за изменениями контекста

  // Если идёт загрузка, показываем спиннер
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  // Основной контент рендерится после завершения загрузки
  return (
    <>
      <Navbar />
      <AppRouter />
      <Footer />
    </>
  );
});

export default App;