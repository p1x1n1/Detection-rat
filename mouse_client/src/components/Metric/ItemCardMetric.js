import React from 'react';
import { Card, Typography } from 'antd';

const { Title, Text } = Typography;

const ItemCardMetric = (props) => {
    const { metric } = props;

    return (
        <Card
            title={<Title level={4}>{metric.metric.title}</Title>}
            bordered={true}
            style={{ marginBottom: 16 }}
        >
            <Text><strong>Пороговое значение:</strong> {metric.value}</Text><br />
            <Text><strong>Итоговое значение:</strong> {metric.result_value}</Text><br />
            <Text><strong>Комментарий:</strong> {metric.comment}</Text>
        </Card>
    );
}

export default ItemCardMetric;
