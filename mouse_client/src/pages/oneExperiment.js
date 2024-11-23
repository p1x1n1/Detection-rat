import { useNavigate } from "react-router-dom";
import CardExperiment from "../components/Experiment/CardExperiment";


const OneExperiment = () => {
    const navigate = useNavigate();
    const experiment =   {
        title: "Experiment #1",
        description: "###########################1",
        video:
            {   id: 1,
                filename: '../static/rat.mp4',
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
        }
        return (
        <>
            <CardExperiment experiment={experiment}/>
        </>
        )
    
}

export default OneExperiment; 