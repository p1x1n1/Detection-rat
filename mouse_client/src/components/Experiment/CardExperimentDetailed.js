// components/Experiment/CardExperimentDetailed.tsx
import React, { useState } from "react";
import {
  Card,
  Typography,
  Tag,
  Row,
  Col,
  Divider,
  Pagination,
  Button,
  message,
  Alert,
} from "antd";
import CardVideo from "../Video/CardVideo";
import ItemCardMetric from "../Metric/ItemCardMetric";
import { API_SERVICE } from "../../service/api.service";
import { BASE_URL, getStatusColorVar } from "../../App";
import "../../pages/css/Experiment.css";
import { useNavigate } from "react-router-dom";
import ButtonExperiment from "./ButtonExperiment";
import VideoDownloadButton from "../Button/VideoDownloadButton";

const { Title, Text, Paragraph } = Typography;

const CardExperimentDetailed = ({ experiment, onRefresh }) => {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const mves = experiment.metricVideoExperiments || [];
  const [showAllMetrics, setShowAllMetrics] = useState(false);

  const videos = experiment.videoExperiments || [];
  const videoExp = videos[page - 1] || {};


  const {
    video,
    filenameResult,
    status: vidStatus,
    videoId,
    videoExperimentId
  } = videoExp;

  return (
    <Card className="experiment-card">
      {/* Основные поля с подписями */}
      {console.log("cardExperimentDetailed", experiment)}
      <Row gutter={[8, 8]}>
        <Col span={24}>
          <Title level={3}>{experiment.name}</Title>
        </Col>
        <Col span={24}>
          <Text strong>Описание:</Text>{" "}
          <Row><Text>{experiment.description || "-"}</Text></Row>
        </Col>
        <Col span={24}>
          <Text strong>Статус:</Text>
          <Tag
            className="status-tag"
            style={{ backgroundColor: getStatusColorVar(experiment.status?.statusName) }}
          >
            {experiment.status?.statusName || "Без статуса"}
          </Tag>
        </Col>
        <Col span={24}>
          <Text strong>Период:</Text>{" "}
          <Text>
            {experiment.startDate} {experiment.startTime} —{" "}
            {experiment.endDate} {experiment.endTime}
          </Text>
        </Col>
      </Row>

      {/* Кнопка анализа */}
      <ButtonExperiment experiment={experiment} onRefresh={onRefresh} />

      <Divider />

      <Title level={4}>
        Видео {page} из {videos.length}
      </Title>

      {videoExp && (
        <Row gutter={16}>
          {/* левая колонка: оригинальное видео */}
          {video && <Col xs={24} sm={24} md={12}>
            <Tag
              className="status-tag"
              style={{ backgroundColor: getStatusColorVar(experiment.status?.statusName) }}
            >
              {vidStatus?.statusName || "Без статуса"}
            </Tag>
            {/* {statusTag(vidStatus?.title)} */}
            <CardVideo video={video} key={video?.id || videoId} isBigVideo={true} />
          </Col>}

          {/* правая колонка: результат карточки метрик */}
          <Col xs={video ? 24 : 48} sm={video ? 24 : 48} md={video ? 12 : 48}>
            {
              vidStatus?.statusName === 'Успешно завершено' ? (
                <Row gutter={[0, 16]}>
                  {/* 1) результат */}
                  <Col span={video ? 24 : 12}>
                    {filenameResult ? (
                      <Card title="Результат анализа" className="card">
                        <video
                          width="100%"
                          controls
                          src={`${BASE_URL}${filenameResult}`}
                          style={{ marginBottom: 12 }}
                        />
                        <VideoDownloadButton
                          buttonName={"Скачать результат анализа"}
                          filenameResult={filenameResult}
                          videoName={video?.name}
                          experimentName={experiment?.name}
                        ></VideoDownloadButton>
                      </Card>
                    ) : (
                      <Text type="secondary">Результат отсутствует</Text>
                    )}
                  </Col>
                  {/* Показатели */}
                  <Col span={video ? 24 : 12}>
                    <Card title="Показатели этого видео:" className="card">
                      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
                        {mves
                          .filter(mv => mv.videoExperiment.videoExperimentId === videoExperimentId)
                          .slice(0, showAllMetrics ? undefined : 2)
                          .map((mv) => (
                            <Col xs={24} key={`${mv.videoExperimentId}-${mv.metric.id}`}>
                              <ItemCardMetric metricItem={mv} />
                            </Col>
                          ))}
                      </Row>

                      {mves.filter(mv => mv.videoExperiment.videoExperimentId === videoExperimentId).length > 2 && (
                        <Button
                          // type="link"
                          className="custom-btn-secondary"
                          onClick={() => setShowAllMetrics(prev => !prev)}
                        // style={{ marginTop: 8, paddingLeft: 0 }}
                        >
                          {showAllMetrics ? "Скрыть лишние показатели" : "Показать все показатели"}
                        </Button>
                      )}
                    </Card>
                  </Col>

                </Row>
              ) : (
                <Col span={24}>
                  <Alert
                    message="Анализ не завершён"
                    description="Данные и результат будут доступны после завершения анализа видео."
                    type="warning"
                    showIcon
                    style={{ marginTop: 16 }}
                  />
                </Col>
              )}
          </Col>
        </Row >
      )}

      <Pagination
        current={page}
        pageSize={1}
        total={videos.length}
        onChange={(p) => setPage(p)}
        style={{ marginTop: "var(--spacing)" }}
      />
    </Card >
  );
};

export default CardExperimentDetailed;
