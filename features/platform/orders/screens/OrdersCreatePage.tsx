"use client";

import React from "react";
import Link from "next/link";
import { PageBreadcrumbs } from "@/features/dashboard/components/PageBreadcrumbs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { ListBand, PageTitle, Pill, SectionTitle, Track } from "@/features/platform/components/vault-ui";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CustomerSearchCombobox } from "../components/CustomerSearchCombobox";
import { AddressSelectCombobox } from "../components/AddressSelectCombobox";
import { LineItemsManager } from "../components/LineItemsManager";
import { AdminPaymentSelection } from "../components/AdminPaymentSelection";
import { CreateItemDrawer } from "@/features/dashboard/views/relationship/client/components/CreateItemDrawer";
import { getCustomer } from "../actions/customers";
import { getRegionByCountry, getActiveCartPaymentProviders } from "../actions/regions";


type LineItem = {
  id: string;
  variant: any;
  quantity: number;
  unitPrice: number;
  total: number;
};

export function OrdersCreatePage() {
  const router = useRouter();
  
  // Order state
  const [lineItems, setLineItems] = React.useState<LineItem[]>([]);
  const [isCreatingOrder, setIsCreatingOrder] = React.useState(false);
  
  // Customer and address management state
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = React.useState<any>(null);
  const [selectedShippingAddressId, setSelectedShippingAddressId] = React.useState<string | null>(null);
  const [selectedShippingAddress, setSelectedShippingAddress] = React.useState<any>(null);
  const [selectedBillingAddressId, setSelectedBillingAddressId] = React.useState<string | null>(null);
  const [selectedBillingAddress, setSelectedBillingAddress] = React.useState<any>(null);
  const [sameAsShippingAddress, setSameAsShippingAddress] = React.useState(true);
  
  // Payment state
  const [availablePaymentMethods, setAvailablePaymentMethods] = React.useState<any[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<string>("");
  const [cartId, setCartId] = React.useState<string | null>(null);
  const [orderCreationMode, setOrderCreationMode] = React.useState<"draft" | "immediate">("draft");
  const [customerEmailForPayment, setCustomerEmailForPayment] = React.useState(true);

  // Create drawer state
  const [createDrawerOpen, setCreateDrawerOpen] = React.useState(false);
  const [createDrawerListKey, setCreateDrawerListKey] = React.useState<string>("");

  // Handle customer selection
  const handleCustomerChange = (customerId: string | null) => {
    setSelectedCustomerId(customerId);
    setSelectedShippingAddressId(null);
    setSelectedShippingAddress(null);
    setSelectedBillingAddressId(null);
    setSelectedBillingAddress(null);
    
    if (customerId) {
      const fetchCustomer = async () => {
        const result = await getCustomer(customerId);
        if (result.success) {
          setSelectedCustomer(result.data);
        } else {
            toast.error("Error fetching customer");
        }
      };
      fetchCustomer();
    } else {
      setSelectedCustomer(null);
    }
  };

  // Handle shipping address selection
  const handleShippingAddressChange = async (addressId: string | null) => {
    setSelectedShippingAddressId(addressId);
    
    if (addressId && selectedCustomer) {
      const address = selectedCustomer.addresses?.find((addr: any) => addr.id === addressId);
      setSelectedShippingAddress(address || null);
      
      // If same as shipping is enabled, also set billing address
      if (sameAsShippingAddress) {
        setSelectedBillingAddressId(addressId);
        setSelectedBillingAddress(address || null);
      }

      // Fetch payment methods for the selected address's region
      if (address?.country?.iso2) {
        await fetchPaymentMethods(address.country.iso2);
      }
    } else {
      setSelectedShippingAddress(null);
      if (sameAsShippingAddress) {
        setSelectedBillingAddressId(null);
        setSelectedBillingAddress(null);
      }
      setAvailablePaymentMethods([]);
      setSelectedPaymentMethod("");
    }
  };

  // Fetch payment methods for a given country
  const fetchPaymentMethods = async (countryCode: string) => {
    const regionResult = await getRegionByCountry(countryCode);

    if (regionResult.success && regionResult.data) {
      const providersResult = await getActiveCartPaymentProviders(regionResult.data.id);
      if (providersResult.success) {
        const providers = providersResult.data || [];
        setAvailablePaymentMethods(providers);
        const manualProvider = providers.find((p: any) => p.code === 'manual');
        if (manualProvider) {
          setSelectedPaymentMethod('manual');
        }
      } else {
        toast.error("Error fetching payment methods");
      }
    } else {
        toast.error("Error fetching region");
    }
  };

  // Handle billing address selection
  const handleBillingAddressChange = (addressId: string | null) => {
    setSelectedBillingAddressId(addressId);
    
    if (addressId && selectedCustomer) {
      const address = selectedCustomer.addresses?.find((addr: any) => addr.id === addressId);
      setSelectedBillingAddress(address || null);
    } else {
      setSelectedBillingAddress(null);
    }
  };

  // Handle same as shipping toggle
  const handleSameAsShippingChange = (checked: boolean) => {
    setSameAsShippingAddress(checked);
    
    if (checked && selectedShippingAddress) {
      setSelectedBillingAddressId(selectedShippingAddressId);
      setSelectedBillingAddress(selectedShippingAddress);
    } else {
      setSelectedBillingAddressId(null);
      setSelectedBillingAddress(null);
    }
  };

  // Handle new address creation
  const handleAddressCreated = (newAddress: any) => {
    if (selectedCustomer) {
      setSelectedCustomer((prev: any) => ({
        ...prev,
        addresses: [...(prev.addresses || []), newAddress]
      }));
    }
  };

  // Handle creating new customer via CreateItemDrawer
  const handleCreateCustomer = () => {
    setCreateDrawerListKey("User");
    setCreateDrawerOpen(true);
  };

  // Handle creating new address via CreateItemDrawer
  const handleCreateAddress = () => {
    if (!selectedCustomerId) return;
    setCreateDrawerListKey("Address");
    setCreateDrawerOpen(true);
  };

  // Handle drawer close
  const handleDrawerClose = () => {
    setCreateDrawerOpen(false);
    setCreateDrawerListKey("");
  };

  // Handle successful creation from drawer
  const handleItemCreated = (data: Record<string, unknown>) => {
    const item = data as { id: string; label?: string };
    // If we created a customer, select them
    if (createDrawerListKey === "User") {
      handleCustomerChange(item.id);
    }
    // If we created an address and have a selected customer, refresh customer data
    if (createDrawerListKey === "Address" && selectedCustomerId) {
      handleCustomerChange(selectedCustomerId);
    }
    handleDrawerClose();
  };

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const shippingCost = 5.00; // Placeholder
  const taxAmount = subtotal * 0.1; // 10% tax placeholder
  const total = subtotal + shippingCost + taxAmount;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleCreateCart = async () => {
    if (!selectedCustomer || !selectedShippingAddress || lineItems.length === 0) {
      toast.error("Missing required data for cart creation");
      return;
    }

    const { createOrderCart, createAdminCartPaymentSessions } = await import('../actions/orders');

    const result = await createOrderCart({
      customerId: selectedCustomer.id,
      shippingAddressId: selectedShippingAddress.id,
      billingAddressId: selectedBillingAddress?.id || selectedShippingAddress.id,
      lineItems: lineItems.map(item => ({
        variantId: item.variant.id,
        quantity: item.quantity
      }))
    });

    if (result.success && result.data) {
      setCartId(result.data.cartId);
      await createAdminCartPaymentSessions(result.data.cartId);
      toast.success("Cart created successfully");
    } else {
      toast.error(result.error || "Failed to create cart");
    }
  };

  const handlePlaceOrder = async () => {
    if (!cartId || !selectedPaymentMethod) {
      toast.error("Cart and payment method are required");
      return;
    }

    setIsCreatingOrder(true);
    try {
      // Import admin server actions
      const { initiateAdminPaymentSession, completeAdminCart } = await import('../actions/orders');
      
      // Step 1: Initiate payment session using admin server action
      await initiateAdminPaymentSession(cartId, selectedPaymentMethod);

      // Step 2: Complete the cart using admin server action
      const completeResult = await completeAdminCart(cartId);
      
      if (!completeResult.success) {
        throw new Error(completeResult.error || "Failed to complete order");
      }

      // The completeActiveCart mutation returns the order directly
      const order = completeResult.data.completeActiveCart;
      
      if (!order) {
        throw new Error("Failed to complete order");
      }
      
      // Show success message and redirect
      toast.success(`Order #${order.displayId} created successfully!`);
      
      // Redirect to the order details page
      router.push(`/dashboard/platform/orders/${order.id}`);

    } catch (error) {
      console.error("Error placing order:", error);
      toast.error(`Failed to place order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleCreateDraftOrder = async () => {
    if (!cartId) {
      toast.error("Cart is required");
      return;
    }

    setIsCreatingOrder(true);
    try {
      // Create order in "Pending Payment" status
      // This is a placeholder implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (customerEmailForPayment) {
        // Send email with payment link to customer
        toast.success("Draft order created and payment instructions sent to customer!");
      } else {
        toast.success("Draft order created successfully!");
      }
      
      router.push("/dashboard/platform/orders");
    } catch (error) {
      console.error("Error creating draft order:", error);
      toast.error("Failed to create draft order");
    } finally {
      setIsCreatingOrder(false);
    }
  };

  return (
    <>
      <PageBreadcrumbs
        items={[
          { type: 'link', label: 'Dashboard', href: '' },
          { type: 'page', label: 'Platform' },
          { type: 'link', label: 'Orders', href: '/platform/orders' },
          { type: 'page', label: 'Create Order' },
        ]}
      />
      <div className="max-w-6xl space-y-8 p-4 pb-10 md:p-6">
        <div className="space-y-3">
          <Link
            href="/dashboard/platform/orders"
            className="inline-flex min-h-8 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Orders
          </Link>
          <PageTitle
            title="Create order"
            tone={cartId ? "info" : undefined}
            state={cartId ? "Cart created" : undefined}
          />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="min-w-0 space-y-8 lg:col-span-8">
            <LineItemsManager
              lineItems={lineItems}
              onLineItemsChange={setLineItems}
            />

            <section>
              <SectionTitle>Totals</SectionTitle>
              <ListBand>
                {[
                  ["Subtotal", formatPrice(subtotal)],
                  ["Shipping", formatPrice(shippingCost)],
                  ["Tax", formatPrice(taxAmount)],
                ].map(([name, value]) => (
                  <div key={name} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
                    <span className="text-muted-foreground">{name}</span>
                    <span className="font-mono tabular-nums text-foreground">{value}</span>
                  </div>
                ))}
                <div className="flex justify-between gap-4 px-4 py-3 text-sm font-semibold">
                  <span className="text-foreground">Total</span>
                  <span className="font-mono tabular-nums text-foreground">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between gap-4 px-4 py-2.5 text-sm">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="font-mono tabular-nums text-foreground">€0.00</span>
                </div>
              </ListBand>
            </section>

            {cartId && availablePaymentMethods.length > 0 && (
              <section>
                <SectionTitle>Payment</SectionTitle>
                <ListBand>
                  <div className="space-y-4 px-4 py-4">
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">Mode</div>
                      <Track label="Order creation mode">
                        <Pill active={orderCreationMode === "draft"} onClick={() => setOrderCreationMode("draft")}>
                          Draft with payment link
                        </Pill>
                        <Pill active={orderCreationMode === "immediate"} onClick={() => setOrderCreationMode("immediate")}>
                          Charge now
                        </Pill>
                      </Track>
                    </div>

                    {orderCreationMode === "draft" && (
                      <div className="flex min-h-10 items-center gap-2">
                        <Switch
                          id="email-customer"
                          checked={customerEmailForPayment}
                          onCheckedChange={setCustomerEmailForPayment}
                        />
                        <Label htmlFor="email-customer" className="text-sm">
                          Email customer payment instructions
                        </Label>
                      </div>
                    )}

                    {orderCreationMode === "immediate" && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">Payment method</div>
                        <AdminPaymentSelection
                          availablePaymentMethods={availablePaymentMethods}
                          selectedPaymentMethod={selectedPaymentMethod}
                          onPaymentMethodChange={setSelectedPaymentMethod}
                        />
                      </div>
                    )}

                    {orderCreationMode === "draft" ? (
                      <Button
                        onClick={handleCreateDraftOrder}
                        className="h-11 w-full rounded-full"
                        disabled={isCreatingOrder}
                      >
                        {isCreatingOrder ? "Creating Order..." : "Create Draft Order"}
                      </Button>
                    ) : (
                      <Button
                        onClick={handlePlaceOrder}
                        className="h-11 w-full rounded-full"
                        disabled={isCreatingOrder || !selectedPaymentMethod}
                      >
                        {isCreatingOrder ? "Processing Payment..." : "Place Order"}
                      </Button>
                    )}
                  </div>
                </ListBand>
              </section>
            )}
          </div>

          <div className="min-w-0 space-y-8 lg:col-span-4">
            <section>
              <SectionTitle>Customer</SectionTitle>
              <ListBand>
                <div className="px-4 py-3">
                  <CustomerSearchCombobox
                    value={selectedCustomerId || undefined}
                    onValueChange={handleCustomerChange}
                    selectedCustomer={selectedCustomer}
                    label=""
                    placeholder="Search customers..."
                    className="space-y-0"
                    onCreateCustomer={handleCreateCustomer}
                  />
                </div>
                {selectedCustomer && (
                  <div className="px-4 py-3">
                    <div className="text-sm font-medium text-foreground">
                      {selectedCustomer.firstName} {selectedCustomer.lastName}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 font-mono text-xs tabular-nums text-muted-foreground">
                      <span>{selectedCustomer.phone || "No phone number"}</span>
                      <span>{selectedCustomer.orders?.length || 0} orders</span>
                    </div>
                  </div>
                )}
              </ListBand>
            </section>

            <section>
              <SectionTitle>Shipping address</SectionTitle>
              <ListBand>
                <div className="px-4 py-3">
                  {selectedCustomer ? (
                    <AddressSelectCombobox
                      addresses={selectedCustomer.addresses || []}
                      value={selectedShippingAddressId || undefined}
                      onValueChange={handleShippingAddressChange}
                      selectedAddress={selectedShippingAddress}
                      label=""
                      placeholder="Search addresses..."
                      customerId={selectedCustomerId || undefined}
                      onAddressCreated={handleAddressCreated}
                      onCreateAddress={handleCreateAddress}
                      className="space-y-0"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">Select a customer first</p>
                  )}
                </div>
                {selectedShippingAddress && (
                  <div className="space-y-0.5 px-4 py-3 text-sm">
                    <div className="font-medium text-foreground">
                      {selectedShippingAddress.firstName} {selectedShippingAddress.lastName}
                    </div>
                    {selectedShippingAddress.company && (
                      <div className="text-muted-foreground">{selectedShippingAddress.company}</div>
                    )}
                    <div className="text-muted-foreground">{selectedShippingAddress.address1}</div>
                    {selectedShippingAddress.address2 && (
                      <div className="text-muted-foreground">{selectedShippingAddress.address2}</div>
                    )}
                    <div className="text-muted-foreground">
                      {[
                        selectedShippingAddress.city,
                        selectedShippingAddress.province,
                        selectedShippingAddress.postalCode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                    {selectedShippingAddress.country?.name && (
                      <div className="text-muted-foreground">{selectedShippingAddress.country.name}</div>
                    )}
                  </div>
                )}
              </ListBand>
            </section>

            <section>
              <SectionTitle>Billing address</SectionTitle>
              <ListBand>
                <div className="flex min-h-12 items-center gap-2 px-4 py-3">
                  <Switch
                    id="same-as-shipping"
                    checked={sameAsShippingAddress}
                    onCheckedChange={handleSameAsShippingChange}
                  />
                  <Label htmlFor="same-as-shipping" className="text-sm">
                    Same as shipping address
                  </Label>
                </div>
                {!sameAsShippingAddress && selectedCustomer ? (
                  <div className="px-4 py-3">
                    <AddressSelectCombobox
                      addresses={selectedCustomer.addresses || []}
                      value={selectedBillingAddressId || undefined}
                      onValueChange={handleBillingAddressChange}
                      selectedAddress={selectedBillingAddress}
                      label=""
                      placeholder="Search addresses..."
                      customerId={selectedCustomerId || undefined}
                      onAddressCreated={handleAddressCreated}
                      onCreateAddress={handleCreateAddress}
                      className="space-y-0"
                    />
                  </div>
                ) : sameAsShippingAddress && selectedShippingAddress ? null : !selectedCustomer ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground">Select a customer first</div>
                ) : (
                  <div className="px-4 py-3 text-sm text-muted-foreground">Select a shipping address first</div>
                )}
              </ListBand>
            </section>

            {selectedCustomer && selectedShippingAddress && lineItems.length > 0 && !cartId && (
              <Button
                onClick={handleCreateCart}
                className="h-11 w-full rounded-full"
              >
                Create Cart
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Create Item Drawer */}
      <CreateItemDrawer
        listKey={createDrawerListKey || ""}
        isOpen={createDrawerOpen && !!createDrawerListKey}
        onClose={handleDrawerClose}
        onCreate={handleItemCreated}
      />
    </>
  );
} 