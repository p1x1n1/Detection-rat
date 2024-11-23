import CardVideo from "./CardVideo";
import ListExperiments from "../Experiment/ListExperiments";
import { Button, Card, Space } from "antd";
import { VIDEO_REPORT_ROUTE, VIDEO_ROUTE } from "../../utils/const";
import { useNavigate } from "react-router-dom";


const CardVideoExperiemens = ({video}) =>{
    const navigate = useNavigate();
    const handleVideoClick = (e) => {
        e.stopPropagation(); // Останавливаем событие, чтобы основной клик не срабатывал
        navigate(VIDEO_ROUTE); // Переход на страницу видео
    };
    const handleEditClick = (id) => {
        console.log(`Edit video with id ${id}`);
        // Логика для редактирования видео
    };

    const handleDeleteClick = (id) => {
        console.log(`Delete video with id ${id}`);
        // Логика для удаления видео
    };

    return <>
    <Card onClick={handleVideoClick}>
        <CardVideo video={video}/>
        {/* Кнопки Изменить и Удалить */}
        <Space style={{ marginTop: '10px' }}>
            <Button type="primary" onClick={() => handleEditClick(video.id)}>
            Изменить
            </Button>
            <Button type="danger" onClick={() => handleDeleteClick(video.id)}>
            Удалить
            </Button>
        </Space>
        <h2>Связанные эксперименты</h2>
        <ListExperiments experiments={video.experiments} />
    </Card>
    </>
}

export default CardVideoExperiemens;