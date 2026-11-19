
import { useEffect, useState } from 'react';

const API = 'http://localhost:5000/api';

const emptyItem = {
  fruit_id: '',
  packaging_size: 'Small',
  quantity: 1
};

function Sales() {
  const [vendors, setVendors] = useState([]);
  const [stock, setStock] = useState([]);
  const [vendorId, setVendorId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountPaid, setAmountPaid] = useState('0');
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);

  async function loadSalesData() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API}/sales/form-data`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load sales information');
      }

      setVendors(data.vendors || []);
      setStock(data.stock || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSalesData();
  }, []);

  function updateItem(index, field, value) {
    setItems(current =>
      current.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  }

  function addItem() {
    setItems(current => [...current, { ...emptyItem }]);
  }

  function removeItem(index) {
    setItems(current => current.filter((_, i) => i !== index));
  }

  function getStockItem(item) {
    return stock.find(
      record =>
        Number(record.fruit_id) === Number(item.fruit_id) &&
        record.packaging_size === item.packaging_size
    );
  }

  function getItemPrice(item) {
    const record = getStockItem(item);

    return record && record.unit_price !== null
      ? Number(record.unit_price)
      : 0;
  }

  function getItemQuantity(item) {
    return Number(item.quantity) || 0;
  }

  function getLineTotal(item) {
    return getItemPrice(item) * getItemQuantity(item);
  }

  const totalAmount = Number(
    items.reduce((total, item) => total + getLineTotal(item), 0).toFixed(2)
  );

  const paid = Number(amountPaid) || 0;

  let paymentStatus = 'UNPAID';

  if (totalAmount > 0 && paid === totalAmount) {
    paymentStatus = 'PAID';
  } else if (paid > 0 && paid < totalAmount) {
    paymentStatus = 'PARTIALLY_PAID';
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');
    setMessage('');
    setResult(null);

    if (!vendorId) {
      setError('Please select a vendor.');
      return;
    }

    if (items.length === 0) {
      setError('Please add at least one sale item.');
      return;
    }

    for (const item of items) {
      if (!item.fruit_id) {
        setError('Please select a fruit for every sale item.');
        return;
      }

      const quantity = Number(item.quantity);
      const record = getStockItem(item);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        setError('Every item must have a valid quantity greater than zero.');
        return;
      }

      if (!record || record.unit_price === null) {
        setError('A purchase price is not available for one of your selected items.');
        return;
      }

      if (quantity > Number(record.available_quantity)) {
        setError(
          `Not enough stock for ${record.fruit_name} (${record.packaging_size}). Available: ${record.available_quantity}.`
        );
        return;
      }
    }

    if (
      !Number.isFinite(paid) ||
      paid < 0 ||
      paid > totalAmount
    ) {
      setError('Amount paid must be between zero and the sale total.');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API}/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vendor_id: Number(vendorId),
          payment_method: paymentMethod,
          amount_paid: paid,
          items: items.map(item => ({
            fruit_id: Number(item.fruit_id),
            packaging_size: item.packaging_size,
            quantity: Number(item.quantity)
          }))
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || 'Sale failed'
        );
      }

      setResult(data);
      setMessage(data.message || 'Sale recorded successfully!');

      setItems([{ ...emptyItem }]);
      setVendorId('');
      setAmountPaid('0');

      await loadSalesData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="suppliers-page">
      <div className="section-heading">
        <div>
          <h2>Sales Management</h2>
          <p>Record vendor sales and automatically update available stock.</p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={loadSalesData}
          disabled={loading}
        >
          Refresh Data
        </button>
      </div>

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      {result && (
        <div className="supplier-form-card">
          <h2>Sale Recorded Successfully</h2>

          <p>Sale ID: <strong>{result.sale_id}</strong></p>

          <p>
            Total Amount:{' '}
            <strong>M{Number(result.total_amount).toFixed(2)}</strong>
          </p>

          <p>
            Amount Paid:{' '}
            <strong>M{Number(result.amount_paid).toFixed(2)}</strong>
          </p>

          <p>
            Payment Status: <strong>{result.payment_status}</strong>
          </p>

          <p>
            Payment Method: <strong>{result.payment_method}</strong>
          </p>

          <p>Stock has been updated successfully.</p>
        </div>
      )}

      <div className="supplier-form-card">
        <div className="form-heading">
          <div>
            <h2>Record New Sale</h2>
            <p>Select a vendor and enter the fruits sold.</p>
          </div>
        </div>

        {loading ? (
          <p className="table-message">Loading sales information...</p>
        ) : vendors.length === 0 ? (
          <p className="table-message">
            Register a vendor before recording a sale.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="supplier-form-grid">
              <label className="full-width">
                Select Vendor

                <select
                  value={vendorId}
                  onChange={event => setVendorId(event.target.value)}
                  required
                >
                  <option value="">Choose a vendor</option>

                  {vendors.map(vendor => (
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
                <p>Add one or more fruits to this sale.</p>
              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={addItem}
              >
                + Add Item
              </button>
            </div>

            {items.map((item, index) => {
              const record = getStockItem(item);
              const price = getItemPrice(item);
              const available = record
                ? Number(record.available_quantity)
                : 0;

              return (
                <div className="purchase-item-card" key={index}>
                  <div className="form-heading">
                    <h3>Item {index + 1}</h3>

                    {items.length > 1 && (
                      <button
                        type="button"
                        className="delete-button"
                        onClick={() => removeItem(index)}
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
                          updateItem(index, 'fruit_id', event.target.value)
                        }
                        required
                      >
                        <option value="">Select fruit</option>

                        {stock
                          .filter(record => record.unit_price !== null)
                          .filter(record => Number(record.available_quantity) > 0)
                          .filter(
                            record =>
                              record.packaging_size === item.packaging_size
                          )
                          .map(record => (
                            <option
                              key={`${record.fruit_id}-${record.packaging_size}`}
                              value={record.fruit_id}
                            >
                              {record.fruit_name}
                            </option>
                          ))}
                      </select>
                    </label>

                    <label>
                      Packaging Size

                      <select
                        value={item.packaging_size}
                        onChange={event =>
                          updateItem(index, 'packaging_size', event.target.value)
                        }
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
                        max={available > 0 ? available : undefined}
                        value={item.quantity}
                        onChange={event =>
                          updateItem(index, 'quantity', event.target.value)
                        }
                        required
                      />
                    </label>

                    <label>
                      Selling Price per Box (M)

                      <input
                        type="text"
                        value={price.toFixed(2)}
                        readOnly
                      />
                    </label>
                  </div>

                  <div className="sale-stock-info">
                    <span>
                      Available Stock: <strong>{record ? available : 0}</strong>
                    </span>

                    <span>
                      Item Total: <strong>M{getLineTotal(item).toFixed(2)}</strong>
                    </span>
                  </div>
                </div>
              );
            })}

            <div className="sale-payment-card">
              <h2>Payment Information</h2>

              <div className="supplier-form-grid">
                <label>
                  Payment Method

                  <select
                    value={paymentMethod}
                    onChange={event => setPaymentMethod(event.target.value)}
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
                    max={totalAmount}
                    step="0.01"
                    value={amountPaid}
                    onChange={event => setAmountPaid(event.target.value)}
                    required
                  />
                </label>
              </div>

              <div className="sale-payment-status">
                <span>Payment Status</span>
                <strong>{paymentStatus}</strong>
              </div>
            </div>

            <div className="purchase-total">
              <span>Sale Total</span>
              <strong>M{totalAmount.toFixed(2)}</strong>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setItems([{ ...emptyItem }]);
                  setVendorId('');
                  setAmountPaid('0');
                  setError('');
                  setMessage('');
                  setResult(null);
                }}
              >
                Clear Form
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={saving || totalAmount <= 0}
              >
                {saving ? 'Recording Sale...' : 'Record Sale'}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

export default Sales;
