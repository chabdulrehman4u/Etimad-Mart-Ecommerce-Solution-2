import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { updateOrderDetails } from '../../functions/order';
import postexAPI from '../../functions/postex';
import { 
  FiPackage, 
  FiTruck, 
  FiX, 
  FiRefreshCw, 
  FiCheck, 
  FiAlertCircle,
  FiSettings,
  FiMapPin
} from 'react-icons/fi';

const PostExManager = ({ order, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [postexStatus, setPostexStatus] = useState(null);
  const [cities, setCities] = useState([]);
  const [cityQuery, setCityQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [hasLoadedCities, setHasLoadedCities] = useState(false);
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [pendingPushAfterCity, setPendingPushAfterCity] = useState(false);
  const [cityPickLoadingKey, setCityPickLoadingKey] = useState(null);
  const [shouldOpenCityModalFromQuery, setShouldOpenCityModalFromQuery] = useState(false);

  useEffect(() => {
    checkPostExStatus();
    // Parse URL query params for deep-linking
    try {
      const sp = new URLSearchParams(window.location.search);
      const tab = sp.get('tab');
      const resolve = sp.get('postexResolveCity');
      if (tab === 'cities') setActiveTab('cities');
      if (resolve === '1') setShouldOpenCityModalFromQuery(true);
    } catch {}
  }, []);

  const checkPostExStatus = async () => {
    try {
      const statusData = await postexAPI.getStatus();
      setPostexStatus(statusData.data);
    } catch (error) {
      console.error('Failed to get PostEx status:', error);
    }
  };

  // Update order city from modal selection, then optionally retry push
  const handleSelectCityAndPush = async (city) => {
    if (!order?._id) return;
    const selectedName = city?.operationalCityName || city?.cityName || city?.name;
    const loadingKey = String(selectedName || '') + ':' + String(city?.id || city?.CityId || '');
    setCityPickLoadingKey(loadingKey);
    try {
      // Persist city on order
      const res = await updateOrderDetails({
        orderId: order._id,
        shippingAddress: {
          fullName: order?.shippingAddress?.fullName || '',
          mobile: order?.shippingAddress?.mobile || '',
          city: selectedName || '',
          streetAddress: order?.shippingAddress?.streetAddress || '',
          additionalInstructions: order?.shippingAddress?.additionalInstructions || ''
        }
      });
      // Reflect changes in parent immediately if available
      if (onUpdate && res?.order) {
        onUpdate(res.order);
      }
      toast.success('City updated');
      setIsCityModalOpen(false);
      if (pendingPushAfterCity) {
        await handlePushToPostEx();
        setPendingPushAfterCity(false);
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'Failed to update city');
    } finally {
      setCityPickLoadingKey(null);
    }
  };

  const filteredCities = useMemo(() => {
    if (!cityQuery) return cities;
    const q = cityQuery.toLowerCase();
    return (cities || []).filter((c) => {
      const name = (c?.operationalCityName || c?.cityName || c?.name || '').toLowerCase();
      const country = (c?.countryName || '').toLowerCase();
      return name.includes(q) || country.includes(q);
    });
  }, [cities, cityQuery]);

  const handlePushToPostEx = async () => {
    if (!order?._id) return;

    setLoading(true);
    try {
      // Ensure PostEx is the active provider for this manager
      const provider = order?.shippingProvider?.provider;
      if (provider && provider !== 'postex') {
        toast.error('Active courier is not PostEx. Switch to PostEx to resolve cities.');
        setLoading(false);
        return;
      }
      // 1) Validate destination city is supported by PostEx
      const currentCityRaw = order?.shippingAddress?.city || '';
      const currentCity = String(currentCityRaw).trim().toLowerCase();

      // Ensure we have cities loaded for validation
      if (!hasLoadedCities) {
        await fetchCities();
      }
      const supported = (cities || []).some(c =>
        String(c?.operationalCityName || c?.cityName || c?.name || '')
          .trim()
          .toLowerCase() === currentCity
      );

      if (!supported) {
        // Open only the PostEx city modal (scoped in this component)
        setIsCityModalOpen(true);
        setPendingPushAfterCity(true);
        toast.error('City not supported by PostEx. Please select a valid city.');
        return; // stop here; resume after selection
      }

      const result = await postexAPI.pushOrder(order._id);
      toast.success('Order successfully pushed to PostEx!');
      
      if (onUpdate) {
        onUpdate({
          ...order,
          shippingProvider: {
            ...order.shippingProvider,
            provider: 'postex',
            pushed: true,
            orderRefNumber: result.data.orderRefNumber,
            trackingNumber: result.data.trackingNumber,
            pushedAt: new Date()
          }
        });
      }
    } catch (error) {
      const statusCode = error?.response?.data?.statusCode || error?.response?.status;
      const statusMessage = error?.response?.data?.statusMessage || error?.response?.data?.message;
      const friendly = statusMessage || error?.message || 'Failed to push order to PostEx';
      toast.error(`PostEx push failed${statusCode ? ` (${statusCode})` : ''}: ${friendly}`);

      // If invalid delivery city from PostEx, guide user to select a valid city
      if (
        String(statusMessage || '').toUpperCase().includes('INVALID DELIVERY CITY') ||
        String(friendly || '').toUpperCase().includes('INVALID DELIVERY CITY')
      ) {
        try {
          if (!hasLoadedCities) await fetchCities();
        } catch {}
        setIsCityModalOpen(true);
        setPendingPushAfterCity(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTrackOrder = async () => {
    const cn = order?.shippingProvider?.trackingNumber;
    if (!cn) return;

    setLoading(true);
    try {
      const result = await postexAPI.trackOrderByCN(cn);
      const latest = result?.data?.data || result?.data || null;
      setTrackingData(latest);

      // reflect status in parent (so list/detail pages stay in sync)
      const newStatus = latest?.status;
      if (newStatus && onUpdate) {
        onUpdate({
          ...order,
          shippingProvider: {
            ...order.shippingProvider,
            status: newStatus,
            lastStatusUpdate: latest?.lastEventAt || new Date().toISOString(),
          },
        });
      }

      toast.success('PostEx tracking updated');
    } catch (error) {
      toast.error(error.message || 'Failed to track order');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order?.shippingProvider?.trackingNumber) {
      toast.error('Tracking number is missing for this order');
      return;
    }
    
    if (!window.confirm('Are you sure you want to cancel this order in PostEx?')) {
      return;
    }

    setLoading(true);
    try {
      await postexAPI.cancelOrder(order._id);
      toast.success('Order cancelled in PostEx!');
      
      if (onUpdate) {
        onUpdate({
          ...order,
          status: 'Cancelled',
          shippingProvider: {
            ...order.shippingProvider,
            status: 'Cancelled'
          }
        });
      }
    } catch (error) {
      toast.error(error.message || 'Failed to cancel order');
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async () => {
    try {
      const result = await postexAPI.getCities('Delivery');
      const list = Array.isArray(result?.data) ? result.data : (Array.isArray(result) ? result : []);
      setCities(list);
      setHasLoadedCities(true);
      toast.success('Cities loaded successfully!');
    } catch (error) {
      toast.error('Failed to fetch cities');
    }
  };

  // Auto-load cities when switching to the Cities tab for the first time
  useEffect(() => {
    if (activeTab === 'cities' && !hasLoadedCities) {
      fetchCities();
    }
  }, [activeTab, hasLoadedCities]);

  // When directed from AllOrders with ?postexResolveCity=1, open the modal after cities load
  useEffect(() => {
    if (activeTab === 'cities' && hasLoadedCities && shouldOpenCityModalFromQuery) {
      setIsCityModalOpen(true);
      setShouldOpenCityModalFromQuery(false);
    }
  }, [activeTab, hasLoadedCities, shouldOpenCityModalFromQuery]);

  const isPostExOrder = order?.shippingProvider?.provider === 'postex';
  const isPushed = order?.shippingProvider?.pushed;
  const orderRefNumber = order?.shippingProvider?.orderRefNumber;
  const trackingNumber = order?.shippingProvider?.trackingNumber;

  if (!postexStatus) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <div className="flex items-center space-x-2">
          <FiRefreshCw className="animate-spin" />
          <span>Loading PostEx status...</span>
        </div>
      </div>
    );
  }

  if (!postexStatus.enabled) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center space-x-2 text-yellow-800">
          <FiAlertCircle />
          <span>PostEx service is disabled</span>
        </div>
      </div>
    );
  }

  if (!postexStatus.configured) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center space-x-2 text-red-800">
          <FiSettings />
          <span>PostEx API token not configured</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
      {/* Premium Header */}
      <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Logo Container */}
              <div className="relative">
                <div className="bg-white bg-opacity-20 backdrop-blur-sm p-3 rounded-xl border border-white border-opacity-20">
                  <FiPackage size={28} className="text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              
              {/* Title Section */}
              <div>
                <h3 className="text-xl font-bold tracking-tight">PostEx Management</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-blue-100 text-sm">Order</span>
                  <span className="bg-white bg-opacity-20 px-2 py-0.5 rounded-md text-xs font-mono font-semibold">
                    #{order?._id?.slice(-8)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Status Badge */}
            <div className="flex flex-col items-end space-y-2">
              {postexStatus?.enabled ? (
                <div className="flex items-center space-x-2 bg-green-500 bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-full border border-green-400 border-opacity-30">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <FiCheck size={16} />
                  <span className="text-sm font-semibold">Service Active</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 bg-red-500 bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-full border border-red-400 border-opacity-30">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <FiAlertCircle size={16} />
                  <span className="text-sm font-semibold">Service Inactive</span>
                </div>
              )}
              
              {/* Connection Status */}
              <div className="text-xs text-blue-100 flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                <span>Connected to PostEx API</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Tab Navigation */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
        <div className="flex">
          {[
            { id: 'overview', label: 'Overview', icon: FiSettings, color: 'blue' },
            { id: 'tracking', label: 'Tracking', icon: FiTruck, color: 'green' },
            { id: 'cities', label: 'Cities', icon: FiMapPin, color: 'purple' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group relative flex items-center space-x-3 px-6 py-4 text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'text-blue-700 bg-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white hover:bg-opacity-50'
              }`}
            >
              {/* Active Tab Indicator */}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600"></div>
              )}
              
              {/* Tab Icon */}
              <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-200 text-gray-500 group-hover:bg-gray-300'
              }`}>
                <tab.icon size={18} />
              </div>
              
              {/* Tab Label */}
              <span className="font-medium">{tab.label}</span>
              
              {/* Tab Badge */}
              {tab.id === 'overview' && isPostExOrder && (
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              )}
              {tab.id === 'tracking' && trackingData && (
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              )}
              {tab.id === 'cities' && cities.length > 0 && (
                <div className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-bold">
                  {cities.length}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Order Status Card */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h4 className="font-semibold text-gray-800">Order Status</h4>
              </div>
              <div className="p-4">
                {isPostExOrder ? (
                  <div className="space-y-6">
                    {/* Dynamic Status Card (PostEx) */}
                    {(() => {
                      const liveStatus = trackingData?.status || order?.shippingProvider?.status || 'Pending';
                      const statusClass =
                        liveStatus?.toLowerCase() === 'delivered'
                          ? 'from-green-50 to-emerald-50 border-green-200'
                          : liveStatus?.toLowerCase() === 'cancelled'
                          ? 'from-red-50 to-rose-50 border-red-200'
                          : liveStatus?.toLowerCase() === 'unbooked' || liveStatus?.toLowerCase() === 'pending'
                          ? 'from-yellow-50 to-amber-50 border-yellow-200'
                          : 'from-blue-50 to-indigo-50 border-blue-200';
                      const badgeBg =
                        liveStatus?.toLowerCase() === 'delivered'
                          ? 'bg-green-500'
                          : liveStatus?.toLowerCase() === 'cancelled'
                          ? 'bg-red-500'
                          : liveStatus?.toLowerCase() === 'unbooked' || liveStatus?.toLowerCase() === 'pending'
                          ? 'bg-yellow-500'
                          : 'bg-blue-500';
                      const when = trackingData?.lastEventAt || order.shippingProvider?.lastStatusUpdate || order.shippingProvider?.pushedAt;
                      return (
                        <div className={`relative overflow-hidden bg-gradient-to-r ${statusClass} border rounded-xl p-6`}>
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16 opacity-40"></div>
                          <div className="relative flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className={`${badgeBg} p-3 rounded-xl shadow-lg`}>
                                <FiCheck className="text-white" size={24} />
                              </div>
                              <div>
                                <h4 className="text-lg font-bold text-gray-800">{liveStatus}</h4>
                                <p className="text-gray-600 text-sm">Latest status from PostEx</p>
                              </div>
                            </div>
                            <div className="text-right">
                              {when && (
                                <div className="bg-white bg-opacity-60 px-3 py-1 rounded-lg">
                                  <p className="text-xs font-medium text-gray-700">Updated on</p>
                                  <p className="text-sm font-semibold text-gray-800">
                                    {new Date(when).toLocaleDateString()}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Tracking Information Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {orderRefNumber && (
                        <div className="group bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="bg-blue-100 p-2 rounded-lg">
                              <FiPackage className="text-blue-600" size={20} />
                            </div>
                            <button className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Order Reference</p>
                          <p className="font-mono text-lg font-bold text-gray-800 break-all">{orderRefNumber}</p>
                        </div>
                      )}
                      
                      {trackingNumber && (
                        <div className="group bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="bg-purple-100 p-2 rounded-lg">
                              <FiTruck className="text-purple-600" size={20} />
                            </div>
                            <button className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tracking Number</p>
                          <p className="font-mono text-lg font-bold text-gray-800 break-all">{trackingNumber}</p>
                        </div>
                      )}
                    </div>

                    {/* Status Badge */}
                    {order.shippingProvider?.status && (
                      <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="bg-gray-100 p-2 rounded-lg">
                              <FiSettings className="text-gray-600" size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-700">Current Status</p>
                              <p className="text-xs text-gray-500">Last updated status from PostEx</p>
                            </div>
                          </div>
                          <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-sm ${
                            order.shippingProvider.status === 'Cancelled' 
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : order.shippingProvider.status === 'Delivered'
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          }`}>
                            {order.shippingProvider.status}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="relative inline-block mb-6">
                      <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-6 rounded-2xl shadow-inner">
                        <FiPackage className="text-gray-400" size={48} />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                        <span className="text-yellow-800 text-xs font-bold">!</span>
                      </div>
                    </div>
                    <h4 className="text-xl font-bold text-gray-800 mb-2">Ready to Ship</h4>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      This order hasn't been pushed to PostEx yet. Click the button below to create a shipment and generate tracking information.
                    </p>
                    <button
                      onClick={handlePushToPostEx}
                      disabled={loading}
                      className="group relative inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                        <FiPackage size={20} />
                      </div>
                      <span className="text-lg font-semibold">
                        {loading ? 'Processing...' : 'Push to PostEx'}
                      </span>
                      {loading && (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Order Details Card */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h4 className="font-semibold text-gray-800">Order Details</h4>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 font-medium">Customer</p>
                    <p className="text-gray-800">{order?.shippingAddress?.fullName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Phone</p>
                    <p className="text-gray-800 font-mono">{order?.shippingAddress?.mobile}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">City</p>
                    <p className="text-gray-800">{order?.shippingAddress?.city}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Total Amount</p>
                    <p className="text-gray-800 font-semibold">Rs. {order?.totalPrice}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-gray-500 font-medium">Address</p>
                    <p className="text-gray-800">{order?.shippingAddress?.streetAddress}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tracking' && (
          <div className="space-y-4">
            {isPushed && orderRefNumber ? (
              <div className="space-y-4">
                <div className="flex space-x-3">
                  <button
                    onClick={handleTrackOrder}
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    <FiTruck />
                    <span>{loading ? 'Tracking...' : 'Track Order'}</span>
                  </button>
                  
                  <button
                    onClick={handleCancelOrder}
                    disabled={loading || order.status === 'Cancelled'}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    <FiX />
                    <span>{loading ? 'Cancelling...' : 'Cancel Order'}</span>
                  </button>
                </div>

                {trackingData && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Tracking Information</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <pre className="text-sm text-gray-600 whitespace-pre-wrap overflow-x-auto">
                        {JSON.stringify(trackingData, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <FiTruck className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-500">No tracking information available</p>
                <p className="text-sm text-gray-400 mt-1">Push order to PostEx first to enable tracking</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'cities' && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <h4 className="font-semibold text-gray-800">PostEx Service Areas</h4>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <input
                  type="text"
                  value={cityQuery}
                  onChange={(e) => setCityQuery(e.target.value)}
                  placeholder="Search city or country..."
                  className="flex-1 md:w-80 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={fetchCities}
                  className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiRefreshCw />
                  <span>Load Cities</span>
                </button>
              </div>
            </div>

            {filteredCities.length > 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-600 mb-3">Available cities ({filteredCities.length}{cityQuery ? ` of ${cities.length}` : ``})</p>
                <div className="max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm">
                    {filteredCities.map((city, index) => (
                      <div key={index} className="bg-gray-50 px-3 py-2 rounded border text-gray-700">
                        {typeof city === 'string' 
                          ? city 
                          : city.operationalCityName || city.cityName || city.name || '—'}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <FiMapPin className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-500">No cities loaded</p>
                <p className="text-sm text-gray-400 mt-1">Click "Load Cities" to fetch available service areas</p>
              </div>
            )}
          </div>
        )}

        {/* City Picker Modal */}
        {isCityModalOpen && (
          <div id="postex-city-modal" className="fixed inset-0 z-[20000] flex items-start justify-center p-4 md:p-6">
            <div className="absolute inset-0 bg-black/40" onClick={() => setIsCityModalOpen(false)}></div>
            <div className="relative z-[20001] bg-white w-full max-w-2xl rounded-lg shadow-xl p-4 mt-16">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-800">Select a valid city</h4>
                  <span className="px-2 py-0.5 text-xs rounded-md bg-purple-100 text-purple-700 border border-purple-200">PostEx</span>
                </div>
                <button onClick={() => setIsCityModalOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="text"
                  value={cityQuery}
                  onChange={(e) => setCityQuery(e.target.value)}
                  placeholder="Search city or country..."
                  className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={fetchCities}
                  className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiRefreshCw />
                  <span>Refresh</span>
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto border rounded-md">
                {filteredCities.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">No cities found</div>
                ) : (
                  <ul className="divide-y">
                    {filteredCities.slice(0, 200).map((city, idx) => (
                      <li key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50">
                        <div className="truncate">
                          <div className="font-medium text-gray-800 truncate">{city.operationalCityName || city.cityName || city.name}</div>
                          <div className="text-xs text-gray-500">{city.countryName}</div>
                        </div>
                        <button
                          onClick={() => handleSelectCityAndPush(city)}
                          className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          select 
                        </button>
                      </li>)
                    )}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostExManager;
