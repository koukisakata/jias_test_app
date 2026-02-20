// src/components/ImportPleats.js
import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import Papa from 'papaparse';
import { Container, Form, Button, Alert, ProgressBar, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const ImportPleats = () => {
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
            // 日本語ヘッダーの改行コードが含まれる場合があるので、柔軟にキーを探す
            // "ヒダ\n種類\nコード" のようなキーを探してIDとする
            const codeKey = Object.keys(item).find(k => k.includes('ヒダ') && k.includes('コード'));
            if (!codeKey || !item[codeKey]) continue;

            const code = String(item[codeKey]);
            
            // 名称などを取得（改行が含まれていてもキーワードで検索）
            const nameKey = Object.keys(item).find(k => k.includes('名称'));
            const stdKey = Object.keys(item).find(k => k.includes('標準'));
            const minKey = Object.keys(item).find(k => k.includes('最小'));
            const maxKey = Object.keys(item).find(k => k.includes('最大'));

            const supportedSpecs = [];
            
            // 行の全キーを走査して対応仕様を抽出
            Object.keys(item).forEach((key) => {
              // 基本フィールド以外をチェック
              if (key !== codeKey && key !== nameKey && key !== stdKey && key !== minKey && key !== maxKey) {
                if (String(item[key]).trim() === '1') {
                  // ヘッダーから数字部分（仕様コード）を抽出
                  const match = key.match(/^(\d+)/);
                  if (match) {
                    supportedSpecs.push(match[1]);
                  }
                }
              }
            });

            const pleatData = {
              code: code,
              name: item[nameKey] || null,
              standardRate: Number(item[stdKey]) || 0,
              minRate: Number(item[minKey]) || 0,
              maxRate: Number(item[maxKey]) || 0,
              supportedSpecs: supportedSpecs,
              updatedAt: serverTimestamp()
            };

            const docRef = doc(db, "pleats", code);
            await setDoc(docRef, pleatData, { merge: true });

            count++;
            setProgress(Math.round((count / data.length) * 100));
          }
          setMessage({ type: 'success', text: `ヒダマスタ インポート完了: ${count}件` });
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
        <Card.Header className="bg-dark text-white">ヒダ種類 CSVインポート</Card.Header>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>ヒダ種類マスタCSV</Form.Label>
            <Form.Control type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} disabled={loading} />
          </Form.Group>
          {loading && <ProgressBar now={progress} label={`${progress}%`} animated className="mb-3" />}
          {message && <Alert variant={message.type} onClose={() => setMessage(null)} dismissible>{message.text}</Alert>}
          <Button variant="dark" className="w-100" onClick={handleUpload} disabled={loading || !file}>インポート開始</Button>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ImportPleats;