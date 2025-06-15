import React, { useEffect, useState } from "react";
import {
  PlusOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Button,
  Col,
  message,
  Modal,
  Pagination,
  Row,
  Input,
  Select,
  Space,
} from "antd";
import AnimalCard from "../components/Animal/CardAnimal";
import AddAnimalModal from "../components/Animal/AddAnimalModal";
import { API_SERVICE } from "../service/api.service";

const { Option } = Select;

const LabAnimalsPage = () => {
  const [loading, setLoading] = useState(true);
  const [animals, setAnimals] = useState([]);
  const [filteredAnimals, setFilteredAnimals] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState(null);
  const [colors, setColors] = useState([]);

  useEffect(() => {
    fetchAnimals();
    fetchColors();
  }, []);

  useEffect(() => {
    filterAndSort();
  }, [animals, searchTerm, sortKey]);

  const fetchAnimals = async () => {
    setLoading(true);
    try {
      const data = await API_SERVICE.get(`/lab-animal`);
      setAnimals(data);
    } catch (error) {
      message.error("Ошибка при загрузке лабораторных животных");
      console.log(`Animal: GetAnimals: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchColors = async () => {
    try {
      const colorList = await API_SERVICE.get(`/color`);
      setColors(colorList);
    } catch (error) {
      message.error("Ошибка при загрузке цветов");
      console.log(`Color fetch error: ${error}`);
    }
  };

  const filterAndSort = () => {
    let data = [...animals];

    if (searchTerm) {
      data = data.filter((a) =>
        a.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortKey === "name") {
      data.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sortKey === "age") {
      data.sort((a, b) => a.age - b.age);
    } else if (sortKey === "weight") {
      data.sort((a, b) => (a.weight || 0) - (b.weight || 0));
    } else if (sortKey === "color") {
      data.sort((a, b) =>
        (a.color?.colorName || "").localeCompare(b.color?.colorName || "")
      );
    }

    setFilteredAnimals(data);
    setCurrentPage(1);
  };

  const handleEdit = (animal) => {
    setEditingAnimal(animal);
    setModalVisible(true);
  };

  const handleDelete = (animal) => {
    Modal.confirm({
      title: "Удалить животное?",
      icon: <ExclamationCircleOutlined />,
      content: `Вы уверены, что хотите удалить животное "${animal.name}"?`,
      okText: "Удалить",
      okType: "danger",
      cancelText: "Отмена",
      centered: true,
      onOk: async () => {
        try {
          await API_SERVICE.delete(`/lab-animal/${animal.id}`);
          message.success("Животное удалено");
          fetchAnimals();
        } catch (error) {
          message.error("Ошибка при удалении животного");
          console.log("Delete error:", error);
        }
      },
    });
  };

  const handleAddClick = () => {
    setEditingAnimal(null);
    setModalVisible(true);
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setEditingAnimal(null);
  };

  const handleModalSubmit = async (formData) => {
    try {
      if (editingAnimal) {
        await API_SERVICE.patchFormData(
          `/lab-animal/${editingAnimal.id}`,
          formData
        );
        message.success("Животное обновлено");
      } else {
        await API_SERVICE.postFormData(`/lab-animal`, formData);
        message.success("Животное добавлено");
      }
      setModalVisible(false);
      fetchAnimals();
    } catch (error) {
      message.error("Ошибка при сохранении животного");
      console.log("Form submit error:", error);
    }
  };

  const startIdx = (currentPage - 1) * pageSize;
  const currentAnimals = filteredAnimals.slice(
    startIdx,
    startIdx + pageSize
  );

  return (
    <div className="">
      <h2 className="mb-4">Лабораторные животные</h2>

      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Space>
            <Input
              placeholder="Поиск по имени"
              prefix={<SearchOutlined />}
              allowClear
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 240 }}
            />

            <Select
              allowClear
              placeholder="Сортировка"
              value={sortKey}
              onChange={(value) => setSortKey(value)}
              style={{ width: 180 }}
            >
              <Option value="name">По имени</Option>
              <Option value="age">По возрасту</Option>
              <Option value="weight">По весу</Option>
              <Option value="color">По окрасу</Option>
            </Select>
          </Space>
        </Col>

        <Col>
          <Button
            className="custom-btn custom-btn-primary"
            icon={<PlusOutlined />}
            onClick={handleAddClick}
          >
            Добавить новое животное
          </Button>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {currentAnimals.map((animal) => (
          <Col xs={24} sm={18} md={7} key={animal.id}>
            <AnimalCard
              animal={animal}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </Col>
        ))}
      </Row>

      <Pagination
        className="mt-4 text-center"
        current={currentPage}
        pageSize={pageSize}
        total={filteredAnimals.length}
        onChange={(page) => setCurrentPage(page)}
      />

      <AddAnimalModal
        visible={modalVisible}
        onCancel={handleModalCancel}
        onSubmit={handleModalSubmit}
        colors={colors}
        initialAnimal={editingAnimal}
      />
    </div>
  );
};

export default LabAnimalsPage;
