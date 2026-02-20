import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Container, Table, Button, Form, Modal, Spinner, Row, Col, Card, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

// 安全に値を表示するヘルパー関数
const safeRender = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    // 配列の場合はカンマ区切り文字列で返す（詳細画面のバッジ表示用には使いませんが念のため）
    if (Array.isArray(value)) return value.join(', ');
    
    // Timestamp対策：日時を表示
    if (value.seconds) return new Date(value.seconds * 1000).toLocaleString('ja-JP');
    return JSON.stringify(value);
  }
  return value;
};

const InstallationMethodList = () => {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const navigate = useNavigate();

  // Firestoreからデータ取得
  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const q = query(collection(db, "installation_methods"), orderBy("code"));
        const querySnapshot = await getDocs(q);
        const methodList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMethods(methodList);
      } catch (error) {
        console.error("Error fetching installation methods:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMethods();
  }, []);

  // 検索フィルタリング
  const filteredMethods = methods.filter(method => {
    const searchLower = searchTerm.toLowerCase();
    const code = String(method.code || '').toLowerCase();
    const name = String(method.name || '').toLowerCase();
    // コードまたは名称で検索
    return code.includes(searchLower) || name.includes(searchLower);
  });

  const handleShowDetail = (method) => {
    setSelectedMethod(method);
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
        <h2>取付方法一覧</h2>
        <div>
          <Button variant="secondary" onClick={() => navigate('/')}>
            メニューへ
          </Button>
        </div>
      </div>

      <Form.Control
        type="text"
        placeholder="検索 (コード, 名称)"
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
              <th>名称</th>
              <th>対応スタイル数</th>
              <th style={{ width: '100px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredMethods.length > 0 ? (
              filteredMethods.map((method) => (
                <tr key={method.id}>
                  <td>{safeRender(method.code)}</td>
                  <td>{safeRender(method.name)}</td>
                  <td>
                    {/* 配列の長さを表示 */}
                    {method.supportedSpecs && Array.isArray(method.supportedSpecs) 
                      ? `${method.supportedSpecs.length} 件` 
                      : '0 件'}
                  </td>
                  <td>
                    <Button size="sm" variant="primary" onClick={() => handleShowDetail(method)}>
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
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            {safeRender(selectedMethod?.name)}
            <Badge bg="light" text="dark" className="ms-2">{safeRender(selectedMethod?.code)}</Badge>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedMethod && (
            <Card className="border-0">
              <Card.Body>
                <h6 className="mb-3 text-muted border-bottom pb-2">基本情報</h6>
                <InfoRow label="コード" value={selectedMethod.code} />
                <InfoRow label="名称" value={selectedMethod.name} />
                <InfoRow label="最終更新日時" value={selectedMethod.updatedAt} />
                
                <h6 className="mt-4 mb-3 text-muted border-bottom pb-2">
                  対応スタイルリスト 
                  <Badge bg="secondary" className="ms-2">
                    {selectedMethod.supportedSpecs?.length || 0}
                  </Badge>
                </h6>
                <div className="d-flex flex-wrap gap-2">
                  {selectedMethod.supportedSpecs && Array.isArray(selectedMethod.supportedSpecs) && selectedMethod.supportedSpecs.length > 0 ? (
                    selectedMethod.supportedSpecs.map((spec, index) => (
                      <Badge key={index} bg="info" className="p-2">
                        {spec}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted small">対応スタイルなし</span>
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

export default InstallationMethodList;