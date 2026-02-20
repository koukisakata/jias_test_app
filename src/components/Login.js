import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Container, Form, Button, Alert, Card, InputGroup } from 'react-bootstrap';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/'); 
    } catch (err) {
      setError('ログインに失敗しました。メールアドレスとパスワードを確認してください。');
      console.error(err);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
      <Card style={{ width: '400px' }}>
        <Card.Body>
          <h2 className="text-center mb-4">ログイン</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleLogin}>
            <Form.Group id="email" className="mb-3">
              <Form.Label>メールアドレス</Form.Label>
              <Form.Control 
                type="email" 
                required 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </Form.Group>
            
            <Form.Group id="password" className="mb-4">
              <Form.Label>パスワード</Form.Label>
              <InputGroup>
                <Form.Control 
                  type={showPassword ? "text" : "password"} 
                  required 
                  onChange={(e) => setPassword(e.target.value)} 
                />
                <Button 
                  variant="outline-secondary" 
                  onClick={togglePasswordVisibility}
                  style={{ cursor: 'pointer' }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </Button>
              </InputGroup>
            </Form.Group>

            <Button className="w-100" type="submit">ログイン</Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Login;