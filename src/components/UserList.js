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

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();

  // Firestoreからデータ取得
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // loginId (ドキュメントID) 順に取得
        const q = query(collection(db, "users"), orderBy("loginId"));
        const querySnapshot = await getDocs(q);
        const userList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(userList);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // 検索フィルタリング
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const loginId = String(user.loginId || '').toLowerCase();
    const name = String(user.name || user['氏名'] || user['名前'] || '').toLowerCase(); // 一般的な名称カラムを想定
    const email = String(user.email || '').toLowerCase();
    
    return loginId.includes(searchLower) || name.includes(searchLower) || email.includes(searchLower);
  });

  const handleShowDetail = (user) => {
    setSelectedUser(user);
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
        <h2>社員一覧</h2>
        <div>
          <Button variant="secondary" onClick={() => navigate('/')}>
            メニューへ
          </Button>
        </div>
      </div>

      <Form.Control
        type="text"
        placeholder="検索 (ログインID, 名前, Email)"
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
              <th>ログインID</th>
              <th>氏名 (想定)</th>
              <th>Email</th>
              <th>認証ステータス</th>
              <th style={{ width: '100px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{safeRender(user.loginId)}</td>
                  {/* CSVのカラム名が不明なため、よくある名前キーを優先表示 */}
                  <td>{safeRender(user.personName || user['氏名'] || user['名前'] || '-')}</td>
                  <td>{safeRender(user.email)}</td>
                  <td>
                    {user.uid ? (
                      <Badge bg="success">Auth連携済</Badge>
                    ) : (
                      <Badge bg="secondary">未連携</Badge>
                    )}
                  </td>
                  <td>
                    <Button size="sm" variant="primary" onClick={() => handleShowDetail(user)}>
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
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            社員詳細
            <Badge bg="light" text="dark" className="ms-2">{safeRender(selectedUser?.loginId)}</Badge>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <Card className="border-0">
              <Card.Body>
                <h6 className="mb-3 text-muted border-bottom pb-2">アカウント情報</h6>
                <InfoRow label="ログインID" value={selectedUser.loginId} />
                <InfoRow label="Email" value={selectedUser.email} />
                <InfoRow label="Firebase UID" value={selectedUser.uid} />
                <InfoRow label="最終更新日時" value={selectedUser.updatedAt} />
                
                <h6 className="mt-4 mb-3 text-muted border-bottom pb-2">その他の登録データ</h6>
                {Object.entries(selectedUser).map(([key, value]) => {
                  if (['loginId', 'email', 'uid', 'updatedAt', 'id'].includes(key)) return null;
                  return (
                    <InfoRow key={key} label={key} value={value} />
                  );
                })}
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

export default UserList;