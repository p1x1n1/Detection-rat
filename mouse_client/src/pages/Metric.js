import React, { useEffect, useState, useRef, useContext } from 'react';
import { Button, Modal, Form, Input, message } from "antd";
import TableMetric from "../components/Metric/TableMetric";
import { API_SERVICE } from '../service/api.service';

const Metric = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState([]);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const data = await API_SERVICE.get(`/metric`);
      setMetrics(data);
      console.log(`Metric:metrics: ${data}`)
    } catch (error) {
      message.error('Ошибка при загрузке данных питомца!');
    }
    setLoading(false);
  };

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMetric, setEditingMetric] = useState(null); // Для редактируемой показатели
  const [isAddModalVisible, setIsAddModalVisible] = useState(false); // Для добавления новой показатели

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
    message.success("показатель успешно изменена!");
  };

  const handleAdd = (values) => {
    const newMetric = {
      id: Math.max(...metrics.map((m) => m.id)) + 1,
      title: values.title,
    };
    setMetrics([...metrics, newMetric]);
    setIsAddModalVisible(false);
    message.success("Новая показатель успешно добавлена!");
  };

  const handleDelete = (id) => {
    setMetrics((prevMetrics) => prevMetrics.filter((m) => m.id !== id));
    message.success("показатель успешно удалена!");
  };

  return (
    <>
      <h2>Показатели</h2>
      {/* <Button type="primary" style={{ marginBottom: "20px" }} onClick={showAddModal}>
        Добавить метрику
      </Button> */}
      <TableMetric metrics={metrics} onEdit={showEditModal} onDelete={handleDelete} />

      {/* Модальное окно для редактирования показатели */}
      <Modal
        title="Изменить метрику"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          layout="vertical"
          onFinish={handleEdit}
          initialValues={{ title: editingMetric ? editingMetric.title : "" }}
        >
          <Form.Item
            label="Название показатели"
            name="title"
            rules={[{ required: true, message: "Введите название показатели" }]}
          >
            <Input className="custom-input"/>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Изменить
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Модальное окно для добавления новой показатели */}
      <Modal
        title="Добавить метрику"
        open={isAddModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleAdd}>
          <Form.Item
            label="Название показатели"
            name="title"
            rules={[{ required: true, message: "Введите название показатели" }]}
          >
            <Input className="custom-input"/>
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
