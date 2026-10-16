import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { CustomerOrder } from '../../types/index.ts';
import { useToast } from '../common/Toast.tsx';
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  Phone,
  MessageSquare,
  DollarSign,
  AlertCircle,
  MapPin,
  RefreshCw,
  ChefHat,
  Receipt,
  User,
} from 'lucide-react';

export function AdminOrders() {
  const { orders, updateOrderStatus, updateOrderPaymentStatus, settings } = useRestaurant();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filtered orders
  const filteredOrders = orders.filter(order => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      order.id.toLowerCase().includes(q) ||
      order.customerName.toLowerCase().includes(q) ||
      order.customerPhone.includes(q) ||
      (order.deliveryAddress && order.deliveryAddress.toLowerCase().includes(q));

    const matchStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchPayment = paymentFilter === 'all' || (order.paymentStatus || 'unpaid') === paymentFilter;

    return matchSearch && matchStatus && matchPayment;
  });

  const handleStatusChange = async (orderId: string, newStatus: CustomerOrder['status']) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      showToast(`Order ${orderId} marked as ${newStatus}`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update order status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePaymentStatusChange = async (orderId: string, newPaymentStatus: 'unpaid' | 'paid') => {
    setUpdatingId(orderId);
    try {
      await updateOrderPaymentStatus(orderId, newPaymentStatus);
      showToast(`Payment status for order ${orderId} updated to ${newPaymentStatus.toUpperCase()}`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update payment status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const openWhatsAppConfirmation = (order: CustomerOrder) => {
    const cleanCustomerPhone = order.customerPhone.replace(/[^0-9]/g, '');
    const cleanPhoneWithCode = cleanCustomerPhone.startsWith('91') ? cleanCustomerPhone : `91${cleanCustomerPhone}`;
    const message = `Hello ${order.customerName}, this is ONE BITE Motihari!\n\nYour home delivery order (Ref: ${order.id}) has been CONFIRMED by our kitchen team.\n\nTotal Payable on Delivery: ₹${order.totalAmount}\nPayment Method: Cash or Delivery Boy's QR Scanner\nEstimated Delivery Time: 30-45 minutes\nDelivery Address: ${order.deliveryAddress || 'Motihari'}\n\nOur delivery boy will arrive shortly. Thank you for choosing One Bite!`;

    const url = `https://wa.me/${cleanPhoneWithCode}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const getStatusBadge = (status: CustomerOrder['status']) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
          </span>
        );
      case 'preparing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800">
            <ChefHat className="w-3.5 h-3.5" /> Preparing
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800">
            <Truck className="w-3.5 h-3.5" /> Delivered
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800">
            <XCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-stone-200 text-stone-800">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">
            <ShoppingBag className="w-4 h-4 text-amber-600" />
            <span>Order Management Dashboard</span>
          </div>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
            Incoming Home Delivery Orders
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-stone-600">
            Verify customer details, confirm orders, update kitchen preparation status, and record Pay on Delivery payments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">Total Orders</span>
            <span className="text-xl font-extrabold text-stone-900">{orders.length}</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Pending</span>
            <span className="text-xl font-extrabold text-emerald-900">
              {orders.filter(o => o.status === 'pending').length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by order ID, name, or phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-stone-600">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold">Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="preparing">Preparing</option>
            <option value="completed">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-stone-600 ml-2">
            <Receipt className="w-3.5 h-3.5" />
            <span className="font-semibold">Payment:</span>
          </div>
          <select
            value={paymentFilter}
            onChange={e => setPaymentFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="all">All Payments</option>
            <option value="unpaid">Unpaid (POD)</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Orders List / Cards */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-stone-200 shadow-xs">
          <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-900 mb-1">No orders found</h3>
          <p className="text-xs sm:text-sm text-stone-500">
            {searchQuery || statusFilter !== 'all' || paymentFilter !== 'all'
              ? 'Try adjusting your search query or filter options.'
              : 'Incoming customer orders will appear here in real time.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => {
            const isPaid = order.paymentStatus === 'paid';
            const isUpdating = updatingId === order.id;

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 space-y-4 hover:border-amber-400/50 transition-colors"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-extrabold text-sm text-stone-900 bg-stone-100 px-3 py-1 rounded-lg">
                      {order.id}
                    </span>
                    {getStatusBadge(order.status)}
                    <span
                      className={`text-xs font-extrabold px-2.5 py-1 rounded-lg ${
                        isPaid
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isPaid ? 'PAID' : 'UNPAID — POD'}
                    </span>
                  </div>

                  <div className="text-xs text-stone-500">
                    Placed: {new Date(order.createdAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                {/* Main Content Columns */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
                  {/* Customer & Address Details */}
                  <div className="lg:col-span-4 space-y-2.5 bg-stone-50 p-4 rounded-xl border border-stone-200/80">
                    <div className="flex items-center gap-2 font-bold text-stone-900 text-sm">
                      <User className="w-4 h-4 text-amber-600" />
                      <span>{order.customerName}</span>
                    </div>

                    <div className="flex items-center gap-2 text-stone-700">
                      <Phone className="w-3.5 h-3.5 text-stone-500" />
                      <span className="font-semibold">{order.customerPhone}</span>
                    </div>

                    <div className="flex items-start gap-2 text-stone-700 pt-1 border-t border-stone-200/60">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <span className="font-semibold text-stone-900 block">Home Delivery Address:</span>
                        <span>
                          {order.deliveryAddress ||
                            [order.houseFlat, order.streetArea, order.landmark, order.city, order.pincode]
                              .filter(Boolean)
                              .join(', ')}
                        </span>
                      </div>
                    </div>

                    {order.deliveryInstructions && (
                      <div className="p-2 bg-amber-50 border border-amber-200/80 rounded-lg text-amber-950 text-[11px] font-medium">
                        <span className="font-bold block">Instructions:</span>
                        {order.deliveryInstructions}
                      </div>
                    )}
                  </div>

                  {/* Food Items Ordered */}
                  <div className="lg:col-span-5 space-y-2 bg-stone-50 p-4 rounded-xl border border-stone-200/80">
                    <span className="font-bold text-stone-900 block text-xs uppercase tracking-wider">
                      Ordered Dishes ({order.items.length})
                    </span>

                    <div className="space-y-1.5 divide-y divide-stone-200/60">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="pt-1.5 first:pt-0 flex justify-between items-start gap-2">
                          <div>
                            <span className="font-bold text-stone-900">
                              {item.name}
                            </span>
                            {item.variant && (
                              <span className="text-[11px] text-amber-800 ml-1 font-medium">
                                ({item.variant.name})
                              </span>
                            )}
                            <div className="text-[11px] text-stone-500">
                              ₹{item.unitPrice} × {item.quantity}
                            </div>
                          </div>
                          <span className="font-extrabold text-stone-900">
                            ₹{item.unitPrice * item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Financial Summary */}
                    <div className="pt-2 border-t border-stone-200 space-y-1 text-[11px] text-stone-600">
                      <div className="flex justify-between">
                        <span>Items Subtotal:</span>
                        <span>₹{order.subtotal}</span>
                      </div>
                      {order.discountAmount ? (
                        <div className="flex justify-between text-emerald-700 font-bold">
                          <span>Discount:</span>
                          <span>-₹{order.discountAmount}</span>
                        </div>
                      ) : null}
                      <div className="flex justify-between">
                        <span>Delivery Fee:</span>
                        <span>{order.deliveryCharge ? `₹${order.deliveryCharge}` : 'FREE'}</span>
                      </div>
                      <div className="flex justify-between text-xs font-black text-stone-950 pt-1 border-t border-stone-200">
                        <span>Total Payable (POD):</span>
                        <span className="text-amber-700 font-extrabold">₹{order.totalAmount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Controls for Staff */}
                  <div className="lg:col-span-3 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
                        Update Order Status
                      </span>
                      <select
                        disabled={isUpdating}
                        value={order.status}
                        onChange={e => handleStatusChange(order.id, e.target.value as any)}
                        className="w-full px-3 py-2 text-xs font-semibold border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="preparing">Preparing</option>
                        <option value="completed">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block pt-1">
                        Pay on Delivery Status
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={isUpdating || !isPaid}
                          onClick={() => handlePaymentStatusChange(order.id, 'unpaid')}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            !isPaid
                              ? 'bg-amber-600 text-white'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                        >
                          Unpaid (POD)
                        </button>
                        <button
                          type="button"
                          disabled={isUpdating || isPaid}
                          onClick={() => handlePaymentStatusChange(order.id, 'paid')}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            isPaid
                              ? 'bg-emerald-600 text-white'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                        >
                          Paid
                        </button>
                      </div>
                    </div>

                    {/* Communication buttons */}
                    <div className="space-y-2 pt-2 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => openWhatsAppConfirmation(order)}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
                        title="Send confirmation message to customer on WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Confirm via WhatsApp</span>
                      </button>

                      <a
                        href={`tel:${order.customerPhone}`}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call Customer</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
