import { Button, message } from "antd";

import { BASE_URL } from "../../App";

const VideoDownloadButton = ({ filenameResult, experimentName, videoName, buttonName }) => {
    return (
        <Button type="custom-btn custom-btn-success"
            onClick={async () => {
                try {
                    const response = await fetch(`${BASE_URL}${filenameResult}`);
                    if (!response.ok) throw new Error('Ошибка при скачивании');

                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);

                    // 🧠 Формируем имя файла
                    const safeExpName = (experimentName || 'experiment').replace(/\s+/g, '_');
                    const safeVideoName = (videoName + "-result" || "video-result").replace(/\s+/g, '_');
                    const fileExt = filenameResult.split('.').pop() || 'mp4';

                    const fileName = `${safeExpName}_${safeVideoName}.${fileExt}`;

                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;
                    a.style.display = 'none';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                } catch (error) {
                    message.error('Не удалось скачать видео');
                    console.error(error);
                }
            }}
        >
            {buttonName}
        </Button>
    )
};

export default VideoDownloadButton;