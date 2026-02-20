import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Container, Table, Button, Form, Modal, Spinner, Row, Col, Card, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

// 安全に値を表示するヘルパー関数
const safeRender = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    // Timestamp対策
    if (value.seconds) return new Date(value.seconds * 1000).toLocaleDateString();
    return JSON.stringify(value);
  }
  return value;
};

const MakerList = () => {
  const [makers, setMakers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedMaker, setSelectedMaker] = useState(null);
  const navigate = useNavigate();

  // Firestoreからデータ取得
  useEffect(() => {
    const fetchMakers = async () => {
      try {
        const q = query(collection(db, "makers"), orderBy("code"));
        const querySnapshot = await getDocs(q);
        const makerList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMakers(makerList);
      } catch (error) {
        console.error("Error fetching makers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMakers();
  }, []);

  // 検索フィルタリング
  const filteredMakers = makers.filter(maker => {
    const searchLower = searchTerm.toLowerCase();
    const code = String(maker.code || '').toLowerCase();
    const name = String(maker.name || '').toLowerCase();
    const index = String(maker.searchIndex || '').toLowerCase();
    // コード、名称、索引で検索可能
    return code.includes(searchLower) || name.includes(searchLower) || index.includes(searchLower);
  });

  const handleShowDetail = (maker) => {
    setSelectedMaker(maker);
    setShowModal(true);
  };

  // 詳細表示用の行コンポーネント
  const InfoRow = ({ label, value }) => (
    <Row className="mb-2 border-bottom pb-1">
      <Col xs={4} className="text-muted small">{label}</Col>
      <Col xs={8} className="fw-bold text-break">{safeRender(value) || '-'}</Col>
    </Row>
  );

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>メーカー一覧</h2>
        <div>
          <Button variant="secondary" onClick={() => navigate('/')}>
            メニューへ
          </Button>
        </div>
      </div>

      <Form.Control
        type="text"
        placeholder="検索 (コード, 名称, 索引)"
        className="mb-3"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {loading ? (
        <div className="text-center mt-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : (
        <Table striped bordered hover responsive>
          <thead className="bg-light">
            <tr>
              <th>コード</th>
              <th>メーカー名</th>
              <th>略称</th>
              <th>索引</th>
              <th style={{ width: '100px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredMakers.length > 0 ? (
              filteredMakers.map((maker) => (
                <tr key={maker.id}>
                  <td>{safeRender(maker.code)}</td>
                  <td>{safeRender(maker.name)}</td>
                  <td>{safeRender(maker.shortName)}</td>
                  <td>{safeRender(maker.searchIndex)}</td>
                  <td>
                    <Button size="sm" variant="success" className="text-white" onClick={() => handleShowDetail(maker)}>
                      詳細
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center">データが見つかりません</td>
              </tr>
            )}
          </tbody>
        </Table>
      )}

      {/* 詳細モーダル */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>
            {safeRender(selectedMaker?.name)}
            <Badge bg="light" text="dark" className="ms-2">{safeRender(selectedMaker?.code)}</Badge>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedMaker && (
            <Card className="border-0">
              <Card.Body>
                <h6 className="mb-3 text-muted border-bottom pb-2">基本情報</h6>
                <InfoRow label="名称コード" value={selectedMaker.code} />
                <InfoRow label="名称" value={selectedMaker.name} />
                <InfoRow label="略称" value={selectedMaker.shortName} />
                <InfoRow label="索引" value={selectedMaker.searchIndex} />
                
                <h6 className="mt-4 mb-3 text-muted border-bottom pb-2">システム管理</h6>
                <InfoRow label="最終更新日時" value={selectedMaker.updatedAt} />
              </Card.Body>
            </Card>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            閉じる
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default MakerList;