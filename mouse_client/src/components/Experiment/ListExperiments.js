import { Card, Table } from "antd";

const ListExperiments = (props) => {
    const {experiments } = props;

    const columns = [
        {
            title : 'Название',
            dataIndex : 'title',
            key : 'title',
        },
        {
            title: 'Описание',
            'dataIndex': 'description',
            'key': 'description',
        },
        {
            title: 'Статус',
            'dataIndex': 'status',
            'key': 'status',
            render: (status) => status === 'active'? 'Активно' : 'Завершено',
        }
    ]
    return(
        <>
               
                <Table 
                columns={columns}
                dataSource={experiments}
                />
        </>
    )
}

export default ListExperiments;