import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import Papa from 'papaparse';
import { Container, Form, Button, Alert, ProgressBar, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const ImportMakers = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const handleUpload = () => {
    if (!file) { setMessage({ type: 'danger', text: 'ファイルを選択してください。' }); return; }
    setLoading(true);

    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data;
        let count = 0;

        try {
          for (const item of data) {
            if (!item['名称コード']) continue;

            const code = String(item['名称コード']);
            
            const makerData = {
              code: code,
              name: item['名称'] || null,
              shortName: item['略称'] || null,
              searchIndex: item['索引'] || null,
              updatedAt: serverTimestamp()
            };

            const docRef = doc(db, "makers", code);
            await setDoc(docRef, makerData, { merge: true });

            count++;
            setProgress(Math.round((count / data.length) * 100));
          }
          setMessage({ type: 'success', text: `メーカーインポート完了: ${count}件` });
        } catch (error) {
          setMessage({ type: 'danger', text: `エラー: ${error.message}` });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  return (
    <Container className="mt-5" style={{ maxWidth: '600px' }}>
      <Button variant="secondary" className="mb-3" onClick={() => navigate('/')}>&lt; メニューに戻る</Button>
      <Card>
        <Card.Header className="bg-success text-white">メーカー CSVインポート</Card.Header>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>メーカー名CSV</Form.Label>
            <Form.Control type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} disabled={loading} />
          </Form.Group>
          {loading && <ProgressBar now={progress} label={`${progress}%`} animated className="mb-3" />}
          {message && <Alert variant={message.type} onClose={() => setMessage(null)} dismissible>{message.text}</Alert>}
          <Button variant="success" className="w-100" onClick={handleUpload} disabled={loading || !file}>インポート開始</Button>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ImportMakers;