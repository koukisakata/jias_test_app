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

const TeamList = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const navigate = useNavigate();

  // Firestoreからデータ取得
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const q = query(collection(db, "teams"), orderBy("teamCode"));
        const querySnapshot = await getDocs(q);
        const teamList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTeams(teamList);
      } catch (error) {
        console.error("Error fetching teams:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  // 検索フィルタリング
  const filteredTeams = teams.filter(team => {
    const searchLower = searchTerm.toLowerCase();
    const code = String(team.teamCode || '').toLowerCase();
    const name = String(team.name || '').toLowerCase();
    const officeCode = String(team.officeCode || '').toLowerCase();
    // チームコード、名称、または所属営業所コードで検索可能
    return code.includes(searchLower) || name.includes(searchLower) || officeCode.includes(searchLower);
  });

  const handleShowDetail = (team) => {
    setSelectedTeam(team);
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
        <h2>チーム一覧</h2>
        <div>
          <Button variant="secondary" onClick={() => navigate('/')}>
            メニューへ
          </Button>
        </div>
      </div>

      <Form.Control
        type="text"
        placeholder="検索 (チームコード, 名称, 所属営業所コード)"
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
              <th>チームコード</th>
              <th>チーム名称</th>
              <th>略称</th>
              <th>所属営業所CD</th>
              <th style={{ width: '100px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeams.length > 0 ? (
              filteredTeams.map((team) => (
                <tr key={team.id}>
                  <td>{safeRender(team.teamCode)}</td>
                  <td>{safeRender(team.name)}</td>
                  <td>{safeRender(team.shortName)}</td>
                  <td>{safeRender(team.officeCode)}</td>
                  <td>
                    <Button size="sm" variant="warning" className="text-dark" onClick={() => handleShowDetail(team)}>
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
        <Modal.Header closeButton className="bg-warning">
          <Modal.Title className="text-dark">
            {safeRender(selectedTeam?.name)}
            <Badge bg="dark" className="text-white ms-2">{safeRender(selectedTeam?.teamCode)}</Badge>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTeam && (
            <Card className="border-0">
              <Card.Body>
                <h6 className="mb-3 text-muted">基本情報</h6>
                <InfoRow label="チームコード" value={selectedTeam.teamCode} />
                <InfoRow label="チーム名称" value={selectedTeam.name} />
                <InfoRow label="略称" value={selectedTeam.shortName} />
                <InfoRow label="索引" value={selectedTeam.searchIndex} />
                
                <h6 className="mt-4 mb-3 text-muted">所属・管理</h6>
                <InfoRow label="所属営業所コード" value={selectedTeam.officeCode} />
                <InfoRow label="最終更新日時" value={selectedTeam.updatedAt} />
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

export default TeamList;