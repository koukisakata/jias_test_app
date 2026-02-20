import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query } from 'firebase/firestore'; // limit を削除
import { useNavigate } from 'react-router-dom';
import { Container, Table, Button, Spinner, Card, Badge, Modal, Row, Col, Tabs, Tab } from 'react-bootstrap';

// --- マッピング定義開始 (前回と同じ) ---
const CODE_MAPS = {
  productType: {
    '1': '生地', '2': 'レール', '3': 'ブラケット', '4': 'フカサケ', '5': 'メカ物',
    '11': 'トリム', '12': 'バイアステープ', '13': 'サンテープ', '19': '他副資材', '21': '物販品', '99': 'その他'
  },
  taxType: { '0': '課税', '1': '非課税' },
  arrangementType: { '0': '発注しない', '1': '手配発注', '2': '資材発注' },
  departmentType: { '0': '対象外', '1': '工事部', '2': '工場', '3': '企画', '4': '営業' },
  unitCode: {
    '01': 'ｍ', '02': 'ｃｍ', '03': 'ｍｍ', '04': '台', '05': '本', '06': '個', '07': '式', '08': '点', '09': 'セット', '10': '巻',
    '11': '反', '12': 'ケース', '13': '組', '14': '袋', '15': 'パック', '16': '枚', '17': '丁', '18': '缶', '19': '箱', '20': '冊'
  },
  installationType: { '0': 'なし', '1': '正面付', '2': '天付' },
  designatedDeliveryType: { '0': 'なし', '1': 'ジアス便（自社便）', '2': 'ヤマト便', '3': '佐川急便' },
  hasAssembly: { '0': 'なし', '1': 'あり' },
  specCode: {
    '01': 'ドレープ', '02': 'レース', '03': 'ボイル', '04': 'ウェイトテープ付き', '05': 'ケースメント', '06': 'エバ柄'
  },
  defaultUsageType: { '1': '縦使い', '2': '横使い' },
  isAllowed: { '0': '不可', '1': '可能' },
  isPatternMatch: { '0': 'ノーマル柄', '1': 'エバ柄' },
  defaultTasselColorCode: { '01': '白', '02': 'ピンク', '03': 'ベージュ', '04': 'グレー' },
  defaultHemCode: {
    '01': '100W', '02': '120W', '03': '70W', '04': '90W', '05': '20W', '06': '30W', '07': '50W',
    '10': '100S', '11': '110S', '12': '120S', '13': '130S', '14': '140S', '15': '150S', '16': '160S', '17': '170S', '18': '180S', '19': '190S',
    '20': '200S', '21': '210S', '22': '220S', '23': '230S', '24': '240S', '25': '250S', '26': '260S', '27': '270S', '28': '280S', '29': '290S',
    '30': '300S', '31': '310S', '32': '320S', '33': '330S', '34': '340S', '35': '350S', '36': '360S', '37': '370S', '38': '380S', '39': '390S', '40': '400S', '99': '-'
  },
  isFireProofProcessed: { '0': '未加工', '1': '加工済' },
  shapeMemoryIconCode: {
    '01': 'J-1', '02': 'J-2', '03': 'J-3', '04': 'J-4', '05': 'J-5', '06': 'J-6', '07': 'J-7', '08': 'J-8', '09': 'J-9', '10': 'J-10',
    '11': 'J-11', '12': 'J-12', '13': 'J-13', '14': 'J-14', '15': 'J-15', '16': 'J-16', '17': 'J-17',
    '21': 'D-1J', '22': 'D-2J', '23': 'D-3J', '24': 'D-4J', '25': 'D-5J', '26': 'D-6J', '27': 'D-7J', '28': 'D-8J', '29': 'D-9J', '30': 'D-10J',
    '31': 'D-11J', '32': 'D-12J', '33': 'D-13J', '34': 'D-14J', '35': 'D-15J', '36': 'D-16J', '37': 'D-17J', '38': 'D-18J', '39': 'D-19J',
    '41': 'JD-1', '42': 'JD-2', '43': 'JD-3', '44': 'JD-4', '45': 'JD-5', '46': 'JD-6', '47': 'JD-7', '48': 'JD-8', '49': 'JD-9', '50': 'JD-10',
    '51': 'JD-11', '52': 'JD-12', '53': 'JD-13', '54': 'JD-14', '55': 'JD-15', '56': 'JD-16', '57': 'JD-17', '58': 'JD-18P', '59': 'JD-19P', '60': 'JD-20P',
    '61': 'JD-21', '62': 'JD-22', '63': 'JD-23', '64': 'JD-24', '65': 'JD-25', '66': 'JD-26', '67': 'JD-27', '68': 'JD-28', '69': 'JD-29P', '70': 'JD-30P',
    '71': 'JD-31P', '72': 'JD-32', '73': 'JD-33P'
  },
  makerCode: {
    '01': 'ジアス', '02': 'サンゲツヴォーヌ', '03': 'リリカラ', '04': '川島織物セルコン', '05': 'シンコール', '07': 'スミノエ', '08': 'フジエテキスタイル', '09': 'トーソー', '10': '立川ブラインド工業',
    '11': 'ニチベイ', '12': '東リ', '13': '小島電機工業', '14': 'バクマ工業', '15': '東洋紡フェアトーン', '16': 'トーソーサービス', '17': '三光商事', '18': '東邦繊維興業', '19': 'ナカガミ糸業',
    '20': '笠原細巾織物', '21': '積水ハウス', '22': '山田照明', '23': '杉本電機産業', '24': '筑波産商', '25': 'ミューハウスエンジニアリング', '26': '新明電材', '27': '藤栄',
    '28': 'アズマ電機興業', '29': 'アスワン', '30': 'ヤマト電機', '31': 'マナトレーディング', '32': 'キロニー', '33': '坂井レース', '34': 'アイリスオーヤマ', '35': 'ムサシ電機', '36': 'FEDE',
    '37': 'ドリームベット', '38': 'TOSO OEM', '39': '古賀企画', '40': 'エイムデザイン', '41': '日本ハウジングサービス', '42': 'ナニックジャパン', '43': '日本フクラ', '44': '光製作所',
    '45': '大塚家具', '46': 'サンゲツ', '49': '中村工芸', '50': 'ナガノインテリア工業', '51': 'IMATEX', '52': 'Stieger', '53': '大彌リビング', '54': 'トーソー（在庫）', '55': '日本フィスバ',
    '56': '五洋インテックス', '57': 'ボルドインテックス', '58': '石川電気', '59': 'セイキ総業', '60': 'ロジスパック', '61': '富士包装資材', '62': '粕谷紙器工業', '63': 'ユニテック パロマ', '64': 'イマイ',
    '65': '立川機工', '66': 'リバコトレーディング', '67': 'タカダ・トランスポートサービス', '68': 'シスコムネット', '69': '朝日木材加工', '70': '吉桂', '71': 'ガラントジャパン', '72': '岡田電気産業',
    '73': 'サフラン電機', '74': '中村設備', '75': 'シラカワ', '76': '柏木工', '77': 'エスティック', '78': 'シモンズ', '79': '国際ロジテック', '80': 'アイシン精機', '81': '日本引越センター',
    '82': '飛騨産業', '83': 'スキャンデックス', '84': 'ナノケアワン', '85': 'ｽﾘｰｴｽｺｰﾎﾟﾚｰｼｮﾝ', '86': 'ｶｼﾜﾌﾞｯｻﾝ', '87': 'ｴｺﾃｯｸ', '88': 'ｴｽｹｰ住宅ｻｰﾋﾞｽ', '89': 'ミサワホーム', '90': '国際ﾛｼﾞﾃｯｸ',
    '91': 'マテリアルエード', '92': 'インテルグロー', '98': 'ジアスＥＣ', '99': '-'
  },
  currencyCode: { '01': '＄｜ドル', '02': '€｜ユーロ', '03': '₣｜フラン', '04': '£｜ポンド', '05': '￥｜円' },
  brandCode: { '01': 'CL', '02': 'JC', '03': 'JD', '04': 'JH', '05': 'JL', '06': 'TH', '07': 'TX' },
  managementType: { '0': '在庫管理しない', '1': '在庫管理する' },
  originCountryCode: {
    '01': 'アメリカ', '02': 'イタリア', '03': 'オーストラリア', '04': 'オランダ', '05': 'スイス', '06': 'スコットランド', '07': 'スペイン', '08': 'タイ', '09': 'ドイツ', '10': 'トルコ',
    '11': 'フランス', '12': 'ベルギー', '13': 'ポルトガル', '14': 'インド', '15': 'スウェーデン', '16': 'デンマーク', '17': 'イギリス', '18': 'ベトナム', '19': '中国', '20': '台湾',
    '21': '日本', '22': '韓国'
  },
  specialProductType: {
    '0': '対象外', '1': 'カーテンBOX', '2': '電動レール', '3': 'メカ', '4': '傾斜メカ', '5': 'バランスレール', '6': '経木スダレ', '7': 'メカもの出窓連携', '8': 'バーチカルブラインド',
    '21': '紐引きレール', '22': '吊レール', '23': 'アコーディオン', '24': 'パネルドア', '25': '木製バーチカル'
  },
  stepPatternType: { '0': 'ノーマル柄', '1': 'ステップ柄', '2': 'ハーフステップ柄' },
  sewingMethodCode: {
    '01': '本縫い', '02': '本縫い２', '03': '被せ縫い', '04': '掬い縫い', '05': '掬い縫い２', '06': '無双縫い',
    '11': '本縫いS', '12': '本縫いL', '13': '本縫いJ', '14': '本縫いI', '15': '本縫いECO', '16': '本縫いSE', '17': '本縫いPremium', '18': '本縫いPremiumクッション専用', '19': 'リリカラ特殊縫製',
    '20': '本縫い介護用', '21': '裏地付本縫い', '22': '裏地付本縫い２', '23': '裏地付被せ縫い', '24': '裏地付掬い縫い', '25': '裏地付掬い縫い２', '26': '裏地付Premium',
    '41': 'メロー仕上げ', '42': 'メロー仕上げ２', '51': 'オリジナル家具縫製', '91': 'セレクト縫製', '99': '-'
  },
  defaultInstallMethodCode: {
    '01': '正面シングル', '02': '正面ダブル', '03': '正面メカ', '04': '枠内天付シングル', '05': '枠内天付ダブル', '06': '枠内天付メカ',
    '07': '天井天付シングル', '08': '天井天付ダブル', '09': '天井天付メカ', '10': 'BOX内天付シングル', '11': 'BOX内天付ダブル', '12': 'BOX内天付メカ',
    '13': '枠内天付シングル窓寄せ', '14': '枠内天付ダブル窓寄せ', '15': '枠内天付メカ窓寄せ', '16': '枠内天付シングル手前', '17': '枠内天付ダブル手前', '18': '枠内天付メカ手前',
    '19': '枠内突張りメカ', '90': '区分無視'
  },
  defaultRollLockType: { '0': 'しない', '1': 'する' },
  isRetailPriceHidden: { '0': '表示', '1': '非表示' }
};
// --- マッピング定義終了 ---


