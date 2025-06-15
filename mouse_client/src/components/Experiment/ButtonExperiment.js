import { Button, Col, message, Row } from "antd";
import { API_SERVICE } from "../../service/api.service";
import { useNavigate } from "react-router-dom";

const ButtonExperiment = ({ experiment, onRefresh }) => {
    const navigate = useNavigate();

    const handleStartAnalysis = async () => {
        try {
            const response = await API_SERVICE.get(`/experiment/analyze/${experiment.id}`);
            message.success("Анализ запущен");
            console.log("Анализ инициирован:", response);
        } catch (error) {
            console.error("Ошибка при запуске анализа:", error);
            message.error("Ошибка при запуске анализа");
        }
        onRefresh();
    };

    const statusTitle = experiment.status?.statusName || "";

    const canStartAnalysis = statusTitle === "Создан";
    const canStopAnalysis = statusTitle === "Анализ";
    const canGenerateReport =
        statusTitle === "Успешно завершено" || statusTitle === "Частично успешно";

    return (
        <>
            <Row gutter={[16, 16]} justify="start" style={{ marginTop: 16 }}>
                { (canGenerateReport || canStartAnalysis) && <Col>
                    <Button
                        className="custom-btn custom-btn-primary"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleStartAnalysis();
                        }}
                    >
                        {canStartAnalysis && `Начать `}
                        {canGenerateReport && `Повторить `}
                        интеллектуальный анализ
                    </Button>
                </Col>}

                {canGenerateReport && (
                    <Col>
                        <Button
                            className="custom-btn custom-btn-primary"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/experiment/${experiment.id}/report`);
                            }}
                        >
                            Сформировать отчёт
                        </Button>
                    </Col>
                )}

                {canStopAnalysis && (
                    <Col>
                        <Button
                            className="custom-btn custom-btn-primary"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/experiment/${experiment.id}/report`);
                            }}
                        >
                            Прекратить анализ
                        </Button>
                    </Col>
                )}
            </Row>
        </>
    );
};

export default ButtonExperiment;
