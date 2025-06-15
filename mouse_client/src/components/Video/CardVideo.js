import { Card, Row, Col, Typography, Tag, Divider } from 'antd';
import { BASE_URL } from '../../App';
import React, { useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const CardVideo = ({ video, isBigVideo = false }) => {
  const videoRef = useRef(null);
  const [isVertical, setIsVertical] = useState(false);
  const navigate = useNavigate();

  if (!video) return null;

  const videoUrl = video.filename ? `${BASE_URL}${video.filename}` : null;
  const animal = video.labAnimal;

  const handleLoadedMetadata = () => {
    const videoEl = videoRef.current;
    if (videoEl) {
      const vertical = videoEl.videoHeight > videoEl.videoWidth;
      setIsVertical(vertical);
    }
  };

  const formatDuration = (min = 0, sec = 0) => {
    const totalSec = min * 60 + sec;
    const h = Math.floor(totalSec / 3600)
      .toString().padStart(2, '0');
    const m = Math.floor((totalSec % 3600) / 60)
      .toString().padStart(2, '0');
    const s = Math.floor(totalSec % 60)
      .toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const wrapperClass = isBigVideo
    ? isVertical
      ? 'custom-video-wrapper-vertical-big'
      : 'custom-video-wrapper-horizontal-big'
    : 'custom-video-wrapper';

  const renderInfo = () => (
    <Row gutter={[8, 12]} className="custom-section">
      <Col span={24}>
        <Text strong>Тип мыши:</Text>
        <Tag
          className="status-tag"
          color={video.isExperimentAnimal ? 'blue' : 'orange'}
          style={{ marginLeft: 8 }}
        >
          {video.isExperimentAnimal ? 'Экспериментальная' : 'Контрольная'}
        </Tag>
      </Col>

      {animal && (
        <>
          <Col span={24}>
            <Text strong>Животное:</Text>{' '}
            <Text>
              {animal.name} ({animal.sex ? 'Самец' : 'Самка'})
            </Text>
          </Col>

          {animal.imagePath && (
            <Col span={24}>
              <img
                src={`${BASE_URL}${animal.imagePath}`}
                alt={animal.name}
                style={{
                  width: '100%',
                  maxHeight: 200,
                  objectFit: 'cover',
                  borderRadius: 8,
                  marginTop: 8,
                }}
              />
            </Col>
          )}
        </>
      )}

      <Col span={24}>
        <Text strong>Описание:</Text>{' '}
        <Text>{video.description || 'Нет описания'}</Text>
      </Col>

      <Col span={24}>
        <Text strong>Длительность:</Text>{' '}
        <Text>{formatDuration(video.durationMinutes, video.durationSeconds)}</Text>
      </Col>

      <Col span={24}>
        <Text type="secondary">
          Дата публикации:{' '}
          {video.date
            ? new Date(video.date).toLocaleDateString()
            : 'Не указана'}
        </Text>
      </Col>
    </Row>
  );

  return (
    <Card
      className="card-video"
      bordered={false}
      hoverable
      style={{ marginBottom: 16, cursor: 'pointer' }}
      onClick={() => navigate(`/video/${video.id}`)}
    >
      <Title level={4} className="section-title">
        {video.name || 'Видео'}
      </Title>

      {isVertical ? (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <div className={wrapperClass}>
              <video
                ref={videoRef}
                onLoadedMetadata={handleLoadedMetadata}
                controls
              >
                <source src={videoUrl} type="video/mp4" />
                Ваш браузер не поддерживает встроенные видео.
              </video>
            </div>
          </Col>
          <Col xs={24} md={12}>{renderInfo()}</Col>
        </Row>
      ) : (
        <>
          <div className={wrapperClass}>
            <video
              ref={videoRef}
              onLoadedMetadata={handleLoadedMetadata}
              controls
            >
              <source src={videoUrl} type="video/mp4" />
              Ваш браузер не поддерживает встроенные видео.
            </video>
          </div>

          <Divider />

          {renderInfo()}
        </>
      )}
    </Card>
  );
};

export default CardVideo;
