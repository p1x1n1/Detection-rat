import React, { useEffect, useMemo, useState } from "react";
import { Form, Input, Button, Select, Transfer, message, Modal, Row, Col } from "antd";
import UploadVideoForm from "../Video/UploadVideoForm";

const { Option } = Select;

const AddExperiment = () => {
    const videos = [
        { id: 1, title: "Rat Experiment 1", createdAt: "2024-09-15", filename: '../static/rat.mp4', },
        { id: 2, title: "Rat Experiment 2", createdAt: "2024-09-16", filename: '../static/rat.mp4', },
    ];
    
    const metrics = [
        { id: 1, title: "Количество пересечённых линий" },
        { id: 2, title: "Количество горизонтальных пересечённых линий" },
        { id: 3, title: "Количество заглядываний в отверстия" },
    ];

    const [experiments, setExperiments] = useState([]);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [selectedMetrics, setSelectedMetrics] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [videoList, setVideoList] = useState(videos);
  
    const onAddExperiment = (newExperiment) => {
        setExperiments((prevExperiments) => [...prevExperiments, newExperiment]);
    };
    
    const onFinish = (values) => {
        if (!selectedVideo || selectedMetrics.length === 0) {
            message.error("Пожалуйста, выберите видео и метрики");
            return;
        }
        
        const newExperiment = {
            title: values.title,
            description: values.description,
            video: videos.find((video) => video.id === selectedVideo),
            metrics: metrics.filter((metric) => selectedMetrics.includes(metric.id)),
        };

        onAddExperiment(newExperiment);
        message.success("Эксперимент успешно добавлен!");
    };

    const handleVideoChange = (value) => {
        setSelectedVideo(value);
    };

    const handleMetricsChange = (targetKeys) => {
        setSelectedMetrics(targetKeys);
    };

    const handleAddVideo = (newVideo) => {
        setVideoList((prev) => [...prev, newVideo]);
        setIsModalVisible(false);
    };

    const showModal = () => {
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    // Используем useMemo для мемоизации компонента видео, чтобы он рендерился только при изменении выбранного видео
    const renderSelectedVideo = useMemo(() => {
        if (!selectedVideo) return null;
        console.log('renderSelectedVideo', selectedVideo)

        const videoData = videoList.find((video) => video.id === selectedVideo);

        return (
            <Col span={12}>
                <h3>Видео эксперимента</h3>
                <video width="100%" controls>
                    <source src={videoData.filename} type="video/mp4" />
                </video>
            </Col>
        );
    }, [selectedVideo, videoList]);

    return (
        <>
            <h2>Добавление нового эксперимента</h2>
            <Row>
                <Col span="12">
                    <Form layout="vertical" onFinish={onFinish}>
                        <Form.Item
                            label="Название эксперимента"
                            name="title"
                            rules={[{ required: true, message: "Пожалуйста, введите название эксперимента" }]}
                        >
                            <Input />
                        </Form.Item>
        
                        <Form.Item
                            label="Описание эксперимента"
                            name="description"
                            rules={[{ required: true, message: "Пожалуйста, введите описание эксперимента" }]}
                        >
                            <Input.TextArea />
                        </Form.Item>
        
                        <Form.Item
                            label="Выберите видео"
                            name="video"
                            rules={[{ required: true, message: "Пожалуйста, выберите видео" }]}
                        >
                            <Select
                                placeholder="Выберите видео"
                                onChange={handleVideoChange}
                                dropdownRender={(menu) => (
                                    <>
                                        {menu}
                                        <Button type="dashed" onClick={showModal} style={{ width: "100%", marginTop: 8 }}>
                                            Добавить новое видео
                                        </Button>
                                    </>
                                )}
                            >
                                {videoList.map((video) => (
                                    <Option key={video.id} value={video.id}>
                                        {video.title} ({video.createdAt})
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
        
                        <Form.Item
                            label="Выберите метрики"
                            name="metrics"
                            rules={[{ required: true, message: "Пожалуйста, выберите метрики" }]}
                        >
                            <Transfer
                                dataSource={metrics.map((metric) => ({ key: metric.id, title: metric.title }))}
                                showSearch
                                titles={['Доступные метрики', 'Выбранные метрики']}
                                targetKeys={selectedMetrics}
                                onChange={handleMetricsChange}
                                render={item => item.title}
                                listStyle={{
                                    width: 300,
                                    height: 300,
                                }}
                            />
                        </Form.Item>
        
                        <Form.Item>
                            <Button type="primary" htmlType="submit">
                                Добавить эксперимент
                            </Button>
                        </Form.Item>
                    </Form>
                </Col>
                {renderSelectedVideo}
            </Row>

            <Modal
                title="Добавить новое видео"
                visible={isModalVisible}
                onCancel={handleCancel}
                footer={null}
            >
                <UploadVideoForm addVideo={handleAddVideo} />
            </Modal>
        </>
    );
};

export default AddExperiment;
