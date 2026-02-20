// src/components/ImportHooks.js
import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import Papa from 'papaparse';
import { Container, Form, Button, Alert, ProgressBar, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const ImportHooks = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const handleUpload = () => {
    if (!file) { setMessage({ type: 'danger', text: 'ファイルを選択してください。' }); return; }
    setLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data;
        let count = 0;

        try {
          for (const item of data) {
            if (!item['フックID']) continue;

            const hookId = String(item['フックID']);
            
            const supportedSpecs = [];
            
            Object.keys(item).forEach((key) => {
              if (key !== 'フック名' && key !== 'フックID' && key !== 'カン上') {
                if (String(item[key]).trim() === '1') {
                  const match = key.match(/^(\d+)/);
                  if (match) {
                    supportedSpecs.push(match[1]);
                  }
                }
              }
            });

            const hookData = {
              code: hookId,
              name: item['フック名'] || null,
              kanMetric: item['カン上'] || null,
              supportedSpecs: supportedSpecs,
              updatedAt: serverTimestamp()
            };

            const docRef = doc(db, "hooks", hookId);
            await setDoc(docRef, hookData, { merge: true });

            count++;
            setProgress(Math.round((count / data.length) * 100));
          }
          setMessage({ type: 'success', text: `フックマスタ インポート完了: ${count}件` });
        } catch (error) {
          console.error(error);
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
        <Card.Header className="bg-secondary text-white">フック CSVインポート</Card.Header>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>フックマスタCSV (マトリクス形式)</Form.Label>
            <Form.Control type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} disabled={loading} />
            <Form.Text className="text-muted">
              ※列ヘッダーのコード(001001等)を自動抽出し、値が「1」のものを対応仕様として登録します。
            </Form.Text>
          </Form.Group>
          {loading && <ProgressBar now={progress} label={`${progress}%`} animated className="mb-3" />}
          {message && <Alert variant={message.type} onClose={() => setMessage(null)} dismissible>{message.text}</Alert>}
          <Button variant="secondary" className="w-100" onClick={handleUpload} disabled={loading || !file}>インポート開始</Button>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ImportHooks;