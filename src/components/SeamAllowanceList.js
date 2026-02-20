import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Container, Table, Button, Form, Modal, Spinner, Row, Col, Card, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

// 安全に値を表示するヘルパー関数
const safeRender = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    // Timestamp対策：日時を表示
    if (value.seconds) return new Date(value.seconds * 1000).toLocaleString('ja-JP');
    return JSON.stringify(value);
  }
  return value;
};

const SeamAllowanceList = () => {
  const [specs, setSpecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedSpec, setSelectedSpec] = useState(null);
  const navigate = useNavigate();

  // Firestoreからデータ取得
  useEffect(() => {
    const fetchSpecs = async () => {
      try {
        const q = query(collection(db, "sewing_specs"), orderBy("code"));
        const querySnapshot = await getDocs(q);
        const specList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSpecs(specList);
      } catch (error) {
        console.error("Error fetching sewing specs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecs();
  }, []);

  // 検索フィルタリング
  const filteredSpecs = specs.filter(spec => {
    const searchLower = searchTerm.toLowerCase();
    const code = String(spec.code || '').toLowerCase();
    const name = String(spec.name || '').toLowerCase();
    // 品番または名称で検索
    return code.includes(searchLower) || name.includes(searchLower);
  });

  const handleShowDetail = (spec) => {
    setSelectedSpec(spec);
    setShowModal(true);
  };

  // 詳細表示用の行コンポーネント
  const InfoRow = ({ label, value, unit = '' }) => (
    <Row className="mb-2 border-bottom pb-1">
      <Col xs={6} className="text-muted small">{label}</Col>
      <Col xs={6} className="fw-bold text-break text-end">
        {safeRender(value) !== '' ? `${safeRender(value)}${unit}` : '-'}
      </Col>
    </Row>
  );

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>縫い代マスタ一覧</h2>
        <div>
          <Button variant="secondary" onClick={() => navigate('/')}>
            メニューへ
          </Button>
        </div>
      </div>

      <Form.Control
        type="text"
        placeholder="検索 (ジアス品番, 名称)"
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
              <th>ジアス品番</th>
              <th>名称</th>
              <th>ゆとり係数</th>
              <th style={{ width: '100px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredSpecs.length > 0 ? (
              filteredSpecs.map((spec) => (
                <tr key={spec.id}>
                  <td>{safeRender(spec.code)}</td>
                  <td>{safeRender(spec.name)}</td>
                  <td>{safeRender(spec.marginFactor)}</td>
                  <td>
                    <Button size="sm" variant="info" className="text-white" onClick={() => handleShowDetail(spec)}>
                      詳細
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center">データが見つかりません</td>
              </tr>
            )}
          </tbody>
        </Table>
      )}

      {/* 詳細モーダル */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton className="bg-info text-white">
          <Modal.Title>
            {safeRender(selectedSpec?.name)}
            <Badge bg="light" text="dark" className="ms-2">{safeRender(selectedSpec?.code)}</Badge>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSpec && (
            <div className="d-flex flex-column gap-3">
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <h6 className="mb-3 text-info border-bottom pb-2">基本情報</h6>
                  <InfoRow label="ジアス品番" value={selectedSpec.code} />
                  <InfoRow label="名称" value={selectedSpec.name} />
                  <InfoRow label="ゆとり係数" value={selectedSpec.marginFactor} />
                  <InfoRow label="最終更新日時" value={selectedSpec.updatedAt} />
                </Card.Body>
              </Card>

              <Row>
                <Col md={6}>
                  <Card className="h-100 border-info">
                    <Card.Header className="bg-light text-center py-1">縦使い (Vertical)</Card.Header>
                    <Card.Body>
                      <InfoRow label="丈 縫代" value={selectedSpec.verticalLengthAllowance} unit=" mm" />
                      <InfoRow label="巾 縫代" value={selectedSpec.verticalWidthAllowance} unit=" mm" />
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="h-100 border-info">
                    <Card.Header className="bg-light text-center py-1">横使い (Horizontal)</Card.Header>
                    <Card.Body>
                      <InfoRow label="丈 縫代" value={selectedSpec.horizontalLengthAllowance} unit=" mm" />
                      <InfoRow label="巾 縫代" value={selectedSpec.horizontalWidthAllowance} unit=" mm" />
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>
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

export default SeamAllowanceList;