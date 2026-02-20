import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Container, Button, Card, Row, Col, Spinner } from 'react-bootstrap';

const MainPage = () => {
  const navigate = useNavigate();
  const [currentUserData, setCurrentUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const q = query(collection(db, "users"), where("email", "==", user.email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setCurrentUserData(userData);
        }
      } catch (error) {
        console.error("ユーザー情報の取得に失敗:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    signOut(auth);
    navigate('/login');
  };

  return (
    <Container className="mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-light rounded shadow-sm">
        <div>
          <h1 className="h3 mb-0">管理メニュー</h1>
          {loading ? (
             <Spinner animation="border" size="sm" className="ms-2" />
          ) : currentUserData ? (
             <div className="text-muted mt-1" style={{ fontSize: '0.9rem' }}>
               ログイン中: <strong>{currentUserData.personName}</strong> さん 
               (ID: {currentUserData.loginId})
             </div>
          ) : (
             <div className="text-muted mt-1">ゲスト ユーザー</div>
          )}
        </div>
        <Button variant="outline-danger" onClick={handleLogout}>ログアウト</Button>
      </div>

      <Row>
        <Col md={12} className="mb-4">
          <Card>
            <Card.Header as="h5">社員管理</Card.Header>
            <Card.Body>
              <div className="d-flex gap-3">
                <Button variant="primary" onClick={() => navigate('/import/users')}>
                  社員CSVインポート (Auth登録)
                </Button>
                <Button variant="success" onClick={() => navigate('/users')}>
                  社員一覧表示
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={12} className="mb-4">
          <Card>
            <Card.Header as="h5">マスタ管理</Card.Header>
            <Card.Body>
              <div className="d-flex gap-3 mb-3">
                 <Button variant="info" className="text-white" onClick={() => navigate('/import/offices')}>
                  営業所CSVインポート
                </Button>
                <Button variant="outline-info" onClick={() => navigate('/offices')}>
                  営業所一覧表示
                </Button>
              </div>

              <hr />

              <div className="d-flex gap-3">
                <Button variant="warning" className="text-dark" onClick={() => navigate('/import/teams')}>
                  チームCSVインポート
                </Button>
                <Button variant="outline-warning" className="text-dark" onClick={() => navigate('/teams')}>
                  チーム一覧表示
                </Button>
              </div>

              <hr />

              <div className="d-flex gap-3">
                <Button variant="success" className="text-white" onClick={() => navigate('/import/makers')}>
                  メーカーCSVインポート
                </Button>
                <Button variant="outline-success" onClick={() => navigate('/makers')}>
                  メーカー一覧表示
                </Button>
              </div>
              <hr/>
              <div className="d-flex gap-3">
                <Button variant="secondary" className="text-white" onClick={() => navigate('/import/hooks')}>
                  フックCSVインポート
                </Button>
                <Button variant="outline-secondary" onClick={() => navigate('/hooks')}>
                  フック一覧表示
                </Button>
              </div>
              <hr/>
              <div className="d-flex gap-3">
                <Button variant="dark" className="text-white" onClick={() => navigate('/import/pleats')}>
                  ヒダCSVインポート
                </Button>
                <Button variant="outline-dark" onClick={() => navigate('/pleats')}>
                  ヒダ一覧表示
                </Button>
              </div>
              <hr/>
              <div className="d-flex gap-3">
                <Button variant="primary" className="text-white" onClick={() => navigate('/import/installations')}>
                  取付方法CSVインポート
                </Button>
                <Button variant="outline-primary" onClick={() => navigate('/installations')}>
                  取付方法一覧表示
                </Button>
              </div>
              <hr/>
              <div className="d-flex gap-3">
                <Button variant="info" className="text-white" onClick={() => navigate('/import/seam-allowances')}>
                  縫い代CSVインポート
                </Button>
                <Button variant="outline-info" onClick={() => navigate('/seam-allowances')}>
                  縫い代一覧表示
                </Button>
              </div>
              <hr/>
              <div className="d-flex gap-3">
                <Button variant="primary" className="text-white" onClick={() => navigate('/import/customers')}>
                  得意先CSVインポート
                </Button>
                <Button variant="outline-primary" onClick={() => navigate('/customers')}>
                  得意先一覧表示
                </Button>
              </div>
              <hr/>
              <div className="d-flex gap-3">
                <Button variant="primary" className="text-white" onClick={() => navigate('/import/products')}>
                  商品マスタCSVインポート
                </Button>
                <Button variant="outline-primary" onClick={() => navigate('/products')}>
                  商品一覧表示
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default MainPage;