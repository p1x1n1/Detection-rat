import { Button, Space, Segmented } from "antd";
import { useNavigate } from "react-router-dom";
import { EXPERIMENT_ROUTE_ADD } from "../../utils/const";

const TabsExperiment = ({ onFilterChange, onRefresh }) => {
    const navigate = useNavigate();

    return (
        <>
            <div className="experiment-header">
                <h2>Эксперименты</h2>
                <Space>
                    <Segmented
                        options={["Все", "Активные", "Завершённые"]}
                        onChange={(val) => onFilterChange(val)}
                    />
                    <Button onClick={onRefresh} className="custom-btn">Обновить</Button>
                    <Button className="custom-btn custom-btn-primary" onClick={() => navigate(EXPERIMENT_ROUTE_ADD)}>
                        Добавить эксперимент
                    </Button>
                </Space>
            </div>
        </>
    );
};

export default TabsExperiment;
