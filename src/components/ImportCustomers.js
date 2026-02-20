// src/components/ImportCustomers.js
import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import Papa from 'papaparse';
import { Container, Form, Button, Alert, ProgressBar, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const ImportCustomers = () => {
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
            // 得意先コードがないデータはスキップ
            if (!item['得意先コード']) continue;

            const customerCode = String(item['得意先コード']);
            
            const customerData = {
              // --- 基本情報 ---
              customerCode: customerCode,
              mainCustomerCode: item['得意先メインコード'] || null,
              subCustomerCode: item['得意先サブコード'] || null,
              contactPerson: item['先方担当者名'] || null,
              paymentReconciliationTargetType: item['入金消込対象区分'] || null,
              businessCategoryType: item['一般工務店量販店区分'] || null,
              newStatusType: item['新規区分'] || null,
              fbDataCreationType: item['ＦＢデータ作成区分'] || null,
              masterSearchTargetType: item['マスタ検索対象区分'] || null,

              // --- 名称 (Map) ---
              customerName: {
                customerName1: item['名称１'] || null,
                customerName2: item['名称２'] || null,
                shortName: item['略称'] || null,
                searchIndex: item['索引'] || null,
              },

              // --- 現住所 (Map) ---
              currentAddress: {
                postalCode: item['現住所郵便番号'] || null,
                address1: item['現住所住所１'] || null,
                address2: item['現住所住所２'] || null,
                address3: item['現住所住所３'] || null,
                tel: item['現住所電話番号'] || null,
                fax: item['現住所ＦＡＸ番号'] || null,
              },

              // --- 新住所 (Map) ---
              newAddress: {
                postalCode: item['新住所郵便番号'] || null,
                address1: item['新住所住所１'] || null,
                address2: item['新住所住所２'] || null,
                address3: item['新住所住所３'] || null,
                tel: item['新住所電話番号'] || null,
                fax: item['新住所ＦＡＸ番号'] || null,
              },

              // --- 得意先区分 (Map) ---
              customerType: {
                customerRateClassCode: item['得意先掛率分類コード'] || null,
                customerType: item['得意先種別区分'] || null,
                customerCategoryCode1: item['得意先分類コード１'] || null,
                customerCategoryCode2: item['得意先分類コード２'] || null,
                customerCategoryCode3: item['得意先分類コード３'] || null,
                customerCategoryCode4: item['得意先分類コード４'] || null,
                customerCategoryCode5: item['得意先分類コード５'] || null,
                customerCategoryCode6: item['得意先分類コード６'] || null,
                customerCategoryCode7: item['得意先分類コード７'] || null,
                customerCategoryCode8: item['得意先分類コード８'] || null,
                customerCategoryCode9: item['得意先分類コード９'] || null,
                constructionCostType: item['施工費区分'] || null,
              },

              // --- 売掛管理項目 (Map) ---
              billing: {
                type: item['請求先区分'] || null,
                code: item['請求先コード'] || null,
                method: item['請求方法区分'] || null,
                closingDate: item['締日'] || null,
                paymentCycle: item['入金サイクル'] || null,
                paymentDate: item['入金日'] || null,
                creditLimit: item['与信限度額'] ? Number(item['与信限度額']) : null,
                transferFeePatternCode: item['振込手数料パターンコード'] || null,
                transferFeePayerType: item['振込手数料負担区分'] || null,
                creditLimitUpdateDate: item['与信限度額更新日'] || null,
              },

              // --- 量販管理項目 (Map) ---
              massRetailerManagementItem: {
                massRetailerBillingStandardType: item['量販請求基準区分'] || null,
                receiptDateInputTarget: item['受領日入力対象'] || null,
                itemConversionRefCustomerCode: item['品番変換参照得意先コード'] || null,
                companyStoreCode: item['社店コード'] || null,
                taxType: item['課税区分'] || null,
                taxRoundingType: item['消費税端数処理区分'] || null,
                taxCalculationType: item['消費税算出区分'] || null,
                amountRoundingType: item['金額端数処理区分'] || null,
                salesSlipLineCount: item['売上伝票行数'] || null,
              },

              // --- 紹介先管理項目 (Map) ---
              referral: {
                type: item['紹介先区分'] || null,
                code: item['紹介先コード'] || null,
                hasCommission: item['紹介料有無区分'] || null,
                rate: item['紹介料率'] || null,
                referralFeeRoundingType: item['紹介料端数処理区分'] || null,
                referralFeePaymentTermType: item['紹介料締支払区分'] || null,
                referralFeePaymentDate: item['紹介料支払日'] || null,
                bankCode: item['金融機関コード'] || null,
                branchCode: item['金融機関支店コード'] || null,
                accountType: item['口座区分'] || null,
                accountNumber: item['口座番号'] || null,
                accountHolderName: item['口座名義'] || null,
                recipientName: item['受取人名'] || null,
                referralFeeRegNumDisplayType: item['紹介料登録番号表示区分'] || null,
                referralFeeConstructionCostExclusionType: item['紹介料施工費対象外区分'] || null,
                referralFeeTargetTaxType: item['紹介料対象額税区分'] || null,
              },

              // --- 担当 (Map) ---
              salesRep: {
                officeCode: item['担当営業所コード'] || null,
                repCode: item['営業担当者コード'] || null,
                prevSalesRepChangeDate: item['前回担当者変更日'] || null,
                prevSalesOfficeCode: item['前任担当営業所コード'] || null,
                prevSalesRepCode: item['前任営業担当者コード'] || null,
                secondPrevSalesRepChangeDate: item['前々回担当者変更日'] || null,
                secondPrevSalesOfficeCode: item['前々任担当営業所コード'] || null,
                secondPrevSalesRepCode: item['前々任営業担当者コード'] || null,
              },

              // --- 企業情報 (Map) ---
              companyInfo: {
                corporateNumber: item['企業番号'] || null,
                registrationNumber: item['登録番号'] || null,
                tdbScore: item['帝国データ点数'] || null,
                tdbAcquisitionDate: item['帝国データ取得日'] || null,
              },

              // --- その他 (Map) ---
              others: {
                specialNote1: item['特記事項１'] || null,
                specialNote2: item['特記事項２'] || null,
                specialNote3: item['特記事項３'] || null,
                specialNote4: item['特記事項４'] || null,
                specialNote5: item['特記事項５'] || null,
                defaultShipToCode: item['標準出荷先コード'] || null,
                quotationPaymentTerms: item['見積書支払条件'] || null,
              },

              updatedAt: serverTimestamp()
            };

            // customers コレクションに保存
            const docRef = doc(db, "customers", customerCode);
            await setDoc(docRef, customerData, { merge: true });

            count++;
            setProgress(Math.round((count / data.length) * 100));
          }
          setMessage({ type: 'success', text: `得意先マスタ インポート完了: ${count}件` });
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
        <Card.Header className="bg-primary text-white">得意先 CSVインポート (DB構成対応版)</Card.Header>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>得意先マスタCSV</Form.Label>
            <Form.Control type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} disabled={loading} />
          </Form.Group>
          {loading && <ProgressBar now={progress} label={`${progress}%`} animated className="mb-3" />}
          {message && <Alert variant={message.type} onClose={() => setMessage(null)} dismissible>{message.text}</Alert>}
          <Button variant="primary" className="w-100" onClick={handleUpload} disabled={loading || !file}>インポート開始</Button>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ImportCustomers;