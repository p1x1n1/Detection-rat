import React, { useEffect, useState } from "react";
import {
    Form,
    Input,
    Button,
    Select,
    Transfer,
    message,
    Modal,
    Row,
    Col,
    DatePicker,
    TimePicker,
    ConfigProvider,
    Pagination,
    InputNumber
} from "antd";
import ruRU from "antd/es/locale/ru_RU";
import UploadVideoForm from "../Video/UploadVideoForm";
import CardVideo from "../Video/CardVideo";
import { API_SERVICE } from "../../service/api.service";
// import { BASE_URL } from "../../App";
import "./css/AddExperiment.css";

const { Option } = Select;
const { TextArea } = Input;

const AddExperiment = () => {
    const [videos, setVideos] = useState([]);
    const [metrics, setMetrics] = useState([]);
    const [metricTimes, setMetricTimes] = useState({});
    // { [metricId]: { startH, startM, startS, endH, endM, endS } }
    const [selectedVideos, setSelectedVideos] = useState([]);
    const [selectedMetrics, setSelectedMetrics] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [currentPage, setCurrentPage] = useState(1);
    const videosPerPage = 2;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [videoResp, metricResp] = await Promise.all([
                    API_SERVICE.get("/video"),
                    API_SERVICE.get("/metric")
                ]);
                setVideos(videoResp ?? []);
                setMetrics(metricResp ?? []);
                console.log('AddExperiment: metric', metricResp);
            } catch (error) {
                message.error("Ошибка при загрузке данных");
                console.error(error);
            }
        };
        fetchData();
    }, []);

    const addVideo = async (formData) => {
        try {
            const newVideo = await API_SERVICE.postFormData('/video', formData);
            setVideos((prev) => [...prev, newVideo]);
            message.success('Видео добавлено');
            setIsModalVisible(false);
        } catch (e) {
            message.error('Ошибка при добавлении');
        }
    };

    const onFinish = async (values) => {
        if (selectedVideos.length === 0 || selectedMetrics.length === 0) {
            message.error("Выберите видео и показатели");
            return;
        }

        const metricExperiments = selectedMetrics.map(id => {
            const m = metrics.find(x => x.id === id);
            if (m.isTimeMetric) {
              const t = metricTimes[id] || {};
              const startSeconds = (t.startH || 0) * 3600 + (t.startM || 0) * 60 + (t.startS || 0);
              const endSeconds   = (t.endH   || 0) * 3600 + (t.endM   || 0) * 60 + (t.endS   || 0);
              return { metricId: id, startSeconds, endSeconds };
            }
            return { metricId: id };
          });
        

        const payload = {
            name: values.name,
            description: values.description || "",
            startDate: values.startDate.format("YYYY-MM-DD"),
            startTime: values.startTime.format("HH:mm:ss"),
            endDate: values.endDate.format("YYYY-MM-DD"),
            endTime: values.endTime.format("HH:mm:ss"),
            comment: values.comment || "",
            isExperimentMouse: values.isExperimentMouse || false,
            videoIds: selectedVideos,
            metricExperiments
        };

        try {
            await API_SERVICE.post("/experiment", payload);
            message.success("Эксперимент создан!");
            form.resetFields();
            setSelectedVideos([]);
            setSelectedMetrics([]);
        } catch (error) {
            message.error("Ошибка при сохранении");
        }
    };

    const handleMetricTimeChange = (metricId, field, value) => {
        setMetricTimes(prev => ({
            ...prev,
            [metricId]: {
                ...prev[metricId],
                [field]: value
            }
        }));
    };

    const startIndex = (currentPage - 1) * videosPerPage;
    const paginatedVideos = selectedVideos.slice(startIndex, startIndex + videosPerPage);

    return (
        <ConfigProvider locale={ruRU}>
            <h2 className="form-title">Создание эксперимента</h2>
            <Row gutter={24}>
                <Col span={16}>
                    <Form layout="vertical" onFinish={onFinish} form={form}>
                        <Form.Item name="name" label="Название" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item name="description" label="Описание">
                            <TextArea rows={3} />
                        </Form.Item>

                        <Row gutter={12}>
                            <Col span={12}>
                                <Form.Item name="startDate" label="Дата начала" rules={[{ required: true }]}>
                                    <DatePicker style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="startTime" label="Время начала" rules={[{ required: true }]}>
                                    <TimePicker style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={12}>
                            <Col span={12}>
                                <Form.Item name="endDate" label="Дата окончания" rules={[{ required: true }]}>
                                    <DatePicker style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="endTime" label="Время окончания" rules={[{ required: true }]}>
                                    <TimePicker style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item name="comment" label="Комментарий">
                            <TextArea rows={2} />
                        </Form.Item>

                        <Form.Item label="Видео эксперимента" required>
                            <Select
                                mode="multiple"
                                placeholder="Выберите видео"
                                value={selectedVideos}
                                onChange={setSelectedVideos}
                                dropdownRender={(menu) => (
                                    <>
                                        {menu}
                                        <Button
                                            type="dashed"
                                            style={{ width: "100%", marginTop: 8 }}
                                            onClick={() => setIsModalVisible(true)}
                                        >
                                            + Добавить новое видео
                                        </Button>
                                    </>
                                )}
                            >
                                {videos.map((v) => (
                                    <Option key={v.id} value={v.id}>
                                        {v.name} ({new Date(v.date).toLocaleDateString()})
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item label="Показатели" required>
                            <Transfer
                                dataSource={metrics.map((m) => ({ key: m.id, title: m.metricName }))}
                                targetKeys={selectedMetrics}
                                onChange={setSelectedMetrics}
                                render={item => item.title}
                                showSearch
                                titles={["Доступные", "Выбранные"]}
                                listStyle={{ width: "100%", height: 300 }}
                            />
                        </Form.Item>

                        {metrics
                            .filter(m => selectedMetrics.includes(m.id) && m.isTimeMetric)
                            .map(m => (
                                <div key={m.id} style={{ marginBottom: 16, padding: 12, border: '1px solid #f0f0f0' }}>
                                    <h4>Время для «{m.metricName}»</h4>
                                    <Row gutter={12}>
                                        <Col span={12}>
                                            <Form.Item label="Начало">
                                                <InputNumber
                                                    min={0} max={23} placeholder="Часы"
                                                    style={{ width: '30%' }}
                                                    onChange={val => handleMetricTimeChange(m.id, 'startH', val)}
                                                />
                                                <InputNumber
                                                    min={0} max={59} placeholder="Мин"
                                                    style={{ width: '30%', margin: '0 8px' }}
                                                    onChange={val => handleMetricTimeChange(m.id, 'startM', val)}
                                                />
                                                <InputNumber
                                                    min={0} max={59} placeholder="Сек"
                                                    style={{ width: '30%' }}
                                                    onChange={val => handleMetricTimeChange(m.id, 'startS', val)}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item label="Конец">
                                                <InputNumber
                                                    min={0} max={23} placeholder="Часы"
                                                    style={{ width: '30%' }}
                                                    onChange={val => handleMetricTimeChange(m.id, 'endH', val)}
                                                />
                                                <InputNumber
                                                    min={0} max={59} placeholder="Мин"
                                                    style={{ width: '30%', margin: '0 8px' }}
                                                    onChange={val => handleMetricTimeChange(m.id, 'endM', val)}
                                                />
                                                <InputNumber
                                                    min={0} max={59} placeholder="Сек"
                                                    style={{ width: '30%' }}
                                                    onChange={val => handleMetricTimeChange(m.id, 'endS', val)}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </div>
                            ))
                        }


                        <Form.Item>
                            <Button type="primary" htmlType="submit" className="custom-btn custom-btn-primary">
                                Сохранить эксперимент
                            </Button>
                        </Form.Item>
                    </Form>
                </Col>

                <Col span={8}>
                    <div className="video-preview-container">
                        {paginatedVideos.map((id) => {
                            const video = videos.find((v) => v.id === id);
                            return (
                                <CardVideo key={id} video={video} />
                            );
                        })}
                        {selectedVideos.length > videosPerPage && (
                            <Pagination
                                current={currentPage}
                                pageSize={videosPerPage}
                                total={selectedVideos.length}
                                onChange={(page) => setCurrentPage(page)}
                                size="small"
                                style={{ marginTop: 12, textAlign: 'center' }}
                            />
                        )}
                    </div>
                </Col>
            </Row>

            <Modal
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                title="Добавление видео"
            >
                <UploadVideoForm addVideo={addVideo} />
            </Modal>
        </ConfigProvider>
    );
};

export default AddExperiment;
