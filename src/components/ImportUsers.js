import React, { useState } from 'react';
import { db, firebaseConfig } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp, getApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import Papa from 'papaparse';
import { Container, Form, Button, Alert, ProgressBar, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const ImportUsers = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const handleUpload = async () => {
    if (!file) { setMessage({ type: 'danger', text: 'ファイルを選択してください。' }); return; }
    setLoading(true);

    const SECONDARY_APP_NAME = "SecondaryApp";
    let secondaryApp;
    try { secondaryApp = getApp(SECONDARY_APP_NAME); } 
    catch (e) { secondaryApp = initializeApp(firebaseConfig, SECONDARY_APP_NAME); }
    const secondaryAuth = getAuth(secondaryApp);

    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data;
        let count = 0;
        let newAuthCount = 0;

        try {
          for (const item of data) {
            if (!item.loginId) continue;

            let createdUid = null;

            if (item.email && item.loginId) {
              try {
                const password = String(item.loginId);
                if (password.length >= 6) {
                   const userCredential = await createUserWithEmailAndPassword(secondaryAuth, item.email, password);
                   
                   createdUid = userCredential.user.uid;

                   await signOut(secondaryAuth);
                   newAuthCount++;
                }
              } catch (e) {
              }
            }

            const safeItem = Object.fromEntries(Object.entries(item).map(([k, v]) => [k, v === undefined ? null : v]));
            safeItem.updatedAt = serverTimestamp();
            
            if (createdUid) {
                safeItem.uid = createdUid;
            }

            const docRef = doc(db, "users", String(item.loginId));
            await setDoc(docRef, safeItem, { merge: true });

            count++;
            setProgress(Math.round((count / data.length) * 100));
          }
          setMessage({ type: 'success', text: `社員インポート完了: ${count}件 (新規Auth: ${newAuthCount}件)` });
        } catch (error) {
          setMessage({ type: 'danger', text: `エラー: ${error.message}` });
        } finally {
          if (secondaryApp) await deleteApp(secondaryApp);
          setLoading(false);
        }
      }
    });
  };

  return (
    <Container className="mt-5" style={{ maxWidth: '600px' }}>
      <Button variant="secondary" className="mb-3" onClick={() => navigate('/')}>&lt; メニューに戻る</Button>
      <Card>
        <Card.Header className="bg-primary text-white">社員 CSVインポート</Card.Header>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>社員CSVファイル</Form.Label>
            <Form.Control type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} disabled={loading} />
          </Form.Group>
          {loading && <ProgressBar now={progress} label={`${progress}%`} animated className="mb-3" />}
          {message && <Alert variant={message.type} onClose={() => setMessage(null)} dismissible>{message.text}</Alert>}
          <Button variant="primary" onClick={handleUpload} disabled={loading || !file} className="w-100">インポート開始</Button>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ImportUsers;