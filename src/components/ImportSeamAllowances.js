// src/components/ImportSeamAllowances.js
import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import Papa from 'papaparse';
import { Container, Form, Button, Alert, ProgressBar, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const ImportSeamAllowances = () => {
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
            // ジアス品番がないデータはスキップ
            if (!item['ジアス品番']) continue;

            // コードは文字列として扱い、必要なら0埋めする（今回はそのまま文字列として保存）
            // CSVの仕様によっては "1001" となってしまう場合があるため、6桁0埋めを推奨します
            let code = String(item['ジアス品番']).trim();
            if (code.length < 6) {
                code = code.padStart(6, '0');
            }
            
            const specData = {
              code: code,
              name: item['名称'] || null,
              marginFactor: Number(item['ゆとり係数']) || 0,
              verticalLengthAllowance: Number(item['縦使い丈縫代']) || 0,
              horizontalLengthAllowance: Number(item['横使い丈縫代']) || 0,
              verticalWidthAllowance: Number(item['縦使い巾縫代']) || 0,
              horizontalWidthAllowance: Number(item['横使い巾縫代']) || 0,
              updatedAt: serverTimestamp()
            };

            // sewing_specs コレクションに保存
            const docRef = doc(db, "sewing_specs", code);
            await setDoc(docRef, specData, { merge: true });

            count++;
            setProgress(Math.round((count / data.length) * 100));
          }
          setMessage({ type: 'success', text: `縫い代マスタ インポート完了: ${count}件` });
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
        <Card.Header className="bg-info text-white">縫い代 CSVインポート</Card.Header>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>縫い代CSV（ジアス品番）</Form.Label>
            <Form.Control type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} disabled={loading} />
          </Form.Group>
          {loading && <ProgressBar now={progress} label={`${progress}%`} animated className="mb-3" />}
          {message && <Alert variant={message.type} onClose={() => setMessage(null)} dismissible>{message.text}</Alert>}
          <Button variant="info" className="w-100 text-white" onClick={handleUpload} disabled={loading || !file}>インポート開始</Button>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ImportSeamAllowances;