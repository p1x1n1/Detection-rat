import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Context } from '../index';
import {
  LOGIN_ROUTE,
  METRIC_ROUTE,
  VIDEO_ROUTE,
  EXPERIMENT_ROUTE,
  LAB_ANIMAL_ROUTE,
  PROFILE_ROUTE,
  USER_GUIDE_ROUTE,
} from '../utils/const';
import { Avatar, Dropdown, Menu } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { BASE_URL } from '../App';
import './css/Navbar.css';

const NavBar = () => {
  const { user } = useContext(Context);
  const navigate = useNavigate();

  const logOut = () => {
    user.setUser({});
    user.setIsAuth(false);
    navigate(LOGIN_ROUTE);
  };

  const profileMenu = (
    <Menu>
      <Menu.Item key="profile" onClick={() => navigate(PROFILE_ROUTE)}>
        Перейти в профиль
      </Menu.Item>
      <Menu.Item key="logout" onClick={logOut}>
        Выйти
      </Menu.Item>
    </Menu>
  );

  return (
    <header className="navbar">
      <div
        className="navbar__logo"
        onClick={() => navigate(USER_GUIDE_ROUTE)}
      >
        Лаборатория
        <img src="/mouse.png" alt="Эксперименты" className="navbar__icon-img" />
      </div>

      <nav className="navbar__nav">
        <ul className="navbar__list">
          {user.isAuth && (
            <>
              <li className="navbar__item">
                <NavLink
                  to={EXPERIMENT_ROUTE}
                  className={({ isActive }) =>
                    `navbar__link${isActive ? ' navbar__link__active' : ''}`
                  }
                >
                  Эксперименты
                  <img src="/test.png" alt="Эксперименты" className="navbar__icon-img" />
                </NavLink>
              </li>
              <li className="navbar__item">
                <NavLink
                  to={VIDEO_ROUTE}
                  className={({ isActive }) =>
                    `navbar__link${isActive ? ' navbar__link__active' : ''}`
                  }
                >
                  Видео
                  <img src="/mouse.png" alt="Эксперименты" className="navbar__icon-img" />
                </NavLink>
              </li>
              <li className="navbar__item">
                <NavLink
                  to={METRIC_ROUTE}
                  className={({ isActive }) =>
                    `navbar__link${isActive ? ' navbar__link__active' : ''}`
                  }
                >
                  Показатели
                  <img src="/lab-test.png" alt="Эксперименты" className="navbar__icon-img" />
                </NavLink>
              </li>
              <li className="navbar__item">
                <NavLink
                  to={LAB_ANIMAL_ROUTE}
                  className={({ isActive }) =>
                    `navbar__link${isActive ? ' navbar__link__active' : ''}`
                  }
                >
                  Животные
                  <img src="/rat-1.png" alt="Эксперименты" className="navbar__icon-img" />
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </nav>

      <div className="navbar__actions">
        {user.isAuth ? (
          <Dropdown overlay={profileMenu} trigger={['click']}>
            <Avatar
              src={user.user?.imagePath ? `${BASE_URL}${user.user.imagePath}` : undefined}
              className="navbar__avatar"
              icon={<UserOutlined />}
            />
          </Dropdown>
        ) : (
          <NavLink
            to={LOGIN_ROUTE}
            className={({ isActive }) =>
              `navbar__btn navbar__btn--login${isActive ? ' navbar__link__active' : ''}`
            }
          >
            Войти
          </NavLink>
        )}
      </div>
    </header>
  );
};

export default NavBar;
