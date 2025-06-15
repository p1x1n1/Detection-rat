import { getStatusColorVar } from "../../App";
import { Card, Table, Tag, Modal, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { EXPERIMENT_ROUTE } from "../../utils/const";
import { useState } from "react";

const { Text, Paragraph } = Typography;

const ListExperiments = ({ experiments }) => {
    const navigate = useNavigate();
    const [selectedExp, setSelectedExp] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const openModal = (record) => {
        setSelectedExp(record);
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setSelectedExp(null);
    };
    const columns = [
        {
            title: "Название",
            dataIndex: "name",
            key: "name",
            render: (text) => <strong>{text}</strong>,
        },
        {
            title: "Описание",
            dataIndex: "description",
            key: "description",
            render: (text) => text || <i>Без описания</i>,
        },
        {
            title: "Статус",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag
                    className="status-tag"
                    style={{ backgroundColor: getStatusColorVar(status?.statusName) }}
                >
                    {status?.statusName || "Без статуса"}
                </Tag>

            ),
        },
    ];


    return (
        <>
            <Card
                className="card"
                style={{
                    borderRadius: "var(--radius)",
                    padding: "var(--spacing)",
                    marginTop: "var(--spacing)",
                }}
            >
                <Table
                    columns={columns}
                    dataSource={experiments}
                    pagination={false}
                    rowKey="id"
                    size="small"
                    bordered
                    onRow={(record) => ({
                        onClick: () => navigate(`${EXPERIMENT_ROUTE}/${record.id}`),
                        onDoubleClick: () => openModal(record),
                        style: { cursor: "pointer" },
                    })}
                />
            </Card>

            {/* Модальное окно по double click */}
            <Modal
                open={modalVisible}
                title={selectedExp?.name}
                onCancel={closeModal}
                footer={null}
                bodyStyle={{
                    backgroundColor: "var(--color-white)",
                    color: "var(--color-text)",
                    padding: "var(--spacing)",
                }}
                style={{
                    borderRadius: "var(--radius)",
                }}
            >
                {selectedExp && (
                    <>
                        <Paragraph>
                            <Text strong>Описание:</Text> {selectedExp.description || "–"}
                        </Paragraph>
                        <Paragraph>
                            <Text strong>Статус:</Text>{" "}
                            <Tag color={selectedExp.status === "active" ? "blue" : "green"}>
                                {selectedExp.status === "active" ? "Активно" : "Завершено"}
                            </Tag>
                        </Paragraph>
                        <Paragraph>
                            <Text strong>Комментарий:</Text>{" "}
                            {selectedExp.comment || "–"}
                        </Paragraph>
                    </>
                )}
            </Modal>
        </>
    );
};

export default ListExperiments;
