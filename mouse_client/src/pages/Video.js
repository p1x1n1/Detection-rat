import { Button,  Col, Row} from "antd";
import { useNavigate } from "react-router-dom";
import { VIDEO_REPORT_ROUTE } from "../utils/const";
import CardVideoExperiemens from "../components/Video/CardVideoExperiements";

const Video = () =>{
    const video = [
    {   id: 1,
        filename: 'url(https://drive.google.com/file/d/1SRuukvckhBkjm0nFyk-3kFLRqXBTjDLK/view?usp=sharing)',
        createdAt:'2024-09-15 9:00',
        title: 'Rat',
        description: 'A video of a rat playing',
        experiments:
            [
                {id: 1, title: 'Experiment 1', description: 'Rat experiment 1',  status: {
                    id: 1,
                    title: 'success',
                }, createdAt: '2024-09-15 9:00'},
                {id: 2, title: 'Experiment 2', description: 'Rat experiment 2',  status: {
                    id: 1,
                    title: 'success',
                },createdAt: '2024-09-15 10:00'},
                {id: 3, title: 'Experiment 3', description: 'Rat experiment 3',  status: {
                    id: 1,
                    title: 'success',
                },createdAt: '2024-09-15 11:00'},
            ]
        
    },
    {   id: 2,
        filename: 'url(https://drive.google.com/file/d/1SRuukvckhBkjm0nFyk-3kFLRqXBTjDLK/view?usp=sharing)',
        createdAt:'2024-09-15 9:00',
        title: 'Rat',
        description: 'A video of a rat playing',
        experiments:
            [
                {id: 1, title: 'Experiment 1', description: 'Rat experiment 1',  status: {
                    id: 1,
                    title: 'success',
                }, createdAt: '2024-09-15 9:00'},
                {id: 2, title: 'Experiment 2', description: 'Rat experiment 2',  status: {
                    id: 1,
                    title: 'success',
                },createdAt: '2024-09-15 10:00'},
                {id: 3, title: 'Experiment 3', description: 'Rat experiment 3',  status: {
                    id: 1,
                    title: 'success',
                },createdAt: '2024-09-15 11:00'},
            ]
        
    },
    {   id: 3,
        filename: 'url(https://drive.google.com/file/d/1SRuukvckhBkjm0nFyk-3kFLRqXBTjDLK/view?usp=sharing)',
        createdAt:'2024-09-15 9:00',
        title: 'Rat',
        description: 'A video of a rat playing',
        experiments:
            [
                {id: 1, title: 'Experiment 1', description: 'Rat experiment 1',  status: {
                    id: 1,
                    title: 'success',
                }, createdAt: '2024-09-15 9:00'},
                {id: 2, title: 'Experiment 2', description: 'Rat experiment 2',  status: {
                    id: 1,
                    title: 'success',
                },createdAt: '2024-09-15 10:00'},
                {id: 3, title: 'Experiment 3', description: 'Rat experiment 3',  status: {
                    id: 1,
                    title: 'success',
                },createdAt: '2024-09-15 11:00'},
            ]
        
    },
    ]

    const navigate = useNavigate();

    const handleUploadClick = () => {
        navigate(VIDEO_REPORT_ROUTE); // Маршрут на страницу загрузки видео
    };
    

    return (
        <>
            <Row justify="space-between" align="middle" style={{ marginBottom: '20px' }}>
                <Button type="primary" onClick={handleUploadClick}>
                    Загрузить видео
                </Button>
            </Row>
            <Row gutter={[16, 16]}>
               
                    {
                        video.map((video, index) => 
                            <Col span='8'>
                                <CardVideoExperiemens video={video}/>
                           </Col>
                    )}
               
            </Row>
           
        </>
    )
}

export default Video;