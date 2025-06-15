// pages/ProfilePage.jsx

import React, { useContext, useState, useEffect } from "react";
import "./css/Profile.css";
import {
    Card,
    Button,
    Typography,
    Descriptions,
    Avatar,
    Tag,
    Form,
    Input,
    Upload,
    message,
    Space,
    Row,
    Col,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { Context } from "../index";
import { useNavigate } from "react-router-dom";
import {
    LOGIN_ROUTE,
    EXPERIMENT_ROUTE,
    VIDEO_ROUTE,
    LAB_ANIMAL_ROUTE,
} from "../utils/const";
import dayjs from "dayjs";
import { API_SERVICE } from "../service/api.service";
import { BASE_URL } from "../App";

const { Title, Text } = Typography;

const ProfilePage = () => {
    const { user } = useContext(Context);
    const navigate = useNavigate();
    const [editMode, setEditMode] = useState(false);
    const [form] = Form.useForm();

    const [previewImage, setPreviewImage] = useState(user.user?.imagePath || null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileList, setFileList] = useState([]);

    const [expCount, setExpCount] = useState(0);
    const [videoCount, setVideoCount] = useState(0);
    const [animalCount, setAnimalCount] = useState(0);

    const u = user.user;

    const fetchUserExperiments = async () => {
        try {
            const experiments = await API_SERVICE.get("/experiment");
            const videos = await API_SERVICE.get("/video");
            const labAnimals = await API_SERVICE.get("/lab-animal");

            setExpCount(experiments.length);
            setVideoCount(videos.length);
            setAnimalCount(labAnimals.length);
        } catch (err) {
            console.error("Ошибка при получении данных пользователя:", err);
        }

    };


    useEffect(() => {
        if (u) {
            form.setFieldsValue({
                email: u.email,
                name: u.name,
                firstname: u.firstname,
                lastname: u.lastname,
                phone: u.phone,
            });
            setPreviewImage(previewImage);
            setFileList([]);
            setSelectedFile(null);
            fetchUserExperiments();
        }
    }, [u, form]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        user.setUser(null);
        user.setIsAuth(false);
        navigate(LOGIN_ROUTE);
    };

    const startEdit = () => setEditMode(true);
    const cancelEdit = () => {
        form.resetFields();
        setPreviewImage(previewImage);
        setFileList([]);
        setSelectedFile(null);
        setEditMode(false);
    };

    const onSave = async () => {
        try {
            const values = await form.validateFields();
            const fd = new FormData();
            fd.append("email", values.email || "");
            fd.append("name", values.name || "");
            fd.append("firstname", values.firstname || "");
            fd.append("lastname", values.lastname || "");
            fd.append("phone", values.phone || "");

            // важно — именно "image"
            if (selectedFile) {
                fd.append("image", selectedFile);
            }

            // если нужно — можно явно прокинуть headers
            const { data } = await API_SERVICE.patchFormData(
                `/users/${u.login}`,
                fd
            );

            user.setUser(data);
            message.success("Профиль сохранён");
            setEditMode(false);
        } catch (err) {
            console.error(err);
            message.error("Не удалось сохранить профиль");
        }
    };


    const handleImageChange = (info) => {
        const file = info.file.originFileObj;
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreviewImage(reader.result);
            reader.readAsDataURL(file);
        }
        setFileList(info.fileList.slice(-1));
    };

    if (!u) {
        return (
            <div className="profile-container">
                <Card className="card profile-card">
                    <Text type="danger">Пользователь не найден</Text>
                </Card>
            </div>
        );
    }

    return (
        <div className="profile-container">
            <Row gutter={24}>
                {/* левая колонка: профиль */}
                <Col xs={24} md={16}>
                    <Card className="card profile-card">
                        <div className="profile-header">
                            <Avatar src={u.imagePath ? `${BASE_URL}${u.imagePath}` : previewImage} className="profile-avatar" />
                            <div className="profile-info">
                                <Title level={2}>
                                    {u.name} {u.firstname} {u.lastname}
                                </Title>
                                <Tag
                                    className="status-tag"
                                    color={u.role?.name ? "blue" : "gray"}>
                                    {u.role?.name || "Роль не указана"}
                                </Tag>
                            </div>
                        </div>

                        {editMode ? (
                            <Form form={form} layout="vertical" className="profile-form">
                                <Form.Item
                                    label="Email"
                                    name="email"
                                    rules={[{ type: "email" }]}
                                >
                                    <Input className="custom-input" />
                                </Form.Item>
                                <Form.Item
                                    label="Имя"
                                    name="name"
                                    rules={[{ required: true, message: "Введите имя" }]}
                                >
                                    <Input className="custom-input" />
                                </Form.Item>
                                <Form.Item label="Отчество" name="firstname">
                                    <Input className="custom-input" />
                                </Form.Item>
                                <Form.Item
                                    label="Фамилия"
                                    name="lastname"
                                    rules={[{ required: true, message: "Введите фамилию" }]}
                                >
                                    <Input className="custom-input" />
                                </Form.Item>
                                <Form.Item label="Телефон" name="phone">
                                    <Input className="custom-input" />
                                </Form.Item>

                                <Form.Item label="Аватар">
                                    <Upload
                                        beforeUpload={() => false}
                                        onChange={handleImageChange}
                                        fileList={fileList}
                                        accept="image/*"
                                        listType="picture"
                                        maxCount={1}
                                    >
                                        <Button className="custom-btn custom-btn-primary" icon={<UploadOutlined />}>
                                            Выбрать файл
                                        </Button>
                                    </Upload>
                                    {previewImage && (
                                        <img
                                            src={previewImage}
                                            alt="Предпросмотр аватара"
                                            style={{
                                                marginTop: 12,
                                                maxHeight: 128,
                                                borderRadius: "50%",
                                            }}
                                        />
                                    )}
                                </Form.Item>
                            </Form>
                        ) : (
                            <Descriptions column={1} bordered className="profile-descriptions">
                                <Descriptions.Item label="Логин">{u.login}</Descriptions.Item>
                                <Descriptions.Item label="Email">{u.email}</Descriptions.Item>
                                <Descriptions.Item label="Имя">{u.name}</Descriptions.Item>
                                <Descriptions.Item label="Отчество">{u.firstname}</Descriptions.Item>
                                <Descriptions.Item label="Фамилия">{u.lastname}</Descriptions.Item>
                                <Descriptions.Item label="Телефон">{u.phone}</Descriptions.Item>
                                <Descriptions.Item label="Дата создания">
                                    {dayjs(u.createdAt).format("DD.MM.YYYY HH:mm")}
                                </Descriptions.Item>
                                <Descriptions.Item label="Последнее обновление">
                                    {dayjs(u.updatedAt).format("DD.MM.YYYY HH:mm")}
                                </Descriptions.Item>
                            </Descriptions>
                        )}

                        <Space className="profile-actions">
                            {editMode ? (
                                <>
                                    <Button className="custom-btn" onClick={cancelEdit}>Отмена</Button>
                                    <Button
                                        className="custom-btn custom-btn-primary"
                                        onClick={onSave}
                                    >
                                        Сохранить
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        className="custom-btn custom-btn-primary"
                                        onClick={startEdit}
                                    >
                                        Редактировать
                                    </Button>
                                    <Button className="custom-btn custom-btn-danger" onClick={handleLogout}>
                                        Выйти
                                    </Button>
                                </>
                            )}
                        </Space>
                    </Card>
                </Col>

                {/* правая колонка: карточки */}
                <Col xs={24} md={8}>
                    <Space direction="vertical" size="large" style={{ width: "100%" }}>
                        <Card
                            hoverable
                            className="card stat-card"
                            onClick={() => navigate(EXPERIMENT_ROUTE)}
                        >
                            <Text>Эксперименты</Text>
                            <Title level={3}>{expCount}</Title>
                        </Card>
                        <Card
                            hoverable
                            className="card stat-card"
                            onClick={() => navigate(VIDEO_ROUTE)}
                        >
                            <Text>Видео</Text>
                            <Title level={3}>{videoCount}</Title>
                        </Card>
                        <Card
                            hoverable
                            className="card stat-card"
                            onClick={() => navigate(LAB_ANIMAL_ROUTE)}
                        >
                            <Text>Животные</Text>
                            <Title level={3}>{animalCount}</Title>
                        </Card>
                    </Space>
                </Col>
            </Row>
        </div>
    );
};

export default ProfilePage;
