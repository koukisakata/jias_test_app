import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Container, Table, Button, Form, Modal, Spinner, Row, Col, Tabs, Tab, Card, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

// 安全に値を表示するヘルパー関数
const safeRender = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    // Timestampなどのオブジェクト対策
    if (value.seconds) return new Date(value.seconds * 1000).toLocaleDateString();
    return JSON.stringify(value);
  }
  return value;
};

const OfficeList = () => {
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState(null);
  const navigate = useNavigate();

  // Firestoreからデータ取得
  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const q = query(collection(db, "offices"), orderBy("officeCode"));
        const querySnapshot = await getDocs(q);
        const officeList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOffices(officeList);
      } catch (error) {
        console.error("Error fetching offices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOffices();
  }, []);

  // 検索フィルタリング
  const filteredOffices = offices.filter(office => {
    const searchLower = searchTerm.toLowerCase();
    const code = String(office.officeCode || '').toLowerCase();
    const name = String(office.name || '').toLowerCase();
    const shortName = String(office.shortName || '').toLowerCase();
    return code.includes(searchLower) || name.includes(searchLower) || shortName.includes(searchLower);
  });

  const handleShowDetail = (office) => {
    setSelectedOffice(office);
    setShowModal(true);
  };

  // 詳細表示用の行コンポーネント
  const InfoRow = ({ label, value }) => (
    <Row className="mb-2 border-bottom pb-1">
      <Col xs={5} className="text-muted small">{label}</Col>
      <Col xs={7} className="fw-bold text-break">{safeRender(value) || '-'}</Col>
    </Row>
  );

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>営業所一覧</h2>
        <div>
          <Button variant="secondary" onClick={() => navigate('/')}>
            メニューへ
          </Button>
        </div>
      </div>

      <Form.Control
        type="text"
        placeholder="検索 (コード, 名称, 略称)"
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
              <th>営業所名</th>
              <th>電話番号</th>
              <th>住所 (抜粋)</th>
              <th style={{ width: '100px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredOffices.length > 0 ? (
              filteredOffices.map((office) => (
                <tr key={office.id}>
                  <td>{safeRender(office.officeCode)}</td>
                  <td>
                    <div>{safeRender(office.name)}</div>
                    <small className="text-muted">{safeRender(office.shortName)}</small>
                  </td>
                  <td>{safeRender(office.phoneNumber)}</td>
                  <td>
                    {safeRender(office.address1)}
                    {office.address2 ? '...' : ''}
                  </td>
                  <td>
                    <Button size="sm" variant="info" className="text-white" onClick={() => handleShowDetail(office)}>
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
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>
            {safeRender(selectedOffice?.name)}
            <Badge bg="secondary" className="ms-2">{safeRender(selectedOffice?.officeCode)}</Badge>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOffice && (
            <Tabs defaultActiveKey="basic" id="office-detail-tabs" className="mb-3">
              
              {/* --- 基本情報タブ --- */}
              <Tab eventKey="basic" title="基本・連絡先">
                <Row>
                  <Col md={6}>
                    <Card className="mb-3 h-100">
                      <Card.Header>基本情報</Card.Header>
                      <Card.Body>
                        <InfoRow label="名称" value={selectedOffice.name} />
                        <InfoRow label="略称" value={selectedOffice.shortName} />
                        <InfoRow label="索引" value={selectedOffice.searchIndex} />
                        <InfoRow label="識別記号" value={selectedOffice.identificationSymbol} />
                        <InfoRow label="最終更新" value={selectedOffice.updatedAt} />
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="mb-3 h-100">
                      <Card.Header>所在地・連絡先</Card.Header>
                      <Card.Body>
                        <InfoRow label="郵便番号" value={selectedOffice.postalCode} />
                        <InfoRow label="住所1" value={selectedOffice.address1} />
                        <InfoRow label="住所2" value={selectedOffice.address2} />
                        <InfoRow label="住所3" value={selectedOffice.address3} />
                        <InfoRow label="電話番号" value={selectedOffice.phoneNumber} />
                        <InfoRow label="FAX番号" value={selectedOffice.faxNumber} />
                        <InfoRow label="フリーダイヤル" value={selectedOffice.tollFreeNumber} />
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Tab>

              {/* --- チーム・コード関連タブ --- */}
              <Tab eventKey="teams" title="チーム・コード">
                <Card className="mb-3">
                  <Card.Header>各種部門・チームコード</Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <InfoRow label="工事部コード" value={selectedOffice.constructionDeptCode} />
                        <InfoRow label="スタイル縫製チーム" value={selectedOffice.styleSewingTeamCode} />
                        <InfoRow label="メカ縫製チーム" value={selectedOffice.mechSewingTeamCode} />
                      </Col>
                      <Col md={6}>
                        <InfoRow label="一般工務店本縫い" value={selectedOffice.generalSewingTeamCode} />
                        <InfoRow label="量販店本縫い" value={selectedOffice.massRetailerSewingTeamCode} />
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Tab>

              {/* --- 財務・条件タブ --- */}
              <Tab eventKey="financial" title="財務・条件">
                <Row>
                  <Col md={6}>
                    <Card className="mb-3 h-100">
                      <Card.Header>条件・リミット</Card.Header>
                      <Card.Body>
                        <InfoRow label="概算確定可能区分" value={selectedOffice.estimateStatus} />
                        <InfoRow label="特別値引率上限" value={selectedOffice.specialDiscountLimit ? `${selectedOffice.specialDiscountLimit}%` : '-'} />
                        <InfoRow label="営業粗利率上限" value={selectedOffice.salesMarginUpperLimit ? `${selectedOffice.salesMarginUpperLimit}%` : '-'} />
                        <InfoRow label="営業粗利率下限" value={selectedOffice.salesMarginLowerLimit ? `${selectedOffice.salesMarginLowerLimit}%` : '-'} />
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="mb-3 h-100">
                      <Card.Header>振込口座情報</Card.Header>
                      <Card.Body>
                        <InfoRow label="口座情報1" value={selectedOffice.bankAccount1} />
                        <InfoRow label="口座情報2" value={selectedOffice.bankAccount2} />
                        <InfoRow label="口座情報3" value={selectedOffice.bankAccount3} />
                        <InfoRow label="口座情報4" value={selectedOffice.bankAccount4} />
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Tab>

            </Tabs>
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

export default OfficeList;