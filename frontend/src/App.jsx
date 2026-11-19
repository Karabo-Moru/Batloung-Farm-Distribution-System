
import { useEffect, useState } from 'react';
import './App.css';
import Payments from './Payments';

const API = 'http://localhost:5000/api';

const emptySupplierForm = {
  business_name: '',
  contact_person: '',
  phone: '',
  province: '',
  address: ''
};

const emptyFruitForm = {
  fruit_name: '',
  description: '',
  status: 'Available'
};

const emptyVendorForm = {
  vendor_name: '',
  phone_number: '',
  location: ''
};

const emptyPurchaseItem = {
  fruit_id: '',
  packaging_size: 'Small',
  quantity: 1,
  unit_cost: 0
};

const emptySaleItem = {
  fruit_id: '',
  packaging_size: 'Small',
  quantity: 1
};

function App() {
  const [activePage, setActivePage] = useState('Dashboard');

  const [stats, setStats] = useState({
    fruits: 0,
    suppliers: 0,
    vendors: 0,
    stock: 0
  });

  const [suppliers, setSuppliers] = useState([]);
  const [fruits, setFruits] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [stock, setStock] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [showLowStock, setShowLowStock] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [supplierForm, setSupplierForm] = useState(emptySupplierForm);
  const [fruitForm, setFruitForm] = useState(emptyFruitForm);
  const [vendorForm, setVendorForm] = useState(emptyVendorForm);

  // Purchase form state
  const [purchaseSupplier, setPurchaseSupplier] = useState('');
  const [purchaseItems, setPurchaseItems] = useState([
    { ...emptyPurchaseItem }
  ]);
  const [purchaseResult, setPurchaseResult] = useState(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  // Sales form state
  const [saleVendors, setSaleVendors] = useState([]);
  const [saleStock, setSaleStock] = useState([]);
  const [saleVendor, setSaleVendor] = useState('');
  const [saleItems, setSaleItems] = useState([{ ...emptySaleItem }]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountPaid, setAmountPaid] = useState('0');
  const [saleResult, setSaleResult] = useState(null);
  const [saleLoading, setSaleLoading] = useState(false);
  const [salesLoading, setSalesLoading] = useState(false);

  // Reports state
  const today = new Date().toLocaleDateString('en-CA');
  const monthStart = `${today.slice(0, 7)}-01`;

  const [topFruits, setTopFruits] = useState([]);
  const [topVendor, setTopVendor] = useState(null);
  const [reportStock, setReportStock] = useState([]);
  const [revenueReport, setRevenueReport] = useState(null);
  const [startDate, setStartDate] = useState(monthStart);
  const [endDate, setEndDate] = useState(today);
  const [reportsLoading, setReportsLoading] = useState(false);

  async function loadDashboard() {
    try {
      const [fruitData, supplierData, vendorData, stockData] =
        await Promise.all([
          fetch(`${API}/fruits`).then(res => res.json()),
          fetch(`${API}/suppliers`).then(res => res.json()),
          fetch(`${API}/vendors`).then(res => res.json()),
          fetch(`${API}/stock`).then(res => res.json())
        ]);

      setStats({
        fruits: Array.isArray(fruitData) ? fruitData.length : 0,
        suppliers: Array.isArray(supplierData) ? supplierData.length : 0,
        vendors: Array.isArray(vendorData) ? vendorData.length : 0,
        stock: Array.isArray(stockData)
          ? stockData.reduce(
              (total, item) => total + Number(item.available_quantity),
              0
            )
          : 0
      });
    } catch (error) {
      console.error('Dashboard loading failed:', error);
    }
  }

  async function loadSuppliers() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API}/suppliers`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load suppliers');
      }

      setSuppliers(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadFruits() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API}/fruits`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load fruits');
      }

      setFruits(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadVendors() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API}/vendors`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load vendors');
      }

      setVendors(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadStock() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API}/stock`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load stock');
      }

      setStock(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadLowStock() {
    try {
      const response = await fetch(`${API}/stock/low-stock`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load low stock');
      }

      setLowStock(data);
    } catch (error) {
      setError(error.message);
    }
  }

  async function searchVendors(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!searchTerm.trim()) {
      await loadVendors();
      return;
    }

    try {
      const response = await fetch(
        `${API}/vendors/search?search=${encodeURIComponent(searchTerm)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Vendor search failed');
      }

      setVendors(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadPurchaseData() {
    setLoading(true);
    setError('');

    try {
      const [supplierResponse, fruitResponse] = await Promise.all([
        fetch(`${API}/suppliers`),
        fetch(`${API}/fruits`)
      ]);

      const supplierData = await supplierResponse.json();
      const fruitData = await fruitResponse.json();

      if (!supplierResponse.ok) {
        throw new Error(
          supplierData.message || 'Failed to load suppliers'
        );
      }

      if (!fruitResponse.ok) {
        throw new Error(
          fruitData.message || 'Failed to load fruits'
        );
      }

      setSuppliers(supplierData);
      setFruits(fruitData);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadSalesData() {
    setSalesLoading(true);
    setError('');

    try {
      const response = await fetch(`${API}/sales/form-data`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to load sales information'
        );
      }

      setSaleVendors(data.vendors || []);
      setSaleStock(data.stock || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setSalesLoading(false);
    }
  }

  async function loadReports() {
    setReportsLoading(true);
    setError('');

    try {
      if (!startDate || !endDate || startDate > endDate) {
        throw new Error('Please select a valid date range.');
      }

      const revenueUrl =
        `${API}/reports/revenue?start_date=${startDate}&end_date=${endDate}`;

      const [
        topFruitsResponse,
        topVendorResponse,
        stockResponse,
        revenueResponse
      ] = await Promise.all([
        fetch(`${API}/reports/top-fruits`),
        fetch(`${API}/reports/top-vendor`),
        fetch(`${API}/reports/stock`),
        fetch(revenueUrl)
      ]);

      const [
        topFruitsData,
        topVendorData,
        stockData,
        revenueData
      ] = await Promise.all([
        topFruitsResponse.json(),
        topVendorResponse.json(),
        stockResponse.json(),
        revenueResponse.json()
      ]);

      if (
        !topFruitsResponse.ok ||
        !topVendorResponse.ok ||
        !stockResponse.ok ||
        !revenueResponse.ok
      ) {
        throw new Error(
          topFruitsData.message ||
          topVendorData.message ||
          stockData.message ||
          revenueData.message ||
          'Failed to load reports.'
        );
      }

      setTopFruits(topFruitsData);
      setTopVendor(
        topVendorData.vendor_id ? topVendorData : null
      );
      setReportStock(stockData);
      setRevenueReport(revenueData);
    } catch (error) {
      setError(error.message);
    } finally {
      setReportsLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    setMessage('');
    setError('');
    setShowForm(false);
    setEditingId(null);
    setSearchTerm('');

    if (activePage === 'Suppliers') loadSuppliers();
    if (activePage === 'Fruits') loadFruits();
    if (activePage === 'Vendors') loadVendors();

    if (activePage === 'Stock') {
      setShowLowStock(false);
      loadStock();
      loadLowStock();
    }

    if (activePage === 'Purchases') {
      setPurchaseSupplier('');
      setPurchaseItems([{ ...emptyPurchaseItem }]);
      setPurchaseResult(null);
      loadPurchaseData();
    }

    if (activePage === 'Sales') {
      setSaleVendor('');
      setSaleItems([{ ...emptySaleItem }]);
      setPaymentMethod('Cash');
      setAmountPaid('0');
      setSaleResult(null);
      loadSalesData();
    }

    if (activePage === 'Reports') {
      loadReports();
    }

    if (activePage === 'Dashboard') loadDashboard();
  }, [activePage]);

  const menuItems = [
    'Dashboard',
    'Suppliers',
    'Fruits',
    'Vendors',
    'Stock',
    'Purchases',
    'Sales',
    'Reports',
    'Payments'
  ];

  function handleSupplierInput(event) {
    setSupplierForm({
      ...supplierForm,
      [event.target.name]: event.target.value
    });
  }

  function handleFruitInput(event) {
    setFruitForm({
      ...fruitForm,
      [event.target.name]: event.target.value
    });
  }

  function handleVendorInput(event) {
    setVendorForm({
      ...vendorForm,
      [event.target.name]: event.target.value
    });
  }

  function openAddSupplier() {
    setSupplierForm(emptySupplierForm);
    setEditingId(null);
    setMessage('');
    setError('');
    setShowForm(true);
  }

  function openEditSupplier(supplier) {
    setSupplierForm({
      business_name: supplier.business_name,
      contact_person: supplier.contact_person,
      phone: supplier.phone,
      province: supplier.province,
      address: supplier.address
    });

    setEditingId(supplier.supplier_id);
    setMessage('');
    setError('');
    setShowForm(true);
  }

  function openAddFruit() {
    setFruitForm(emptyFruitForm);
    setEditingId(null);
    setMessage('');
    setError('');
    setShowForm(true);
  }

  function openEditFruit(fruit) {
    setFruitForm({
      fruit_name: fruit.fruit_name,
      description: fruit.description || '',
      status: fruit.status
    });

    setEditingId(fruit.fruit_id);
    setMessage('');
    setError('');
    setShowForm(true);
  }

  function openAddVendor() {
    setVendorForm(emptyVendorForm);
    setEditingId(null);
    setMessage('');
    setError('');
    setShowForm(true);
  }

  function openEditVendor(vendor) {
    setVendorForm({
      vendor_name: vendor.vendor_name,
      phone_number: vendor.phone_number,
      location: vendor.location
    });

    setEditingId(vendor.vendor_id);
    setMessage('');
    setError('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setSupplierForm(emptySupplierForm);
    setFruitForm(emptyFruitForm);
    setVendorForm(emptyVendorForm);
  }

  async function handleSupplierSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    const url = editingId
      ? `${API}/suppliers/${editingId}`
      : `${API}/suppliers`;

    const method = editingId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierForm)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Operation failed');
      }

      setMessage(
        editingId
          ? 'Supplier updated successfully!'
          : 'Supplier added successfully!'
      );

      closeForm();
      await loadSuppliers();
      await loadDashboard();
    } catch (error) {
      setError(error.message);
    }
  }

  async function handleFruitSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    const url = editingId
      ? `${API}/fruits/${editingId}`
      : `${API}/fruits`;

    const method = editingId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fruitForm)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Operation failed');
      }

      setMessage(
        editingId
          ? 'Fruit updated successfully!'
          : 'Fruit added successfully!'
      );

      closeForm();
      await loadFruits();
      await loadDashboard();
    } catch (error) {
      setError(error.message);
    }
  }

  async function handleVendorSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    const url = editingId
      ? `${API}/vendors/${editingId}`
      : `${API}/vendors`;

    const method = editingId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vendorForm)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Operation failed');
      }

      setMessage(
        editingId
          ? 'Vendor updated successfully!'
          : 'Vendor registered successfully!'
      );

      closeForm();
      setSearchTerm('');
      await loadVendors();
      await loadDashboard();
    } catch (error) {
      setError(error.message);
    }
  }

  // Custom delete confirmation
  function openDeleteModal(type, id) {
    setDeleteItem({ type, id });
    setShowDeleteModal(true);
  }

  function closeDeleteModal() {
    if (deleteLoading) return;

    setShowDeleteModal(false);
    setDeleteItem(null);
  }

  async function confirmDelete() {
    if (!deleteItem || deleteLoading) return;

    setDeleteLoading(true);
    setMessage('');
    setError('');

    try {
      const { type, id } = deleteItem;
      const endpoint = type === 'supplier' ? 'suppliers' : 'fruits';

      const response = await fetch(`${API}/${endpoint}/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || `Failed to delete ${type}`
        );
      }

      setShowDeleteModal(false);
      setDeleteItem(null);

      setMessage(
        `${type === 'supplier' ? 'Supplier' : 'Fruit'} deleted successfully!`
      );

      if (type === 'supplier') {
        await loadSuppliers();
      } else {
        await loadFruits();
      }

      await loadDashboard();
    } catch (error) {
      setError(error.message);
    } finally {
      setDeleteLoading(false);
    }
  }

  // Purchase form functions
  function handlePurchaseItemChange(index, field, value) {
    setPurchaseItems(currentItems =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: value }
          : item
      )
    );
  }

  function addPurchaseItem() {
    setPurchaseItems(currentItems => [
      ...currentItems,
      { ...emptyPurchaseItem }
    ]);
  }

  function removePurchaseItem(index) {
    setPurchaseItems(currentItems =>
      currentItems.filter((item, itemIndex) => itemIndex !== index)
    );
  }

  const purchaseTotal = purchaseItems.reduce((total, item) => {
    const quantity = Number(item.quantity) || 0;
    const unitCost = Number(item.unit_cost) || 0;

    return total + quantity * unitCost;
  }, 0);

  async function handlePurchaseSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    setPurchaseResult(null);

    if (!purchaseSupplier) {
      setError('Please select a supplier.');
      return;
    }

    if (purchaseItems.length === 0) {
      setError('Please add at least one purchase item.');
      return;
    }

    for (const item of purchaseItems) {
      if (
        !item.fruit_id ||
        !['Small', 'Medium', 'Large'].includes(item.packaging_size) ||
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) <= 0 ||
        !Number.isFinite(Number(item.unit_cost)) ||
        Number(item.unit_cost) < 0
      ) {
        setError(
          'Please complete every purchase item with a valid fruit, packaging size, quantity and unit cost.'
        );
        return;
      }
    }

    setPurchaseLoading(true);

    try {
      const response = await fetch(`${API}/purchases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          supplier_id: Number(purchaseSupplier),
          items: purchaseItems.map(item => ({
            fruit_id: Number(item.fruit_id),
            packaging_size: item.packaging_size,
            quantity: Number(item.quantity),
            unit_cost: Number(item.unit_cost)
          }))
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Purchase failed');
      }

      setPurchaseResult(data);
      setMessage(data.message || 'Purchase recorded successfully!');

      setPurchaseSupplier('');
      setPurchaseItems([{ ...emptyPurchaseItem }]);

      await loadStock();
      await loadLowStock();
      await loadDashboard();
    } catch (error) {
      setError(error.message);
    } finally {
      setPurchaseLoading(false);
    }
  }

  // Sales form functions
  function handleSaleItemChange(index, field, value) {
    setSaleItems(currentItems =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: value }
          : item
      )
    );
  }

  function addSaleItem() {
    setSaleItems(currentItems => [
      ...currentItems,
      { ...emptySaleItem }
    ]);
  }

  function removeSaleItem(index) {
    setSaleItems(currentItems =>
      currentItems.filter((item, itemIndex) => itemIndex !== index)
    );
  }

  function getSaleStockItem(item) {
    return saleStock.find(
      stockItem =>
        Number(stockItem.fruit_id) === Number(item.fruit_id) &&
        stockItem.packaging_size === item.packaging_size
    );
  }

  function getSaleLineTotal(item) {
    const stockItem = getSaleStockItem(item);

    if (!stockItem || stockItem.unit_price === null) {
      return 0;
    }

    return Number(item.quantity || 0) *
      Number(stockItem.unit_price || 0);
  }

  const saleTotal = saleItems.reduce(
    (total, item) => total + getSaleLineTotal(item),
    0
  );

  const numericAmountPaid = Number(amountPaid) || 0;

  const remainingBalance = Math.max(
    0,
    saleTotal - numericAmountPaid
  );

  let calculatedPaymentStatus = 'UNPAID';

  if (saleTotal > 0 && numericAmountPaid === saleTotal) {
    calculatedPaymentStatus = 'PAID';
  } else if (numericAmountPaid > 0 && numericAmountPaid < saleTotal) {
    calculatedPaymentStatus = 'PARTIALLY_PAID';
  }

  async function handleSaleSubmit(event) {
    event.preventDefault();

    setMessage('');
    setError('');
    setSaleResult(null);

    if (!saleVendor) {
      setError('Please select a vendor.');
      return;
    }

    if (saleItems.length === 0) {
      setError('Please add at least one sale item.');
      return;
    }

    for (const item of saleItems) {
      if (
        !item.fruit_id ||
        !['Small', 'Medium', 'Large'].includes(item.packaging_size) ||
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) <= 0
      ) {
        setError(
          'Please complete every sale item with a fruit, packaging size and valid quantity.'
        );
        return;
      }

      const selectedStock = getSaleStockItem(item);

      if (!selectedStock) {
        setError(
          'A selling price is not available for one of the selected items.'
        );
        return;
      }

      if (
        Number(item.quantity) >
        Number(selectedStock.available_quantity)
      ) {
        setError(
          `Not enough stock for ${selectedStock.fruit_name} (${selectedStock.packaging_size}). Available: ${selectedStock.available_quantity}.`
        );
        return;
      }
    }

    if (saleTotal <= 0) {
      setError('The sale total must be greater than zero.');
      return;
    }

    if (
      !Number.isFinite(numericAmountPaid) ||
      numericAmountPaid < 0
    ) {
      setError('Please enter a valid amount paid.');
      return;
    }

    if (numericAmountPaid > saleTotal) {
      setError('Amount paid cannot be greater than the sale total.');
      return;
    }

    setSaleLoading(true);

    try {
      const response = await fetch(`${API}/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vendor_id: Number(saleVendor),
          payment_method: paymentMethod,
          amount_paid: numericAmountPaid,
          items: saleItems.map(item => ({
            fruit_id: Number(item.fruit_id),
            packaging_size: item.packaging_size,
            quantity: Number(item.quantity)
          }))
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || 'Sale could not be recorded'
        );
      }

      setSaleResult(data);
      setMessage(data.message || 'Sale recorded successfully!');

      setSaleVendor('');
      setSaleItems([{ ...emptySaleItem }]);
      setPaymentMethod('Cash');
      setAmountPaid('0');

      await loadSalesData();
      await loadStock();
      await loadLowStock();
      await loadDashboard();
    } catch (error) {
      setError(error.message);
    } finally {
      setSaleLoading(false);
    }
  }

  const displayedStock = showLowStock ? lowStock : stock;

  const totalStock = stock.reduce(
    (total, item) => total + Number(item.available_quantity),
    0
  );

  const lowStockCount = lowStock.length;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">BF</div>
          <div>
            <h2>Batloung Farm</h2>
            <p>Distribution System</p>
          </div>
        </div>

        <p className="menu-heading">MAIN MENU</p>

        <nav>
          {menuItems.map(item => (
            <button
              key={item}
              className={
                activePage === item ? 'menu-item active' : 'menu-item'
              }
              onClick={() => setActivePage(item)}
            >
              <span>{item}</span>
              <span className="menu-arrow">›</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="profile-circle">BF</div>
          <div>
            <strong>Farm Admin</strong>
            <p>Administrator</p>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="breadcrumb">Pages / {activePage}</p>
            <h1>{activePage}</h1>
          </div>

          <div className="topbar-right">
            <span className="system-status">
              <span className="status-dot"></span>
              System Online
            </span>
            <div className="admin-avatar">A</div>
          </div>
        </header>

        {activePage === 'Dashboard' ? (
          <section className="dashboard">
            <div className="welcome-banner">
              <div>
                <p className="welcome-label">
                  BATLOUNG FARM DISTRIBUTION
                </p>
                <h2>Welcome to your dashboard</h2>
                <p>
                  Manage your fruits, suppliers, vendors and daily operations.
                </p>
              </div>
              <div className="banner-decoration">BF</div>
            </div>

            <div className="section-heading">
              <div>
                <h2>Business Overview</h2>
                <p>Current information from your database</p>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-top">
                  <span>Total Fruits</span>
                  <span className="stat-icon green">F</span>
                </div>
                <h3>{stats.fruits}</h3>
                <p>Registered fruit types</p>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <span>Total Suppliers</span>
                  <span className="stat-icon orange">S</span>
                </div>
                <h3>{stats.suppliers}</h3>
                <p>Registered suppliers</p>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <span>Total Vendors</span>
                  <span className="stat-icon blue">V</span>
                </div>
                <h3>{stats.vendors}</h3>
                <p>Registered vendors</p>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <span>Available Stock</span>
                  <span className="stat-icon purple">ST</span>
                </div>
                <h3>{stats.stock}</h3>
                <p>Total units available</p>
              </div>
            </div>

            <div className="bottom-grid">
              <div className="information-card">
                <h2>System Information</h2>
                <p>
                  Your distribution system is connected to the database.
                </p>

                <div className="information-row">
                  <span>Backend API</span>
                  <strong className="online-text">Connected</strong>
                </div>

                <div className="information-row">
                  <span>Database</span>
                  <strong className="online-text">MySQL</strong>
                </div>

                <div className="information-row">
                  <span>Application</span>
                  <strong>Batloung Farm</strong>
                </div>
              </div>

              <div className="information-card quick-actions">
                <h2>Quick Navigation</h2>
                <p>Choose a section to manage your business.</p>

                <div className="quick-buttons">
                  {['Fruits', 'Suppliers', 'Vendors', 'Stock'].map(item => (
                    <button
                      key={item}
                      onClick={() => setActivePage(item)}
                    >
                      {item} <span>›</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : activePage === 'Suppliers' ? (
          <section className="suppliers-page">
            <div className="section-heading">
              <div>
                <h2>Supplier Management</h2>
                <p>View and manage your registered suppliers.</p>
              </div>

              <button className="primary-button" onClick={openAddSupplier}>
                + Add Supplier
              </button>
            </div>

            {message && <p className="success-message">{message}</p>}
            {error && <p className="error-message">{error}</p>}

            {showForm && (
              <div className="modal-overlay" onClick={closeForm}>
                <div
                  className="supplier-form-card modal-content"
                  onClick={event => event.stopPropagation()}
                >
                  <div className="form-heading">
                    <h2>
                      {editingId ? 'Edit Supplier' : 'Add New Supplier'}
                    </h2>
                    <button
                      className="close-button"
                      onClick={closeForm}
                      type="button"
                    >
                      ×
                    </button>
                  </div>

                  <form onSubmit={handleSupplierSubmit}>
                    <div className="supplier-form-grid">
                      <label>
                        Business Name
                        <input
                          name="business_name"
                          value={supplierForm.business_name}
                          onChange={handleSupplierInput}
                          required
                        />
                      </label>

                      <label>
                        Contact Person
                        <input
                          name="contact_person"
                          value={supplierForm.contact_person}
                          onChange={handleSupplierInput}
                          required
                        />
                      </label>

                      <label>
                        Phone Number
                        <input
                          name="phone"
                          value={supplierForm.phone}
                          onChange={handleSupplierInput}
                          required
                        />
                      </label>

                      <label>
                        Province
                        <input
                          name="province"
                          value={supplierForm.province}
                          onChange={handleSupplierInput}
                          required
                        />
                      </label>

                      <label className="full-width">
                        Address
                        <input
                          name="address"
                          value={supplierForm.address}
                          onChange={handleSupplierInput}
                          required
                        />
                      </label>
                    </div>

                    <div className="form-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={closeForm}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="primary-button">
                        {editingId ? 'Save Changes' : 'Add Supplier'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="supplier-table-card">
              <div className="table-heading">
                <div>
                  <h2>Registered Suppliers</h2>
                  <p>{suppliers.length} suppliers found</p>
                </div>
                <button
                  className="secondary-button"
                  onClick={loadSuppliers}
                >
                  Refresh
                </button>
              </div>

              {loading ? (
                <p className="table-message">Loading suppliers...</p>
              ) : suppliers.length === 0 ? (
                <p className="table-message">No suppliers found.</p>
              ) : (
                <div className="table-container">
                  <table className="supplier-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Business Name</th>
                        <th>Contact Person</th>
                        <th>Phone</th>
                        <th>Province</th>
                        <th>Address</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suppliers.map(supplier => (
                        <tr key={supplier.supplier_id}>
                          <td>{supplier.supplier_id}</td>
                          <td>{supplier.business_name}</td>
                          <td>{supplier.contact_person}</td>
                          <td>{supplier.phone}</td>
                          <td>{supplier.province}</td>
                          <td>{supplier.address}</td>
                          <td>
                            <div className="table-actions">
                              <button
                                className="edit-button"
                                onClick={() => openEditSupplier(supplier)}
                              >
                                Edit
                              </button>
                              <button
                                className="delete-button"
                                onClick={() =>
                                  openDeleteModal('supplier', supplier.supplier_id)
                                }
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        ) : activePage === 'Fruits' ? (
          <section className="suppliers-page">
            <div className="section-heading">
              <div>
                <h2>Fruit Management</h2>
                <p>
                  View and manage the fruits supplied by Batloung Farm.
                </p>
              </div>
              <button className="primary-button" onClick={openAddFruit}>
                + Add Fruit
              </button>
            </div>

            {message && <p className="success-message">{message}</p>}
            {error && <p className="error-message">{error}</p>}

            {showForm && (
              <div className="modal-overlay" onClick={closeForm}>
                <div
                  className="supplier-form-card modal-content"
                  onClick={event => event.stopPropagation()}
                >
                  <div className="form-heading">
                    <h2>{editingId ? 'Edit Fruit' : 'Add New Fruit'}</h2>
                    <button
                      className="close-button"
                      onClick={closeForm}
                      type="button"
                    >
                      ×
                    </button>
                  </div>

                  <form onSubmit={handleFruitSubmit}>
                    <div className="supplier-form-grid">
                      <label>
                        Fruit Name
                        <input
                          name="fruit_name"
                          value={fruitForm.fruit_name}
                          onChange={handleFruitInput}
                          placeholder="Enter fruit name"
                          required
                        />
                      </label>

                      <label>
                        Description
                        <input
                          name="description"
                          value={fruitForm.description}
                          onChange={handleFruitInput}
                          placeholder="Enter fruit description"
                          required
                        />
                      </label>

                      <label>
                        Availability Status
                        <select
                          name="status"
                          value={fruitForm.status}
                          onChange={handleFruitInput}
                          required
                        >
                          <option value="Available">Available</option>
                          <option value="Unavailable">Unavailable</option>
                        </select>
                      </label>
                    </div>

                    <div className="form-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={closeForm}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="primary-button">
                        {editingId ? 'Save Changes' : 'Add Fruit'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="supplier-table-card">
              <div className="table-heading">
                <div>
                  <h2>Registered Fruits</h2>
                  <p>{fruits.length} fruits found</p>
                </div>
                <button className="secondary-button" onClick={loadFruits}>
                  Refresh
                </button>
              </div>

              {loading ? (
                <p className="table-message">Loading fruits...</p>
              ) : fruits.length === 0 ? (
                <p className="table-message">No fruits found.</p>
              ) : (
                <div className="table-container">
                  <table className="supplier-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Fruit Name</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fruits.map(fruit => (
                        <tr key={fruit.fruit_id}>
                          <td>{fruit.fruit_id}</td>
                          <td>{fruit.fruit_name}</td>
                          <td>{fruit.description}</td>
                          <td>
                            <span
                              className={
                                fruit.status === 'Available'
                                  ? 'fruit-status available'
                                  : 'fruit-status unavailable'
                              }
                            >
                              {fruit.status}
                            </span>
                          </td>
                          <td>
                            <div className="table-actions">
                              <button
                                className="edit-button"
                                onClick={() => openEditFruit(fruit)}
                              >
                                Edit
                              </button>
                              <button
                                className="delete-button"
                                onClick={() =>
                                  openDeleteModal('fruit', fruit.fruit_id)
                                }
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        ) : activePage === 'Vendors' ? (
          <section className="suppliers-page">
            <div className="section-heading">
              <div>
                <h2>Vendor Management</h2>
                <p>Register, search and manage your vendors.</p>
              </div>
              <button className="primary-button" onClick={openAddVendor}>
                + Register Vendor
              </button>
            </div>

            {message && <p className="success-message">{message}</p>}
            {error && <p className="error-message">{error}</p>}

            {showForm && (
              <div className="modal-overlay" onClick={closeForm}>
                <div
                  className="supplier-form-card modal-content"
                  onClick={event => event.stopPropagation()}
                >
                  <div className="form-heading">
                    <h2>
                      {editingId ? 'Edit Vendor' : 'Register New Vendor'}
                    </h2>
                    <button
                      className="close-button"
                      onClick={closeForm}
                      type="button"
                    >
                      ×
                    </button>
                  </div>

                  <form onSubmit={handleVendorSubmit}>
                    <div className="supplier-form-grid">
                      <label>
                        Vendor Name
                        <input
                          name="vendor_name"
                          value={vendorForm.vendor_name}
                          onChange={handleVendorInput}
                          placeholder="Enter vendor name"
                          required
                        />
                      </label>

                      <label>
                        Phone Number
                        <input
                          name="phone_number"
                          value={vendorForm.phone_number}
                          onChange={handleVendorInput}
                          placeholder="Enter phone number"
                          required
                        />
                      </label>

                      <label>
                        Location
                        <input
                          name="location"
                          value={vendorForm.location}
                          onChange={handleVendorInput}
                          placeholder="Enter vendor location"
                          required
                        />
                      </label>
                    </div>

                    <div className="form-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={closeForm}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="primary-button">
                        {editingId ? 'Save Changes' : 'Register Vendor'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="supplier-table-card">
              <div className="table-heading">
                <div>
                  <h2>Registered Vendors</h2>
                  <p>{vendors.length} vendors found</p>
                </div>
                <button className="secondary-button" onClick={loadVendors}>
                  Refresh
                </button>
              </div>

              <form onSubmit={searchVendors} className="vendor-search-form">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  placeholder="Search by vendor name, phone or location..."
                />
                <button type="submit" className="primary-button">
                  Search
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setSearchTerm('');
                    loadVendors();
                  }}
                >
                  Clear
                </button>
              </form>

              {loading ? (
                <p className="table-message">Loading vendors...</p>
              ) : vendors.length === 0 ? (
                <p className="table-message">No vendors found.</p>
              ) : (
                <div className="table-container">
                  <table className="supplier-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Vendor Name</th>
                        <th>Phone Number</th>
                        <th>Location</th>
                        <th>Registration Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendors.map(vendor => (
                        <tr key={vendor.vendor_id}>
                          <td>{vendor.vendor_id}</td>
                          <td>{vendor.vendor_name}</td>
                          <td>{vendor.phone_number}</td>
                          <td>{vendor.location}</td>
                          <td>
                            {vendor.registration_date
                              ? new Date(
                                  vendor.registration_date
                                ).toLocaleDateString()
                              : 'Not available'}
                          </td>
                          <td>
                            <div className="table-actions">
                              <button
                                className="edit-button"
                                onClick={() => openEditVendor(vendor)}
                              >
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        ) : activePage === 'Stock' ? (
          <section className="suppliers-page">
            <div className="section-heading">
              <div>
                <h2>Stock Management</h2>
                <p>
                  Monitor available fruits and packaging quantities.
                </p>
              </div>

              <button
                className="secondary-button"
                onClick={() => {
                  loadStock();
                  loadLowStock();
                }}
              >
                Refresh Stock
              </button>
            </div>

            {error && <p className="error-message">{error}</p>}

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-top">
                  <span>Total Available Stock</span>
                  <span className="stat-icon green">ST</span>
                </div>
                <h3>{totalStock}</h3>
                <p>Total boxes available</p>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <span>Stock Records</span>
                  <span className="stat-icon blue">R</span>
                </div>
                <h3>{stock.length}</h3>
                <p>Fruit and packaging combinations</p>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <span>Low Stock Items</span>
                  <span className="stat-icon orange">!</span>
                </div>
                <h3>{lowStockCount}</h3>
                <p>10 or fewer boxes remaining</p>
              </div>
            </div>

            <div className="supplier-table-card">
              <div className="table-heading">
                <div>
                  <h2>
                    {showLowStock ? 'Low Stock Items' : 'Current Stock Levels'}
                  </h2>
                  <p>
                    {showLowStock
                      ? `${lowStock.length} low-stock items found`
                      : `${stock.length} stock records found`}
                  </p>
                </div>

                <div className="stock-filter-buttons">
                  <button
                    className={
                      !showLowStock ? 'primary-button' : 'secondary-button'
                    }
                    onClick={() => setShowLowStock(false)}
                  >
                    All Stock
                  </button>

                  <button
                    className={
                      showLowStock ? 'primary-button' : 'secondary-button'
                    }
                    onClick={() => setShowLowStock(true)}
                  >
                    Low Stock
                  </button>
                </div>
              </div>

              {loading ? (
                <p className="table-message">Loading stock...</p>
              ) : displayedStock.length === 0 ? (
                <p className="table-message">
                  {showLowStock
                    ? 'There are no low-stock items.'
                    : 'No stock records found.'}
                </p>
              ) : (
                <div className="table-container">
                  <table className="supplier-table">
                    <thead>
                      <tr>
                        <th>Fruit Name</th>
                        <th>Packaging Size</th>
                        <th>Available Quantity</th>
                        <th>Stock Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {displayedStock.map((item, index) => {
                        const quantity = Number(item.available_quantity);

                        return (
                          <tr
                            key={`${item.fruit_name}-${item.packaging_size}-${index}`}
                          >
                            <td>{item.fruit_name}</td>
                            <td>{item.packaging_size}</td>
                            <td>{quantity}</td>
                            <td>
                              <span
                                className={
                                  quantity <= 10
                                    ? 'fruit-status unavailable'
                                    : 'fruit-status available'
                                }
                              >
                                {quantity <= 10 ? 'Low Stock' : 'In Stock'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        ) : activePage === 'Purchases' ? (
          <section className="suppliers-page">
            <div className="section-heading">
              <div>
                <h2>Purchase Management</h2>
                <p>
                  Record fruit purchases from suppliers and update stock.
                </p>
              </div>
              <button
                className="secondary-button"
                onClick={loadPurchaseData}
              >
                Refresh Data
              </button>
            </div>

            {message && <p className="success-message">{message}</p>}
            {error && <p className="error-message">{error}</p>}

            {purchaseResult && (
              <div className="supplier-form-card">
                <h2>Purchase Recorded Successfully</h2>
                <p>
                  Purchase ID: <strong>{purchaseResult.purchase_id}</strong>
                </p>
                <p>
                  Total Amount:{' '}
                  <strong>
                    M{Number(purchaseResult.total_amount).toFixed(2)}
                  </strong>
                </p>
                <p>Stock has been updated successfully.</p>
              </div>
            )}

            <div className="supplier-form-card">
              <div className="form-heading">
                <div>
                  <h2>Record New Purchase</h2>
                  <p>
                    Select a supplier and enter the fruits received.
                  </p>
                </div>
              </div>

              {loading ? (
                <p className="table-message">
                  Loading suppliers and fruits...
                </p>
              ) : suppliers.length === 0 || fruits.length === 0 ? (
                <p className="table-message">
                  You need at least one supplier and one fruit registered
                  before recording a purchase.
                </p>
              ) : (
                <form onSubmit={handlePurchaseSubmit}>
                  <div className="supplier-form-grid">
                    <label className="full-width">
                      Select Supplier
                      <select
                        value={purchaseSupplier}
                        onChange={event =>
                          setPurchaseSupplier(event.target.value)
                        }
                        required
                      >
                        <option value="">Choose a supplier</option>
                        {suppliers.map(supplier => (
                          <option
                            key={supplier.supplier_id}
                            value={supplier.supplier_id}
                          >
                            {supplier.business_name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="table-heading">
                    <div>
                      <h2>Purchase Items</h2>
                      <p>Add one or more fruits to this purchase.</p>
                    </div>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={addPurchaseItem}
                    >
                      + Add Item
                    </button>
                  </div>

                  {purchaseItems.map((item, index) => (
                    <div className="purchase-item-card" key={index}>
                      <div className="form-heading">
                        <h3>Item {index + 1}</h3>
                        {purchaseItems.length > 1 && (
                          <button
                            type="button"
                            className="delete-button"
                            onClick={() => removePurchaseItem(index)}
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="supplier-form-grid">
                        <label>
                          Fruit
                          <select
                            value={item.fruit_id}
                            onChange={event =>
                              handlePurchaseItemChange(
                                index,
                                'fruit_id',
                                event.target.value
                              )
                            }
                            required
                          >
                            <option value="">Select fruit</option>
                            {fruits.map(fruit => (
                              <option
                                key={fruit.fruit_id}
                                value={fruit.fruit_id}
                              >
                                {fruit.fruit_name}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label>
                          Packaging Size
                          <select
                            value={item.packaging_size}
                            onChange={event =>
                              handlePurchaseItemChange(
                                index,
                                'packaging_size',
                                event.target.value
                              )
                            }
                            required
                          >
                            <option value="Small">Small</option>
                            <option value="Medium">Medium</option>
                            <option value="Large">Large</option>
                          </select>
                        </label>

                        <label>
                          Quantity (Boxes)
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantity}
                            onChange={event =>
                              handlePurchaseItemChange(
                                index,
                                'quantity',
                                event.target.value
                              )
                            }
                            required
                          />
                        </label>

                        <label>
                          Unit Cost (M)
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_cost}
                            onChange={event =>
                              handlePurchaseItemChange(
                                index,
                                'unit_cost',
                                event.target.value
                              )
                            }
                            required
                          />
                        </label>
                      </div>

                      <p className="purchase-line-total">
                        Item Total: M
                        {(
                          Number(item.quantity || 0) *
                          Number(item.unit_cost || 0)
                        ).toFixed(2)}
                      </p>
                    </div>
                  ))}

                  <div className="purchase-total">
                    <span>Purchase Total</span>
                    <strong>M{purchaseTotal.toFixed(2)}</strong>
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => {
                        setPurchaseSupplier('');
                        setPurchaseItems([{ ...emptyPurchaseItem }]);
                        setError('');
                        setMessage('');
                        setPurchaseResult(null);
                      }}
                    >
                      Clear Form
                    </button>

                    <button
                      type="submit"
                      className="primary-button"
                      disabled={purchaseLoading}
                    >
                      {purchaseLoading
                        ? 'Recording Purchase...'
                        : 'Record Purchase'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>
        ) : activePage === 'Sales' ? (
          <section className="suppliers-page">
            <div className="section-heading">
              <div>
                <h2>Sales Management</h2>
                <p>
                  Record vendor sales, calculate payments and update stock.
                </p>
              </div>

              <button
                className="secondary-button"
                onClick={loadSalesData}
                disabled={salesLoading}
              >
                Refresh Data
              </button>
            </div>

            {message && <p className="success-message">{message}</p>}
            {error && <p className="error-message">{error}</p>}

            {saleResult && (
              <div className="supplier-form-card">
                <h2>Sale Recorded Successfully</h2>

                <p>
                  Sale ID: <strong>{saleResult.sale_id}</strong>
                </p>

                <p>
                  Total Amount:{' '}
                  <strong>
                    M{Number(saleResult.total_amount).toFixed(2)}
                  </strong>
                </p>

                <p>
                  Amount Paid:{' '}
                  <strong>
                    M{Number(saleResult.amount_paid).toFixed(2)}
                  </strong>
                </p>

                <p>
                  Payment Method: <strong>{saleResult.payment_method}</strong>
                </p>

                <p>
                  Payment Status:{' '}
                  <strong>{saleResult.payment_status}</strong>
                </p>

                <p>Stock has been reduced successfully.</p>
              </div>
            )}

            <div className="supplier-form-card">
              <div className="form-heading">
                <div>
                  <h2>Record New Sale</h2>
                  <p>
                    Select a vendor and add the fruits being sold.
                  </p>
                </div>
              </div>

              {salesLoading ? (
                <p className="table-message">
                  Loading vendors and available stock...
                </p>
              ) : saleVendors.length === 0 ? (
                <p className="table-message">
                  Register a vendor before recording a sale.
                </p>
              ) : (
                <form onSubmit={handleSaleSubmit}>
                  <div className="supplier-form-grid">
                    <label className="full-width">
                      Select Vendor
                      <select
                        value={saleVendor}
                        onChange={event =>
                          setSaleVendor(event.target.value)
                        }
                        required
                      >
                        <option value="">Choose a vendor</option>
                        {saleVendors.map(vendor => (
                          <option
                            key={vendor.vendor_id}
                            value={vendor.vendor_id}
                          >
                            {vendor.vendor_name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="table-heading">
                    <div>
                      <h2>Sale Items</h2>
                      <p>
                        Selling prices are calculated from the latest
                        purchase costs.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={addSaleItem}
                    >
                      + Add Item
                    </button>
                  </div>

                  {saleItems.map((item, index) => {
                    const selectedStock = getSaleStockItem(item);
                    const availableQuantity = selectedStock
                      ? Number(selectedStock.available_quantity)
                      : 0;
                    const unitPrice = selectedStock
                      ? Number(selectedStock.unit_price || 0)
                      : 0;

                    return (
                      <div className="purchase-item-card" key={index}>
                        <div className="form-heading">
                          <h3>Item {index + 1}</h3>

                          {saleItems.length > 1 && (
                            <button
                              type="button"
                              className="delete-button"
                              onClick={() => removeSaleItem(index)}
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="supplier-form-grid">
                          <label>
                            Fruit and Packaging
                            <select
                              value={
                                item.fruit_id && selectedStock
                                  ? `${item.fruit_id}-${item.packaging_size}`
                                  : ''
                              }
                              onChange={event => {
                                const selected = saleStock.find(
                                  stockItem =>
                                    `${stockItem.fruit_id}-${stockItem.packaging_size}` ===
                                    event.target.value
                                );

                                if (selected) {
                                  setSaleItems(currentItems =>
                                    currentItems.map((currentItem, itemIndex) =>
                                      currentItem && itemIndex === index
                                        ? {
                                            ...currentItem,
                                            fruit_id: String(selected.fruit_id),
                                            packaging_size: selected.packaging_size
                                          }
                                        : currentItem
                                    )
                                  );
                                } else {
                                  handleSaleItemChange(
                                    index,
                                    'fruit_id',
                                    ''
                                  );
                                }
                              }}
                              required
                            >
                              <option value="">Select fruit and size</option>

                              {saleStock.map(stockItem => (
                                <option
                                  key={`${stockItem.fruit_id}-${stockItem.packaging_size}`}
                                  value={`${stockItem.fruit_id}-${stockItem.packaging_size}`}
                                  disabled={
                                    Number(stockItem.available_quantity) <= 0 ||
                                    stockItem.unit_price === null
                                  }
                                >
                                  {stockItem.fruit_name} - {stockItem.packaging_size}
                                  {' | '}
                                  {stockItem.available_quantity} available
                                </option>
                              ))}
                            </select>
                          </label>

                          <label>
                            Quantity (Boxes)
                            <input
                              type="number"
                              min="1"
                              max={availableQuantity || undefined}
                              step="1"
                              value={item.quantity}
                              onChange={event =>
                                handleSaleItemChange(
                                  index,
                                  'quantity',
                                  event.target.value
                                )
                              }
                              required
                            />
                          </label>

                          <label>
                            Selling Price per Box (M)
                            <input
                              type="text"
                              value={selectedStock
                                ? unitPrice.toFixed(2)
                                : 'Select an item'}
                              readOnly
                            />
                          </label>

                          <label>
                            Available Stock
                            <input
                              type="text"
                              value={selectedStock
                                ? availableQuantity
                                : 'Select an item'}
                              readOnly
                            />
                          </label>
                        </div>

                        <p className="purchase-line-total">
                          Item Total: M{getSaleLineTotal(item).toFixed(2)}
                        </p>
                      </div>
                    );
                  })}

                  <div className="purchase-total">
                    <span>Sale Total</span>
                    <strong>M{saleTotal.toFixed(2)}</strong>
                  </div>

                  <div className="supplier-form-grid sale-payment-grid">
                    <label>
                      Payment Method
                      <select
                        value={paymentMethod}
                        onChange={event =>
                          setPaymentMethod(event.target.value)
                        }
                        required
                      >
                        <option value="Cash">Cash</option>
                        <option value="Mobile Money">Mobile Money</option>
                        <option value="Credit">Credit</option>
                      </select>
                    </label>

                    <label>
                      Amount Paid (M)
                      <input
                        type="number"
                        min="0"
                        max={saleTotal}
                        step="0.01"
                        value={amountPaid}
                        onChange={event =>
                          setAmountPaid(event.target.value)
                        }
                        required
                      />
                    </label>
                  </div>

                  <div className="sale-payment-summary">
                    <div>
                      <span>Sale Total</span>
                      <strong>M{saleTotal.toFixed(2)}</strong>
                    </div>

                    <div>
                      <span>Amount Paid</span>
                      <strong>M{numericAmountPaid.toFixed(2)}</strong>
                    </div>

                    <div>
                      <span>Remaining Balance</span>
                      <strong>M{remainingBalance.toFixed(2)}</strong>
                    </div>

                    <div>
                      <span>Payment Status</span>
                      <strong>{calculatedPaymentStatus}</strong>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => {
                        setSaleVendor('');
                        setSaleItems([{ ...emptySaleItem }]);
                        setPaymentMethod('Cash');
                        setAmountPaid('0');
                        setMessage('');
                        setError('');
                        setSaleResult(null);
                      }}
                    >
                      Clear Form
                    </button>

                    <button
                      type="submit"
                      className="primary-button"
                      disabled={saleLoading || salesLoading}
                    >
                      {saleLoading ? 'Recording Sale...' : 'Record Sale'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>
        ) : activePage === 'Reports' ? (
          <section className="suppliers-page">
            <div className="section-heading">
              <div>
                <h2>Business Reports</h2>
                <p>
                  View sales performance, popular fruits, vendors and stock.
                </p>
              </div>

              <button
                className="secondary-button"
                onClick={loadReports}
                disabled={reportsLoading}
              >
                {reportsLoading ? 'Loading...' : 'Refresh Reports'}
              </button>
            </div>

            {error && <p className="error-message">{error}</p>}

            <div className="supplier-form-card">
              <div className="form-heading">
                <div>
                  <h2>Revenue Report</h2>
                  <p>Select a date range to calculate sales revenue.</p>
                </div>
              </div>

              <div className="report-date-filter">
                <label>
                  Start Date
                  <input
                    type="date"
                    value={startDate}
                    max={endDate}
                    onChange={event => setStartDate(event.target.value)}
                  />
                </label>

                <label>
                  End Date
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={event => setEndDate(event.target.value)}
                  />
                </label>

                <button
                  className="primary-button"
                  onClick={loadReports}
                  disabled={reportsLoading || !startDate || !endDate}
                >
                  Generate Report
                </button>
              </div>

              {revenueReport && (
                <div className="stats-grid report-stats">
                  <div className="stat-card">
                    <div className="stat-top">
                      <span>Total Sales</span>
                      <span className="stat-icon blue">S</span>
                    </div>
                    <h3>{revenueReport.total_sales}</h3>
                    <p>Sales within selected dates</p>
                  </div>

                  <div className="stat-card">
                    <div className="stat-top">
                      <span>Total Revenue</span>
                      <span className="stat-icon green">M</span>
                    </div>
                    <h3>
                      M{Number(revenueReport.total_revenue || 0).toFixed(2)}
                    </h3>
                    <p>Revenue within selected dates</p>
                  </div>
                </div>
              )}
            </div>

            <div className="supplier-table-card">
              <div className="table-heading">
                <div>
                  <h2>Top 5 Most Sold Fruits</h2>
                  <p>Fruits ranked by the total number of boxes sold.</p>
                </div>
              </div>

              {reportsLoading ? (
                <p className="table-message">Loading report...</p>
              ) : topFruits.length === 0 ? (
                <p className="table-message">No fruit sales records found.</p>
              ) : (
                <div className="table-container">
                  <table className="supplier-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Fruit Name</th>
                        <th>Boxes Sold</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topFruits.map((fruit, index) => (
                        <tr key={fruit.fruit_name}>
                          <td>{index + 1}</td>
                          <td>{fruit.fruit_name}</td>
                          <td>{fruit.total_sold}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="supplier-form-card">
              <div className="form-heading">
                <div>
                  <h2>Top Vendor</h2>
                  <p>Vendor who purchased the most boxes.</p>
                </div>
              </div>

              {reportsLoading ? (
                <p className="table-message">Loading report...</p>
              ) : topVendor ? (
                <div className="report-vendor-details">
                  <div>
                    <span>Vendor Name</span>
                    <strong>{topVendor.vendor_name}</strong>
                  </div>

                  <div>
                    <span>Total Boxes Purchased</span>
                    <strong>{topVendor.total_boxes}</strong>
                  </div>
                </div>
              ) : (
                <p className="table-message">No sales records found.</p>
              )}
            </div>

            <div className="supplier-table-card">
              <div className="table-heading">
                <div>
                  <h2>Current Stock Report</h2>
                  <p>
                    Available stock grouped by fruit and packaging size.
                  </p>
                </div>
              </div>

              {reportsLoading ? (
                <p className="table-message">Loading stock report...</p>
              ) : reportStock.length === 0 ? (
                <p className="table-message">No stock records found.</p>
              ) : (
                <div className="table-container">
                  <table className="supplier-table">
                    <thead>
                      <tr>
                        <th>Fruit Name</th>
                        <th>Packaging Size</th>
                        <th>Available Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportStock.map((item, index) => (
                        <tr
                          key={`${item.fruit_name}-${item.packaging_size}-${index}`}
                        >
                          <td>{item.fruit_name}</td>
                          <td>{item.packaging_size}</td>
                          <td>{item.available_quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        ) : activePage === 'Payments' ? (
          <Payments />
        ) : (
          <section className="placeholder-page">
            <div className="placeholder-icon">BF</div>
            <h2>{activePage}</h2>
            <p>This section is ready for its management features.</p>
            <p>We will connect it to your database next.</p>
            <button onClick={() => setActivePage('Dashboard')}>
              Return to Dashboard
            </button>
          </section>
        )}

        {showDeleteModal && (
          <div
            className="modal-overlay"
            onClick={closeDeleteModal}
          >
            <div
              className="delete-modal modal-content"
              onClick={event => event.stopPropagation()}
            >
              <div className="delete-modal-icon">!</div>

              <h2>Confirm Deletion</h2>

              <p>
                Are you sure you want to delete this{' '}
                <strong>{deleteItem?.type}</strong>?
              </p>

              <p className="delete-warning">
                This action cannot be undone.
              </p>

              <div className="delete-modal-buttons">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeDeleteModal}
                  disabled={deleteLoading}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="delete-confirm-button"
                  onClick={confirmDelete}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        <footer>
          © 2026 Batloung Farm Distribution System. All rights reserved.
        </footer>
      </main>
    </div>
  );
}

export default App;
