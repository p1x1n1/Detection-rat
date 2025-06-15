// pages/ExperimentReport.jsx

import React, { useEffect, useState } from "react";
import {
  Table,
  Typography,
  Spin,
  message,
  Button,
  Modal,
  Input,
  Checkbox,
  Radio,
  Row,
  Col,
  Space,
} from "antd";
import { useParams } from "react-router-dom";
import { API_SERVICE } from "../service/api.service";


const { Title } = Typography;

// Опции дополнительных колонок
const allColumnsOptions = [
  { key: "videoName", title: "Название видео", category: "Видео" },
  { key: "animalName", title: "Имя животного", category: "Животное" },
  { key: "animalWeight", title: "Вес животного", category: "Животное" },
  { key: "animalSex", title: "Пол животного", category: "Животное" },
];

const ExperimentReport = () => {
  const { id } = useParams();
  const [columns, setColumns] = useState([]);
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);

  const [columnModalVisible, setColumnModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCols, setSelectedCols] = useState([]);
  const [activeCategory, setActiveCategory] = useState("Видео");

  useEffect(() => {
    setLoading(true);
    API_SERVICE.get(`/experiment/${id}`)
      .then(exp => {
        const videoExps = exp.videoExperiments || [];
        const metricVideoExps = exp.metricVideoExperiments || [];

        // 1) Уникальные метрики
        const metricNames = Array.from(
          new Set(metricVideoExps.map(mv => mv.metric.metricName))
        );

        // 2) Обязательные колонки: тип мыши + метрики
        const baseCols = [
          { title: "Тип мыши", dataIndex: "type", key: "type", fixed: "left" },
          ...metricNames.map(name => ({
            title: name,
            dataIndex: name,
            key: name,
          })),
        ];

        // 3) Строки по каждому видео
        const rows = videoExps.map(ve => {
          const { video, videoId } = ve;
          const isExp = video.labAnimal?.isExperimentAnimal === true;
          const row = {
            key: videoId,
            type: isExp ? "Экспериментальная" : "Контрольная",
            // доп. поля (вычислены сразу, но покажутся только если выбраны)
            videoName: video.name,
            animalName: video.labAnimal?.name || "-",
            animalWeight: video.labAnimal?.weight != null
              ? `${video.labAnimal.weight} г`
              : "-",
            animalSex: video.labAnimal
              ? (video.labAnimal.sex ? "♂" : "♀")
              : "-",
          };
          metricNames.forEach(name => {
            const mv = metricVideoExps.find(
              x => x.videoId === videoId && x.metric.metricName === name
            );
            row[name] = mv ? mv.value : 0;
          });
          return row;
        });

        // 4) Колонки из модального окна
        const extraCols = allColumnsOptions
          .filter(o => selectedCols.includes(o.key))
          .map(o => ({
            title: o.title,
            dataIndex: o.key,
            key: o.key,
            fixed: "right",
          }));

        setColumns([...baseCols, ...extraCols]);
        setDataSource(rows);
      })
      .catch(() => {
        message.error("Не удалось загрузить данные отчёта");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, selectedCols]);

  const downloadExcel = async () => {
    try {
      // вместо API_SERVICE.get(...).then(res.json())
      const blob = await API_SERVICE.getBlob(`/experiment/${id}/report/excel`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `experiment-${id}-report.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      message.error("Не удалось скачать Excel");
    }
  };


  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Отчёт по эксперименту #{id}</Title>

      <Space style={{ float: "right", marginBottom: 16 }}>
        <Button
          className="custom-btn custom-btn-primary"
          onClick={() => setColumnModalVisible(true)}
        >
          Добавить колонку
        </Button>
        {/* ↓ НОВАЯ КНОПКА */}
        <Button
          className="custom-btn custom-btn-primary"
          onClick={downloadExcel}
        >
          Скачать Excel
        </Button>
      </Space>

      {loading ? (
        <Spin />
      ) : (
        <Table
          className="custom-table"
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          bordered
          scroll={{ x: "max-content" }}
        />
      )}

      <Modal
        className="custom-modal"
        title="Добавить колонки"
        visible={columnModalVisible}
        onOk={() => setColumnModalVisible(false)}
        onCancel={() => setColumnModalVisible(false)}
        width={600}
      >
        <Input.Search
          className="custom-input custom-modal-search"
          placeholder="Поиск..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ marginBottom: 16 }}
        />

        <Row gutter={16}>
          <Col span={6}>
            <Radio.Group
              className="custom-radio-group"
              onChange={e => setActiveCategory(e.target.value)}
              value={activeCategory}
            >
              <Space direction="vertical">
                {Array.from(
                  new Set(allColumnsOptions.map(o => o.category))
                ).map(cat => (
                  <Radio key={cat} value={cat}>{cat}</Radio>
                ))}
              </Space>
            </Radio.Group>
          </Col>

          <Col span={18}>
            <Checkbox.Group
              className="custom-checkbox-group"
              value={selectedCols}
              onChange={vals => setSelectedCols(vals)}
            >
              <Space direction="vertical">
                {allColumnsOptions
                  .filter(o => o.category === activeCategory)
                  .filter(o =>
                    o.title.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(o => (
                    <Checkbox key={o.key} value={o.key}>
                      {o.title}
                    </Checkbox>
                  ))}
              </Space>
            </Checkbox.Group>
          </Col>
        </Row>
      </Modal>
    </div>
  );
};

export default ExperimentReport;
