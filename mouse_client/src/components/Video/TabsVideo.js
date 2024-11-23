import { Button } from "antd";
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VIDEO_REPORT_ROUTE } from "../../utils/const";

const TabsVideo = () => {
    const navigate = useNavigate();
    return (
        <>
            <>  
                <Button onClick={()=> navigate(VIDEO_REPORT_ROUTE)}>Загрузить</Button>
                
            </>
        </>
    )
}
export default TabsVideo;