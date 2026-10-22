import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { CustomerOrder, OrderStatus, CartItem } from '../../types/index.ts';
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
  PackageCheck,
  ArrowRight,
  History,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import {
  formatTimelineTime,
  formatTimelineDateTime,
  getOrderTimelineTimestamps,
  getStatusDisplayName,
  getStatusRank,
  getNextAllowedTransition,
  validateStatusTransition,
} from '../../utils/orderTimeline.ts';

export function AdminOrders() {
  const {
    orders,
    updateOrderStatus,
    updateOrderPaymentStatus,
    assignOrderToDeliveryBoy,
    unassignOrderFromDeliveryBoy,
    createManualOrder,
    settings,
    adminUser,
  } = useRestaurant();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'packed' | 'out_for_delivery' | 'delivered'>('all');
  const [sortBy, setSortBy] = useState<'latest_order' | 'latest_update'>('latest_order');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // Status Change Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    order: CustomerOrder | null;
    targetStatus: OrderStatus | null;
    actionLabel: string;
  }>({
    isOpen: false,
    order: null,
    targetStatus: null,
    actionLabel: '',
  });

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

  // Filter and sort orders
  const filteredAndSortedOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    const filtered = orders.filter((order) => {
      // 1. Search filter: Order ID, customer name, phone number, address
      const matchSearch =
        !q ||
        order.id.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.customerPhone.includes(q) ||
        (order.deliveryAddress && order.deliveryAddress.toLowerCase().includes(q));

      if (!matchSearch) return false;

      // 2. Status filter: All, New Orders, Packed, Out for Delivery, Delivered
      if (statusFilter === 'all') return true;
      if (statusFilter === 'new') {
        return order.status === 'pending' || order.status === 'confirmed' || order.status === 'preparing';
      }
      if (statusFilter === 'packed') {
        return order.status === 'packed';
      }
      if (statusFilter === 'out_for_delivery') {
        return order.status === 'out_for_delivery';
      }
      if (statusFilter === 'delivered') {
        return order.status === 'delivered' || order.status === 'completed' || order.deliveryStatus === 'Delivered';
      }
      return true;
    });

    // 3. Sorting: latest order or latest status update
    return [...filtered].sort((a, b) => {
      if (sortBy === 'latest_update') {
        const timeA = new Date(a.updatedAt || a.createdAt).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt).getTime();
        return timeB - timeA;
      }
      // default: latest order
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeB - timeA;
    });
  }, [orders, searchQuery, statusFilter, sortBy]);

  // Open confirmation modal for valid forward transition
  const handleInitiateStatusUpdate = (order: CustomerOrder, targetStatus: OrderStatus, actionLabel: string) => {
    // Validate forward transition
    const validation = validateStatusTransition(order.status, targetStatus);
    if (!validation.valid) {
      showToast(validation.error || 'Invalid status transition', 'error');
      return;
    }

    setConfirmModal({
      isOpen: true,
      order,
      targetStatus,
      actionLabel,
    });
  };

  // Handle direct click on a 4-step timeline box in the admin order card
  const handleTimelineStepClick = (
    order: CustomerOrder,
    stepNum: number,
    targetStatus: OrderStatus,
    stepLabel: string
  ) => {
    if (order.status === 'cancelled') {
      showToast('Cannot change status: This order has been cancelled.', 'error');
      return;
    }

    const currentRank = getStatusRank(order.status);

    // 1. If clicking the immediate next allowed step -> open confirmation dialog
    if (stepNum === currentRank + 1) {
      const actionLabels: Record<string, string> = {
        packed: 'Mark as Order Packed',
        out_for_delivery: 'Mark Out for Delivery',
        delivered: 'Mark as Delivered',
      };
      handleInitiateStatusUpdate(
        order,
        targetStatus,
        actionLabels[targetStatus] || `Mark as ${stepLabel}`
      );
      return;
    }

    // 2. If clicking an already completed step
    if (stepNum < currentRank || (stepNum === 4 && currentRank >= 4)) {
      const timeStr = formatTimelineTime(
        stepNum === 1
          ? order.placedAt || order.createdAt
          : stepNum === 2
          ? order.packedAt
          : stepNum === 3
          ? order.outForDeliveryAt
          : order.deliveredAt
      );
      showToast(
        `Step ${stepNum} (${stepLabel}) was completed ${timeStr ? `at ${timeStr}` : 'previously'}.`,
        'info'
      );
      return;
    }

    // 3. If clicking the currently active step
    if (stepNum === currentRank) {
      showToast(`Order #${order.id} is currently in progress at Step ${stepNum}: ${stepLabel}.`, 'info');
      return;
    }

    // 4. If clicking a future step beyond the next step -> enforce sequential order progression
    const nextStepNames: Record<number, string> = {
      1: 'Step 2: Order Packed',
      2: 'Step 3: Out for Delivery',
      3: 'Step 4: Delivered',
    };
    showToast(
      `Sequential progression required: Please advance to ${nextStepNames[currentRank] || 'next step'} before selecting Step ${stepNum} (${stepLabel}).`,
      'error'
    );
  };

  // Execute confirmed status change
  const handleConfirmStatusChange = async () => {
    if (!confirmModal.order || !confirmModal.targetStatus) return;
    const { order, targetStatus, actionLabel } = confirmModal;

    setUpdatingId(order.id);
    try {
      await updateOrderStatus(order.id, targetStatus);
      showToast(`✓ Order #${order.id} updated to ${getStatusDisplayName(targetStatus)}! Customer timeline synchronized.`, 'success');
      setConfirmModal({ isOpen: false, order: null, targetStatus: null, actionLabel: '' });
    } catch (err: any) {
      // If Firebase returns an error, display an error message and preserve the existing status
      showToast(err?.message || 'Firebase update failed. Status preserved.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePaymentStatusChange = async (orderId: string, newPaymentStatus: 'unpaid' | 'paid') => {
    setUpdatingId(orderId);
    try {
      await updateOrderPaymentStatus(orderId, newPaymentStatus);
      showToast(`Payment status for order #${orderId} updated to ${newPaymentStatus.toUpperCase()}`, 'success');
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
      showToast(`Order #${orderId} assigned to Delivery Boy Panel!`, 'success');
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
      showToast(`Order #${orderId} unassigned from Delivery Boy`, 'info');
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
    const statusText = getStatusDisplayName(order.status).toUpperCase();

    const message = `Hello ${order.customerName}, this is ONE BITE Motihari!\n\nYour home delivery order (Ref: #${order.id}) current status is: ${statusText}.\n\nTotal Payable on Delivery: ₹${order.totalAmount}\nPayment Method: Cash or Delivery Boy's QR Scanner\nDelivery Address: ${order.deliveryAddress || 'Motihari'}\n\nThank you for choosing One Bite!`;

    const url = `https://wa.me/${cleanPhoneWithCode}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Notify Delivery Boy on WhatsApp
  const sendOrderToDeliveryBoyWhatsApp = (order: CustomerOrder) => {
    const itemsList = (order.items || [])
      .map(i => `• ${i.quantity}× ${i.name}${i.variant ? ` (${i.variant.name})` : ''}`)
      .join('\n');

    let msg = `🛵 NEW HOME DELIVERY TASK — ONE BITE MOTIHARI\n\n`;
    msg += `Order Ref: #${order.id}\n`;
    msg += `Status: ${getStatusDisplayName(order.status).toUpperCase()}\n`;
    msg += `Customer: ${order.customerName}\n`;
    msg += `Phone: ${order.customerPhone}\n`;
    msg += `Address: ${order.deliveryAddress || 'Motihari'}\n`;
    if (order.deliveryInstructions) {
      msg += `Instructions: ${order.deliveryInstructions}\n`;
    }
    msg += `\nDishes to Deliver:\n${itemsList}\n\n`;
    msg += `Total Amount to Collect (POD): ₹${order.totalAmount}\n`;
    msg += `Payment Status: ${(order.paymentStatus || 'unpaid').toUpperCase()}\n`;

    const deliveryBoyPhone = (settings.phone || '+918210442538').replace(/[^0-9]/g, '');
    const url = `https://wa.me/${deliveryBoyPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Handle Manual Order Submission
  const handleCreateManualOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.customerName.trim() || !manualForm.customerPhone.trim() || !manualForm.totalAmount) {
      showToast('Please fill in customer name, phone, and total amount', 'error');
      return;
    }

    const cleanPhone = manualForm.customerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }

    setIsSubmittingManual(true);
    try {
      const parsedAmount = Math.max(1, parseInt(manualForm.totalAmount, 10) || 100);
      const items: CartItem[] = manualForm.itemsSummary.trim()
        ? manualForm.itemsSummary
            .split(',')
            .map((itemText, idx) => ({
              id: `manual_item_${Date.now()}_${idx}`,
              menuItemId: `manual_menu_${Date.now()}_${idx}`,
              name: itemText.trim(),
              foodType: 'veg',
              unitPrice: parsedAmount,
              quantity: 1,
            }))
        : [
            {
              id: `manual_order_${Date.now()}`,
              menuItemId: `manual_order_${Date.now()}`,
              name: 'Custom Order (Phone/WhatsApp)',
              foodType: 'veg',
              unitPrice: parsedAmount,
              quantity: 1,
            },
          ];

      await createManualOrder(
        {
          customerName: manualForm.customerName.trim(),
          customerPhone: cleanPhone,
          deliveryAddress: manualForm.deliveryAddress.trim() || 'Balua Chowk, Motihari',
          landmark: manualForm.landmark.trim(),
          totalAmount: parsedAmount,
          subtotal: parsedAmount,
          addonsTotal: 0,
          deliveryCharge: 0,
          deliveryInstructions: manualForm.deliveryInstructions.trim(),
          items,
        },
        manualForm.assignImmediately
      );

      showToast('Manual order created successfully in Firebase!', 'success');
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
      showToast(err?.message || 'Failed to create manual order', 'error');
    } finally {
      setIsSubmittingManual(false);
    }
  };

  // Status badge styling
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Delivered</span>
          </span>
        );
      case 'out_for_delivery':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-sky-100 text-sky-800 border border-sky-300 animate-pulse">
            <Truck className="w-3.5 h-3.5 text-sky-600" />
            <span>Out for Delivery</span>
          </span>
        );
      case 'packed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
            <PackageCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Order Packed</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-900 border border-blue-300">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Order Placed</span>
          </span>
        );
    }
  };

  // Metrics
  const newOrdersCount = orders.filter(
    (o) => o.status === 'pending' || o.status === 'confirmed' || o.status === 'preparing'
  ).length;
  const packedCount = orders.filter((o) => o.status === 'packed').length;
  const outForDeliveryCount = orders.filter((o) => o.status === 'out_for_delivery').length;
  const deliveredCount = orders.filter(
    (o) => o.status === 'delivered' || o.status === 'completed' || o.deliveryStatus === 'Delivered'
  ).length;

  return (
    <div className="space-y-6">
      {/* Prominent Header Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-700 mb-1">
            <ShoppingBag className="w-4 h-4 text-amber-600" />
            <span>Admin Control Panel</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Order Management & Live Timeline
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed">
            Manage live 4-stage order progression (<strong>Order Placed ➔ Order Packed ➔ Out for Delivery ➔ Delivered</strong>). Status updates synchronize directly with customer tracking in real time via Firebase Firestore.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsManualModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-amber-600/20 transition-all cursor-pointer"
            title="Record phone or WhatsApp order directly"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Manual WhatsApp Order</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-stone-900 text-white border-stone-900 shadow-md'
              : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">All Orders</span>
          <span className="text-xl sm:text-2xl font-black">{orders.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('new')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'new'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
              : 'bg-blue-50/70 border-blue-200 text-blue-900 hover:border-blue-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">1. Placed</span>
          <span className="text-xl sm:text-2xl font-black">{newOrdersCount}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('packed')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'packed'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md'
              : 'bg-amber-50/70 border-amber-200 text-amber-900 hover:border-amber-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">2. Packed</span>
          <span className="text-xl sm:text-2xl font-black">{packedCount}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('out_for_delivery')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'out_for_delivery'
              ? 'bg-sky-600 text-white border-sky-600 shadow-md'
              : 'bg-sky-50/70 border-sky-200 text-sky-900 hover:border-sky-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">3. Out for Delivery</span>
          <span className="text-xl sm:text-2xl font-black">{outForDeliveryCount}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('delivered')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'delivered'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
              : 'bg-emerald-50/70 border-emerald-200 text-emerald-900 hover:border-emerald-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">4. Delivered</span>
          <span className="text-xl sm:text-2xl font-black">{deliveredCount}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order ID, phone, or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50/50"
          />
        </div>

        {/* Filter buttons & sort */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs text-stone-600 font-bold mr-1">
            <Filter className="w-3.5 h-3.5 text-amber-600" />
            <span>Filter:</span>
          </div>

          <div className="flex flex-wrap gap-1">
            {[
              { id: 'all', label: 'All Orders' },
              { id: 'new', label: 'New Orders' },
              { id: 'packed', label: 'Packed' },
              { id: 'out_for_delivery', label: 'Out for Delivery' },
              { id: 'delivered', label: 'Delivered' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 text-xs font-semibold border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer ml-1"
          >
            <option value="latest_order">Sort: Latest Order</option>
            <option value="latest_update">Sort: Latest Status Update</option>
          </select>
        </div>
      </div>

      {/* Orders List / Cards */}
      {filteredAndSortedOrders.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-stone-200 shadow-xs">
          <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-900 mb-1">No orders found</h3>
          <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all'
              ? 'No orders match your filter criteria. Try clearing search or selecting "All Orders".'
              : 'Incoming customer orders will appear here automatically in real time.'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredAndSortedOrders.map((order) => {
            const isPaid = order.paymentStatus === 'paid';
            const isUpdating = updatingId === order.id;
            const isDelivered = order.status === 'delivered' || order.status === 'completed';
            const isCancelled = order.status === 'cancelled';
            const isAssigned = Boolean(order.assignedToDeliveryBoy || order.deliveryStatus === 'Assigned');
            const transitionInfo = getNextAllowedTransition(order.status);
            const stageTimestamps = getOrderTimelineTimestamps(order);
            const rank = getStatusRank(order.status);
            const isHistoryOpen = expandedHistoryId === order.id;

            // 4 Canonical stages for the interactive live timeline
            const timelineSteps = [
              {
                id: 'placed',
                stepNum: 1,
                label: 'Order Placed',
                targetStatus: 'confirmed' as OrderStatus,
                isCompleted: rank > 1,
                isCurrent: rank === 1,
                isNext: false,
                timestamp: stageTimestamps.placedAt,
              },
              {
                id: 'packed',
                stepNum: 2,
                label: 'Order Packed',
                targetStatus: 'packed' as OrderStatus,
                isCompleted: rank > 2,
                isCurrent: rank === 2,
                isNext: rank === 1,
                timestamp: stageTimestamps.packedAt,
              },
              {
                id: 'out_for_delivery',
                stepNum: 3,
                label: 'Out for Delivery',
                targetStatus: 'out_for_delivery' as OrderStatus,
                isCompleted: rank > 3,
                isCurrent: rank === 3,
                isNext: rank === 2,
                timestamp: stageTimestamps.outForDeliveryAt,
              },
              {
                id: 'delivered',
                stepNum: 4,
                label: 'Delivered',
                targetStatus: 'delivered' as OrderStatus,
                isCompleted: rank >= 4,
                isCurrent: rank === 4,
                isNext: rank === 3,
                timestamp: stageTimestamps.deliveredAt,
              },
            ];

            return (
              <div
                key={order.id}
                className={`bg-white rounded-3xl border shadow-sm p-5 sm:p-6 space-y-5 transition-all ${
                  isDelivered
                    ? 'border-emerald-200 bg-emerald-50/10'
                    : isCancelled
                    ? 'border-rose-200 bg-rose-50/10 opacity-75'
                    : 'border-stone-200 hover:border-amber-300'
                }`}
              >
                {/* 1. Top Card Bar: ID, Date, Payment, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono font-black text-sm text-amber-900 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl">
                      #{order.id}
                    </span>
                    {getStatusBadge(order.status)}
                    <span
                      className={`text-xs font-black px-2.5 py-1 rounded-xl border ${
                        isPaid
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {isPaid ? 'PAID' : 'PAY ON DELIVERY (UNPAID)'}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                      {order.orderType === 'takeaway' ? 'Takeaway' : order.orderType === 'dine_in' ? 'Dine-In' : 'Home Delivery'}
                    </span>
                  </div>

                  <div className="text-xs text-stone-500 font-medium flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span>Placed: {formatTimelineDateTime(order.placedAt || order.createdAt)}</span>
                  </div>
                </div>

                {/* 2. LIVE 4-STAGE INTERACTIVE ORDER STATUS TIMELINE BAR */}
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
                    <span className="font-black text-stone-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Live Order Status Timeline</span>
                    </span>
                    <span className="text-[11px] font-medium text-stone-500">
                      Step {rank} of 4 · <strong className="text-stone-800">{getStatusDisplayName(order.status)}</strong>
                    </span>
                  </div>

                  {/* Responsive 4-Step Interactive Tracker (2 cols on mobile, 4 on desktop to prevent label truncation) */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
                    {timelineSteps.map((step) => {
                      const timeStr = formatTimelineTime(step.timestamp);
                      const isClickable = !isUpdating && !isCancelled;

                      let containerClass = 'border-stone-200 bg-white text-stone-400';
                      let dotClass = 'bg-stone-200 text-stone-600';
                      let badge = null;

                      if (step.isCompleted) {
                        containerClass = 'border-emerald-300 bg-emerald-50/70 text-emerald-950 hover:bg-emerald-100/70 hover:border-emerald-400 cursor-pointer shadow-2xs';
                        dotClass = 'bg-emerald-600 text-white';
                        badge = timeStr ? (
                          <span className="font-mono font-bold text-emerald-900 bg-emerald-100/80 border border-emerald-300 px-1.5 py-0.5 rounded text-[10px]">
                            {timeStr}
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-semibold text-[10px]">Completed</span>
                        );
                      } else if (step.isCurrent) {
                        containerClass = 'border-amber-400 bg-amber-50 text-amber-950 ring-2 ring-amber-300 cursor-pointer shadow-2xs';
                        dotClass = 'bg-amber-600 text-white animate-pulse';
                        badge = (
                          <span className="font-bold text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded text-[10px]">
                            Current
                          </span>
                        );
                      } else if (step.isNext) {
                        containerClass = 'border-amber-500 bg-white hover:bg-amber-50 text-stone-900 ring-2 ring-amber-400/40 hover:ring-amber-400 cursor-pointer shadow-xs transition-transform transform active:scale-[0.98]';
                        dotClass = 'bg-amber-600 text-white font-black';
                        badge = (
                          <span className="inline-flex items-center gap-0.5 font-black text-amber-700 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded text-[10px]">
                            <span>Advance</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </span>
                        );
                      } else {
                        // Future pending step
                        containerClass = 'border-stone-200 bg-stone-100/60 text-stone-400 hover:bg-stone-100 cursor-pointer';
                        dotClass = 'bg-stone-200 text-stone-400';
                        badge = <span className="text-stone-400 italic text-[10px]">Pending</span>;
                      }

                      return (
                        <button
                          key={step.id}
                          type="button"
                          disabled={!isClickable}
                          onClick={() =>
                            handleTimelineStepClick(order, step.stepNum, step.targetStatus, step.label)
                          }
                          title={
                            step.isNext
                              ? `Click to advance to Step ${step.stepNum}: ${step.label}`
                              : step.isCompleted
                              ? `Step ${step.stepNum}: ${step.label} (Completed)`
                              : step.isCurrent
                              ? `Step ${step.stepNum}: ${step.label} (Current)`
                              : `Step ${step.stepNum}: ${step.label} (Pending - sequential progression)`
                          }
                          className={`p-2.5 rounded-xl border flex flex-col justify-between text-left transition-all relative ${containerClass} disabled:opacity-60 disabled:cursor-not-allowed`}
                        >
                          <div className="flex items-center gap-1.5 w-full min-w-0">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${dotClass}`}
                            >
                              {step.isCompleted ? '✓' : step.stepNum}
                            </span>
                            <span className="font-bold text-[11px] leading-tight truncate">
                              Step {step.stepNum}: {step.label}
                            </span>
                          </div>

                          <div className="mt-2 flex items-center justify-between w-full">
                            {badge}
                            {step.isNext && (
                              <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-600">
                                Click to update
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Main Order Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
                  {/* Customer & Address Details (4 cols) */}
                  <div className="lg:col-span-4 space-y-3 bg-stone-50/70 p-4 rounded-2xl border border-stone-200/80">
                    <div className="flex items-center gap-2 font-bold text-stone-900 text-sm">
                      <User className="w-4 h-4 text-amber-600" />
                      <span>{order.customerName}</span>
                    </div>

                    <div className="flex items-center gap-2 text-stone-700">
                      <Phone className="w-3.5 h-3.5 text-stone-500" />
                      <span className="font-bold font-mono text-xs">{order.customerPhone}</span>
                    </div>

                    <div className="flex items-start gap-2 text-stone-700 pt-2 border-t border-stone-200/80">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <span className="font-bold text-stone-900 block text-[11px] uppercase tracking-wide">
                          Delivery Address:
                        </span>
                        <span>
                          {order.deliveryAddress ||
                            [order.houseFlat, order.streetArea, order.landmark, order.city, order.pincode]
                              .filter(Boolean)
                              .join(', ')}
                        </span>
                      </div>
                    </div>

                    {order.deliveryInstructions && (
                      <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-950 text-[11px]">
                        <span className="font-bold block">Delivery Instructions:</span>
                        {order.deliveryInstructions}
                      </div>
                    )}
                  </div>

                  {/* Food Items Ordered & Bill Summary (4 cols) */}
                  <div className="lg:col-span-4 space-y-2.5 bg-stone-50/70 p-4 rounded-2xl border border-stone-200/80">
                    <span className="font-black text-stone-900 block text-[11px] uppercase tracking-wider">
                      Ordered Dishes ({(order.items || []).length})
                    </span>

                    <div className="space-y-1.5 divide-y divide-stone-200/70 max-h-40 overflow-y-auto pr-1">
                      {(order.items || []).map((item, idx) => (
                        <div key={idx} className="pt-1.5 first:pt-0 flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <span className="font-bold text-stone-900 truncate block">
                              {item.name}
                            </span>
                            {item.variant && (
                              <span className="text-[10px] text-amber-800 font-medium">
                                ({item.variant.name})
                              </span>
                            )}
                            <div className="text-[11px] text-stone-500">
                              ₹{item.unitPrice} × {item.quantity}
                            </div>
                          </div>
                          <span className="font-black text-stone-900 font-mono">
                            ₹{item.unitPrice * item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Financial Summary */}
                    <div className="pt-2 border-t border-stone-200 space-y-1 text-[11px] text-stone-600">
                      <div className="flex justify-between">
                        <span>Items Subtotal:</span>
                        <span className="font-mono">₹{order.subtotal}</span>
                      </div>
                      {order.discountAmount ? (
                        <div className="flex justify-between text-emerald-700 font-bold">
                          <span>Discount:</span>
                          <span className="font-mono">-₹{order.discountAmount}</span>
                        </div>
                      ) : null}
                      <div className="flex justify-between">
                        <span>Delivery Fee:</span>
                        <span>{order.deliveryCharge ? `₹${order.deliveryCharge}` : 'FREE'}</span>
                      </div>
                      <div className="flex justify-between text-xs font-black text-stone-950 pt-1.5 border-t border-stone-200">
                        <span>Total Payable:</span>
                        <span className="text-amber-700 font-black font-mono text-sm">₹{order.totalAmount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Prominent Update Order Status Control & Actions (4 cols) */}
                  <div className="lg:col-span-4 space-y-3 flex flex-col justify-between bg-stone-50/70 p-4 rounded-2xl border border-stone-200/80">
                    <div className="space-y-2.5">
                      {/* PROMINENT "UPDATE ORDER STATUS" CONTROL */}
                      <div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-stone-800 block mb-1.5">
                          Update Order Status
                        </span>

                        {transitionInfo.isAllowed && transitionInfo.nextStatus ? (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() =>
                              handleInitiateStatusUpdate(
                                order,
                                transitionInfo.nextStatus!,
                                transitionInfo.actionButtonText
                              )
                            }
                            className={`w-full py-3 px-4 rounded-xl text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer transform active:scale-[0.98] ${
                              transitionInfo.nextStatus === 'packed'
                                ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 shadow-amber-600/25'
                                : transitionInfo.nextStatus === 'out_for_delivery'
                                ? 'bg-sky-600 hover:bg-sky-700 active:bg-sky-800 shadow-sky-600/25'
                                : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-600/25'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {isUpdating ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <ArrowRight className="w-4 h-4" />
                            )}
                            <span>{transitionInfo.actionButtonText}</span>
                          </button>
                        ) : isDelivered ? (
                          <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-center text-emerald-950 font-extrabold text-xs flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Delivered (Final Status)</span>
                          </div>
                        ) : isCancelled ? (
                          <div className="p-3 bg-rose-100 border border-rose-300 rounded-xl text-center text-rose-950 font-extrabold text-xs flex items-center justify-center gap-1.5">
                            <XCircle className="w-4 h-4 text-rose-600" />
                            <span>Order Cancelled</span>
                          </div>
                        ) : null}
                      </div>

                      {/* Delivery Boy Assignment */}
                      {!isCancelled && !isDelivered && (
                        <div className="pt-2 border-t border-stone-200/80">
                          {!isAssigned ? (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleAssignOrder(order.id)}
                              className="w-full py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Truck className="w-3.5 h-3.5 text-amber-600" />
                              <span>Assign to Delivery Boy</span>
                            </button>
                          ) : (
                            <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-amber-50 border border-amber-200">
                              <span className="font-bold text-amber-900 flex items-center gap-1">
                                <Truck className="w-3.5 h-3.5 text-amber-600" />
                                <span>Assigned</span>
                              </span>
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleUnassignOrder(order.id)}
                                className="text-[11px] text-stone-500 hover:text-rose-600 font-bold underline cursor-pointer"
                              >
                                Unassign
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Payment Status Toggle */}
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-stone-500 font-semibold">Payment:</span>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handlePaymentStatusChange(order.id, isPaid ? 'unpaid' : 'paid')}
                          className="font-bold underline text-stone-700 hover:text-amber-700 cursor-pointer"
                        >
                          Mark as {isPaid ? 'Unpaid' : 'Paid'}
                        </button>
                      </div>
                    </div>

                    {/* Quick Communication Actions */}
                    <div className="pt-2 border-t border-stone-200/80 flex items-center gap-1.5">
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="flex-1 py-2 px-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs text-center flex items-center justify-center gap-1 transition-colors"
                        title="Call Customer"
                      >
                        <Phone className="w-3.5 h-3.5 text-stone-600" />
                        <span>Call</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => openWhatsAppConfirmation(order)}
                        className="flex-1 py-2 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="Send Status Update on WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4. Status Update History Section (Collapsible & Comprehensive) */}
                <div className="pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setExpandedHistoryId(isHistoryOpen ? null : order.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      Status Update History (
                      {order.statusHistory && order.statusHistory.length > 0
                        ? order.statusHistory.length
                        : 1}{' '}
                      events)
                    </span>
                    {isHistoryOpen ? (
                      <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                    )}
                  </button>

                  {isHistoryOpen && (
                    <div className="mt-3 p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2.5 text-xs animate-in fade-in duration-150">
                      <div className="font-black text-stone-800 uppercase tracking-wider text-[11px] pb-1 border-b border-stone-200">
                        Authoritative Status History (Firestore Log)
                      </div>

                      {order.statusHistory && order.statusHistory.length > 0 ? (
                        <div className="space-y-2">
                          {order.statusHistory.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2.5 bg-white rounded-xl border border-stone-200/70"
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                <span className="font-extrabold text-stone-900">
                                  {item.statusName || getStatusDisplayName(item.status)}
                                </span>
                                {item.updatedBy && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-semibold border border-stone-200">
                                    By {item.updatedBy}
                                    {item.updaterId && item.updaterId !== item.updatedBy
                                      ? ` (${item.updaterId})`
                                      : ''}
                                  </span>
                                )}
                              </div>
                              <span className="font-mono text-[11px] text-stone-500 font-semibold">
                                {formatTimelineDateTime(item.timestamp)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-2.5 bg-white rounded-xl border border-stone-200/70 text-stone-600 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                            <span className="font-bold text-stone-900">Order Placed</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-semibold">
                              Initial
                            </span>
                          </div>
                          <span className="font-mono text-[11px] text-stone-500">
                            {formatTimelineDateTime(order.placedAt || order.createdAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CONFIRMATION DIALOG MODAL (Requirement 3: Confirm order ID and next status) */}
      {confirmModal.isOpen && confirmModal.order && confirmModal.targetStatus && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => {
            if (!updatingId) {
              setConfirmModal({ isOpen: false, order: null, targetStatus: null, actionLabel: '' });
            }
          }}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-5 animate-in zoom-in-95 duration-200 text-stone-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900">
                    Confirm Status Update
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Live timeline update to Firebase Firestore
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={Boolean(updatingId)}
                onClick={() =>
                  setConfirmModal({ isOpen: false, order: null, targetStatus: null, actionLabel: '' })
                }
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Order Details Card */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-500">Order Reference:</span>
                <span className="font-mono font-black text-sm text-stone-950 bg-white border border-stone-200 px-2.5 py-0.5 rounded-lg">
                  #{confirmModal.order.id}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-500">Customer:</span>
                <span className="font-extrabold text-stone-900">
                  {confirmModal.order.customerName} ({confirmModal.order.customerPhone})
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-500">Amount:</span>
                <span className="font-black text-amber-700 font-mono text-sm">
                  ₹{confirmModal.order.totalAmount}
                </span>
              </div>

              {/* Status Transition Visual */}
              <div className="pt-2 border-t border-stone-200/80 space-y-1.5">
                <span className="font-black text-[11px] uppercase tracking-wider text-stone-600 block">
                  Status Transition:
                </span>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-stone-200 text-xs">
                  <span className="font-bold text-stone-500">
                    {getStatusDisplayName(confirmModal.order.status)}
                  </span>
                  <ArrowRight className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-black text-amber-700">
                    {getStatusDisplayName(confirmModal.targetStatus)}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Updating will immediately update the customer’s live timeline via Firestore onSnapshot listener.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                disabled={Boolean(updatingId)}
                onClick={() =>
                  setConfirmModal({ isOpen: false, order: null, targetStatus: null, actionLabel: '' })
                }
                className="flex-1 py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-extrabold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={Boolean(updatingId)}
                onClick={handleConfirmStatusChange}
                className="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-extrabold text-xs shadow-md shadow-amber-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {updatingId ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Update</span>
                  </>
                )}
              </button>
            </div>
          </div>
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
            onClick={(e) => e.stopPropagation()}
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
                    onChange={(e) => setManualForm({ ...manualForm, customerName: e.target.value })}
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
                    onChange={(e) => setManualForm({ ...manualForm, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Home Delivery Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Main Road, Balua Chowk, Motihari"
                  value={manualForm.deliveryAddress}
                  onChange={(e) => setManualForm({ ...manualForm, deliveryAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Near Town Hall"
                    value={manualForm.landmark}
                    onChange={(e) => setManualForm({ ...manualForm, landmark: e.target.value })}
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
                    onChange={(e) => setManualForm({ ...manualForm, totalAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Ordered Dishes Summary (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2x Veg Supreme Burger, 1x Paneer Pizza, 1x Coke"
                  value={manualForm.itemsSummary}
                  onChange={(e) => setManualForm({ ...manualForm, itemsSummary: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Special Kitchen / Delivery Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Extra spicy, call before arriving"
                  value={manualForm.deliveryInstructions}
                  onChange={(e) => setManualForm({ ...manualForm, deliveryInstructions: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingManual}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-extrabold text-xs shadow-md shadow-amber-600/25 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingManual ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Order...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Save & Record Order</span>
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
