import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { message, Spin } from "antd";
import { API_SERVICE } from "../service/api.service";
import CardExperimentDetailed from "../components/Experiment/CardExperimentDetailed";

const OneExperiment = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [experiment, setExperiment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isChanged, setIsChanged] = useState(false);

    const fetchExperiment = async () => {
        setLoading(true);
        try {
            const data = await API_SERVICE.get(`/experiment/${id}`);
            setExperiment(data);
        } catch (error) {
            message.error("Не удалось загрузить эксперимент");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExperiment();
    }, [isChanged]);

    return (
        <>
            {loading ? (
                <div style={{ textAlign: "center", marginTop: 50 }}>
                    <Spin size="large" />
                </div>
            ) : experiment ? (
                <CardExperimentDetailed experiment={experiment} onRefresh={() => setIsChanged(prev => !prev)} />
            ) : (
                <p style={{ textAlign: "center", color: "red" }}>
                    Эксперимент не найден.
                </p>
            )}
        </>
    );
};

export default OneExperiment;
