import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {Container, Nav, Navbar} from 'react-bootstrap';
import {Button} from 'antd';
import { LOGIN_ROUTE, FORM_ROUTE, METRIC_ROUTE, VIDEO_ROUTE, VIDEO_REPORT_ROUTE, EXPERIMENT_ROUTE } from "../utils/const";
// import { Context } from "../index";
import './css/Navbar.css';

const NavBar = () =>{
    // const {user} = useContext(Context);
    const user = {isAuth:true}
    const navigate = useNavigate();

    const logOut = () => {
    //     user.setUser({});
        // user.setIsAuth(false);
        navigate(LOGIN_ROUTE);
    };

    return (
        <Navbar>
            
                <Container fluid>
                <Navbar.Collapse>
                    
                    {user.isAuth ? 
                        <Nav className='navbar'>
                            <NavLink className="nav-link" to={EXPERIMENT_ROUTE}>Эксперименты</NavLink>
                            <NavLink className="nav-link" to={VIDEO_ROUTE}>Видео</NavLink>
                            <NavLink className="nav-link" to={METRIC_ROUTE}>Метрики</NavLink>
                            <Button className="logout-button" onClick={logOut}>Выйти</Button>
                        </Nav> :
                        <Nav.Link to={LOGIN_ROUTE}>Войти</Nav.Link>
                    }
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default NavBar;
