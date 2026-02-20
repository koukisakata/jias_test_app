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
    
    // Timestamp対策：日時を表示
    if (value.seconds) return new Date(value.seconds * 1000).toLocaleString('ja-JP');
    return JSON.stringify(value);
  }
  return value;
};

const PleatList = () => {
  const [pleats, setPleats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedPleat, setSelectedPleat] = useState(null);
  const navigate = useNavigate();

  // Firestoreからデータ取得
  useEffect(() => {
    const fetchPleats = async () => {
      try {
        const q = query(collection(db, "pleats"), orderBy("code"));
        const querySnapshot = await getDocs(q);
        const pleatList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPleats(pleatList);
      } catch (error) {
        console.error("Error fetching pleats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPleats();
  }, []);

  // 検索フィルタリング
  const filteredPleats = pleats.filter(pleat => {
    const searchLower = searchTerm.toLowerCase();
    const code = String(pleat.code || '').toLowerCase();
    const name = String(pleat.name || '').toLowerCase();
    // コードまたは名称で検索
    return code.includes(searchLower) || name.includes(searchLower);
  });

  const handleShowDetail = (pleat) => {
    setSelectedPleat(pleat);
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
        <h2>ヒダ種類一覧</h2>
        <div>
          <Button variant="secondary" onClick={() => navigate('/')}>
            メニューへ
          </Button>
        </div>
      </div>

      <Form.Control
        type="text"
        placeholder="検索 (ヒダコード, 名称)"
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
              <th>ヒダ名称</th>
              <th>標準倍率</th>
              <th className="d-none d-md-table-cell">倍率範囲</th>
              <th style={{ width: '100px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredPleats.length > 0 ? (
              filteredPleats.map((pleat) => (
                <tr key={pleat.id}>
                  <td>{safeRender(pleat.code)}</td>
                  <td>{safeRender(pleat.name)}</td>
                  <td>{pleat.standardRate ? `${pleat.standardRate}倍` : '-'}</td>
                  <td className="d-none d-md-table-cell">
                    {pleat.minRate && pleat.maxRate ? `${pleat.minRate} 〜 ${pleat.maxRate}倍` : '-'}
                  </td>
                  <td>
                    <Button size="sm" variant="dark" onClick={() => handleShowDetail(pleat)}>
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
        <Modal.Header closeButton className="bg-dark text-white">
          <Modal.Title>
            {safeRender(selectedPleat?.name)}
            <Badge bg="light" text="dark" className="ms-2">{safeRender(selectedPleat?.code)}</Badge>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPleat && (
            <Card className="border-0">
              <Card.Body>
                <h6 className="mb-3 text-muted border-bottom pb-2">基本スペック</h6>
                <InfoRow label="ヒダコード" value={selectedPleat.code} />
                <InfoRow label="名称" value={selectedPleat.name} />
                <InfoRow label="標準倍率" value={selectedPleat.standardRate} />
                <InfoRow label="最小倍率" value={selectedPleat.minRate} />
                <InfoRow label="最大倍率" value={selectedPleat.maxRate} />
                <InfoRow label="最終更新日時" value={selectedPleat.updatedAt} />
                
                <h6 className="mt-4 mb-3 text-muted border-bottom pb-2">対応仕様リスト</h6>
                <div className="d-flex flex-wrap gap-2">
                  {selectedPleat.supportedSpecs && Array.isArray(selectedPleat.supportedSpecs) && selectedPleat.supportedSpecs.length > 0 ? (
                    selectedPleat.supportedSpecs.map((spec, index) => (
                      <Badge key={index} bg="secondary" className="p-2">
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

export default PleatList;