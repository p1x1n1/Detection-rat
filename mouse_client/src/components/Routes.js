import { LOGIN_ROUTE, REGISTRATION_ROUTE, FORM_ROUTE, METRIC_ROUTE, VIDEO_ROUTE, VIDEO_REPORT_ROUTE, EXPERIMENT_ROUTE, EXPERIMENT_ROUTE_ADD } from "../utils/const";
import Login from '../pages/Login'; // Импорт компонента Login
import Registration from '../pages/Registration'; // Импорт компонента Registration
import Form from '../pages/Form'; // Импорт компонента Form
import Metric from '../pages/Metric'; // Импорт компонента Metric
import Video from '../pages/Video'; // Импорт компонента Video
import VideoReport from '../pages/VideoReport'; // Импорт компонента VideoReport
import Experiment from "../pages/Experiment";
import AddExperiment from "./Experiment/AddExperiment";
import OneExperiment from "../pages/oneExperiment";


export const authRoutes = [
    {
        path: LOGIN_ROUTE,
        component: <Login/>
    },
    {
        path: REGISTRATION_ROUTE,
        component: <Registration/>
    }
];

export const publicRoutes = [
    {
        path: FORM_ROUTE,
        component: <Form/>
    },
    {
        path: METRIC_ROUTE,
        component: <Metric/>
    },
    {
        path: EXPERIMENT_ROUTE,
        component: <Experiment/>
    },
    {
        path: EXPERIMENT_ROUTE+'/:id',
        component: <OneExperiment/>
    },
    {
        path: EXPERIMENT_ROUTE_ADD,
        component: <AddExperiment/>
    },
    {
        path: VIDEO_REPORT_ROUTE,
        component: <VideoReport/>
    },
    {
        path: VIDEO_ROUTE,
        component: <Video/>
    }
];
