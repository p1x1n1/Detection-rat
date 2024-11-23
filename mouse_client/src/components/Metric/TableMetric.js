import React from "react";
import { Table, Button, Popconfirm } from "antd";

const TableMetric = ({ metrics, onEdit, onDelete }) => {
  const columns = [
    {
      title: "Название метрики",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Действия",
      key: "actions",
      render: (_, record) => (
        <>
          <Button type="link" onClick={() => onEdit(record)}>
            Изменить
          </Button>
          <Popconfirm
            title="Вы уверены, что хотите удалить эту метрику?"
            onConfirm={() => onDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button type="link" danger>
              Удалить
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return <Table dataSource={metrics} columns={columns} rowKey="id" />;
};

export default TableMetric;
