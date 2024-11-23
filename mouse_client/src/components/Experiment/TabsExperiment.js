import { Button } from "antd";
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EXPERIMENT_ROUTE_ADD } from "../../utils/const";

const TabsExperiment = () => {
    const navigate = useNavigate();
    return (
        <>
            <p>Эксперименты</p>
            <>  
                <Button onClick={()=>navigate(EXPERIMENT_ROUTE_ADD)}>Добавить</Button>
            </>
        </>
    )
}
export default TabsExperiment;