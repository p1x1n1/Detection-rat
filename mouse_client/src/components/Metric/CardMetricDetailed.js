import React from "react";
import { List, Typography } from "antd";

const { Text } = Typography;

const CardMetricDetailed = ({ metrics }) => {
  return (
    <List
      bordered
      dataSource={metrics}
      renderItem={({ metric, startTime, endTime }) => (
        <List.Item>
          <Text>
            {metric.metricName}
            {metric.isTimeMetric && typeof startTime === 'number' && typeof endTime === 'number' &&
              ` (с ${startTime} по ${endTime} сек)`
            }
          </Text>
        </List.Item>
      )}
    />
  );
};

export default CardMetricDetailed;
