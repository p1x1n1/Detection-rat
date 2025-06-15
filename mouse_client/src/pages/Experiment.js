// pages/Experiment.jsx
import React, { useEffect, useState } from "react";
import {
    Button,
    Modal,
    Space,
    Table,
    Input,
    Select,
    message,
    Empty,
} from "antd";
import CardExperiment from "../components/Experiment/CardExperiment";
import TabsExperiment from "../components/Experiment/TabsExperiment";
import { useNavigate } from "react-router-dom";
import { EXPERIMENT_ROUTE } from "../utils/const";
import { API_SERVICE } from "../service/api.service";
import { getStatusColorVar } from "../App";
import { PlusOutlined } from "@ant-design/icons";

const { Search } = Input;
const { Option } = Select;

const Experiment = () => {
    const [experiments, setExperiments] = useState([]);
    const [filteredExperiments, setFilteredExperiments] = useState([]);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [loading, setLoading] = useState(false);

    const [statusFilter, setStatusFilter] = useState("Все");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortKey, setSortKey] = useState('name');

    const [isChanged, setIsChanged] = useState(false);

    const navigate = useNavigate();

    const fetchExperiments = async () => {
        setLoading(true);
        try {
            const data = await API_SERVICE.get("/experiment");
            const safeData = Array.isArray(data) ? data : [];
            setExperiments(safeData);
        } catch (error) {
            message.error("Ошибка при загрузке экспериментов");
            setExperiments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExperiments();
    }, [isChanged]);

    useEffect(() => {
        let data = [...experiments];

        if (statusFilter !== "Все") {
            const target = statusFilter === "Активные" ? "Анализ" : "Успешно завершено";
            data = data.filter(exp => exp.status?.statusName === target);
        }

        if (searchTerm) {
            data = data.filter(exp =>
                exp.name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (sortKey === "startDate") {
            data.sort((a, b) =>
                new Date(`${a.startDate}T${a.startTime}`) -
                new Date(`${b.startDate}T${b.startTime}`)
            );
        } else if (sortKey === "endDate") {
            data.sort((a, b) =>
                new Date(`${a.endDate}T${a.endTime}`) -
                new Date(`${b.endDate}T${b.endTime}`)
            );
        } else if (sortKey === "status") {
            data.sort((a, b) =>
                (a.status?.statusName || "").localeCompare(b.status?.statusName || "")
            );
        }
        else if (sortKey === "name") {
            data.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        }

        setFilteredExperiments(data);
    }, [experiments, statusFilter, searchTerm, sortKey]);

    const filterByStatus = label => {
        setStatusFilter(label);
    };

    const columns = [
        {
            title: "Эксперименты",
            dataIndex: "experiment",
            key: "experiment",
            render: (_, record) => (
                <div
                    onClick={() => navigate(`${EXPERIMENT_ROUTE}/${record.id}`)}
                    style={{
                        backgroundColor: getStatusColorVar(record.status?.title),
                        borderRadius: "8px",
                        padding: "4px",
                        transition: "background-color 0.3s ease"
                    }}
                >
                    <CardExperiment
                        onRefresh={() => setIsChanged(prev => !prev)}
                        experiment={record} />
                </div>
            ),
        },
    ];

    const rowSelection = {
        selectedRowKeys,
        onChange: setSelectedRowKeys,
    };

    const onRowClick = record => {
        const id = record.id;
        setSelectedRowKeys(prev =>
            prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id]
        );
    };

    const handleDelete = () => {
        const names = experiments
            .filter(exp => selectedRowKeys.includes(exp.id))
            .map(exp => `• ${exp.name}`)
            .join("\n");

        Modal.confirm({
            title: "Удалить эксперименты?",
            content: <pre style={{ whiteSpace: "pre-wrap" }}>{names}</pre>,
            okText: "Удалить",
            okType: "danger",
            cancelText: "Отмена",
            centered: true,
            onOk: async () => {
                try {
                    await Promise.all(
                        selectedRowKeys.map(id =>
                            API_SERVICE.delete(`/experiment/${id}`)
                        )
                    );
                    message.success("Удалены");
                    setSelectedRowKeys([]);
                    fetchExperiments();
                } catch(e) {
                    message.error("Ошибка при удалении");
                    console.log('error', e)
                }
            },
        });
    };

    const handleEdit = () => {
        if (selectedRowKeys.length === 1) {
            navigate(`${EXPERIMENT_ROUTE}/edit/${selectedRowKeys[0]}`);
        } else {
            message.warning("Выберите один эксперимент");
        }
    };

    const EmptyContent = () => (
        <Empty
            description={
                <span style={{ fontSize: "1rem", color: "#666" }}>
                    Эксперименты не найдены
                </span>
            }
        >
            {statusFilter !== "Все" &&
                <Button
                    className="custom-btn custom-btn-primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate(`${EXPERIMENT_ROUTE}/create`)}
                >
                    Создать эксперимент
                </Button>}
        </Empty>
    );


    return (
        <>
            <TabsExperiment
                onFilterChange={filterByStatus}
                onRefresh={fetchExperiments}
            />

            <Space style={{ margin: "16px 0" }}>
                <Search
                    placeholder="Поиск по названию"
                    allowClear
                    onSearch={value => setSearchTerm(value)}
                    style={{ width: 240 }}
                />
                <Select
                    placeholder="Сортировать по"
                    allowClear
                    onChange={value => setSortKey(value)}
                    style={{ width: 200 }}
                >
                    <Option default value="name">Название</Option>
                    <Option value="startDate">Дата проведения</Option>
                    <Option value="endDate">Дата завершения</Option>
                    <Option value="status">Статус</Option>
                </Select>
            </Space>

            {selectedRowKeys.length > 0 && (
                <Space style={{ marginBottom: 16 }}>
                    <Button
                        onClick={handleEdit}
                        className="custom-btn custom-btn-primary"
                    >
                        Изменить
                    </Button>
                    <Button
                        onClick={handleDelete}
                        className="custom-btn custom-btn-danger"
                    >
                        Удалить
                    </Button>
                </Space>
            )}

            <Table
                columns={columns}
                dataSource={filteredExperiments}
                rowKey="id"
                rowSelection={rowSelection}
                loading={loading}
                pagination={{ pageSize: 10 }}
                onRow={record => ({
                    onClick: () => onRowClick(record),
                })}
                locale={{ emptyText: <EmptyContent /> }}
            />
        </>
    );
};

export default Experiment;