import React, { useState } from 'react';
import UploadVideoForm from '../components/Video/UploadVideoForm';
import { useNavigate } from 'react-router-dom';
import Title from 'antd/es/typography/Title';

const VideoReport = () => {
  const [videos, setVideos] = useState([
    {
      id: 1,
      filename: '../static/rat.mp4',
      createdAt: '2024-09-15 9:00',
      title: 'Rat',
      description: 'A video of a rat playing',
      experiments: [],
    },
  ]);

  const addVideo = (newVideo) => {
    setVideos([...videos, newVideo]);
  };

  return (
    <div>
       <Title level={2}>Загрузка видео</Title>
      <UploadVideoForm addVideo={addVideo} />
    </div>
  );
};

export default VideoReport;
