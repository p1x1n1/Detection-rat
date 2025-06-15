import React, { useState } from 'react';
import { Button, Card, Col, Modal, Row, Space, Typography, Upload, message, Alert } from 'antd';
import { useNavigate } from 'react-router-dom';
import { VIDEO_ROUTE } from '../../utils/const';
import CardVideo from './CardVideo';
import ListExperiments from '../Experiment/ListExperiments';
import { API_SERVICE } from '../../service/api.service';
import { UploadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

//TODO
// isExperimnet check this place
const CardVideoExperiments = ({ video }) => {
    const navigate = useNavigate();
    const [editing, setEditing] = useState(false);
    const [fileList, setFileList] = useState([]);
    const [description, setDescription] = useState(video.description || '');

    const handleVideoClick = (e) => {
        e.stopPropagation();
        navigate(`${VIDEO_ROUTE}/${video.id}`);
    };

    const handleEditClick = () => {
        setEditing(true);
    };

    const handleDeleteClick = () => {
        if (video.videoExperiments?.length > 0) {
            Modal.warning({
                title: 'Нельзя удалить видео',
                content: (
                    <>
                        <Text>
                            Видео участвует в следующих экспериментах:
                        </Text>
                        <ul>
                            {video.videoExperiments.map((ve) => (
                                <li key={ve.experimentId}>{ve.experiment?.name}</li>
                            ))}
                        </ul>
                    </>
                ),
            });
            return;
        }

        Modal.confirm({
            title: 'Удалить видео?',
            content: 'Вы уверены, что хотите удалить это видео?',
            okText: 'Удалить',
            cancelText: 'Отмена',
            onOk: async () => {
                try {
                    await API_SERVICE.delete(`/video/${video.id}`);
                    message.success('Видео удалено');
                    navigate(VIDEO_ROUTE);
                } catch (e) {
                    message.error('Ошибка при удалении видео', e);
                }
            },
        });
    };

    const handleSave = async () => {
        const formData = new FormData();
        formData.append('description', description);
        if (fileList[0]) {
            formData.append('file', fileList[0].originFileObj);
        }

        try {
            await API_SERVICE.patchFormData(`/video/${video.id}`, formData);
            message.success('Видео обновлено');
            setEditing(false);

        } catch (e) {
            message.error('Ошибка при обновлении');
        }
    };

    return (
        <Card style={{ marginBottom: 24 }}>
            <Row gutter={[24, 24]}>
                {/* Левая колонка — видео */}
                <Col xs={24} md={12}>
                    <CardVideo video={video} key={video?.id} isBigVideo={true} />
                    <Space style={{ marginTop: 12 }}>
                        <Button
                            className="custom-btn custom-btn-primary"
                            onClick={handleEditClick}
                        >
                            Изменить
                        </Button>
                        <Button
                            className="custom-btn custom-btn-danger"
                            onClick={handleDeleteClick}
                        >
                            Удалить
                        </Button>
                    </Space>
                </Col>

                {/* Правая колонка — эксперименты */}
                <Col xs={24} md={12}>
                    <Title level={4}>Связанные эксперименты</Title>
                    {video.videoExperiments?.length > 0 ? (
                        <ListExperiments
                            experiments={video.videoExperiments.map((ve) => ve.experiment)}
                        />
                    ) : (
                        <Alert
                            type="info"
                            showIcon
                            message="Это видео пока не связано с экспериментами"
                        />
                    )}
                </Col>
            </Row>

            {/* Модалка редактирования */}
            <Modal
                open={editing}
                title="Редактировать видео"
                onCancel={() => setEditing(false)}
                onOk={handleSave}
                okText="Сохранить"
                cancelText="Отмена"
            >
                <p>
                    <strong>Описание:</strong>
                </p>
                <textarea
                    style={{ width: '100%', minHeight: 80 }}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <p style={{ marginTop: 12 }}>
                    <strong>Заменить файл видео:</strong>
                </p>
                <Upload
                    beforeUpload={() => false}
                    maxCount={1}
                    fileList={fileList}
                    onChange={({ fileList }) => setFileList(fileList)}
                >
                    <Button icon={<UploadOutlined />}>Выбрать файл</Button>
                </Upload>
            </Modal>
        </Card>
    );
};

export default CardVideoExperiments;
