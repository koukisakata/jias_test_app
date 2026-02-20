import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import Papa from 'papaparse';
import { Container, Form, Button, Alert, ProgressBar, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const ImportProducts = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  // ヘルパー: 文字列を数値に変換
  const parseNumber = (value, defaultVal = 0) => {
    if (!value) return defaultVal;
    const num = Number(value.replace(/,/g, ''));
    return isNaN(num) ? defaultVal : num;
  };

  // ヘルパー: "1" または "TRUE" を Boolean に変換
  const parseBool = (value) => {
    if (!value) return false;
    const s = String(value).trim().toUpperCase();
    return s === '1' || s === 'TRUE';
  };

  // ヘルパー: 日付文字列を Timestamp に変換
  const parseDate = (value) => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : Timestamp.fromDate(d);
  };

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
            const pCode = item['品番'] || item['productCode'];
            if (!pCode) continue;

            const productCode = String(pCode);

            // --- 対応機能 (1~9) を配列にまとめる処理 ---
            const supportedFunctions = [];
            for (let i = 1; i <= 9; i++) {
              const funcVal = item[`対応機能${i}`];
              if (funcVal) {
                supportedFunctions.push(funcVal);
              }
            }

            const productData = {
              // --- 1. 基本情報 (Root) ---
              productCode: productCode,
              productType: item['商品区分'] || null,
              name: item['名称'] || null,
              shortName: item['略称'] || null,
              searchIndex: item['索引'] || null,
              unitCode: item['単位コード'] || null,
              retailPrice: parseNumber(item['上代']),
              standardRate: parseNumber(item['標準掛率']),
              isDeleted: parseBool(item['削除区分']),
              salesPeriodFrom: parseDate(item['販売可能期間FROM']),
              salesPeriodTo: parseDate(item['販売可能期間TO']),
              taxType: item['課税区分'] || null,
              
              // --- 2. 分類 ---
              classification: {
                category1: item['商品分類1'] || null,
                category2: item['商品分類2'] || null,
                category3: item['商品分類3'] || null,
                category4: item['商品分類4'] || null,
                category5: item['商品分類5'] || null,
                category6: item['商品分類6'] || null,
                category7: item['商品分類7'] || null,
                category8: item['商品分類8'] || null,
                category9: item['商品分類9'] || null,
                category10: item['商品分類10'] || null,
                rateClassCode: item['商品掛率分類コード'] || null,
              },

              // --- 3. 発注関連 ---
              ordering: {
                arrangementType: item['手配区分'] || null,
                departmentType: item['発注部門区分'] || null,
                orderUnitCode: item['発注単位コード'] || null,
                leadTime: item['発注リードタイム'] || null,
                makerCode: item['メーカーコード'] || null,
                standardSupplierCode: item['標準仕入先コード'] || null,
                makerPartNumber: item['メーカー品番'] || null,
                matrixRefPartNumber: item['マトリックス単価参照品番'] || null,
                orderPrice: parseNumber(item['発注単価']),
                purchaseRate: parseNumber(item['仕入掛率']),
              },

              // --- 4. レール ---
              rail: {
                screwPositionToKan: item['ビス位置〜カン'] || null,
                railSize: item['レールサイズ'] || null,
                installationType: item['取付区分'] || null,
              },

              // --- 5. その他スペック ---
              specs: {
                designatedDeliveryType: item['指定配送便区分'] || null,
                hasAssembly: parseBool(item['組立品有無区分']),
                styleSpecWidth: item['スタイル仕様巾'] || null,
              },

              // --- 6. 生地関連 ---
              fabricSpecs: {
                specCode: item['生地特製コード'] || null,
                retailWidth: parseNumber(item['上代生地巾']),
                costWidth: parseNumber(item['原価生地巾']),
                defaultUsageType: item['生地使い区分初期値'] || null,
                isVerticalUseAllowed: parseBool(item['縦使い可否区分']),
                isHorizontalUseAllowed: parseBool(item['横使い可否区分']),
                repeatVertical: parseNumber(item['縦リピート']),
                repeatHorizontal: parseNumber(item['横リピート']),
                isPatternMatch: parseBool(item['エバ柄区分']),
                isFrillAllowed: parseBool(item['フリル可否区分']),
                isPFAllowed: parseBool(item['PF可能区分']),
                isBWAllowed: parseBool(item['BW可能区分']),
                defaultTasselColorCode: item['タッセルループ色コード初期値'] || null,
                defaultHemCode: item['裾返コード初期値'] || null,
                isFireLabelAttachable: parseBool(item['防炎ラベル取付可否区分']),
                isFireProofProcessed: parseBool(item['防炎加工済区分']),
                shapeMemoryIconCode: item['形態安定加工有絵表示コード'] || null,
                noShapeMemoryIconCode: item['形態安定加工無絵表示コード'] || null,
                ironingTemperature: item['アイロン温度'] || null,
                isSteamAllowed: parseBool(item['スチーム可否区分']),
                comment1: item['コメント1'] || null,
                comment2: item['コメント2'] || null,
                comment3: item['コメント3'] || null,
              },

              // --- 7. オリジナル生地 ---
              originalFabric: {
                makerCode: item['オリジナル生地メーカーコード'] || null,
                supplierCode: item['オリジナル生地仕入先コード'] || null,
                developmentCode: item['開発コード(デザイン)'] || null,
                colorCode: item['色番'] || null,
                currencyCode: item['発注通貨コード'] || null,
                orderPrice: parseNumber(item['発注単価']),
                brandCode: item['ブランドコード'] || null,
              },

              // --- 8. 在庫関連 ---
              inventory: {
                managementType: item['在庫管理区分'] || null,
                evaluationPrice: parseNumber(item['在庫評価単価']),
                partNumber: item['在庫品番'] || null,
                scrapStandardMeter: parseNumber(item['端反基準M']),
              },

              // --- 9. 品質・尺角シール (qualityLabel) ---
              qualityLabel: {
                composition1: item['組成1'] || null,
                composition2: item['組成2'] || null,
                dimChangeWashVertical: item['寸法変化率 水洗いタテ'] || null,
                dimChangeWashHorizontal: item['寸法変化率 水洗いヨコ'] || null,
                dimChangeDryVertical: item['寸法変化率ドライタテ'] || null,
                dimChangeDryHorizontal: item['寸法変化率ドライヨコ'] || null,
                originCountryCode: item['原産国コード'] || null,
                shadingGrade: item['遮光階級'] || null,
                
                // ★ここを修正: func1~func9 を supportedFunctions 配列に統合
                supportedFunctions: supportedFunctions,
                
                handRaiseType: item['手上げ区分'] || null,
                specialProductType: item['特殊商品区分'] || null,
                specialNote1: item['特記事項1'] || null,
                specialNote2: item['特記事項2'] || null,
                specialNote3: item['特記事項3'] || null,
                stepPatternType: item['ステップ柄区分'] || null,
                processingTemperature: item['加工温度'] || null,
                threadNumber: item['糸番号'] || null,
                sewingMethodCode1: item['縫い方コード1'] || null,
                sewingMethodCode2: item['縫い方コード2'] || null,
                sewingMethodCode3: item['縫い方コード3'] || null,
                sewingMethodCode4: item['縫い方コード4'] || null,
              },

              // --- 10. その他 ---
              others: {
                standardPairPartNumber: item['標準ペア品番'] || null,
                defaultInstallMethodCode: item['レール取付方法コード初期値'] || null,
                colorName: item['色名'] || null,
                defaultRollLockType: item['巻きロック初期値区分'] || null,
                isRetailPriceHidden: parseBool(item['発注書上代非表示区分']),
                searchIndex: item['INDEX.1'] || null,
                searchRailName: item['検索レール名'] || null,
                capName: item['キャップ名'] || null,
                lightPartNumber: item['LIGHT品番'] || null,
                lightOperationMethod: item['LIGHT操作方法'] || null,
                lightType: item['LIGHT種類'] || null,
                otherOrderPart1: item['その他手配品1/セット名'] || null,
                otherOrderPart2: item['その他手配品2'] || null,
                otherOrderPart3: item['その他手配品3'] || null,
                productWarningComment: item['商品注意コメント'] || null,
                registeredLoginId: item['登録ログインID'] || null,
              },

              updatedAt: serverTimestamp()
            };

            const docRef = doc(db, "productData", productCode);
            await setDoc(docRef, productData, { merge: true });

            count++;
            setProgress(Math.round((count / data.length) * 100));
          }
          setMessage({ type: 'success', text: `商品マスタ インポート完了: ${count}件` });
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
        <Card.Header className="bg-primary text-white">商品マスタ CSVインポート</Card.Header>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>商品マスタCSV</Form.Label>
            <Form.Control type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} disabled={loading} />
            <Form.Text className="text-muted">
              ※品番をキーとして登録します。「対応機能1〜9」は配列として保存されます。
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

export default ImportProducts;