import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import Papa from 'papaparse';
import { Container, Form, Button, Alert, ProgressBar, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const ImportOffices = () => {
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
            if (!item.officeCode && !item['営業所コード']) continue;

            const officeCode = String(item.officeCode || item['営業所コード']);
            
            const officeData = {
              officeCode: officeCode,
              name: item.name || item['名称'] || null,
              shortName: item.shortName || item['略称'] || null,
              searchIndex: item.searchIndex || item['索引'] || null,
              postalCode: item.postalCode || item['郵便番号'] || null,
              address1: item.address1 || item['住所１'] || null,
              address2: item.address2 || item['住所２'] || null,
              address3: item.address3 || item['住所３'] || null,
              phoneNumber: item.phoneNumber || item['電話番号'] || null,
              faxNumber: item.faxNumber || item['ＦＡＸ番号'] || null,
              constructionDeptCode: item.constructionDeptCode || item['工事部コード'] || null,
              generalSewingTeamCode: item.generalSewingTeamCode || item['一般工務店本縫い縫製チームコード'] || null,
              massRetailerSewingTeamCode: item.massRetailerSewingTeamCode || item['量販店本縫い縫製チームコード'] || null,
              styleSewingTeamCode: item.styleSewingTeamCode || item['スタイル縫製チームコード'] || null,
              mechSewingTeamCode: item.mechSewingTeamCode || item['メカ縫製チームコード'] || null,
              estimateStatus: item.estimateStatus || item['概算確定可能区分'] || null,
              specialDiscountLimit: item.specialDiscountLimit || item['特別値引率上限'] || null,
              salesMarginUpperLimit: item.salesMarginUpperLimit || item['営業粗利率上限'] || null,
              salesMarginLowerLimit: item.salesMarginLowerLimit || item['営業粗利率下限'] || null,
              bankAccount1: item.bankAccount1 || item['振込口座情報１'] || null,
              bankAccount2: item.bankAccount2 || item['振込口座情報２'] || null,
              bankAccount3: item.bankAccount3 || item['振込口座情報３'] || null,
              bankAccount4: item.bankAccount4 || item['振込口座情報４'] || null,
              identificationSymbol: item.identificationSymbol || item['識別記号'] || null,
              tollFreeNumber: item.tollFreeNumber || item['フリーダイヤル'] || null,
              updatedAt: serverTimestamp()
            };

            const docRef = doc(db, "offices", officeCode);
            await setDoc(docRef, officeData, { merge: true });

            count++;
            setProgress(Math.round((count / data.length) * 100));
          }
          setMessage({ type: 'success', text: `営業所インポート完了: ${count}件` });
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
        <Card.Header className="bg-info text-white">営業所 CSVインポート</Card.Header>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>営業所マスタCSV</Form.Label>
            <Form.Control type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} disabled={loading} />
          </Form.Group>
          {loading && <ProgressBar now={progress} label={`${progress}%`} animated className="mb-3" />}
          {message && <Alert variant={message.type} onClose={() => setMessage(null)} dismissible>{message.text}</Alert>}
          <Button variant="info" className="text-white w-100" onClick={handleUpload} disabled={loading || !file}>インポート開始</Button>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ImportOffices;