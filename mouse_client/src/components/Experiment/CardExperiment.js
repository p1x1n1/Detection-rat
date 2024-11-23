import { Card, Col, Row, Typography } from "antd";
import CardVideo from "../Video/CardVideo";
import CardMetric from "../Metric/CardMetric";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

const CardExperiment = (props) => {
    const { experiment, onClick } = props;
    const navigate = useNavigate();
    // Определяем тип в зависимости от значения статус
    const statusType = () => {
        switch (experiment.status?.title) {
            case "success":
                return "success";
            case "in proccess":
                return "warning";
            case "error":
                return "danger";
            default:
                return "secondary"; // или "default" для неуказанных статусов
        }
    };


    return (
        <Card style={{ cursor: 'pointer' }}>
            <Title level={4}>{experiment.title || "Без названия"}</Title>
            <Text strong>Описание: </Text>
            <Text>{experiment.description || "Нет описания"}</Text>
            <br />
            <Text type="secondary">Дата: {experiment.processedAt}</Text>
            <br />
            <Text type={statusType()}>Статус: {experiment.status?.title || "Нет статуса"}</Text>
            <Row gutter={[16, 16]}  onClick={onClick}>
                <Col span={12}>
                    <CardVideo video={experiment.video} />
                </Col>
                <Col span={12}>
                    <CardMetric 
                        metrics={experiment.metricExperiment}  
                    />
                </Col>
            </Row>
        </Card>
    );
};

export default CardExperiment;
