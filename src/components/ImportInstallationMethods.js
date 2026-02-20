// src/components/ImportInstallationMethods.js
import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import Papa from 'papaparse';
import { Container, Form, Button, Alert, ProgressBar, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const ImportInstallationMethods = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const handleUpload = () => {
    if (!file) { setMessage({ type: 'danger', text: 'ファイルを選択してください。' }); return; }
    setLoading(true);

    // ヘッダーなしで読み込んで、行ごとの配列として処理する
    Papa.parse(file, {
      header: false, // 重要: ヘッダーとして扱わない
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;
        
        if (rows.length < 3) {
            setMessage({ type: 'danger', text: 'データ形式が正しくありません（行数が不足しています）。' });
            setLoading(false);
            return;
        }

        // 1行目 (index 0): スタイルコード行 (011001, 011002...)
        const styleCodeRow = rows[0];
        // 2行目 (index 1): 日本語ヘッダー行 (取付方法コード, 名称...)
        // 3行目以降 (index 2~): データ行

        let count = 0;

        try {
          // 3行目からデータとしてループ処理
          for (let i = 2; i < rows.length; i++) {
            const row = rows[i];
            
            // 0列目: コード, 1列目: 名称 と仮定
            // ※CSVの列ズレ防止のため、空行などはスキップ
            if (!row[0] || !row[1]) continue;

            const methodCode = String(row[0]);
            const methodName = String(row[1]);

            const supportedSpecs = [];

            // 2列目以降（スタイルコード部分）を走査
            for (let j = 2; j < row.length; j++) {
                // 値が "1" なら対応
                if (String(row[j]).trim() === '1') {
                    // 対応する1行目のコードを取得
                    const targetStyleCode = styleCodeRow[j];
                    if (targetStyleCode) {
                        supportedSpecs.push(String(targetStyleCode).trim());
                    }
                }
            }

            const data = {
              code: methodCode,
              name: methodName,
              supportedSpecs: supportedSpecs,
              updatedAt: serverTimestamp()
            };

            const docRef = doc(db, "installation_methods", methodCode);
            await setDoc(docRef, data, { merge: true });

            count++;
            setProgress(Math.round(((i - 1) / (rows.length - 2)) * 100));
          }
          setMessage({ type: 'success', text: `取付方法マスタ インポート完了: ${count}件` });
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
        <Card.Header className="bg-primary text-white">取付方法 CSVインポート</Card.Header>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>取付方法マスタCSV</Form.Label>
            <Form.Control type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} disabled={loading} />
            <Form.Text className="text-muted">
              ※1行目にスタイルコード、2行目にヘッダー、3行目以降にデータがある形式に対応しています。
            </Form.Text>
          </Form.Group>
          {loading && <ProgressBar now={progress} label={`${progress}%`} animated className="mb-3" />}
          {message && <Alert variant={message.type} onClose={() => setMessage(null)} dismissible>{message.text}</Alert>}
          <Button variant="primary" className="w-100" onClick={handleUpload} disabled={loading || !file}>インポート開始</Button>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ImportInstallationMethods;