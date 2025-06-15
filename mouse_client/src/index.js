import React,{createContext} from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import UserStore from './store/user.store';
import { BrowserRouter } from 'react-router-dom';

export const Context = createContext(null)

if (process.env.NODE_ENV === 'test') {
  const { worker } = require('./tests/mocks/browser');
  worker.start();
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Context.Provider value={
    {
      user: new UserStore(),
    }
   }>
      <BrowserRouter>
        <App />
      </BrowserRouter>
  </Context.Provider>,
);

