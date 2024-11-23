import { Button, Checkbox, Space, Table } from "antd";
import CardExperiment from "../components/Experiment/CardExperiment";
import TabsExperiment from "../components/Experiment/TabsExperiment";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { EXPERIMENT_ROUTE } from "../utils/const";

const Experiment = () => {
    const [selectedRowKeys, setSelectedRowKeys] = useState([]); // Состояние для выбранных строк таблицы для изменения в db
    const navigate = useNavigate();
    const experiments = [
        {
        id:1,
        title: "Experiment #1",
        description: "###########################1",
        video:
            {   id: 1,
                filename: 'url(https://drive.google.com/file/d/1SRuukvckhBkjm0nFyk-3kFLRqXBTjDLK/view?usp=sharing)',
                createdAt:'2024-09-15 9:00',
            },
        status: {
            id: 1,
            title: 'success',
        },
        processedAt:'2024-09-15 10:00',
        metricExperiment: [
        {
            metric:{
                id: 1,
                title: 'Количество пересечённых линий',
            },
            value: 0,
            result_value: 10,
            comment: "Пересёк 10"
        },
        {
            metric:{
                id: 2,
                title: 'Количество пересечённых горизонтальных линий',
            },
            value: 0,
            result_value: 6,
            comment: "Пересёк 6"
        },
            
        ]
        },
        {
            id:3,
            title: "Experiment #3",
            description: "###########################1",
            video:
                {   id: 1,
                    filename: 'url(https://drive.google.com/file/d/1SRuukvckhBkjm0nFyk-3kFLRqXBTjDLK/view?usp=sharing)',
                    createdAt:'2024-09-15 9:00',
                },
            status: {
                id: 2,
                title: 'in proccess',
            },
            processedAt:'2024-09-15 10:00',
            metricExperiment: [
            {
                metric:{
                    id: 1,
                    title: 'Количество пересечённых линий',
                },
                value: 0,
                result_value: 10,
                comment: "Пересёк 10"
            },
            {
                metric:{
                    id: 2,
                    title: 'Количество пересечённых горизонтальных линий',
                },
                value: 0,
                result_value: 6,
                comment: "Пересёк 6"
            },
                
            ]
            },
            {
                id:2,
                title: "Experiment #2",
                description: "###########################1",
                video:
                    {   id: 1,
                        filename: 'url(https://drive.google.com/file/d/1SRuukvckhBkjm0nFyk-3kFLRqXBTjDLK/view?usp=sharing)',
                        createdAt:'2024-09-15 9:00',
                    },
                status: {
                    id: 1,
                    title: 'error',
                },
                processedAt:'2024-09-15 10:00',
                metricExperiment: [
                {
                    metric:{
                        id: 1,
                        title: 'Количество пересечённых линий',
                    },
                    value: 0,
                    result_value: 10,
                    comment: "Пересёк 10"
                },
                {
                    metric:{
                        id: 2,
                        title: 'Количество пересечённых горизонтальных линий',
                    },
                    value: 0,
                    result_value: 6,
                    comment: "Пересёк 6"
                },
                    
                ]
                },

    ];
    //Table
    //Колонки для таблицы экспериментов
    const columns = [
        {
            title: 'Эксперимент',
            dataIndex: 'experiment',
            key: 'experiment',
            render: (_, record) => (
                <div onClick={()=>navigate(EXPERIMENT_ROUTE+'/'+record.id)}>
                    <CardExperiment experiment={record} onClick={(e) => e.stopPropagation()} />
                </div>
               
            ),
        },
    ];
    const rowSelection = {
        selectedRowKeys, // Связь с выбранными строками
        onChange: (newSelectedRowKeys) => {
            console.log('Выбраные строки таблицы: ', newSelectedRowKeys);
            setSelectedRowKeys(newSelectedRowKeys); // Обновление выбранных строк
        },
    };
    // Функция для обработки клика по строке
    const onRowClick = (record) => {
        const selectedKey = record.id;
        const newSelectedRowKeys = selectedRowKeys.includes(selectedKey)
            ? selectedRowKeys.filter(key => key !== selectedKey) // Убираем строку, если она уже выбрана
            : [...selectedRowKeys, selectedKey]; // Добавляем строку, если она не выбрана
        setSelectedRowKeys(newSelectedRowKeys); // Обновление состояния выбранных строк
    };

    //to do this - вынести для каждой карточки, прокинуть сет метод для отслеживания чекбокса конкретной карточки
    const DeleteExp = () => {
        console.log('Удалить выбранные элементы:', selectedRowKeys);
    };


    const EditExp = () => {
        console.log('Изменить выбранные элементы:', selectedRowKeys);
    };



    return (
        <>
            {console.log(experiments)}
            <TabsExperiment/>
            {selectedRowKeys.length > 0 && (
                <Space style={{ marginBottom: 16 }}>
                    <Button onClick={EditExp} type="primary">Изменить</Button>
                    <Button onClick={DeleteExp} type="danger">Удалить</Button>
                </Space>
            )}
            <Table 
                columns={columns} 
                dataSource={experiments} 
                rowKey={record => record.id}
                rowSelection={rowSelection} //checkbox Для выбора строк
                pagination={true} 
                onRow={(record) => ({
                    onClick: () => onRowClick(record), 
                })}
            
            />
        </>
    );
};

export default Experiment;