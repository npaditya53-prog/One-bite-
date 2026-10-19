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
  Plus,
  X,
  ExternalLink,
  Send,
} from 'lucide-react';

export function AdminOrders() {
  const {
    orders,
    updateOrderStatus,
    updateOrderPaymentStatus,
    assignOrderToDeliveryBoy,
    unassignOrderFromDeliveryBoy,
    createManualOrder,
    settings,
  } = useRestaurant();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [assignmentFilter, setAssignmentFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Manual / WhatsApp Order Entry Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [manualForm, setManualForm] = useState({
    customerName: '',
    customerPhone: '',
    deliveryAddress: '',
    landmark: '',
    itemsSummary: '',
    totalAmount: '',
    deliveryInstructions: '',
    assignImmediately: true,
  });

  // Filtered orders
  const filteredOrders = orders.filter(order => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      order.id.toLowerCase().includes(q) ||
      order.customerName.toLowerCase().includes(q) ||
      order.customerPhone.includes(q) ||
      (order.deliveryAddress && order.deliveryAddress.toLowerCase().includes(q));

    const matchStatus =
      statusFilter === 'all' ||
      order.status === statusFilter ||
      (statusFilter === 'delivered' && (order.status === 'completed' || order.deliveryStatus === 'Delivered'));

    const matchPayment = paymentFilter === 'all' || (order.paymentStatus || 'unpaid') === paymentFilter;

    const isAssigned = Boolean(order.assignedToDeliveryBoy || order.status === 'out_for_delivery' || order.deliveryStatus === 'Assigned');
    const matchAssignment =
      assignmentFilter === 'all' ||
      (assignmentFilter === 'assigned' && isAssigned) ||
      (assignmentFilter === 'unassigned' && !isAssigned && order.status !== 'delivered' && order.status !== 'cancelled');

    return matchSearch && matchStatus && matchPayment && matchAssignment;
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

  const handleAssignOrder = async (orderId: string) => {
    setUpdatingId(orderId);
    try {
      await assignOrderToDeliveryBoy(orderId);
      showToast(`🚚 Order ${orderId} assigned to Delivery Boy Panel!`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to assign order', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUnassignOrder = async (orderId: string) => {
    setUpdatingId(orderId);
    try {
      await unassignOrderFromDeliveryBoy(orderId);
      showToast(`Order ${orderId} unassigned from Delivery Boy`, 'info');
    } catch (err: any) {
      showToast(err?.message || 'Failed to unassign order', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // WhatsApp Customer Confirmation Message
  const openWhatsAppConfirmation = (order: CustomerOrder) => {
    const cleanCustomerPhone = order.customerPhone.replace(/[^0-9]/g, '');
    const cleanPhoneWithCode = cleanCustomerPhone.startsWith('91') ? cleanCustomerPhone : `91${cleanCustomerPhone}`;
    const statusText = order.status === 'out_for_delivery'
      ? 'OUT FOR DELIVERY'
      : order.status === 'delivered' || order.status === 'completed'
      ? 'DELIVERED'
      : order.status === 'preparing'
      ? 'BEING PREPARED'
      : order.assignedToDeliveryBoy
      ? 'CONFIRMED & ASSIGNED TO DELIVERY'
      : 'CONFIRMED';

    const message = `Hello ${order.customerName}, this is ONE BITE Motihari!\n\nYour home delivery order (Ref: ${order.id}) status is: ${statusText}.\n\nTotal Payable on Delivery: ₹${order.totalAmount}\nPayment Method: Cash or Delivery Boy's QR Scanner\nDelivery Address: ${order.deliveryAddress || 'Motihari'}\n\nThank you for choosing One Bite!`;

    const url = `https://wa.me/${cleanPhoneWithCode}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Notify Delivery Boy on WhatsApp with full dispatch details
  const sendOrderToDeliveryBoyWhatsApp = (order: CustomerOrder) => {
    const itemsList = (order.items || [])
      .map(i => `• ${i.quantity}× ${i.name}${i.variant ? ` (${i.variant.name})` : ''}`)
      .join('\n');

    let msg = `🛵 NEW HOME DELIVERY TASK — ONE BITE MOTIHARI\n\n`;
    msg += `Order Reference: ${order.id}\n`;
    msg += `Status: ASSIGNED FOR DELIVERY\n\n`;
    msg += `CUSTOMER DETAILS:\n`;
    msg += `Name: ${order.customerName}\n`;
    msg += `Phone: ${order.customerPhone}\n\n`;
    msg += `DELIVERY ADDRESS:\n`;
    msg += `${order.deliveryAddress || 'Motihari'}\n`;
    if (order.landmark) msg += `Landmark: Near ${order.landmark}\n`;
    if (order.deliveryInstructions) msg += `Note: ${order.deliveryInstructions}\n`;
    msg += `\nITEMS TO DELIVER:\n${itemsList || 'Order items specified in panel'}\n\n`;
    msg += `PAYABLE AMOUNT (POD):\n`;
    msg += `₹${order.totalAmount} (${order.paymentStatus === 'paid' ? 'PAID' : 'COLLECT CASH OR SCAN QR'})\n\n`;
    msg += `Delivery Boy Panel Link:\n`;
    msg += `${window.location.origin}/delivery-dashboard\n\n`;
    msg += `Please open the panel to start delivery and confirm completion.`;

    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Submit Manual / WhatsApp Order
  const handleCreateManualOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.customerName.trim()) {
      showToast('Please enter the customer name', 'error');
      return;
    }
    const cleanPhone = manualForm.customerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }
    if (!manualForm.deliveryAddress.trim()) {
      showToast('Please enter the delivery address', 'error');
      return;
    }
    const amount = Number(manualForm.totalAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid total order amount (₹)', 'error');
      return;
    }

    setIsSubmittingManual(true);
    try {
      const itemsText = manualForm.itemsSummary.trim() || 'Custom WhatsApp Order Items';
      const orderPayload: Partial<CustomerOrder> = {
        customerName: manualForm.customerName.trim(),
        customerPhone: cleanPhone,
        deliveryAddress: manualForm.deliveryAddress.trim(),
        landmark: manualForm.landmark.trim() || undefined,
        deliveryInstructions: manualForm.deliveryInstructions.trim() || undefined,
        totalAmount: amount,
        subtotal: amount,
        addonsTotal: 0,
        items: [
          {
            id: 'item_manual_' + Date.now(),
            menuItemId: 'manual_custom',
            name: itemsText,
            quantity: 1,
            unitPrice: amount,
            foodType: 'veg',
          },
        ],
        notes: 'Order entered manually by Admin from WhatsApp/Phone inquiry',
      };

      const created = await createManualOrder(orderPayload, manualForm.assignImmediately);
      showToast(
        `🎉 Order ${created.id} recorded & ${manualForm.assignImmediately ? 'assigned to Delivery Boy' : 'saved'} successfully!`,
        'success'
      );
      setIsManualModalOpen(false);
      setManualForm({
        customerName: '',
        customerPhone: '',
        deliveryAddress: '',
        landmark: '',
        itemsSummary: '',
        totalAmount: '',
        deliveryInstructions: '',
        assignImmediately: true,
      });
    } catch (err: any) {
      showToast(err?.message || 'Failed to record manual order', 'error');
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const getStatusBadge = (order: CustomerOrder) => {
    if (order.status === 'delivered' || order.status === 'completed' || order.deliveryStatus === 'Delivered') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800">
          <Truck className="w-3.5 h-3.5 text-emerald-600" /> Delivered
        </span>
      );
    }
    if (order.status === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800">
          <XCircle className="w-3.5 h-3.5" /> Cancelled
        </span>
      );
    }
    if (order.status === 'out_for_delivery') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-100 text-sky-800 animate-pulse">
          <Truck className="w-3.5 h-3.5" /> Out for Delivery
        </span>
      );
    }
    if (order.assignedToDeliveryBoy) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-900">
          <Truck className="w-3.5 h-3.5 text-amber-700" /> Assigned to Delivery
        </span>
      );
    }
    if (order.status === 'preparing') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800">
          <ChefHat className="w-3.5 h-3.5" /> Preparing
        </span>
      );
    }
    if (order.status === 'confirmed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-800">
          <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-stone-200 text-stone-800">
        <Clock className="w-3.5 h-3.5" /> Awaiting Action
      </span>
    );
  };

  const assignedCount = orders.filter(
    o => o.assignedToDeliveryBoy && o.status !== 'delivered' && o.status !== 'completed' && o.status !== 'cancelled'
  ).length;

  const deliveredCount = orders.filter(
    o => o.status === 'delivered' || o.status === 'completed' || o.deliveryStatus === 'Delivered'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">
            <ShoppingBag className="w-4 h-4 text-amber-600" />
            <span>Order Management & Delivery Dispatch</span>
          </div>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
            Orders & Delivery Boy Management
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-stone-600">
            Assign orders directly to the single Delivery Boy, verify Pay on Delivery, and monitor live delivery confirmations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Action: Add / Import WhatsApp Order */}
          <button
            type="button"
            onClick={() => setIsManualModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-amber-600/25 transition-all cursor-pointer"
            title="Manually create an order received via WhatsApp or phone call"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Manual WhatsApp Order</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-stone-200 p-3.5 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">Total Orders</span>
          <span className="text-xl sm:text-2xl font-black text-stone-900">{orders.length}</span>
        </div>
        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">Pending / Unassigned</span>
          <span className="text-xl sm:text-2xl font-black text-amber-900">
            {orders.filter(o => !o.assignedToDeliveryBoy && o.status !== 'delivered' && o.status !== 'cancelled').length}
          </span>
        </div>
        <div className="bg-sky-50 border border-sky-200 p-3.5 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 block">With Delivery Boy</span>
          <span className="text-xl sm:text-2xl font-black text-sky-900">{assignedCount}</span>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Delivered</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-900">{deliveredCount}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col lg:flex-row gap-3 items-center justify-between">
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by order ID, name, or phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Assignment Filter */}
          <div className="flex items-center gap-1.5 text-xs text-stone-600">
            <Truck className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-semibold">Dispatch:</span>
          </div>
          <select
            value={assignmentFilter}
            onChange={e => setAssignmentFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="all">All Assignments</option>
            <option value="unassigned">Awaiting Assignment</option>
            <option value="assigned">Assigned to Delivery Boy</option>
          </select>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-stone-600 ml-1">
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
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Payment Filter */}
          <div className="flex items-center gap-1.5 text-xs text-stone-600 ml-1">
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
            {searchQuery || statusFilter !== 'all' || paymentFilter !== 'all' || assignmentFilter !== 'all'
              ? 'Try adjusting your search query or filter options.'
              : 'Incoming customer orders will appear here in real time.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => {
            const isPaid = order.paymentStatus === 'paid';
            const isUpdating = updatingId === order.id;
            const isDelivered = order.status === 'delivered' || order.status === 'completed' || order.deliveryStatus === 'Delivered';
            const isCancelled = order.status === 'cancelled';
            const isAssigned = Boolean(order.assignedToDeliveryBoy || order.status === 'out_for_delivery' || order.deliveryStatus === 'Assigned');

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border shadow-xs p-5 space-y-4 transition-colors ${
                  isDelivered
                    ? 'border-emerald-200 bg-emerald-50/15'
                    : isAssigned
                    ? 'border-amber-300/80 hover:border-amber-400'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono font-extrabold text-sm text-stone-900 bg-stone-100 border border-stone-200 px-3 py-1 rounded-lg">
                      {order.id}
                    </span>
                    {getStatusBadge(order)}
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

                    {/* Delivery Confirmation Audit Card */}
                    {isDelivered && (
                      <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Delivery Confirmed (Live Sync)</span>
                        </div>
                        <div className="text-[11px] text-emerald-900 space-y-0.5 pt-0.5">
                          {order.deliveredAt && (
                            <div>
                              <span className="font-semibold text-emerald-950">Delivered At: </span>
                              <span>
                                {new Date(order.deliveredAt).toLocaleString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          )}
                          {order.deliveredBy && (
                            <div>
                              <span className="font-semibold text-emerald-950">Delivered By: </span>
                              <span className="font-mono bg-emerald-100/90 text-emerald-900 px-1.5 py-0.2 rounded font-semibold text-[10px]">
                                {order.deliveredBy}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Food Items Ordered */}
                  <div className="lg:col-span-5 space-y-2 bg-stone-50 p-4 rounded-xl border border-stone-200/80">
                    <span className="font-bold text-stone-900 block text-xs uppercase tracking-wider">
                      Ordered Dishes ({(order.items || []).length})
                    </span>

                    <div className="space-y-1.5 divide-y divide-stone-200/60 max-h-48 overflow-y-auto">
                      {(order.items || []).map((item, idx) => (
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

                  {/* Action Controls for Staff & Delivery Boy Assignment */}
                  <div className="lg:col-span-3 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      {/* Section: Delivery Boy Assignment Action */}
                      {!isCancelled && !isDelivered && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">
                            Delivery Boy Assignment
                          </span>
                          {!isAssigned ? (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleAssignOrder(order.id)}
                              className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-extrabold text-xs shadow-md shadow-amber-600/25 transition-all cursor-pointer transform active:scale-[0.98]"
                              title="Assign this order to the Delivery Boy Panel"
                            >
                              <Truck className="w-4 h-4" />
                              <span>Assign to Delivery Boy</span>
                            </button>
                          ) : (
                            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-xs space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="inline-flex items-center gap-1 font-bold text-amber-900">
                                  <Truck className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Assigned to Delivery</span>
                                </span>
                                <button
                                  type="button"
                                  disabled={isUpdating}
                                  onClick={() => handleUnassignOrder(order.id)}
                                  className="text-[10px] text-stone-500 hover:text-rose-600 font-semibold underline cursor-pointer"
                                  title="Remove assignment"
                                >
                                  Unassign
                                </button>
                              </div>
                              {order.assignedAt && (
                                <span className="text-[10px] text-amber-800 block">
                                  Assigned: {new Date(order.assignedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => sendOrderToDeliveryBoyWhatsApp(order)}
                                className="w-full py-1.5 px-2 bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                title="Send order details directly to delivery boy on WhatsApp"
                              >
                                <MessageSquare className="w-3 h-3 text-emerald-600" />
                                <span>Notify Delivery Boy (WhatsApp)</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Section: Status Dropdown */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
                          Order Status
                        </span>
                        <select
                          disabled={isUpdating}
                          value={order.status}
                          onChange={e => handleStatusChange(order.id, e.target.value as any)}
                          className="w-full px-3 py-1.5 text-xs font-semibold border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="preparing">Preparing</option>
                          <option value="out_for_delivery">Out for Delivery</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    {/* Communication buttons */}
                    <div className="pt-2 border-t border-stone-100">
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition-colors"
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

      {/* Manual / WhatsApp Order Entry Modal */}
      {isManualModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => {
            if (!isSubmittingManual) setIsManualModalOpen(false);
          }}
        >
          <div
            className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-stone-900">
                    Record Manual / WhatsApp Order
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Creates order in database & assigns directly to the Delivery Boy
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualOrderSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={manualForm.customerName}
                    onChange={e => setManualForm({ ...manualForm, customerName: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Mobile Phone (10 digits) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={manualForm.customerPhone}
                    onChange={e => setManualForm({ ...manualForm, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Full Home Delivery Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="House/Flat, Street, Area in Motihari..."
                  value={manualForm.deliveryAddress}
                  onChange={e => setManualForm({ ...manualForm, deliveryAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Nearby Landmark (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Near Arya Samaj Mandir"
                    value={manualForm.landmark}
                    onChange={e => setManualForm({ ...manualForm, landmark: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Total Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 450"
                    value={manualForm.totalAmount}
                    onChange={e => setManualForm({ ...manualForm, totalAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Ordered Dishes / Food Items
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. 2x Double Patty Burger, 1x Veg Loaded Pizza, 1x Cold Coffee"
                  value={manualForm.itemsSummary}
                  onChange={e => setManualForm({ ...manualForm, itemsSummary: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Special Delivery Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Call before arrival, extra ketchup packets"
                  value={manualForm.deliveryInstructions}
                  onChange={e => setManualForm({ ...manualForm, deliveryInstructions: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
                <input
                  type="checkbox"
                  id="assignImmediately"
                  checked={manualForm.assignImmediately}
                  onChange={e => setManualForm({ ...manualForm, assignImmediately: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded-md focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="assignImmediately" className="text-xs font-bold text-amber-950 cursor-pointer">
                  Assign directly to Delivery Boy Panel immediately
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  disabled={isSubmittingManual}
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 font-semibold text-stone-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingManual}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-extrabold shadow-md shadow-amber-600/25 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmittingManual ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Order...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save & Dispatch</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
