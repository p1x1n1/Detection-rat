import React, { useState } from "react";
import { Button, Modal, Form, Input, Popconfirm, message } from "antd";
import TableMetric from "../components/Metric/TableMetric";

const Metric = () => {
  const [metrics, setMetrics] = useState([
    {
      id: 1,
      title: "Количество пересечённых линий",
    },
    {
      id: 2,
      title: "Количество горизонтальных пересечённых линий",
    },
  ]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMetric, setEditingMetric] = useState(null); // Для редактируемой метрики
  const [isAddModalVisible, setIsAddModalVisible] = useState(false); // Для добавления новой метрики

  const showEditModal = (metric) => {
    setEditingMetric(metric);
    setIsModalVisible(true);
  };

  const showAddModal = () => {
    setIsAddModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setIsAddModalVisible(false);
    setEditingMetric(null);
  };

  const handleEdit = (values) => {
    setMetrics((prevMetrics) =>
      prevMetrics.map((m) => (m.id === editingMetric.id ? { ...m, title: values.title } : m))
    );
    setIsModalVisible(false);
    message.success("Метрика успешно изменена!");
  };

  const handleAdd = (values) => {
    const newMetric = {
      id: Math.max(...metrics.map((m) => m.id)) + 1,
      title: values.title,
    };
    setMetrics([...metrics, newMetric]);
    setIsAddModalVisible(false);
    message.success("Новая метрика успешно добавлена!");
  };

  const handleDelete = (id) => {
    setMetrics((prevMetrics) => prevMetrics.filter((m) => m.id !== id));
    message.success("Метрика успешно удалена!");
  };

  return (
    <>
      <h2>Метрики</h2>
      <Button type="primary" style={{ marginBottom: "20px" }} onClick={showAddModal}>
        Добавить метрику
      </Button>
      <TableMetric metrics={metrics} onEdit={showEditModal} onDelete={handleDelete} />

      {/* Модальное окно для редактирования метрики */}
      <Modal
        title="Изменить метрику"
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          layout="vertical"
          onFinish={handleEdit}
          initialValues={{ title: editingMetric ? editingMetric.title : "" }}
        >
          <Form.Item
            label="Название метрики"
            name="title"
            rules={[{ required: true, message: "Введите название метрики" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Изменить
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Модальное окно для добавления новой метрики */}
      <Modal
        title="Добавить метрику"
        visible={isAddModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleAdd}>
          <Form.Item
            label="Название метрики"
            name="title"
            rules={[{ required: true, message: "Введите название метрики" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Добавить
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Metric;
