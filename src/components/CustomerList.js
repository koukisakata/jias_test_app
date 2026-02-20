// src/components/CustomerList.js
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Container, Table, Button, Form, Modal, Spinner, Badge, Row, Col, Tabs, Tab, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

// ★安全に値を表示するためのヘルパー関数
const safeRender = (value) => {
  if (value === null || value === undefined) return '';
  
  // オブジェクトの場合の処理
  if (typeof value === 'object') {
    // Firestore Timestampの場合 (secondsプロパティがあるかチェック)
    if (value.seconds !== undefined && value.toDate) {
      return value.toDate().toLocaleDateString();
    }
    // その他のオブジェクトの場合は、JSON文字列にして表示（デバッグ用）
    // エラーの原因となっているデータが画面に表示されるようになります
    return JSON.stringify(value);
  }
  
  // 文字列や数値はそのまま返す
  return value;
};

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const q = query(collection(db, "customers"), orderBy("customerCode"));
        const querySnapshot = await getDocs(q);
        const customerList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCustomers(customerList);
      } catch (error) {
        console.error("Error fetching customers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    // オプショナルチェーン (?.) と String() 変換で安全策をとる
    const code = String(customer.customerCode || '').toLowerCase();
    
    // customerName自体がオブジェクトでない場合やnullの場合を考慮
    const name1 = String(customer.customerName?.customerName1 || '').toLowerCase();
    const name2 = String(customer.customerName?.customerName2 || '').toLowerCase();
    
    return code.includes(searchLower) || name1.includes(searchLower) || name2.includes(searchLower);
  });

  const handleShowDetail = (customer) => {
    setSelectedCustomer(customer);
    setShowModal(true);
  };

  // InfoRow内でも safeRender を使用してエラーを防ぐ
  const InfoRow = ({ label, value }) => (
    <Row className="mb-2 border-bottom pb-1">
      <Col xs={5} className="text-muted small">{label}</Col>
      <Col xs={7} className="fw-bold text-break">{safeRender(value) || '-'}</Col>
    </Row>
  );

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>得意先一覧</h2>
        <div>
          <Button variant="secondary" onClick={() => navigate('/')}>
            メニューへ
          </Button>
        </div>
      </div>

      <Form.Control
        type="text"
        placeholder="検索 (コード または 名称)"
        className="mb-3"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {loading ? (
        <div className="text-center mt-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : (
        <Table striped bordered hover responsive>
          <thead className="bg-light">
            <tr>
              <th>コード</th>
              <th>得意先名</th>
              <th>電話番号</th>
              <th>担当者名</th>
              <th>区分</th>
              <th style={{ width: '100px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  {/* safeRenderを使ってここでのクラッシュも防ぐ */}
                  <td>{safeRender(customer.customerCode)}</td>
                  <td>
                    <div>{safeRender(customer.customerName?.customerName1)}</div>
                    <small className="text-muted">{safeRender(customer.customerName?.customerName2)}</small>
                  </td>
                  <td>{safeRender(customer.currentAddress?.tel)}</td>
                  <td>{safeRender(customer.contactPerson)}</td>
                  <td>
                    {customer.businessCategoryType === '一般工務店' && <Badge bg="info">工務店</Badge>}
                    {customer.businessCategoryType === '量販店' && <Badge bg="warning" text="dark">量販店</Badge>}
                  </td>
                  <td>
                    <Button size="sm" variant="primary" onClick={() => handleShowDetail(customer)}>
                      詳細
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center">データが見つかりません</td>
              </tr>
            )}
          </tbody>
        </Table>
      )}

      {/* 詳細表示モーダル */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            詳細情報: {safeRender(selectedCustomer?.customerName?.customerName1)}
            <span className="ms-3 fs-6 text-muted">({safeRender(selectedCustomer?.customerCode)})</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCustomer && (
            <Tabs defaultActiveKey="basic" id="customer-detail-tabs" className="mb-3">
              
              {/* --- 基本情報タブ --- */}
              <Tab eventKey="basic" title="基本情報">
                <Row>
                  <Col md={6}>
                    <Card className="mb-3">
                      <Card.Header>基本属性</Card.Header>
                      <Card.Body>
                        <InfoRow label="メインコード" value={selectedCustomer.mainCustomerCode} />
                        <InfoRow label="サブコード" value={selectedCustomer.subCustomerCode} />
                        <InfoRow label="先方担当者" value={selectedCustomer.contactPerson} />
                        <InfoRow label="入金消込対象" value={selectedCustomer.paymentReconciliationTargetType} />
                        <InfoRow label="業態区分" value={selectedCustomer.businessCategoryType} />
                        <InfoRow label="新規区分" value={selectedCustomer.newStatusType} />
                        <InfoRow label="FBデータ作成" value={selectedCustomer.fbDataCreationType} />
                        <InfoRow label="マスタ検索対象" value={selectedCustomer.masterSearchTargetType} />
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="mb-3">
                      <Card.Header>名称・索引</Card.Header>
                      <Card.Body>
                        <InfoRow label="名称1" value={selectedCustomer.customerName?.customerName1} />
                        <InfoRow label="名称2" value={selectedCustomer.customerName?.customerName2} />
                        <InfoRow label="略称" value={selectedCustomer.customerName?.shortName} />
                        <InfoRow label="索引" value={selectedCustomer.customerName?.searchIndex} />
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Card className="mb-3 h-100">
                      <Card.Header>現住所</Card.Header>
                      <Card.Body>
                        <InfoRow label="郵便番号" value={selectedCustomer.currentAddress?.postalCode} />
                        <InfoRow label="住所1" value={selectedCustomer.currentAddress?.address1} />
                        <InfoRow label="住所2" value={selectedCustomer.currentAddress?.address2} />
                        <InfoRow label="住所3" value={selectedCustomer.currentAddress?.address3} />
                        <InfoRow label="TEL" value={selectedCustomer.currentAddress?.tel} />
                        <InfoRow label="FAX" value={selectedCustomer.currentAddress?.fax} />
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="mb-3 h-100">
                      <Card.Header>新住所 (移転等)</Card.Header>
                      <Card.Body>
                        <InfoRow label="郵便番号" value={selectedCustomer.newAddress?.postalCode} />
                        <InfoRow label="住所1" value={selectedCustomer.newAddress?.address1} />
                        <InfoRow label="住所2" value={selectedCustomer.newAddress?.address2} />
                        <InfoRow label="住所3" value={selectedCustomer.newAddress?.address3} />
                        <InfoRow label="TEL" value={selectedCustomer.newAddress?.tel} />
                        <InfoRow label="FAX" value={selectedCustomer.newAddress?.fax} />
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Tab>

              {/* --- 取引・請求タブ --- */}
              <Tab eventKey="billing" title="取引・請求">
                <Row>
                  <Col md={6}>
                    <Card className="mb-3">
                      <Card.Header>売掛管理 (Billing)</Card.Header>
                      <Card.Body>
                        <InfoRow label="請求先区分" value={selectedCustomer.billing?.type} />
                        <InfoRow label="請求先コード" value={selectedCustomer.billing?.code} />
                        <InfoRow label="請求方法" value={selectedCustomer.billing?.method} />
                        <InfoRow label="締日" value={selectedCustomer.billing?.closingDate} />
                        <InfoRow label="入金サイクル" value={selectedCustomer.billing?.paymentCycle} />
                        <InfoRow label="入金日" value={selectedCustomer.billing?.paymentDate} />
                        <InfoRow label="与信限度額" value={selectedCustomer.billing?.creditLimit ? `${Number(selectedCustomer.billing.creditLimit).toLocaleString()}円` : '-'} />
                        <InfoRow label="限度額更新日" value={selectedCustomer.billing?.creditLimitUpdateDate} />
                        <InfoRow label="手数料パターン" value={selectedCustomer.billing?.transferFeePatternCode} />
                        <InfoRow label="手数料負担" value={selectedCustomer.billing?.transferFeePayerType} />
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="mb-3">
                      <Card.Header>得意先区分 (Classification)</Card.Header>
                      <Card.Body>
                        <InfoRow label="掛率分類" value={selectedCustomer.customerType?.customerRateClassCode} />
                        <InfoRow label="種別区分" value={selectedCustomer.customerType?.customerType} />
                        <InfoRow label="施工費区分" value={selectedCustomer.customerType?.constructionCostType} />
                        {[1,2,3,4,5].map(num => (
                          <InfoRow key={num} label={`分類コード${num}`} value={selectedCustomer.customerType?.[`customerCategoryCode${num}`]} />
                        ))}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Tab>

              {/* --- 量販・紹介タブ --- */}
              <Tab eventKey="sales" title="量販・紹介">
                <Row>
                   <Col md={6}>
                    <Card className="mb-3">
                      <Card.Header>量販管理項目</Card.Header>
                      <Card.Body>
                        <InfoRow label="請求基準" value={selectedCustomer.massRetailerManagementItem?.massRetailerBillingStandardType} />
                        <InfoRow label="受領日入力" value={selectedCustomer.massRetailerManagementItem?.receiptDateInputTarget} />
                        <InfoRow label="品番変換参照" value={selectedCustomer.massRetailerManagementItem?.itemConversionRefCustomerCode} />
                        <InfoRow label="社店コード" value={selectedCustomer.massRetailerManagementItem?.companyStoreCode} />
                        <InfoRow label="課税区分" value={selectedCustomer.massRetailerManagementItem?.taxType} />
                        <InfoRow label="消費税端数" value={selectedCustomer.massRetailerManagementItem?.taxRoundingType} />
                        <InfoRow label="消費税算出" value={selectedCustomer.massRetailerManagementItem?.taxCalculationType} />
                        <InfoRow label="金額端数" value={selectedCustomer.massRetailerManagementItem?.amountRoundingType} />
                        <InfoRow label="伝票行数" value={selectedCustomer.massRetailerManagementItem?.salesSlipLineCount} />
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="mb-3">
                      <Card.Header>紹介料管理</Card.Header>
                      <Card.Body>
                        <InfoRow label="紹介先区分" value={selectedCustomer.referral?.type} />
                        <InfoRow label="紹介先コード" value={selectedCustomer.referral?.code} />
                        <InfoRow label="紹介料有無" value={selectedCustomer.referral?.hasCommission} />
                        <InfoRow label="紹介料率" value={selectedCustomer.referral?.rate} />
                        <InfoRow label="金融機関" value={`${safeRender(selectedCustomer.referral?.bankCode)} - ${safeRender(selectedCustomer.referral?.branchCode)}`} />
                        <InfoRow label="口座番号" value={`${safeRender(selectedCustomer.referral?.accountType)} ${safeRender(selectedCustomer.referral?.accountNumber)}`} />
                        <InfoRow label="口座名義" value={selectedCustomer.referral?.accountHolderName} />
                        <InfoRow label="受取人名" value={selectedCustomer.referral?.recipientName} />
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Tab>

              {/* --- 会社・その他タブ --- */}
              <Tab eventKey="others" title="会社・その他">
                 <Row>
                  <Col md={6}>
                    <Card className="mb-3">
                      <Card.Header>営業担当・履歴</Card.Header>
                      <Card.Body>
                        <InfoRow label="担当営業所" value={selectedCustomer.salesRep?.officeCode} />
                        <InfoRow label="営業担当者" value={selectedCustomer.salesRep?.repCode} />
                        <hr />
                        {/* 日付がTimestampの場合でもsafeRenderが文字列に変換します */}
                        <InfoRow label="前回変更日" value={selectedCustomer.salesRep?.prevSalesRepChangeDate} />
                        <InfoRow label="前任営業所" value={selectedCustomer.salesRep?.prevSalesOfficeCode} />
                        <InfoRow label="前任担当者" value={selectedCustomer.salesRep?.prevSalesRepCode} />
                      </Card.Body>
                    </Card>
                    <Card className="mb-3">
                      <Card.Header>企業情報</Card.Header>
                      <Card.Body>
                        <InfoRow label="企業番号" value={selectedCustomer.companyInfo?.corporateNumber} />
                        <InfoRow label="登録番号" value={selectedCustomer.companyInfo?.registrationNumber} />
                        <InfoRow label="TDB点数" value={selectedCustomer.companyInfo?.tdbScore} />
                        <InfoRow label="TDB取得日" value={selectedCustomer.companyInfo?.tdbAcquisitionDate} />
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="mb-3">
                      <Card.Header>その他・特記事項</Card.Header>
                      <Card.Body>
                        <InfoRow label="標準出荷先" value={selectedCustomer.others?.defaultShipToCode} />
                        <InfoRow label="見積支払条件" value={selectedCustomer.others?.quotationPaymentTerms} />
                        <hr />
                        {[1,2,3,4,5].map(num => (
                          <InfoRow key={num} label={`特記事項${num}`} value={selectedCustomer.others?.[`specialNote${num}`]} />
                        ))}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Tab>

            </Tabs>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            閉じる
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CustomerList;