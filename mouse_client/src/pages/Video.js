import React, { useContext, useEffect, useState } from 'react';
import {
  Button,
  Col,
  Row,
  Empty,
  Spin,
  message,
  Pagination,
  Input,
  Select,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { VIDEO_REPORT_ROUTE } from '../utils/const';
import { API_SERVICE } from '../service/api.service';
import CardVideo from '../components/Video/CardVideo';
import { Context } from "../index";

const { Search } = Input;
const { Option } = Select;

const VIDEOS_PER_PAGE = 8;

const Video = () => {
  const { user } = useContext(Context);
  const u = user.user;
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await API_SERVICE.get('/video');
        setVideos(response);
        setFilteredVideos(response);
      } catch (error) {
        message.error('Не удалось загрузить список видео');
        console.error(error);
        window.location.reload()
        setVideos([]);
        setFilteredVideos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  // 🔁 Фильтрация и сортировка
  useEffect(() => {
    let data = [...videos];

    if (searchTerm) {
      data = data.filter(video =>
        video.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortKey === 'name') {
      data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortKey === 'date') {
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortKey === 'animal') {
      data.sort((a, b) =>
        (a.labAnimal?.name || '').localeCompare(b.labAnimal?.name || '')
      );
    }

    setFilteredVideos(data);
    setCurrentPage(1);
  }, [searchTerm, sortKey, videos]);

  const paginatedVideos = filteredVideos.slice(
    (currentPage - 1) * VIDEOS_PER_PAGE,
    currentPage * VIDEOS_PER_PAGE
  );

  return (
    <>
      <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px' }}>
        Видео
      </h2>

      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Search
            placeholder="Поиск по названию"
            allowClear
            onSearch={value => setSearchTerm(value)}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: 250 }}
          />
        </Col>

        <Col>
          <Select
            allowClear
            placeholder="Сортировать по"
            onChange={value => setSortKey(value)}
            style={{ width: 200, marginRight: 16 }}
          >
            <Option value="name">По названию</Option>
            <Option value="date">По дате</Option>
            <Option value="animal">По животному</Option>
          </Select>

          <Button className="custom-btn custom-btn-primary" onClick={() => navigate(VIDEO_REPORT_ROUTE)}>
            Загрузить видео
          </Button>
        </Col>
      </Row>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Row gutter={[24, 24]}>
            {paginatedVideos.length > 0 ? (
              paginatedVideos.map((videoItem) => (
                <Col span={8} key={videoItem.id}>
                  <CardVideo video={videoItem} />
                </Col>
              ))
            ) : (
              <Col span={24} style={{ textAlign: 'center', padding: '40px 0' }}>
                <Empty description="Видео не найдены" />
              </Col>
            )}
          </Row>

          {filteredVideos.length > VIDEOS_PER_PAGE && (
            <Row justify="center" style={{ marginTop: '32px' }}>
              <Pagination
                current={currentPage}
                pageSize={VIDEOS_PER_PAGE}
                total={filteredVideos.length}
                onChange={setCurrentPage}
                showSizeChanger={false}
              />
            </Row>
          )}
        </>
      )}
    </>
  );
};

export default Video;
