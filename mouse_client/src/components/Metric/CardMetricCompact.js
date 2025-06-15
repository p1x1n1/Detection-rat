import React from "react";
import { Tag } from "antd";

const CardMetricCompact = ({ metrics }) => {
  return (
    <div style={{ marginTop: 8 }}>
      {metrics.map((m) => (
        <Tag key={m.id}>{m.metricName}</Tag>
      ))}
    </div>
  );
};

export default CardMetricCompact;
