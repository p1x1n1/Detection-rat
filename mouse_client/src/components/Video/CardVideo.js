import { Card, Row, Col, Typography } from "antd";

const { Title, Text } = Typography;

const CardVideo = (props) => {
    const { video } = props;

    return (
        <Card title={video.title || "Видео "}>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <video width="100%" controls>
                        <source src={video.filename} type="video/mp4" />
                        Ваш браузер не поддерживает встроенные видео.
                    </video>
                </Col>
                <Col span={24}>
                    <Text strong>Описание: </Text>
                    <Text>{video.description || "Нет описания"}</Text>
                </Col>
                <Col span={24}>
                    <Text type="secondary">Дата публикации: {video.createdAt}</Text>
                </Col>
            </Row>
        </Card>
    );
};

export default CardVideo;
