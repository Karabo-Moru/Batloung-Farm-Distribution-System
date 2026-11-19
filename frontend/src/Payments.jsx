
import { useEffect, useState } from 'react';

const API = 'http://localhost:5000/api';

function Payments() {
  const [outstandingSales, setOutstandingSales] = useState([]);
  const [vendorBalances, setVendorBalances] = useState([]);
  const [selectedSale, setSelectedSale] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadPayments() {
    setLoading(true);
    setError('');

    try {
      const [salesResponse, balancesResponse] = await Promise.all([
        fetch(`${API}/payments/outstanding-sales`),
        fetch(`${API}/payments/vendor-balances`)
      ]);

      const salesData = await salesResponse.json();
      const balancesData = await balancesResponse.json();

      if (!salesResponse.ok) {
        throw new Error(
          salesData.message || 'Could not load outstanding sales.'
        );
      }

      if (!balancesResponse.ok) {
        throw new Error(
          balancesData.message || 'Could not load vendor balances.'
        );
      }

      setOutstandingSales(salesData);
      setVendorBalances(balancesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayments();
  }, []);

  const selectedSaleData = outstandingSales.find(
    sale => String(sale.sale_id) === String(selectedSale)
  );

  const totalOutstanding = outstandingSales.reduce(
    (total, sale) =>
      total + Number(sale.outstanding_balance || 0),
    0
  );

  const totalVendorBalance = vendorBalances.reduce(
    (total, vendor) =>
      total + Number(vendor.outstanding_balance || 0),
    0
  );

  async function handlePaymentSubmit(event) {
    event.preventDefault();

    setMessage('');
    setError('');

    if (!selectedSale) {
      setError('Please select an outstanding sale.');
      return;
    }

    const amount = Number(paymentAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Please enter a valid payment amount.');
      return;
    }

    if (
      amount >
      Number(selectedSaleData?.outstanding_balance || 0)
    ) {
      setError('Payment cannot be greater than the outstanding balance.');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sale_id: Number(selectedSale),
          amount
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || 'Payment could not be recorded.'
        );
      }

      setMessage(data.message || 'Payment recorded successfully!');
      setSelectedSale('');
      setPaymentAmount('');

      await loadPayments();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function formatMoney(value) {
    return `M${Number(value || 0).toFixed(2)}`;
  }

  return (
    <section className="suppliers-page">
      <div className="section-heading">
        <div>
          <h2>Payment Management</h2>
          <p>
            Record vendor payments and monitor outstanding balances.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={loadPayments}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh Payments'}
        </button>
      </div>

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-top">
            <span>Outstanding Sales</span>
            <span className="stat-icon orange">OS</span>
          </div>
          <h3>{outstandingSales.length}</h3>
          <p>Sales awaiting full payment</p>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Outstanding Amount</span>
            <span className="stat-icon blue">M</span>
          </div>
          <h3>{formatMoney(totalOutstanding)}</h3>
          <p>Amount still owed</p>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Vendor Balances</span>
            <span className="stat-icon purple">VB</span>
          </div>
          <h3>{formatMoney(totalVendorBalance)}</h3>
          <p>Total outstanding vendor balances</p>
        </div>
      </div>

      <div className="supplier-form-card">
        <div className="form-heading">
          <div>
            <h2>Record Vendor Payment</h2>
            <p>
              Select an outstanding sale and record the payment received.
            </p>
          </div>
        </div>

        <form onSubmit={handlePaymentSubmit}>
          <div className="supplier-form-grid">
            <label className="full-width">
              Select Outstanding Sale
              <select
                value={selectedSale}
                onChange={event => {
                  setSelectedSale(event.target.value);
                  setPaymentAmount('');
                }}
                required
              >
                <option value="">Choose a sale</option>

                {outstandingSales.map(sale => (
                  <option key={sale.sale_id} value={sale.sale_id}>
                    Sale #{sale.sale_id} - {sale.vendor_name}
                    {' - '}
                    Balance: {formatMoney(sale.outstanding_balance)}
                  </option>
                ))}
              </select>
            </label>

            {selectedSaleData && (
              <>
                <label>
                  Vendor
                  <input
                    type="text"
                    value={selectedSaleData.vendor_name}
                    readOnly
                  />
                </label>

                <label>
                  Sale Total
                  <input
                    type="text"
                    value={formatMoney(selectedSaleData.total_amount)}
                    readOnly
                  />
                </label>

                <label>
                  Amount Already Paid
                  <input
                    type="text"
                    value={formatMoney(selectedSaleData.amount_paid)}
                    readOnly
                  />
                </label>

                <label>
                  Outstanding Balance
                  <input
                    type="text"
                    value={formatMoney(selectedSaleData.outstanding_balance)}
                    readOnly
                  />
                </label>

                <label className="full-width">
                  Payment Amount (M)
                  <input
                    type="number"
                    min="0.01"
                    max={selectedSaleData.outstanding_balance}
                    step="0.01"
                    value={paymentAmount}
                    onChange={event =>
                      setPaymentAmount(event.target.value)
                    }
                    placeholder="Enter payment amount"
                    required
                  />
                </label>
              </>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setSelectedSale('');
                setPaymentAmount('');
                setMessage('');
                setError('');
              }}
            >
              Clear Form
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={saving || !selectedSale}
            >
              {saving ? 'Recording Payment...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>

      <div className="supplier-table-card">
        <div className="table-heading">
          <div>
            <h2>Outstanding Sales</h2>
            <p>Sales that still have an unpaid balance.</p>
          </div>
        </div>

        {loading ? (
          <p className="table-message">Loading outstanding sales...</p>
        ) : outstandingSales.length === 0 ? (
          <p className="table-message">
            No outstanding sales. All recorded sales are fully paid.
          </p>
        ) : (
          <div className="table-container">
            <table className="supplier-table">
              <thead>
                <tr>
                  <th>Sale ID</th>
                  <th>Date</th>
                  <th>Vendor</th>
                  <th>Total Amount</th>
                  <th>Amount Paid</th>
                  <th>Balance</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {outstandingSales.map(sale => (
                  <tr key={sale.sale_id}>
                    <td>{sale.sale_id}</td>
                    <td>
                      {sale.sale_date
                        ? new Date(sale.sale_date).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td>{sale.vendor_name}</td>
                    <td>{formatMoney(sale.total_amount)}</td>
                    <td>{formatMoney(sale.amount_paid)}</td>
                    <td>{formatMoney(sale.outstanding_balance)}</td>
                    <td>{sale.payment_method}</td>
                    <td>
                      <span className="fruit-status unavailable">
                        {sale.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="supplier-table-card">
        <div className="table-heading">
          <div>
            <h2>Vendor Payment Balances</h2>
            <p>Summary of sales, payments and outstanding balances.</p>
          </div>
        </div>

        {loading ? (
          <p className="table-message">Loading vendor balances...</p>
        ) : vendorBalances.length === 0 ? (
          <p className="table-message">No vendor balance records found.</p>
        ) : (
          <div className="table-container">
            <table className="supplier-table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Total Sales</th>
                  <th>Total Paid</th>
                  <th>Outstanding Balance</th>
                </tr>
              </thead>

              <tbody>
                {vendorBalances.map((vendor, index) => (
                  <tr key={vendor.vendor_id || index}>
                    <td>{vendor.vendor_name}</td>
                    <td>{formatMoney(vendor.total_sales)}</td>
                    <td>{formatMoney(vendor.total_paid)}</td>
                    <td>{formatMoney(vendor.outstanding_balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default Payments;
