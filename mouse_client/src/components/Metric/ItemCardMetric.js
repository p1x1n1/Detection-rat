import React, { useEffect, useState } from 'react';
import { Card, Typography } from 'antd';
import { API_SERVICE } from '../../service/api.service'; // путь к API_SERVICE

const { Title, Text } = Typography;

// Форматируем "HH:mm:ss"
const format = (val) => val ?? '-';

const ItemCardMetric = ({ metricItem }) => {
    const { metric, value, comment, experimentId, metricId } = metricItem;

    const [timeWindow, setTimeWindow] = useState({ start: null, end: null });

    useEffect(() => {
        if (metric.isTimeMetric && experimentId && metricId) {
            API_SERVICE.get(`/metric-experiment/window/${experimentId}/${metricId}`)
                .then((res) => setTimeWindow(res))
                .catch((err) => {
                    console.warn('Ошибка при загрузке времени метрики:', err);
                    setTimeWindow({ start: null, end: null });
                });
        }
    }, [experimentId, metricId, metric.isTimeMetric]);

    return (
        <Card
            title={<Title level={4}>{metric.metricName}</Title>}
            bordered
            style={{ marginBottom: 16 }}
        >
            {metric.isTimeMetric && (
                <>
                    <Text>
                        <strong>Начало:</strong> {format(timeWindow.start)}
                    </Text>
                    <br />
                    <Text>
                        <strong>Конец:</strong> {format(timeWindow.end)}
                    </Text>
                    <br />
                </>
            )}
            <Text>
                <strong>Значение:</strong> {value ?? '-'}
            </Text>
            {comment != null && (
                <>
                    <br />
                    <Text>
                        <strong>Комментарий:</strong> {comment || '-'}
                    </Text>
                </>
            )}
        </Card>
    );
};

export default ItemCardMetric;
