import React, { useState, useEffect } from 'react';
import {
  Form, Input, Button, Upload, message, DatePicker, Alert, Select, Checkbox, ConfigProvider,
  Card,
  Image
} from 'antd';
import ruRU from 'antd/es/locale/ru_RU';
import { UploadOutlined, PlusOutlined } from '@ant-design/icons';
import { API_SERVICE } from '../../service/api.service';
import AddAnimalModal from '../Animal/AddAnimalModal';
import '../css/UploadVideoForm.css';
import { BASE_URL } from '../../App';
import Title from 'antd/es/skeleton/Title';

const { TextArea } = Input;
const { Option } = Select;

const UploadVideoForm = ({ addVideo }) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewError, setPreviewError] = useState(false);
  const [labAnimals, setLabAnimals] = useState([]);
  const [selectedLabAnimal, setSelectedLabAnimal] = useState(null);
  const [addAnimalVisible, setAddAnimalVisible] = useState(false);
  const [colors, setColors] = useState([]);

  useEffect(() => {
    fetchAnimals();
    fetchColors();
  }, []);

  const fetchAnimals = async () => {
    try {
      const animals = await API_SERVICE.get('/lab-animal');
      setLabAnimals(Array.isArray(animals) ? animals : []);
    } catch (e) {
      message.error('Ошибка загрузки животных');
    }
  };

  const fetchColors = async () => {
    try {
      const colors = await API_SERVICE.get('/color');
      setColors(colors ?? []);
    } catch (e) {
      message.error('Ошибка загрузки окрасов');
    }
  };

  useEffect(() => {
    if (fileList.length) {
      const url = URL.createObjectURL(fileList[0]);
      setPreviewUrl(url);
      setPreviewError(false);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
      setPreviewError(false);
    }
  }, [fileList]);

  const onFinish = (values) => {
    if (!fileList.length) {
      message.error('Пожалуйста, выберите видео для загрузки.');
      return;
    }

    // if (!selectedLabAnimal) {
    //   message.error('Выберите лабораторное животное.');
    //   return;
    // }

    const formData = new FormData();
    formData.append('name', values.name);
    formData.append('description', values.description || '');
    formData.append('date', values.date.toISOString());
    formData.append('labAnimalId', selectedLabAnimal);
    formData.append('isExperimentAnimal', JSON.stringify(!!values.isExperimentAnimal));
    formData.append('video', fileList[0]);

    addVideo(formData);
    form.resetFields();
    setFileList([]);
    setSelectedLabAnimal(null);
    message.success('Видео успешно загружено!');
  };

  const uploadProps = {
    accept: 'video/*',
    beforeUpload: (file) => {
      setFileList([file]);
      return false;
    },
    onRemove: () => setFileList([]),
    fileList,
  };

  const handleAddAnimal = async (formData) => {
    try {
      const added = await API_SERVICE.postFormData('/lab-animal', formData);
      await fetchAnimals();
      setSelectedLabAnimal(added.id);
      setAddAnimalVisible(false);
      message.success('Животное добавлено');
    } catch (err) {
      message.error('Ошибка при добавлении животного');
    }
  };

  const selectedAnimal = labAnimals.find((a) => a.id === selectedLabAnimal);

  return (
    <ConfigProvider locale={ruRU}>
      <Form className="upload-form" layout="vertical" onFinish={onFinish} form={form}>
        <div className="upload-form__top">
          <div className="upload-form__left">
            <Form.Item
              name="name"
              label="Название"
              rules={[{ required: true, message: 'Введите название видео' }]}
            >
              <Input className="custom-input" placeholder="Например, Видео 1»" />
            </Form.Item>

            <Form.Item name="description" label="Описание">
              <TextArea rows={3} placeholder="Краткое описание видео" className="custom-input" />
            </Form.Item>

            <Form.Item
              name="date"
              label="Дата проведения"
              rules={[{ required: true, message: 'Укажите дату записи' }]}
            >
              <DatePicker className="custom-datepicker" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="Лабораторное животное">
              <Select
                placeholder="Выберите животное"
                allowClear
                value={selectedLabAnimal}
                onChange={setSelectedLabAnimal}
                dropdownRender={(menu) => (
                  <>
                    {menu}
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      style={{ width: '100%', marginTop: 8 }}
                      onClick={() => setAddAnimalVisible(true)}
                      className="custom-btn custom-btn-secondary"
                    >
                      Добавить новое животное
                    </Button>
                  </>
                )}
              >
                {labAnimals.map((a) => (
                  <Option key={a.id} value={a.id}>
                    {a.name} ({a.species}, {a.sex ? 'Самец' : 'Самка'})
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="isExperimentAnimal" valuePropName="checked">
              <Checkbox className="custom-checkbox">Экспериментальное животное</Checkbox>
            </Form.Item>
          </div>

          <div className="upload-form__right">
            <Form.Item label="Файл видео">
              <Upload.Dragger {...uploadProps} className="custom-dragger">
                <p className="ant-upload-drag-icon"><UploadOutlined /></p>
                <p>Перетащите видео сюда или нажмите для выбора</p>
                {fileList.length > 0 && (
                  <p className="selected-file">{fileList[0].name}</p>
                )}
              </Upload.Dragger>
            </Form.Item>
            {selectedAnimal?.imagePath && (
              <div className="animal-preview-side">
                <Card
                  className="custom-animal-card"
                  style={{
                    backgroundColor: "white",
                    border: "8px solid var(--color-deep-ocean)",
                    padding: "1rem",
                    borderRadius: "1rem",
                    marginBottom: "var(--spacing)",
                  }}
                  title={
                    <Title level={4} style={{ margin: 0 }}>
                      {selectedAnimal.name || `Животное #${selectedAnimal.id}`}
                    </Title>
                  }
                  cover={
                    <Image
                      src={`${BASE_URL}${selectedAnimal.imagePath}`}
                      alt={selectedAnimal.name}
                      style={{
                        height: "240px",
                        width: "100%",
                        borderRadius: "0.75rem",
                      }}
                      preview={false}
                    />
                  }
                >
                </Card>
              </div>
            )}
          </div>
        </div>

        {previewUrl && (
          <div className="upload-form__preview">
            {previewError
              ? <Alert type="warning" message="Предпросмотр недоступен" showIcon />
              : (
                <video controls onError={() => setPreviewError(true)}>
                  <source src={previewUrl} type={fileList[0]?.type || 'video/mp4'} />
                  Ваш браузер не поддерживает видео.
                </video>
              )}
          </div>
        )}
        <Form.Item className="upload-form__submit">
          <Button type="primary" htmlType="submit" className="custom-btn custom-btn-primary">
            Загрузить
          </Button>
        </Form.Item>
      </Form>
      <AddAnimalModal
        visible={addAnimalVisible}
        onCancel={() => setAddAnimalVisible(false)}
        onSubmit={handleAddAnimal}
        colors={colors}
      />
    </ConfigProvider>
  );
};

export default UploadVideoForm;
