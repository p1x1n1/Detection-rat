// components/Experiment/CardExperiment.tsx
import { Card, Typography, Tag } from "antd";
import "../../pages/css/Experiment.css";
import { getStatusColorVar } from "../../App";
import ButtonExperiment from "./ButtonExperiment";

const { Title, Text } = Typography;

const CardExperiment = ({ experiment, onClick, onRefresh }) => {
    const videoExps = experiment.videoExperiments || [];
    const metricExps = experiment.metricExperiments || [];

    return (
        <Card
            hoverable
            className="experiment-card"
            onClick={onClick}
        >
            <Title level={4}>{experiment.name}</Title>
            <Tag
                className="status-tag"
                style={{ backgroundColor: getStatusColorVar(experiment.status?.statusName) }}
            >
                {experiment.status?.statusName || "Без статуса"}
            </Tag>

            <Text type="secondary">
                Дата: {" "}
            </Text>

            <Text className="meta">
                {experiment.startDate} {experiment.startTime} —{" "}
                {experiment.endDate} {experiment.endTime}
            </Text>

            <div className="section">
                <Text strong>Показатели ({metricExps.length}): </Text>
                {metricExps.map(({ metric }) => (
                    <Tag className="status-tag" style={{ backgroundColor: getStatusColorVar("Анализ") }}  key={metric.id}>{metric.metricName}</Tag>
                ))}
            </div>

            <div className="section">
                <Text strong>Видео ({videoExps.length}):</Text>
                <ul>
                    {videoExps.map((ve) => (
                        <li key={ve.videoId}>
                            <Tag
                                className="status-tag"
                                style={{ backgroundColor: getStatusColorVar(ve.status?.statusName) }}
                            >
                                {ve.status?.statusName || "Нет статуса"}
                            </Tag>

                            {ve.video?.name || `Видео ${ve.videoId? ve.video.name : ''}`}
                            {ve.video?.labAnimal && (
                                <ul>
                                    <li>
                                        <Tag className="status-tag"
                                            color={
                                                ve.video.labAnimal.isExperimentAnimal
                                                    ? "var(--color-primary)"
                                                    : "var(--color-secondary)"
                                            }
                                        >
                                            {ve.video.labAnimal.isExperimentAnimal
                                                ? "Экспериментальная"
                                                : "Контрольная"}
                                        </Tag>
                                        {ve.video.labAnimal.name} (
                                        {ve.video.labAnimal.sex ? "(Самец)" : "(Самка)"})
                                    </li>
                                </ul>
                            )}
                        </li>
                    ))}
                </ul>
            </div>

            <ButtonExperiment
                experiment={experiment}
                onRefresh={onRefresh} />
        </Card>
    );
};

export default CardExperiment;