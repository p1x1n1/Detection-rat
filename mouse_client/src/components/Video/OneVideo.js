import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Row, Col, Empty, Spin, Typography } from "antd";
import CardVideoExperiments from "./CardVideoExperiements";
import { API_SERVICE } from "../../service/api.service";

const { Title } = Typography;

const OneVideo = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const data = await API_SERVICE.get(`/video/${id}`);
        setVideo(data);
        console.log('oneVideo:', data)
      } catch (error) {
        console.error("Ошибка при загрузке видео:", error);
        setVideo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [id]);

  return (
    <>
      <Title level={2} style={{ marginBottom: 16 }}>
        Видео
      </Title>

      {loading ? (
        <Spin size="large" />
      ) : video ? (
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <CardVideoExperiments video={video} />
          </Col>
        </Row>
      ) : (
        <Empty description="Видео не найдено" />
      )}
    </>
  );
};

export default OneVideo;
