import React, { useContext, useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Tabs,
  message,
  Checkbox,
} from 'antd';
import { Context } from '../index';
import { ApiService } from '../service/api.service';
import { useNavigate } from 'react-router-dom';
import { PROFILE_ROUTE } from '../utils/const';

const { TabPane } = Tabs;
const apiService = new ApiService();

const Auth = () => {
  const { user } = useContext(Context);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (values) => {
    setIsLoading(true);
    try {
      const response = await apiService.post('/auth/login', values);
      if (response.token && response.user){
        console.log("login", response.user)
        message.success('Вы успешно авторизовались!');
        localStorage.setItem('token', response.token);
        user.checkSession();
        // user.setUser(response.user);
        user.setIsAuth(true);
        navigate(PROFILE_ROUTE);
      } else {
        message.error('Ошибка авторизации!');
      }
    } catch {
      message.error('Неправильный логин или пароль!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistration = async (values) => {
    setIsLoading(true);
    try {
      const response = await apiService.post('/auth/registration', values);
      if (response.token && response.user) {
        message.success('Регистрация успешна!');
        localStorage.setItem('token', response.token);
        user.checkSession();
        // user.setUser(response.user);
        user.setIsAuth(true);
        navigate(PROFILE_ROUTE);
      } else {
        message.error('Ошибка регистрации!');
      }
    } catch {
      message.error('Ошибка при регистрации! Попробуйте снова.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Card className="auth-card">
        <Tabs defaultActiveKey="1" centered>
          <TabPane tab="Вход" key="1">
            <Form onFinish={handleLogin} layout="vertical">
              <Form.Item
                name="login"
                rules={[
                  { required: true, message: 'Введите логин!' },
                  { min: 4, message: 'Минимум 4 символа!' },
                ]}
              >
                <Input className="custom-input" placeholder="Логин" />
              </Form.Item>
              <Form.Item
                name="password"
                rules={[
                  { required: true, message: 'Введите пароль!' },
                  { min: 6, message: 'Минимум 6 символов!' },
                ]}
              >
                <Input.Password className="custom-input" placeholder="Пароль" />
              </Form.Item>
              <Form.Item>
                <Button
                  className="custom-btn custom-btn-primary"
                  htmlType="submit"
                  loading={isLoading}
                  block
                >
                  Войти
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane tab="Регистрация" key="2">
            <Form onFinish={handleRegistration} layout="vertical">
              <Form.Item name="login" rules={[{ required: true }, { min: 4 }]}>
                <Input className="custom-input" placeholder="Логин" />
              </Form.Item>
              <Form.Item name="password" rules={[{ required: true }, { min: 6 }]}>
                <Input.Password className="custom-input" placeholder="Пароль" />
              </Form.Item>
              <Form.Item name="email" rules={[{ required: true }, { type: 'email' }]}>
                <Input className="custom-input" placeholder="Email" />
              </Form.Item>
              <Form.Item name="name" rules={[{ required: true }]}>
                <Input className="custom-input" placeholder="Имя" />
              </Form.Item>
              <Form.Item name="lastname" rules={[{ required: true }]}>
                <Input className="custom-input" placeholder="Фамилия" />
              </Form.Item>
              <Form.Item name="firstname" rules={[{ required: true }]}>
                <Input className="custom-input" placeholder="Отчество" />
              </Form.Item>
              <Form.Item
                name="phone"
                rules={[
                  { required: true },
                  { pattern: /^\+7\d{10}$/, message: 'Формат: +7XXXXXXXXXX' },
                ]}
              >
                <Input className="custom-input" placeholder="Телефон (+7XXXXXXXXXX)" />
              </Form.Item>
              <Form.Item
                name="consent"
                valuePropName="checked"
                rules={[{ validator: (_, value) => value ? Promise.resolve() : Promise.reject('Согласие обязательно!') }]}
              >
                <Checkbox>Согласен на обработку персональных данных</Checkbox>
              </Form.Item>
              <Form.Item>
                <Button
                  className="custom-btn custom-btn-primary"
                  htmlType="submit"
                  loading={isLoading}
                  block
                >
                  Зарегистрироваться
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;