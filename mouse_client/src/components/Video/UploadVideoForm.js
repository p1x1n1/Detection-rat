import React, { useState } from 'react';
import { Form, Input, Button, Upload, message, Typography } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { VIDEO_ROUTE } from '../../utils/const';

const { Title } = Typography;

const UploadVideoForm = ({ addVideo }) => {
    const [file, setFile] = useState(null);
    const navigate = useNavigate();

    const onFinish = (values) => {
        if (!file) {
            message.error('Пожалуйста, загрузите видеофайл');
            return;
        }

        // Пример добавления видео в список
        const newVideo = {
            id: Math.random(), // Можете использовать другой способ генерации уникального ID
            filename: file.name,
            createdAt: new Date().toLocaleString(),
            title: values.title,
            description: values.description,
        };

        // Добавляем новое видео (через функцию, переданную как пропс)
        addVideo(newVideo);

        message.success('Видео успешно загружено!');
        navigate(VIDEO_ROUTE); // Перенаправление на главную страницу или другую страницу
    };

    const handleFileChange = (info) => {
        const { file } = info;
        if (file.status === 'done' || file.status === 'uploading') {
            setFile(file.originFileObj); // Сохраняем загруженный файл
        }
    };

    return (
        <Form layout="vertical" onFinish={onFinish}>
          
            
            <Form.Item
                label="Название видео"
                name="title"
                rules={[{ required: true, message: 'Введите название видео' }]}
            >
                <Input />
            </Form.Item>

            <Form.Item
                label="Описание"
                name="description"
                rules={[{ required: true, message: 'Введите описание видео' }]}
            >
                <Input.TextArea rows={4} />
            </Form.Item>

            <Form.Item
                label="Загрузите видео"
                rules={[{ required: true, message: 'Загрузите видео' }]}
            >
                <Upload
                    beforeUpload={() => false} // Не загружает файл автоматически
                    onChange={handleFileChange}
                    accept="video/*"
                >
                    <Button icon={<UploadOutlined />}>Нажмите для загрузки видео</Button>
                </Upload>
                {file && <span style={{ marginLeft: 10 }}>{file.name}</span>}
            </Form.Item>

            <Form.Item>
                <Button type="primary" htmlType="submit">
                    Загрузить
                </Button>
            </Form.Item>
        </Form>
    );
};

export default UploadVideoForm;