const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // limit(100) を削除して全件取得に変更
        const q = query(collection(db, "productData")); 
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        data.sort((a, b) => a.productCode.localeCompare(b.productCode));
        setProducts(data);
      } catch (error) {
        console.error("データの取得に失敗しました:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleShowDetail = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const handleCloseDetail = () => {
    setShowModal(false);
    setSelectedProduct(null);
  };

  const formatCode = (mapName, val) => {
    if (val === null || val === undefined || val === '') return <span className="text-muted">-</span>;

    // Boolean値のハンドリング
    let searchKey = String(val);
    if (typeof val === 'boolean') {
      searchKey = val ? '1' : '0';
    }

    const map = CODE_MAPS[mapName];
    if (map && map[searchKey]) {
      return `${map[searchKey]}(${searchKey})`;
    }
    return val;
  };

  const renderValue = (val) => {
    if (val === null || val === undefined || val === '') return <span className="text-muted">-</span>;
    if (typeof val === 'boolean') return val ? <Badge bg="success">YES</Badge> : <Badge bg="secondary">NO</Badge>;
    if (val?.seconds) return new Date(val.seconds * 1000).toLocaleDateString();
    return val;
  };

  return (
    <Container className="mt-5" fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>商品マスタ一覧 (全件)</h2>
        <Button variant="secondary" onClick={() => navigate('/')}>
          &lt; メニューに戻る
        </Button>
      </div>

      {loading ? (
        <div className="text-center mt-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : (
        <Card>
          <Card.Body>
            <Table striped bordered hover responsive size="sm">
              <thead className="bg-light">
                <tr>
                  <th style={{width: '60px'}}>操作</th>
                  <th>品番</th>
                  <th>商品区分</th>
                  <th>名称</th>
                  <th>上代</th>
                  <th>分類1</th>
                  <th>生地巾</th>
                  <th>在庫管理</th>
                </tr>
              </thead>
              <tbody>
                {products.map((item) => (
                  <tr key={item.id}>
                    <td className="text-center">
                      <Button variant="outline-primary" size="sm" onClick={() => handleShowDetail(item)}>
                        詳細
                      </Button>
                    </td>
                    <td><strong>{item.productCode}</strong></td>
                    <td>{formatCode('productType', item.productType)}</td>
                    <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                    </td>
                    <td className="text-end">
                        {item.retailPrice ? `¥${item.retailPrice.toLocaleString()}` : '-'}
                    </td>
                    <td>{item.classification?.category1 || '-'}</td>
                    <td>
                        {item.fabricSpecs?.retailWidth || '-'} / {item.fabricSpecs?.costWidth || '-'}
                    </td>
                    <td className="text-center">
                        {formatCode('managementType', item.inventory?.managementType)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className="mt-3 text-end text-muted">
              表示件数: {products.length} 件
            </div>
          </Card.Body>
        </Card>
      )}

      {/* 詳細表示モーダル */}
      <Modal show={showModal} onHide={handleCloseDetail} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>商品詳細: {selectedProduct?.productCode}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProduct && (
            <Tabs defaultActiveKey="basic" id="product-detail-tabs" className="mb-3">
              
              <Tab eventKey="basic" title="基本情報・分類">
                <Row>
                  <Col md={6}>
                    <Card className="mb-3">
                      <Card.Header>基本情報</Card.Header>
                      <Card.Body>
                        <Table size="sm" bordered>
                          <tbody>
                            <tr><th>品番</th><td>{selectedProduct.productCode}</td></tr>
                            <tr><th>商品区分</th><td><strong>{formatCode('productType', selectedProduct.productType)}</strong></td></tr>
                            <tr><th>名称</th><td>{selectedProduct.name}</td></tr>
                            <tr><th>略称</th><td>{selectedProduct.shortName}</td></tr>
                            <tr><th>上代</th><td>{renderValue(selectedProduct.retailPrice)}</td></tr>
                            <tr><th>標準掛率</th><td>{renderValue(selectedProduct.standardRate)}</td></tr>
                            <tr><th>単位コード</th><td>{formatCode('unitCode', selectedProduct.unitCode)}</td></tr>
                            <tr><th>課税区分</th><td>{formatCode('taxType', selectedProduct.taxType)}</td></tr>
                            <tr><th>販売期間</th><td>{renderValue(selectedProduct.salesPeriodFrom)} ～ {renderValue(selectedProduct.salesPeriodTo)}</td></tr>
                            <tr><th>削除区分</th><td>{renderValue(selectedProduct.isDeleted)}</td></tr>
                            <tr><th>上代非表示</th><td>{formatCode('isRetailPriceHidden', selectedProduct.others?.isRetailPriceHidden)}</td></tr>
                          </tbody>
                        </Table>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="mb-3">
                      <Card.Header>分類情報</Card.Header>
                      <Card.Body>
                        <Table size="sm" bordered>
                          <tbody>
                            <tr><th>分類1</th><td>{renderValue(selectedProduct.classification?.category1)}</td></tr>
                            <tr><th>分類2</th><td>{renderValue(selectedProduct.classification?.category2)}</td></tr>
                            <tr><th>分類3</th><td>{renderValue(selectedProduct.classification?.category3)}</td></tr>
                            <tr><th>分類4</th><td>{renderValue(selectedProduct.classification?.category4)}</td></tr>
                            <tr><th>分類5</th><td>{renderValue(selectedProduct.classification?.category5)}</td></tr>
                            <tr><th>掛率分類</th><td>{renderValue(selectedProduct.classification?.rateClassCode)}</td></tr>
                            <tr><th>INDEX</th><td>{selectedProduct.others?.searchIndex}</td></tr>
                          </tbody>
                        </Table>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Tab>

              <Tab eventKey="order" title="発注・在庫・レール">
                <Row>
                  <Col md={6}>
                    <Card className="mb-3">
                      <Card.Header>発注情報</Card.Header>
                      <Card.Body>
                        <Table size="sm" bordered>
                          <tbody>
                            <tr><th>手配区分</th><td>{formatCode('arrangementType', selectedProduct.ordering?.arrangementType)}</td></tr>
                            <tr><th>発注部門</th><td>{formatCode('departmentType', selectedProduct.ordering?.departmentType)}</td></tr>
                            <tr><th>発注単位</th><td>{formatCode('unitCode', selectedProduct.ordering?.orderUnitCode)}</td></tr>
                            <tr><th>通貨</th><td>{formatCode('currencyCode', selectedProduct.originalFabric?.currencyCode)}</td></tr>
                            <tr><th>メーカー</th><td>{formatCode('makerCode', selectedProduct.ordering?.makerCode)} ({selectedProduct.ordering?.makerPartNumber})</td></tr>
                            <tr><th>仕入先</th><td>{renderValue(selectedProduct.ordering?.standardSupplierCode)}</td></tr>
                            <tr><th>発注単価</th><td>{renderValue(selectedProduct.ordering?.orderPrice)}</td></tr>
                            <tr><th>仕入掛率</th><td>{renderValue(selectedProduct.ordering?.purchaseRate)}</td></tr>
                            <tr><th>リードタイム</th><td>{renderValue(selectedProduct.ordering?.leadTime)}</td></tr>
                          </tbody>
                        </Table>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="mb-3">
                      <Card.Header>在庫・レール</Card.Header>
                      <Card.Body>
                        <Table size="sm" bordered>
                          <tbody>
                            <tr><th>在庫管理</th><td>{formatCode('managementType', selectedProduct.inventory?.managementType)}</td></tr>
                            <tr><th>在庫品番</th><td>{renderValue(selectedProduct.inventory?.partNumber)}</td></tr>
                            <tr><th>評価単価</th><td>{renderValue(selectedProduct.inventory?.evaluationPrice)}</td></tr>
                            <tr><th colSpan="2" className="bg-light">レール情報</th></tr>
                            <tr><th>ビス位置</th><td>{renderValue(selectedProduct.rail?.screwPositionToKan)}</td></tr>
                            <tr><th>サイズ</th><td>{renderValue(selectedProduct.rail?.railSize)}</td></tr>
                            <tr><th>取付区分</th><td>{formatCode('installationType', selectedProduct.rail?.installationType)}</td></tr>
                            <tr><th>取付方法初期値</th><td>{formatCode('defaultInstallMethodCode', selectedProduct.others?.defaultInstallMethodCode)}</td></tr>
                          </tbody>
                        </Table>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Tab>

              <Tab eventKey="fabric" title="生地・スペック">
                <Row>
                  <Col md={12}>
                    <Card className="mb-3">
                      <Card.Header>生地仕様</Card.Header>
                      <Card.Body>
                        <Row>
                          <Col md={6}>
                            <Table size="sm" bordered>
                              <tbody>
                                <tr><th>生地特性CD</th><td>{formatCode('specCode', selectedProduct.fabricSpecs?.specCode)}</td></tr>
                                <tr><th>上代生地巾</th><td>{renderValue(selectedProduct.fabricSpecs?.retailWidth)}</td></tr>
                                <tr><th>原価生地巾</th><td>{renderValue(selectedProduct.fabricSpecs?.costWidth)}</td></tr>
                                <tr><th>リピート(縦/横)</th><td>{renderValue(selectedProduct.fabricSpecs?.repeatVertical)} / {renderValue(selectedProduct.fabricSpecs?.repeatHorizontal)}</td></tr>
                                <tr><th>使い区分初期値</th><td>{formatCode('defaultUsageType', selectedProduct.fabricSpecs?.defaultUsageType)}</td></tr>
                                <tr><th>タッセル色</th><td>{formatCode('defaultTasselColorCode', selectedProduct.fabricSpecs?.defaultTasselColorCode)}</td></tr>
                                <tr><th>裾返コード</th><td>{formatCode('defaultHemCode', selectedProduct.fabricSpecs?.defaultHemCode)}</td></tr>
                              </tbody>
                            </Table>
                          </Col>
                          <Col md={6}>
                            <Table size="sm" bordered>
                              <tbody>
                                <tr><th>縦使い</th><td>{formatCode('isAllowed', selectedProduct.fabricSpecs?.isVerticalUseAllowed)}</td></tr>
                                <tr><th>横使い</th><td>{formatCode('isAllowed', selectedProduct.fabricSpecs?.isHorizontalUseAllowed)}</td></tr>
                                <tr><th>エバ柄</th><td>{formatCode('isPatternMatch', selectedProduct.fabricSpecs?.isPatternMatch)}</td></tr>
                                <tr><th>フリル</th><td>{formatCode('isAllowed', selectedProduct.fabricSpecs?.isFrillAllowed)}</td></tr>
                                <tr><th>PF可能</th><td>{formatCode('isAllowed', selectedProduct.fabricSpecs?.isPFAllowed)}</td></tr>
                                <tr><th>BW可能</th><td>{formatCode('isAllowed', selectedProduct.fabricSpecs?.isBWAllowed)}</td></tr>
                                <tr><th>防炎ラベル</th><td>{formatCode('isAllowed', selectedProduct.fabricSpecs?.isFireLabelAttachable)}</td></tr>
                                <tr><th>防炎加工</th><td>{formatCode('isFireProofProcessed', selectedProduct.fabricSpecs?.isFireProofProcessed)}</td></tr>
                                <tr><th>スチーム</th><td>{formatCode('isAllowed', selectedProduct.fabricSpecs?.isSteamAllowed)}</td></tr>
                              </tbody>
                            </Table>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                    <Card className="mb-3">
                      <Card.Header>その他スペック</Card.Header>
                      <Card.Body>
                        <div className="d-flex gap-3 flex-wrap">
                            <div><strong>組立品有無:</strong> {formatCode('hasAssembly', selectedProduct.specs?.hasAssembly)}</div>
                            <div><strong>指定配送便:</strong> {formatCode('designatedDeliveryType', selectedProduct.specs?.designatedDeliveryType)}</div>
                            <div><strong>スタイル仕様巾:</strong> {renderValue(selectedProduct.specs?.styleSpecWidth)}</div>
                            <div><strong>巻きロック初期値:</strong> {formatCode('defaultRollLockType', selectedProduct.others?.defaultRollLockType)}</div>
                            <div><strong>特殊商品:</strong> {formatCode('specialProductType', selectedProduct.qualityLabel?.specialProductType)}</div>
                            <div><strong>ステップ柄:</strong> {formatCode('stepPatternType', selectedProduct.qualityLabel?.stepPatternType)}</div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Tab>

              <Tab eventKey="quality" title="品質・その他">
                <Card className="mb-3">
                  <Card.Header>品質表示・機能</Card.Header>
                  <Card.Body>
                    <Table size="sm" bordered>
                      <tbody>
                        <tr><th>絵表示(有)</th><td>{formatCode('shapeMemoryIconCode', selectedProduct.fabricSpecs?.shapeMemoryIconCode)}</td></tr>
                        <tr><th>絵表示(無)</th><td>{formatCode('shapeMemoryIconCode', selectedProduct.fabricSpecs?.noShapeMemoryIconCode)}</td></tr>
                        <tr><th>組成</th><td>{selectedProduct.qualityLabel?.composition1} / {selectedProduct.qualityLabel?.composition2}</td></tr>
                        <tr><th>ブランド</th><td>{formatCode('brandCode', selectedProduct.originalFabric?.brandCode)}</td></tr>
                        <tr><th>原産国</th><td>{formatCode('originCountryCode', selectedProduct.qualityLabel?.originCountryCode)}</td></tr>
                        <tr><th>対応機能</th>
                          <td>
                            {selectedProduct.qualityLabel?.supportedFunctions?.map((f, i) => (
                              <Badge key={i} bg="info" className="me-1" style={{fontWeight:'normal'}}>{f}</Badge>
                            ))}
                          </td>
                        </tr>
                        <tr><th>縫い方1</th><td>{formatCode('sewingMethodCode', selectedProduct.qualityLabel?.sewingMethodCode1)}</td></tr>
                        <tr><th>縫い方2</th><td>{formatCode('sewingMethodCode', selectedProduct.qualityLabel?.sewingMethodCode2)}</td></tr>
                        <tr><th>縫い方3</th><td>{formatCode('sewingMethodCode', selectedProduct.qualityLabel?.sewingMethodCode3)}</td></tr>
                        <tr><th>縫い方4</th><td>{formatCode('sewingMethodCode', selectedProduct.qualityLabel?.sewingMethodCode4)}</td></tr>
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>

                <Card className="mb-3">
                  <Card.Header>コメント・備考</Card.Header>
                  <Card.Body>
                    <Table size="sm" bordered>
                      <tbody>
                        <tr><th>コメント</th><td>{selectedProduct.fabricSpecs?.comment1} {selectedProduct.fabricSpecs?.comment2} {selectedProduct.fabricSpecs?.comment3}</td></tr>
                        <tr><th>特記事項</th><td>{selectedProduct.qualityLabel?.specialNote1} {selectedProduct.qualityLabel?.specialNote2} {selectedProduct.qualityLabel?.specialNote3}</td></tr>
                        <tr><th>商品注意</th><td>{selectedProduct.others?.productWarningComment}</td></tr>
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Tab>

            </Tabs>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDetail}>
            閉じる
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ProductList;