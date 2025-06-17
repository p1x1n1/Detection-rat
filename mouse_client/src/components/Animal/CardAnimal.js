import React, { useState, useRef } from "react";
import {
  Card,
  Table,
  Tag,
  Typography,
  Space,
  Image,
  Button,
  Row,
  Col,
  Modal,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  RightOutlined,
  LeftOutlined,
} from "@ant-design/icons";
import { BASE_URL } from "../../App";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

const AnimalCard = ({ animal, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const [showVideos, setShowVideos] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const holdTimer = useRef(null);

  const imageUrl = animal.imagePath ? `${BASE_URL}${animal.imagePath}` : null;

  const videoColumns = [
    {
      title: "Название видео",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Button
          type="link"
          style={{ padding: 0 }}
          onClick={() => navigate(`/video/${record.id}`)}
        >
          {text}
        </Button>
      ),
    },
    {
      title: "Дата",
      dataIndex: "date",
      key: "date",
      render: (date) =>
        date ? new Date(date).toLocaleDateString() : "Не указана",
    },
    {
      title: "Длительность",
      key: "duration",
      render: (_, record) =>
        record.durationMinutes != null
          ? `${record.durationMinutes}м ${record.durationSeconds || 0}с`
          : "-",
    },
    {
      title: "Тип мыши",
      dataIndex: "isExperimentAnimal",
      key: "isExperimentAnimal",
      render: (flag) => (
        <Tag color={flag ? "blue" : "orange"}>
          {flag ? "Экспериментальная" : "Контрольная"}
        </Tag>
      ),
    },
  ];

  const handleMouseDown = () => {
    holdTimer.current = setTimeout(() => {
      setModalVisible(true);
    }, 500);
  };

  const handleMouseUp = () => {
    clearTimeout(holdTimer.current);
  };

  return (
    <>
      <Card
        className="custom-animal-card"
        style={{
          backgroundColor: "white",
          border: "8px solid var(--color-deep-ocean)",
          padding: "1rem",
          borderRadius: "1rem",
          marginBottom: "var(--spacing)",
        }}
        title={
          <Title level={4} style={{ margin: 0 }}>
            {animal.name || `Животное #${animal.id}`}
          </Title>
        }
        actions={[
          <EditOutlined key="edit" onClick={() => onEdit(animal)} />,
          <DeleteOutlined key="delete" onClick={() => onDelete(animal)} />,
        ]}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        cover={
          // imageUrl && (
          <Image
            src={imageUrl || '/rat-1.png'}
            alt={animal.name}
            style={{
              height: "240px",
              width: "100%",
              borderRadius: "0.75rem",
            }}
            preview={false}
          />
          // )
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={showVideos ? 12 : 24}>
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <Text><strong>Пол:</strong> {animal.sex ? "Самец" : "Самка"}</Text>
              <Text><strong>Возраст:</strong> {animal.age} мес</Text>
              {animal.weight !== undefined && (
                <Text><strong>Вес:</strong> {animal.weight} г</Text>
              )}
              {animal.color?.colorName && (
                <Text><strong>Окрас:</strong> {animal.color.colorName}</Text>
              )}
            </Space>

            {animal.videos?.length > 0 && (
              <Button
                type="default"
                onClick={() => setShowVideos(!showVideos)}
                icon={showVideos ? <LeftOutlined /> : <RightOutlined />}
                style={{
                  backgroundColor: "var(--color-deep-ocean)",
                  color: "white",
                  border: "none",
                  borderRadius: "var(--radius)",
                  marginTop: 12,
                }}
              >
                {showVideos ? "Скрыть видео" : "Показать видео"}
              </Button>
            )}
          </Col>

          {showVideos && (
            <Col xs={24} md={12}>
              <Table
                columns={videoColumns}
                dataSource={animal.videos}
                rowKey="id"
                pagination={false}
                size="small"
                bordered
                scroll={{ x: "100%" }}
                className="custom-animal-table"
              />
            </Col>
          )}
        </Row>
      </Card>

      <Modal
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        title={`Видео животного "${animal.name}"`}
        width={800}
      >
        <Table
          dataSource={animal.videos || []}
          columns={videoColumns}
          rowKey="id"
          pagination={false}
          bordered
          size="small"
        />
      </Modal>
    </>
  );
};

export default AnimalCard;
