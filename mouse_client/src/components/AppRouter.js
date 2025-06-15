import React, { useContext } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { authRoutes, publicRoutes } from "../utils/routes";
import { Context } from "../index";
import { observer } from "mobx-react-lite";
import { Container} from 'react-bootstrap';
import { USER_GUIDE_ROUTE } from '../utils/const';

const AppRouter = observer(() => {
    const { user } = useContext(Context);
    console.log('user', user.user, 'userIsAuth', user.isAuth);

    return (
        <Container fluid>
            <Routes>
                {user.isAuth && authRoutes.map(({ path, component: Component }) => (
                    <Route key={path} path={path} element={Component} />
                ))}
                {publicRoutes.map(({ path, component: Component }) => (
                    <Route key={path} path={path} element={Component} />
                ))}
                <Route path="*" element={<Navigate to={USER_GUIDE_ROUTE} replace={true} />} />
            </Routes>
        </Container>
    );
});

export default AppRouter;
