import React, {useContext} from 'react';
import {Route, Routes, Navigate} from 'react-router-dom';
import {authRoutes, publicRoutes} from "../components/Routes.js";
import {LOGIN_ROUTE} from "../utils/const.js";
// import {Context} from "../index";
import {observer} from "mobx-react-lite";

const AppRouter = observer(() => {
    // const {user} = useContext(Context);
    const {user} = {user:{ isAuth:true}}

    return (
        <div className='Container'>
            <Routes>
                {user.isAuth && authRoutes.map(({path, component}) =>
                    <Route key={path} path={path} element={component} />
                )}
                {publicRoutes.map(({path, component}) =>
                    <Route key={path} path={path} element={component} />
                )}
                {user.isAuth ? 
                    <Route path="*" element={<Navigate to={'/'} replace={true} />} /> :
                    <Route path="*" element={<Navigate to={'/'} replace={true} />} />
                }
            </Routes>
        </div>
    );
});

export default AppRouter;
