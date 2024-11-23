import { NavLink } from "react-router-dom";
import ItemCardMetric from "./ItemCardMetric";
import { METRIC_ROUTE } from "../../utils/const";

const CardMetric = (props) => {
    
    const {metrics} = props;
    return (
        <>
            {console.log(metrics)}
            <NavLink to={METRIC_ROUTE}><h2>Метрики</h2></NavLink>
            {metrics.map(metric =>(
                <ItemCardMetric metric={metric}/>
            ))}
        </>
    )
}

export default CardMetric;