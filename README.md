# Detection-rat

Состоит клиентская часть react, серверная состоит из двух сервисов один на NestJs другой на Python 

Запуск клиента 
```
cd mouse_client
npm run start
```

Запуск сервера взаимодействия с  пользователем
```
cd mouse_server_user_service\lab-service
npm run start:dev
```

```
cd mouse_server_user_service\video-service
.\venv\Scripts\Activate.ps1
python .\consumer.py
```