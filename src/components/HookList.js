import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Container, Table, Button, Form, Modal, Spinner, Row, Col, Card, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

// 安全に値を表示するヘルパー関数
const safeRender = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    // 配列の場合はカンマ区切り文字列で返す（詳細画面では個別に処理します）
    if (Array.isArray(value)) return value.join(', ');
    
    // Timestamp対策：時間を表示するために toLocaleString を使用
    if (value.seconds) return new Date(value.seconds * 1000).toLocaleString('ja-JP');
    return JSON.stringify(value);
  }
  return value;
};

const HookList = () => {
  const [hooks, setHooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedHook, setSelectedHook] = useState(null);
  const navigate = useNavigate();

  // Firestoreからデータ取得
  useEffect(() => {
    const fetchHooks = async () => {
      try {
        const q = query(collection(db, "hooks"), orderBy("code"));
        const querySnapshot = await getDocs(q);
        const hookList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setHooks(hookList);
      } catch (error) {
        console.error("Error fetching hooks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHooks();
  }, []);

  // 検索フィルタリング
  const filteredHooks = hooks.filter(hook => {
    const searchLower = searchTerm.toLowerCase();
    const code = String(hook.code || '').toLowerCase();
    const name = String(hook.name || '').toLowerCase();
    // フックIDまたは名称で検索
    return code.includes(searchLower) || name.includes(searchLower);
  });

  const handleShowDetail = (hook) => {
    setSelectedHook(hook);
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
        <h2>フック一覧</h2>
        <div>
          <Button variant="secondary" onClick={() => navigate('/')}>
            メニューへ
          </Button>
        </div>
      </div>

      <Form.Control
        type="text"
        placeholder="検索 (フックID, フック名)"
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
              <th>フックID</th>
              <th>フック名</th>
              <th>カン上</th>
              <th style={{ width: '100px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredHooks.length > 0 ? (
              filteredHooks.map((hook) => (
                <tr key={hook.id}>
                  <td>{safeRender(hook.code)}</td>
                  <td>{safeRender(hook.name)}</td>
                  <td>{safeRender(hook.kanMetric)}</td>
                  <td>
                    <Button size="sm" variant="secondary" onClick={() => handleShowDetail(hook)}>
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
        <Modal.Header closeButton className="bg-secondary text-white">
          <Modal.Title>
            {safeRender(selectedHook?.name)}
            <Badge bg="light" text="dark" className="ms-2">{safeRender(selectedHook?.code)}</Badge>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedHook && (
            <Card className="border-0">
              <Card.Body>
                <h6 className="mb-3 text-muted border-bottom pb-2">基本情報</h6>
                <InfoRow label="フックID" value={selectedHook.code} />
                <InfoRow label="フック名" value={selectedHook.name} />
                <InfoRow label="カン上" value={selectedHook.kanMetric} />
                <InfoRow label="最終更新日時" value={selectedHook.updatedAt} />
                
                <h6 className="mt-4 mb-3 text-muted border-bottom pb-2">対応仕様リスト</h6>
                <div className="d-flex flex-wrap gap-2">
                  {selectedHook.supportedSpecs && Array.isArray(selectedHook.supportedSpecs) && selectedHook.supportedSpecs.length > 0 ? (
                    selectedHook.supportedSpecs.map((spec, index) => (
                      <Badge key={index} bg="info" className="p-2">
                        {spec}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted small">対応仕様なし</span>
                  )}
                </div>
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

export default HookList;