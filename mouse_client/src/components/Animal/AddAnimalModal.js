import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Radio,
  Button,
  Upload,
  message,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import "./add-animal-modal.css";
import { BASE_URL } from "../../App";

const { Option } = Select;

const AddAnimalModal = ({
  visible,
  onCancel,
  onSubmit,
  colors,
  initialAnimal,
}) => {
  const [form] = Form.useForm();
  const [formValues, setFormValues] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    if (visible && initialAnimal) {
      const colorName = initialAnimal.color?.colorName || null;
      form.setFieldsValue({
        name: initialAnimal.name,
        age: initialAnimal.age,
        weight: initialAnimal.weight,
        sex: initialAnimal.sex,
        colorName,
      });
      setFormValues(initialAnimal);

      if (initialAnimal.imagePath) {
        const fullImageUrl = `${BASE_URL}${initialAnimal.imagePath}`;
        setPreviewImage(fullImageUrl);
        setFileList([
          {
            uid: "-1",
            name: "image.jpg",
            status: "done",
            url: fullImageUrl,
          },
        ]);
      }
    } else if (visible) {
      form.resetFields();
      setFormValues({});
      setPreviewImage(null);
      setSelectedFile(null);
      setFileList([]);
    }
  }, [visible, initialAnimal, form]);

  const handleOk = () => {
    form.validateFields().then((values) => {
      const formData = new FormData();
      formData.append("name", values.name || "");
      formData.append("age", values.age.toString());
      formData.append(
        "weight",
        values.weight !== undefined ? values.weight.toString() : ""
      );
      formData.append("sex", values.sex.toString());

      const selectedColor = colors.find(
        (c) => c.colorName === values.colorName
      );
      if (selectedColor) {
        formData.append("colorId", selectedColor.id.toString());
      }

      if (selectedFile) {
        formData.append("image", selectedFile);
      } else if (!initialAnimal) {
        message.error("Файл не выбран!");
        return;
      }

      onSubmit(formData);
      form.resetFields();
      setFormValues({});
      setPreviewImage(null);
      setSelectedFile(null);
      setFileList([]);
    }).catch((info) => {
      console.log("Validation Failed:", info);
    });
  };

  const handleCancel = () => {
    setFormValues(form.getFieldsValue());
    onCancel();
  };

  const handleReset = () => {
    form.resetFields();
    setFormValues({});
    setPreviewImage(null);
    setSelectedFile(null);
    setFileList([]);
  };

  const handleImageChange = (info) => {
    const file =
      info.file.originFileObj ||
      (info.fileList[0] && info.fileList[0].originFileObj);
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
    setFileList(info.fileList);
  };

  return (
    <Modal
      title={
        initialAnimal
          ? "Редактировать животное"
          : "Добавить лабораторное животное"
      }
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="reset" onClick={handleReset}>
          Очистить
        </Button>,
        <Button key="back" onClick={handleCancel}>
          Отмена
        </Button>,
        <Button
          key="submit"
          className="custom-btn custom-btn-primary"
          onClick={handleOk}
        >
          {initialAnimal ? "Сохранить изменения" : "Добавить"}
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={formValues}
        className="modal-form-container"
      >
        <Form.Item name="name" label="Имя">
          <Input className="custom-input" placeholder="Введите имя" />
        </Form.Item>

        <Form.Item
          name="age"
          label="Возраст (в месяцах)"
          rules={[{ required: true, message: "Укажите возраст" }]}
        >
          <InputNumber
            className="custom-input"
            min={1}
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item name="weight" label="Вес (в граммах)">
          <InputNumber
            className="custom-input"
            min={0}
            step={0.01}
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item
          name="sex"
          label="Пол"
          rules={[{ required: true, message: "Укажите пол" }]}
        >
          <Radio.Group>
            <Radio value={true}>Самец</Radio>
            <Radio value={false}>Самка</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="colorName"
          label="Окрас"
          rules={[{ required: true, message: "Выберите окрас" }]}
        >
          <Select placeholder="Выберите окрас">
            {colors.map((color) => (
              <Option key={color.id} value={color.colorName}>
                {color.colorName}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <div className="image-upload-container">
          <label>Изображение животного:</label>
          <Upload
            beforeUpload={() => false}
            onChange={handleImageChange}
            maxCount={1}
            accept="image/*"
            fileList={fileList}
            listType="picture"
          >
            <Button
              className="custom-btn custom-btn-primary"
              icon={<UploadOutlined />}
            >
              Загрузить изображение
            </Button>
          </Upload>

          {previewImage && (
            <img
              src={previewImage}
              alt="Предпросмотр"
              className={`image-preview ${previewImage ? "show" : ""}`}
            />
          )}
        </div>
      </Form>
    </Modal>
  );
};

export default AddAnimalModal;
