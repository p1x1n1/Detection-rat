import React from 'react';

import UploadVideoForm from '../components/Video/UploadVideoForm';
import { API_SERVICE } from '../service/api.service';
import { message } from 'antd';


const UploadVideoFormPage = () => {
  const addVideo = async (formData) => {
    try {
      await API_SERVICE.postFormData('/video', formData);
      message.success('Видео успешно добавлено!');
    } catch (error) {
      message.error('Ошибка при добавлении видео');
      console.error(error);
    }
  };

  return (
    <UploadVideoForm addVideo={addVideo} />
  );
};

export default UploadVideoFormPage;
