import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import {
  LayoutGrid,
  ArrowRightLeft,
  RotateCw,
  ShoppingBag,
  FileSpreadsheet,
} from "lucide-react";
import { SiteFilter } from "../../components/filters/SiteFilter";
import { ProductFilter } from "../../components/filters/ProductFilter";
import { VendorFilter } from "../../components/filters/VendorFilter";
import {
  InfiniteScrollTable,
  type Column,
} from "../../components/common/InfiniteScrollTable";
import { CustomSelect } from "../../components/common/CustomSelect";
import { PageHeader } from "../../components/common/PageHeader";
import { InventoryService } from "../../services/inventoryService";
import { InventoryDetailModal } from "../../components/inventory/InventoryDetailModal";
import { EditProductModal } from "../../components/inventory/EditProductModal";
import { ConsumeStockModal } from "../../components/inventory/ConsumeStockModal";
import { CreateCompositeModal } from "../../components/inventory/CreateCompositeModal";
import { TransferStockModal } from "../../components/inventory/TransferStockModal";
import { ExportInventoryModal } from "../../components/inventory/ExportInventoryModal";
import type {
  Site,
  Product,
  Vendor,
  InventoryItem,
  InventoryFetchPayload,
} from "../../types/inventory";

export default function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { accounts } = useMsal();
  const claims = accounts[0]?.idTokenClaims ?? {};
  const tokenRoles: string[] = Array.isArray(claims['roles']) ? (claims['roles'] as string[]) : [];
  const canSeeFinancials = tokenRoles.some(r => ['ADMIN', 'MANAGER'].includes(r));

  // States - initialized immediately from URL search params so refresh preserves filters and sends correct payload
  const [selectedSites, setSelectedSites] = useState<Site[]>(() => {
    const siteParam = searchParams.get("sites") || searchParams.get("site");
    const ids = siteParam?.split(",").map(Number).filter(Boolean) || [];
    return ids.map((id) => ({
      id,
      name: `Site #${id}`,
      address: "",
      city: "",
      state: "",
      country: "",
      zipCode: 0,
      gpsLat: 0,
      gpsLng: 0,
      startDate: null,
      endDate: null,
      projectType: "",
      status: "",
      searchKey: "",
    }));
  });

  const [selectedProducts, setSelectedProducts] = useState<Product[]>(() => {
    const productParam = searchParams.get("products") || searchParams.get("product");
    const ids = productParam?.split(",").map(Number).filter(Boolean) || [];
    return ids.map((id) => ({
      id,
      imageUrl: null,
      name: `Product #${id}`,
      hsnName: "",
      hsnCode: 0,
      cgstInPerc: 0,
      sgstInPerc: 0,
      unit: "",
      price: 0,
      tax: 0,
      priceIncTax: 0,
    }));
  });

  const [selectedVendors, setSelectedVendors] = useState<Vendor[]>(() => {
    const vendorParam = searchParams.get("vendors") || searchParams.get("vendor");
    const ids = vendorParam?.split(",").map(Number).filter(Boolean) || [];
    return ids.map((id) => ({
      id,
      name: `Vendor #${id}`,
      contactEmail: "",
      contactPhone: "",
      gstNumber: "",
      address: "",
    }));
  });

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [searchType, setSearchType] = useState(
    searchParams.get("st") || "Product Name"
  );

  // Table state
  const [tableData, setTableData] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedItems, setSelectedItems] = useState<Map<string, InventoryItem>>(new Map());
  const selectedKeys = new Set(selectedItems.keys());
  const [isHydrated, setIsHydrated] = useState(false);
  const [hsnSubHeading, setHsnSubHeading] = useState<string | null>(searchParams.get("hsnSubHeading") || null);

  // Detail Modal State
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);

  // Consume Modal State
  const [isConsumeOpen, setIsConsumeOpen] = useState(false);
  const [consumeItems, setConsumeItems] = useState<InventoryItem[]>([]);

  // Composite Modal State
  const [isCompositeOpen, setIsCompositeOpen] = useState(false);
  const [compositeItems, setCompositeItems] = useState<InventoryItem[]>([]);

  // Transfer Modal State
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferItems, setTransferItems] = useState<InventoryItem[]>([]);

  // Export Modal State
  const [isExportOpen, setIsExportOpen] = useState(false);

  const getItemKey = (item: InventoryItem) =>
    `${item.productId}-${item.siteId}`;

  const pageRef = useRef(0);
  const isLoadingRef = useRef(false);
  // Keys from URL that haven't been resolved to full items yet
  const pendingSelKeys = useRef<Set<string>>(
    new Set((searchParams.get("sel") ?? "").split(",").filter(Boolean))
  );

  const isHydratingRef = useRef(false);

  // 1. URL Sync Effect: Update browser URL when state changes
  useEffect(() => {
    const params: Record<string, string> = {};
    if (search) params.q = search;
    if (searchType !== "Product Name") params.st = searchType;
    if (selectedSites.length > 0)
      params.sites = selectedSites.map((s) => s.id).join(",");
    if (selectedProducts.length > 0)
      params.products = selectedProducts.map((p) => p.id).join(",");
    if (selectedVendors.length > 0)
      params.vendors = selectedVendors.map((v) => v.id).join(",");
    if (selectedItems.size > 0)
      params.sel = Array.from(selectedItems.keys()).join(",");
    if (hsnSubHeading) params.hsnSubHeading = hsnSubHeading;

    setSearchParams(params, { replace: true });
  }, [
    search,
    searchType,
    selectedSites,
    selectedProducts,
    selectedVendors,
    selectedItems,
    hsnSubHeading,
    setSearchParams,
  ]);

  // Robust detail-fetching helpers for hydration with fallback
  const fetchSiteDetails = async (ids: number[]): Promise<Site[]> => {
    try {
      const res = await InventoryService.fetchSitesByIds(ids);
      if (res.data?.content && res.data.content.length > 0) {
        return res.data.content;
      }
    } catch {
      // Endpoint may not support { ids } on certain backend builds
    }
    try {
      const res = await InventoryService.fetchSites(0, 100);
      const all = res.data?.content || [];
      return all.filter((s) => ids.includes(s.id));
    } catch {
      return [];
    }
  };

  const fetchProductDetails = async (ids: number[]): Promise<Product[]> => {
    try {
      const res = await InventoryService.fetchProductsByIds(ids);
      if (res.data?.content && res.data.content.length > 0) {
        return res.data.content;
      }
    } catch {
      // fallback
    }
    try {
      const res = await InventoryService.fetchProducts(0, 100);
      const all = res.data?.content || [];
      return all.filter((p) => ids.includes(p.id));
    } catch {
      return [];
    }
  };

  const fetchVendorDetails = async (ids: number[]): Promise<Vendor[]> => {
    try {
      const res = await InventoryService.fetchVendorsByIds(ids);
      if (res.data?.content && res.data.content.length > 0) {
        return res.data.content;
      }
    } catch {
      // fallback
    }
    try {
      const res = await InventoryService.fetchVendors(0, 100);
      const all = res.data?.content || [];
      return all.filter((v) => ids.includes(v.id));
    } catch {
      return [];
    }
  };

  // 2. Hydration Effect: Fetch full objects for IDs found in URL and enrich the stub objects
  useEffect(() => {
    if (isHydrated || isHydratingRef.current) return;
    isHydratingRef.current = true;

    const hydrate = async () => {
      const siteParam = searchParams.get("sites") || searchParams.get("site");
      const productParam = searchParams.get("products") || searchParams.get("product");
      const vendorParam = searchParams.get("vendors") || searchParams.get("vendor");

      const siteIds = siteParam?.split(",").map(Number).filter(Boolean) || [];
      const productIds = productParam?.split(",").map(Number).filter(Boolean) || [];
      const vendorIds = vendorParam?.split(",").map(Number).filter(Boolean) || [];

      if (
        siteIds.length === 0 &&
        productIds.length === 0 &&
        vendorIds.length === 0
      ) {
        setIsHydrated(true);
        return;
      }

      try {
        if (siteIds.length > 0) {
          const sites = await fetchSiteDetails(siteIds);
          if (sites.length > 0) {
            setSelectedSites((prev) => {
              const map = new Map(sites.map((s) => [s.id, s]));
              return prev.map((p) => map.get(p.id) || p);
            });
          }
        }
        if (productIds.length > 0) {
          const products = await fetchProductDetails(productIds);
          if (products.length > 0) {
            setSelectedProducts((prev) => {
              const map = new Map(products.map((p) => [p.id, p]));
              return prev.map((p) => map.get(p.id) || p);
            });
          }
        }
        if (vendorIds.length > 0) {
          const vendors = await fetchVendorDetails(vendorIds);
          if (vendors.length > 0) {
            setSelectedVendors((prev) => {
              const map = new Map(vendors.map((v) => [v.id, v]));
              return prev.map((v) => map.get(v.id) || v);
            });
          }
        }
      } catch (e) {
        console.error("Hydration failed", e);
      } finally {
        setIsHydrated(true);
      }
    };

    hydrate();
  }, [searchParams, isHydrated]);

  const getFilterPayload = useCallback((): InventoryFetchPayload => {
    const siteParam = searchParams.get("sites") || searchParams.get("site");
    const fallbackSiteIds = siteParam?.split(",").map(Number).filter(Boolean) || [];
    const siteIds = selectedSites.length > 0 ? selectedSites.map((s) => s.id) : fallbackSiteIds;

    const productParam = searchParams.get("products") || searchParams.get("product");
    const fallbackProductIds = productParam?.split(",").map(Number).filter(Boolean) || [];
    const productIds = selectedProducts.length > 0 ? selectedProducts.map((p) => p.id) : fallbackProductIds;

    const vendorParam = searchParams.get("vendors") || searchParams.get("vendor");
    const fallbackVendorIds = vendorParam?.split(",").map(Number).filter(Boolean) || [];
    const vendorIds = selectedVendors.length > 0 ? selectedVendors.map((v) => v.id) : fallbackVendorIds;

    return {
      site: siteIds,
      product: productIds,
      vendor: vendorIds,
      showZeroStock: false,
      searchByProductName:
        searchType === "Product Name" && search.length >= 3 ? search : null,
      searchByBillNo:
        searchType === "Invoice No" && search.length >= 3 ? search : null,
      searchBySupplierName:
        searchType === "Vendor Name" && search.length >= 3 ? search : null,
      sortBy: sortBy,
      sortDir: sortBy ? sortDir : null,
      hsnSubHeading: hsnSubHeading,
    };
  }, [
    searchParams,
    selectedSites,
    selectedProducts,
    selectedVendors,
    searchType,
    search,
    sortBy,
    sortDir,
    hsnSubHeading,
  ]);

  const loadData = useCallback(
    async (reset: boolean = false) => {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      setIsLoading(true);

      try {
        if (reset) {
          pageRef.current = 0;
          setHasMore(true);
        }

        const payload = getFilterPayload();

        const res = await InventoryService.fetchInventory(
          pageRef.current,
          10,
          payload
        );
        const items = res.data.content || [];

        setTableData((prev) => {
          const merged = reset ? items : [...prev, ...items]
          const seen = new Map<string, InventoryItem>()
          for (const item of merged) {
            const key = `${item.productId}-${item.siteId}`
            const existing = seen.get(key)
            if (existing) {
              seen.set(key, { ...existing, quantity: existing.quantity + item.quantity })
            } else {
              seen.set(key, item)
            }
          }
          return Array.from(seen.values())
        });
        setTotalElements(res.data.totalElements || 0);

        pageRef.current += 1;
        setHasMore(
          res.data.last !== undefined ? !res.data.last : items.length === 10
        );
      } catch (e) {
        console.error(e);
      } finally {
        isLoadingRef.current = false;
        setIsLoading(false);
      }
    },
    [selectedSites, selectedProducts, selectedVendors, search, searchType, sortBy, sortDir, hsnSubHeading]
  );

  // Auto-select items that were pending from URL (resolved as pages load in)
  useEffect(() => {
    if (pendingSelKeys.current.size === 0) return;
    setSelectedItems(prev => {
      const next = new Map(prev);
      let changed = false;
      tableData.forEach(item => {
        const key = getItemKey(item);
        if (pendingSelKeys.current.has(key) && !next.has(key)) {
          next.set(key, item);
          pendingSelKeys.current.delete(key);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [tableData]);

  // Filter change effect
  useEffect(() => {
    if (!isHydrated) return;

    const timer = setTimeout(() => {
      loadData(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [loadData, isHydrated]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoadingRef.current) {
      loadData(false);
    }
  }, [hasMore, loadData]);

  const handleClearFilters = () => {
    setSearch("");
    setSelectedSites([]);
    setSelectedProducts([]);
    setSelectedVendors([]);
    setSearchType("Product Name");
    setHsnSubHeading(null);
  };

  const handleQtyClick = useCallback((item: InventoryItem) => {
    setDetailItem(item);
    setIsDetailOpen(true);
  }, []);

  const handleEditClick = useCallback((item: InventoryItem) => {
    setEditItem(item);
    setIsEditOpen(true);
  }, []);

  const handleConsumeAction = useCallback(() => {
    setConsumeItems(Array.from(selectedItems.values()));
    setIsConsumeOpen(true);
  }, [selectedItems]);

  const handleCompositeAction = useCallback(() => {
    setCompositeItems(Array.from(selectedItems.values()));
    setIsCompositeOpen(true);
  }, [selectedItems]);

  const handleTransferAction = useCallback(() => {
    setTransferItems(Array.from(selectedItems.values()));
    setIsTransferOpen(true);
  }, [selectedItems]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const hasActiveFilters =
    search.length > 0 ||
    selectedSites.length > 0 ||
    selectedProducts.length > 0 ||
    selectedVendors.length > 0 ||
    !!hsnSubHeading;

  const toggleSelect = (key: string | number) => {
    const strKey = String(key);
    setSelectedItems(prev => {
      const next = new Map(prev);
      if (next.has(strKey)) {
        next.delete(strKey);
      } else {
        const item = tableData.find(i => getItemKey(i) === strKey);
        if (item) next.set(strKey, item);
      }
      return next;
    });
  };

  const toggleSelectAll = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedItems(prev => {
        const next = new Map(prev);
        tableData.slice(0, 150).forEach(item => next.set(getItemKey(item), item));
        return next;
      });
    } else {
      setSelectedItems(new Map());
    }
  };

  const columns: Column<InventoryItem>[] = [
    {
      header: "Product Name",
      key: "productName",
      width: "40%",
      cellType: "product",
      dataMap: {
        image: "imageUrl",
        title: "productName",
        subtitle: "vendorNames",
      },
    },
    {
      header: "Site",
      key: "site",
      width: "15%",
      cellType: "location",
      dataMap: { title: "site", subtitle: "siteCity" },
    },
    {
      header: "Available Qty",
      key: "quantity",
      width: "16%",
      className: "text-right",
      cellType: "quantity",
      dataMap: { value: "quantity", unit: "unit" },
      onCellClick: handleQtyClick,
    },
    {
      header: "Price / unit",
      key: "price",
      width: "18%",
      className: "text-right",
      sortable: true,
      sortField: "price",
      cellType: "currency",
      dataMap: {
        value: "price",
        unit: "unit",
        computedTax: (row) => row.taxPerUnit ?? 0,
      },
      render: !canSeeFinancials ? () => (
        <div className="flex flex-col items-end opacity-40 select-none">
          <div className="text-[13px] font-bold">₹ ••••</div>
          <span className="text-[10px] mt-0.5">+ ₹ •• tax</span>
        </div>
      ) : undefined,
    },
    {
      header: "Net Amount",
      key: "netAmount",
      width: "15%",
      className: "text-right",
      sortable: true,
      sortField: "totalExcludingTax",
      cellType: "currency-net",
      dataMap: {
        value: "totalExcludingTax",
        computedTax: (row) => row.totalIncludingTax - row.totalExcludingTax,
      },
      render: !canSeeFinancials ? () => (
        <div className="flex flex-col items-end opacity-40 select-none">
          <div className="text-[13px] font-bold">₹ ••••</div>
          <span className="text-[10px] mt-0.5">+ ₹ •• tax</span>
        </div>
      ) : undefined,
    },
  ];

  const selectionActions = [
    {
      label: `Export XLS (${selectedItems.size})`,
      icon: FileSpreadsheet,
      onClick: () => setIsExportOpen(true),
    },
    {
      label: "Consume",
      icon: ShoppingBag,
      onClick: handleConsumeAction,
    },
    {
      label: "Create Final Product",
      icon: LayoutGrid,
      onClick: handleCompositeAction,
    },
    {
      label: "Transfer",
      icon: ArrowRightLeft,
      onClick: handleTransferAction,
    },
  ];

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto w-full flex flex-col h-full transition-all">
      {/* Header */}
      <PageHeader
        title="Inventory Management"
        description="Track and manage your stock across all sites"
        actions={
          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[13px] font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet size={16} />
            <span>Export XLS</span>
          </button>
        }
      />

      {/* Filters Row */}
      <div className="flex flex-row flex-wrap items-center gap-3 mb-5 w-full bg-card p-3 rounded-xl border border-border-main">
        {/* Search Input with Prefix Select */}
        <div className="flex items-center bg-card border border-border-main rounded-lg h-[38px] w-full md:flex-[1.5] md:min-w-[320px] shadow-sm relative z-20">
          <div className="h-full border-r border-border-main w-[110px] sm:w-[140px] shrink-0 font-medium">
            <CustomSelect
              placeholder="Search by"
              options={[
                { label: "Product Name", value: "Product Name" },
                { label: "Invoice No", value: "Invoice No" },
                { label: "Vendor Name", value: "Vendor Name" },
              ]}
              value={searchType}
              onChange={(val) => setSearchType(val)}
            />
          </div>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 h-full px-3 text-[13px] text-primary-text placeholder:text-muted-text outline-none rounded-r-lg bg-transparent"
          />
        </div>

        {/* Multi-Select Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto md:flex-1">
          <SiteFilter
            selectedItems={selectedSites}
            onSelectionChange={setSelectedSites}
            className="w-full sm:w-[calc(50%-6px)] md:w-auto flex-1 md:min-w-[200px]"
          />
          <ProductFilter
            selectedItems={selectedProducts}
            onSelectionChange={setSelectedProducts}
            className="w-full sm:w-[calc(50%-6px)] md:w-auto flex-1 md:min-w-[200px]"
          />
        </div>
        <VendorFilter
          selectedItems={selectedVendors}
          onSelectionChange={setSelectedVendors}
          className="w-full sm:w-[calc(50%-6px)] md:w-auto flex-1 md:min-w-[200px]"
        />

        <div className="flex items-center gap-2 ml-auto">
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-2 px-3 py-1.5 text-[12px] font-bold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all active:scale-95 cursor-pointer"
            >
              <RotateCw size={14} />
              Clear
            </button>
          )}
          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-lg text-[12px] font-bold transition-all active:scale-95 cursor-pointer"
            title="Export filtered records to Excel (max 1,000 rows)"
          >
            <FileSpreadsheet size={15} />
            <span>Export XLS</span>
          </button>
        </div>


      </div>

      {/* Table Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <InfiniteScrollTable
          data={tableData}
          columns={columns}
          isLoading={isLoading}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          onClearFilters={handleClearFilters}
          keyExtractor={getItemKey}
          selectable={true}
          selectedKeys={selectedKeys}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          totalElements={totalElements}
          itemName="products"
          selectionActions={selectionActions}
          onEdit={handleEditClick}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
        />
      </div>

      {isDetailOpen && (
        <InventoryDetailModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          item={detailItem}
        />
      )}

      {isEditOpen && (
        <EditProductModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          item={editItem}
          onSuccess={() => {
            setTableData([]);
            pageRef.current = 0;
            loadData(true);
          }}
        />
      )}

      {isConsumeOpen && (
        <ConsumeStockModal
          isOpen={isConsumeOpen}
          onClose={() => setIsConsumeOpen(false)}
          items={consumeItems}
          onSuccess={() => {
            setTableData([]);
            pageRef.current = 0;
            loadData(true);
            setSelectedItems(new Map());
          }}
        />
      )}

      {isCompositeOpen && (
        <CreateCompositeModal
          isOpen={isCompositeOpen}
          onClose={() => setIsCompositeOpen(false)}
          rawItems={compositeItems}
          onSuccess={() => {
            setTableData([]);
            pageRef.current = 0;
            loadData(true);
            setSelectedItems(new Map());
          }}
        />
      )}

      {isTransferOpen && (
        <TransferStockModal
          isOpen={isTransferOpen}
          onClose={() => setIsTransferOpen(false)}
          items={transferItems}
          onSuccess={() => {
            const keysToRemove = new Set(transferItems.map(getItemKey));
            setTableData((prev) =>
              prev.filter((item) => !keysToRemove.has(getItemKey(item)))
            );
            setTotalElements((prev) => Math.max(0, prev - transferItems.length));
            setSelectedItems(new Map());
            // Background reload to sync with server
            loadData(true);
          }}
        />
      )}

      {isExportOpen && (
        <ExportInventoryModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          totalElements={totalElements}
          activePayload={getFilterPayload()}
          canSeeFinancials={canSeeFinancials}
          metadata={{
            siteNames: selectedSites.map((s) => s.name),
            productNames: selectedProducts.map((p) => p.name),
            vendorNames: selectedVendors.map((v) => v.name),
            searchTerm: search.length >= 3 ? `${searchType}: ${search}` : undefined,
            totalElements,
          }}
          selectedItemsMap={selectedItems}
        />
      )}
    </div>
  );
}
