import {makeAutoObservable} from "mobx";
import { ApiService } from "../service/api.service";

const api = new ApiService();
export default class UserStore {
    constructor () {
        this.checkSession(); 
        makeAutoObservable(this)
    }
    
    setIsAuth(bool) {
        this._isAuth = bool
    }

    setUser(user) {
        this._user = user
    }

    get isAuth() {
        return this._isAuth
    }
    get user() {
        return this._user
    }

    async checkSession() {
        const token = localStorage.getItem('token');
        if (token) {
            this.setIsAuth(true);
            try {
                const response = await api.getUserInfo(token); // Используем новый метод
                this.setUser(response); // Устанавливаем пользователя в store
            } catch (error) {
                console.error('Ошибка при получении информации о пользователе', error);
                this.setIsAuth(false);
            }
        } else {
            this.setIsAuth(false);
            this.setUser({});
        }
    }
    

}