import { LOGIN_ROUTE, FORM_ROUTE, METRIC_ROUTE, VIDEO_ROUTE, VIDEO_REPORT_ROUTE, EXPERIMENT_ROUTE, EXPERIMENT_ROUTE_ADD, PROFILE_ROUTE, LAB_ANIMAL_ROUTE, USER_GUIDE_ROUTE } from "./const";
import Auth from '../pages/Auth'; // Импорт компонента Auth
// import Registration from '../pages/Registration'; // Импорт компонента Registration
import Form from '../pages/Form'; // Импорт компонента Form
import Metric from '../pages/Metric'; // Импорт компонента Metric
import Video from '../pages/Video'; // Импорт компонента Video
import UploadVideoForm from '../pages/UploadVideoForm';
import Experiment from "../pages/Experiment";
import AddExperiment from "../components/Experiment/AddExperiment";
import OneExperiment from "../pages/oneExperiment";
import ReportExperimentPage from "../pages/ReportExperiment";
import ProfilePage from "../pages/Profile";
import LabAnimalsPage from "../pages/LabAnimal";
import OneVideo from "../components/Video/OneVideo";
import UserGuide from "../pages/user-guide/user-guide";


export const publicRoutes = [
    {
        path: LOGIN_ROUTE,
        component: <Auth />
    },
    {
        path: USER_GUIDE_ROUTE,
        component: < UserGuide />
    }
];

export const authRoutes = [
    {
        path: FORM_ROUTE,
        component: <Form />
    },
    {
        path: METRIC_ROUTE,
        component: <Metric />
    },
    {
        path: EXPERIMENT_ROUTE,
        component: <Experiment />
    },
    {
        path: EXPERIMENT_ROUTE + '/:id',
        component: <OneExperiment />
    },
    {
        path: EXPERIMENT_ROUTE + '/:id' + '/report',
        component: < ReportExperimentPage />
    },
    {
        path: EXPERIMENT_ROUTE_ADD,
        component: <AddExperiment />
    },
    {
        path: VIDEO_REPORT_ROUTE,
        component: <UploadVideoForm />
    },
    {
        path: VIDEO_ROUTE,
        component: <Video />
    },
    {
        path: VIDEO_ROUTE + '/:id',
        component: <OneVideo />
    },
    {
        path: PROFILE_ROUTE,
        component: <ProfilePage />
    },
    {
        path: LAB_ANIMAL_ROUTE,
        component: <LabAnimalsPage />
    }
];
