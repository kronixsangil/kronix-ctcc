// app/(cc)/stores/lib/storesApi.ts
// app/(cc)/stores/lib/storesApi.ts
import { apiFetch } from "@/lib/api";

export type StoreStatusFilter = "ALL" | "ACTIVE" | "PAUSED" | "INACTIVE";
export type StorePremiumTier = "STANDARD" | "PREMIUM" | "PREMIUM_PLUS";
export type StorePayoutMethod = "BANK_ACCOUNT" | "NEQUI" | "DAVIPLATA";
export type StorePayoutInfoStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

export type StoreAffiliateStatus =
  | "PENDING_VISIT"
  | "VISITED"
  | "DOCUMENTS_PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED";
export type BannerBackgroundMode = "GRADIENT" | "IMAGE";
export type BannerTextAlign = "LEFT" | "CENTER";
export type BannerMediaPosition = "LEFT" | "RIGHT";
export type BannerAnimation = "NONE" | "PULSE" | "FLOAT";
export type HomeBackgroundMode = "SOLID" | "GRADIENT";
export type StoreCardLayout = "FEATURED" | "COMPACT";

export type SystemServiceType =
  | "STORE"
  | "PICKUP_AND_DELIVERY"
  | "SEND_PACKAGE"
  | "ERRAND";

export type AdminCityItem = {
  id: string;
  slug: string;
  name: string;
  department: string;
  country: string;
  isActive: boolean;
  isFeatured: boolean;
  storesCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminCitiesListResponse = {
  ok: true;
  items: AdminCityItem[];
  total: number;
  page: number;
  limit: number;
};

export type AdminStoreListItem = {
  id: string;
  storeCode: string;
  name: string;
  address: string;
  cityId: string | null;
  city?: {
    id: string;
    slug: string;
    name: string;
    department: string;
    country: string;
  } | null;
  category: string;
  isActive: boolean;
  isPaused: boolean;
  commissionRateBps: number;
  premiumTier: StorePremiumTier;
  autoDecisionMode: "AUTO_REJECT" | "AUTO_CONFIRM";
  autoDecisionMinutes: number;
  isBuyerRecommended: boolean;
  buyerRecommendedOrder: number | null;
  createdAt: string;
  todayOrders: number;
  todaySalesCOP: number;
  todayCommissionCOP: number;
  storePayoutInfoStatus?: StorePayoutInfoStatus | string | null;
  
};

export type AdminStoresListResponse = {
  items: AdminStoreListItem[];
  total: number;
  page: number;
  limit: number;
};

export type AdminStoreDetails = {
  id: string;
  storeCode: string;
  name: string;
  address: string;
  cityId: string | null;
  city?: {
    id: string;
    slug: string;
    name: string;
    department: string;
    country: string;
  } | null;
  lat: number;
  lng: number;
  category: string;
  description: string;
  cel1: string | null;
  cel2: string | null;
  hrOp: string | null;
  hrCl: string | null;
  etaMin: number;
  etaMax: number;
  image: string | null;
  image2: string | null;
  image3: string | null;
  image4: string | null;
  legalName?: string | null;
  nit?: string | null;
  businessEmail?: string | null;
  addressReference?: string | null;
  mainEntranceLat?: number | null;
  mainEntranceLng?: number | null;
  pickupLat?: number | null;
  pickupLng?: number | null;
  coverImage?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  themeId?: string | null;
  useCustomTheme?: boolean;
  customThemeJson?: any;
  theme?: any;
  onboardingStep?: number;
  onboardingCompleted?: boolean;
  ownerName?: string | null;
  ownerDocument?: string | null;
  ownerPhone?: string | null;
  ownerEmail?: string | null;
  storeType?: string | null;
  affiliateStatus?: StoreAffiliateStatus;
  visitedAt?: string | null;
  visitedBy?: string | null;
  physicalDocumentsReceived?: boolean;
  documentsReviewed?: boolean;
  documentsApproved?: boolean;
  contractSigned?: boolean;
  approvedAt?: string | null;
  approvedBy?: string | null;
  approvalNotes?: string | null;
  onboardingNotes?: string | null;
  rejectedReason?: string | null;

  storePayoutMethod?: StorePayoutMethod | null;
  storePayoutBankName?: string | null;
  storePayoutAccountType?: "AHORROS" | "CORRIENTE" | "BILLETERA" | string | null;
  storePayoutAccountNumber?: string | null;
  storePayoutAccountHolder?: string | null;
  storePayoutAccountDocument?: string | null;
  storePayoutNequiPhone?: string | null;
  storePayoutDaviplataPhone?: string | null;
  storePayoutBillingEmail?: string | null;
  storePayoutTaxResponsibility?: string | null;
  storePayoutTaxNotes?: string | null;
  storePayoutInfoStatus?: StorePayoutInfoStatus | null;
  storePayoutInfoSubmittedAt?: string | null;
  storePayoutInfoReviewedAt?: string | null;
  storePayoutInfoReviewedBy?: string | null;
  storePayoutInfoReviewNotes?: string | null;
  storePayoutInfoRejectedReason?: string | null;
  productsFeatureEnabled?: boolean;
  storeAppCanManageProducts?: boolean;
  storeAppCanCreateProducts?: boolean;
  storeAppCanEditProducts?: boolean;
  storeAppCanDeleteProducts?: boolean;
  storeAppCanChangeProductPrices?: boolean;
  storeAppCanUploadProductImages?: boolean;
  storeAppCanUseProductCamera?: boolean;
  storeAppCanImportProductsCsv?: boolean;
  storeAppCanToggleProductActive?: boolean;
  storeAppCanToggleProductAvailable?: boolean;
  isActive: boolean;
  isPaused: boolean;
  pausedReason: string | null;
  commissionRateBps: number;
  premiumTier: StorePremiumTier;
  autoDecisionMode: "AUTO_REJECT" | "AUTO_CONFIRM";
  autoDecisionMinutes: number;
  isBuyerRecommended: boolean;
  buyerRecommendedOrder: number | null;
  buyerCardTitleOverride: string | null;
  buyerCardSubtitleOverride: string | null;
  buyerCardBadgeText: string | null;
  buyerCardDistanceText: string | null;
  buyerCardRatingText: string | null;
  buyerCardStickerEmoji: string | null;
  buyerCardImageOrder: string | null;
  createdAt: string;
};

export type AdminStoreMetrics = {
  date: string;
  ordersCount: number;
  salesCOP: number;
  commissionCOP: number;
};

export type AdminCreateStoreInput = {
  citySlug: string;
  storeCode: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: string;
  description: string;
  etaMin: number;
  etaMax: number;
  cel1?: string | null;
  cel2?: string | null;
  hrOp?: string | null;
  hrCl?: string | null;
  image?: string | null;
  image2?: string | null;
  image3?: string | null;
  image4?: string | null;
  legalName?: string | null;
  nit?: string | null;
  businessEmail?: string | null;
  addressReference?: string | null;
  mainEntranceLat?: number | null;
  mainEntranceLng?: number | null;
  pickupLat?: number | null;
  pickupLng?: number | null;
  coverImage?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  themeId?: string | null;
  useCustomTheme?: boolean;
  customThemeJson?: any;
  onboardingStep?: number;
  onboardingCompleted?: boolean;
  ownerName?: string | null;
  ownerDocument?: string | null;
  ownerPhone?: string | null;
  ownerEmail?: string | null;
  storeType?: string | null;
  affiliateStatus?: StoreAffiliateStatus;
  visitedAt?: string | null;
  visitedBy?: string | null;
  physicalDocumentsReceived?: boolean;
  documentsReviewed?: boolean;
  documentsApproved?: boolean;
  contractSigned?: boolean;
  approvedAt?: string | null;
  approvedBy?: string | null;
  approvalNotes?: string | null;
  onboardingNotes?: string | null;
  rejectedReason?: string | null;
};

export type AdminUpdateStoreInput = Partial<AdminCreateStoreInput> & {
  isActive?: boolean;
  isPaused?: boolean;
  pausedReason?: string | null;
  commissionRateBps?: number;
  premiumTier?: StorePremiumTier;
  autoDecisionMode?: "AUTO_REJECT" | "AUTO_CONFIRM";
  autoDecisionMinutes?: number;
  isBuyerRecommended?: boolean;
  buyerRecommendedOrder?: number | null;
  buyerCardTitleOverride?: string | null;
  buyerCardSubtitleOverride?: string | null;
  buyerCardBadgeText?: string | null;
  buyerCardDistanceText?: string | null;
  buyerCardRatingText?: string | null;
  buyerCardStickerEmoji?: string | null;
  buyerCardImageOrder?: string | null;

  storePayoutMethod?: StorePayoutMethod | null;
  storePayoutBankName?: string | null;
  storePayoutAccountType?: "AHORROS" | "CORRIENTE" | "BILLETERA" | string | null;
  storePayoutAccountNumber?: string | null;
  storePayoutAccountHolder?: string | null;
  storePayoutAccountDocument?: string | null;
  storePayoutNequiPhone?: string | null;
  storePayoutDaviplataPhone?: string | null;
  storePayoutBillingEmail?: string | null;
  storePayoutTaxResponsibility?: string | null;
  storePayoutTaxNotes?: string | null;
  storePayoutInfoStatus?: StorePayoutInfoStatus | null;
  storePayoutInfoSubmittedAt?: string | null;
  storePayoutInfoReviewedAt?: string | null;
  storePayoutInfoReviewedBy?: string | null;
  storePayoutInfoReviewNotes?: string | null;
  storePayoutInfoRejectedReason?: string | null;
  productsFeatureEnabled?: boolean;
  storeAppCanManageProducts?: boolean;
  storeAppCanCreateProducts?: boolean;
  storeAppCanEditProducts?: boolean;
  storeAppCanDeleteProducts?: boolean;
  storeAppCanChangeProductPrices?: boolean;
  storeAppCanUploadProductImages?: boolean;
  storeAppCanUseProductCamera?: boolean;
  storeAppCanImportProductsCsv?: boolean;
  storeAppCanToggleProductActive?: boolean;
  storeAppCanToggleProductAvailable?: boolean;
};

export type AdminProduct = {
  id: string;
  storeId: string;
  externalId: string;
  name: string;
  description: string | null;
  info?: string | null;
  priceCOP: number;
  image: string | null;
  isActive?: boolean;
  isAvailable: boolean;
  sortOrder?: number;
  category?: string | null;
  categoryOrder?: number;
  isRecommended?: boolean;
  displayOrder?: number;
  createdAt: string;
  updatedAt?: string;
};

export type AdminCreateProductInput = {
  externalId: string;
  name: string;
  description?: string | null;
  info?: string | null;
  priceCOP: number;
  image?: string | null;
  isAvailable?: boolean;
  category?: string | null;
  categoryOrder?: number;
  isRecommended?: boolean;
  displayOrder?: number;
};

export type AdminUpdateProductInput = Partial<AdminCreateProductInput>;

export type AdminBuyerCategory = {
  id: string;
  cityId?: string | null;
  slug: string;
  name: string;
  emoji: string | null;
  sortOrder: number;
  isActive: boolean;
  matchTerms: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminCreateBuyerCategoryInput = {
  citySlug: string;
  slug: string;
  name: string;
  emoji?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  matchTerms?: string | null;
};

export type AdminUpdateBuyerCategoryInput = Partial<
  Omit<AdminCreateBuyerCategoryInput, "citySlug">
> & {
  citySlug: string;
};

export type AdminBuyerHomeBanner = {
  id: string;
  cityId?: string | null;
  key: string;
  title: string;
  subtitle: string | null;
  ctaText: string | null;
  emoji: string | null;
  imageUrl: string | null;
  bgMode: BannerBackgroundMode;
  bgFromColor: string;
  bgToColor: string;
  textColor: string;
  overlayColor: string | null;
  overlayOpacity: number | null;
  ctaBgColor: string | null;
  ctaTextColor: string | null;
  fontFamily: string | null;
  minHeight: number | null;
  borderRadius: number | null;
  paddingX: number | null;
  paddingY: number | null;
  contentAlign: BannerTextAlign;
  mediaPosition: BannerMediaPosition;
  showCta: boolean;
  showEmoji: boolean;
  showImage: boolean;
  titleFontSize: number | null;
  subtitleFontSize: number | null;
  ctaFontSize: number | null;
  emojiSize: number | null;
  imageWidth: number | null;
  imageHeight: number | null;
  animation: BannerAnimation;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminUpsertBuyerHomeBannerInput = Partial<AdminBuyerHomeBanner> & {
  citySlug: string;
  title: string;
};

export type AdminBuyerHomeConfig = {
  id: string;
  cityId?: string | null;
  key: string;
  homeBgMode: HomeBackgroundMode;
  homeBgColor: string;
  homeBgColor2: string | null;
  showRecommended: boolean;
  recommendedTitle: string;
  recommendedMax: number;
  storeCardLayout: StoreCardLayout;
  storeCardShowName: boolean;
  storeCardShowDescription: boolean;
  storeCardShowCategory: boolean;
  storeCardShowRating: boolean;
  storeCardShowDistance: boolean;
  storeCardShowEta: boolean;
  storeCardShowSticker: boolean;
  storeCardShowExtraImages: boolean;
  storeCardExtraImagesCount: number;
  storeCardShowBadge: boolean;
  storeCardCornerRadius: number;
  storeCardImageWidth: number;
  storeCardImageHeight: number;
    storeCardTitleFontSize: number;
  storeCardSubtitleFontSize: number;
  storeCardMetaFontSize: number;
  telEnabled: boolean;
  telShowMessage: boolean;
  telMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminUpsertBuyerHomeConfigInput = Partial<AdminBuyerHomeConfig> & {
  citySlug: string;
};

export type AdminSystemConfig = {
  id?: string;
  cityId?: string | null;
  city?: {
    id: string;
    slug: string;
    name: string;
    department: string;
    country: string;
  } | null;
  key: string;
  serviceType?: SystemServiceType;
  baseDeliveryCOP: number;
  extraStoreDeliveryCOP: number;
  serviceFeeCOP: number;
  serviceFeePercent: number;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminUpdateSystemConfigInput = Partial<
  Pick<
    AdminSystemConfig,
    "baseDeliveryCOP" | "extraStoreDeliveryCOP" | "serviceFeeCOP" | "serviceFeePercent"
  >
>;

export type AdminCourierZone = {
  id: string;
  cityId: string;
  city?: {
    id: string;
    slug: string;
    name: string;
    department: string;
    country: string;
  } | null;
  serviceType: SystemServiceType;
  zoneNumber: number;
  name: string;
  feeCOP: number;
  baseServiceCOP: number;
  serviceFeeCOP: number;
  packageLargeFeeCOP: number;
  extraPointFeeCOP: number;
  returnFeeCOP: number;
  complexityFeeCOP: number;
  isNegotiable: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminUpdateCourierZoneInput = Partial<{
  name: string;
  feeCOP: number;
  baseServiceCOP: number;
  serviceFeeCOP: number;
  packageLargeFeeCOP: number;
  extraPointFeeCOP: number;
  returnFeeCOP: number;
  complexityFeeCOP: number;
  isNegotiable: boolean;
  isActive: boolean;
}>;

export type AdminSystemPromo = {
  id: string;
  cityId?: string | null;
  city?: {
    id: string;
    slug: string;
    name: string;
    department: string;
    country: string;
  } | null;
  code: string;
  serviceType?: SystemServiceType;
  title: string;
  description: string | null;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  minOrderCOP: number | null;
  maxDiscountCOP: number | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminCreateSystemPromoInput = {
  citySlug?: string;
  serviceType?: SystemServiceType;
  code: string;
  title: string;
  description?: string | null;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  minOrderCOP?: number | null;
  maxDiscountCOP?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive?: boolean;
};

export type AdminUpdateSystemPromoInput = Partial<
  Omit<AdminCreateSystemPromoInput, "citySlug">
> & {
  citySlug?: string;
};

export async function adminListCities(params?: {
  q?: string;
  status?: "ACTIVE" | "INACTIVE" | "ALL";
  page?: number;
  limit?: number;
}): Promise<AdminCitiesListResponse> {
  const sp = new URLSearchParams();
  if (params?.q) sp.set("q", params.q);
  if (params?.status && params.status !== "ALL") sp.set("status", params.status);
  sp.set("page", String(params?.page ?? 1));
  sp.set("limit", String(params?.limit ?? 100));
  return apiFetch(`/admin/cities?${sp.toString()}`);
}

export async function adminListStores(params: {
  q?: string;
  status?: StoreStatusFilter;
  citySlug?: string;
  page?: number;
  limit?: number;
}): Promise<AdminStoresListResponse> {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.status && params.status !== "ALL") sp.set("status", params.status);
  if (params.citySlug) sp.set("citySlug", params.citySlug);
  sp.set("page", String(params.page ?? 1));
  sp.set("limit", String(params.limit ?? 10));
  return apiFetch(`/admin/stores?${sp.toString()}`);
}

export async function adminGetStore(id: string): Promise<AdminStoreDetails> {
  return apiFetch(`/admin/stores/${encodeURIComponent(id)}`);
}

export async function adminGetStoreMetricsToday(id: string): Promise<AdminStoreMetrics> {
  return apiFetch(`/admin/stores/${encodeURIComponent(id)}/metrics/today`);
}

export async function adminCreateStore(input: AdminCreateStoreInput): Promise<AdminStoreDetails> {
  return apiFetch(`/admin/stores`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function adminUpdateStore(
  id: string,
  input: AdminUpdateStoreInput
): Promise<AdminStoreDetails> {
  return apiFetch(`/admin/stores/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function adminDeactivateStore(id: string): Promise<{ ok: true }> {
  return apiFetch(`/admin/stores/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function adminListStoreProducts(
  storeId: string,
  params?: { q?: string; available?: "ALL" | "true" | "false" }
): Promise<AdminProduct[]> {
  const sp = new URLSearchParams();
  if (params?.q) sp.set("q", params.q);
  if (params?.available && params.available !== "ALL") sp.set("available", params.available);
  const qs = sp.toString();
  return apiFetch(`/admin/stores/${encodeURIComponent(storeId)}/products${qs ? `?${qs}` : ""}`);
}

export async function adminCreateStoreProduct(
  storeId: string,
  input: AdminCreateProductInput
): Promise<AdminProduct> {
  return apiFetch(`/admin/stores/${encodeURIComponent(storeId)}/products`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function adminUpdateStoreProduct(
  storeId: string,
  productId: string,
  input: AdminUpdateProductInput
): Promise<AdminProduct> {
  return apiFetch(
    `/admin/stores/${encodeURIComponent(storeId)}/products/${encodeURIComponent(productId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    }
  );
}

export async function adminDeleteStoreProduct(
  storeId: string,
  productId: string
): Promise<{ ok: true }> {
  return apiFetch(
    `/admin/stores/${encodeURIComponent(storeId)}/products/${encodeURIComponent(productId)}`,
    {
      method: "DELETE",
    }
  );
}

export async function adminImportStoreProducts(
  storeId: string,
  input: {
    rows: Array<{
      externalId: string;
      name: string;
      description?: string | null;
      priceCOP: number;
      image?: string | null;
      isAvailable?: boolean;
    }>;
  }
): Promise<{
  ok: true;
  total: number;
  parsed: number;
  unique: number;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}> {
  return apiFetch(`/admin/stores/${encodeURIComponent(storeId)}/products/import`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function adminListBuyerCategories(params: {
  citySlug: string;
}): Promise<AdminBuyerCategory[]> {
  const sp = new URLSearchParams();
  sp.set("citySlug", params.citySlug);
  return apiFetch(`/admin/stores/buyer-categories?${sp.toString()}`);
}

export async function adminCreateBuyerCategory(
  input: AdminCreateBuyerCategoryInput
): Promise<AdminBuyerCategory> {
  return apiFetch(`/admin/stores/buyer-categories`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function adminUpdateBuyerCategory(
  id: string,
  input: AdminUpdateBuyerCategoryInput
): Promise<AdminBuyerCategory> {
  return apiFetch(`/admin/stores/buyer-categories/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function adminDeleteBuyerCategory(id: string): Promise<{ ok: true }> {
  return apiFetch(`/admin/stores/buyer-categories/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function adminGetBuyerHomeBanner(params: {
  citySlug: string;
}): Promise<AdminBuyerHomeBanner> {
  const sp = new URLSearchParams();
  sp.set("citySlug", params.citySlug);
  return apiFetch(`/admin/stores/buyer-home-banner?${sp.toString()}`);
}

export async function adminUpsertBuyerHomeBanner(
  input: AdminUpsertBuyerHomeBannerInput
): Promise<AdminBuyerHomeBanner> {
  const sp = new URLSearchParams();
  sp.set("citySlug", input.citySlug);

  return apiFetch(`/admin/stores/buyer-home-banner?${sp.toString()}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function adminGetBuyerHomeConfig(params: {
  citySlug: string;
}): Promise<AdminBuyerHomeConfig> {
  const sp = new URLSearchParams();
  sp.set("citySlug", params.citySlug);
  return apiFetch(`/admin/stores/buyer-home-config?${sp.toString()}`);
}

export async function adminUpsertBuyerHomeConfig(
  input: AdminUpsertBuyerHomeConfigInput
): Promise<AdminBuyerHomeConfig> {
  const sp = new URLSearchParams();
  sp.set("citySlug", input.citySlug);

  return apiFetch(`/admin/stores/buyer-home-config?${sp.toString()}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function adminGetSystemConfig(
  citySlug?: string,
  serviceType?: SystemServiceType
): Promise<AdminSystemConfig> {
  const sp = new URLSearchParams();
  if (citySlug) sp.set("citySlug", citySlug);
  if (serviceType) sp.set("serviceType", serviceType);

  const qs = sp.toString();
  return apiFetch(`/admin/system/config${qs ? `?${qs}` : ""}`);
}

export async function adminUpdateSystemConfig(
  input: AdminUpdateSystemConfigInput,
  citySlug?: string,
  serviceType?: SystemServiceType
): Promise<AdminSystemConfig> {
  const sp = new URLSearchParams();
  if (citySlug) sp.set("citySlug", citySlug);
  if (serviceType) sp.set("serviceType", serviceType);

  const qs = sp.toString();
  return apiFetch(`/admin/system/config${qs ? `?${qs}` : ""}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function adminListCourierZones(params: {
  citySlug: string;
  serviceType: SystemServiceType;
}): Promise<AdminCourierZone[]> {
  const sp = new URLSearchParams();
  sp.set("citySlug", params.citySlug);
  sp.set("serviceType", params.serviceType);

  return apiFetch(`/admin/courier-zones?${sp.toString()}`);
}

export async function adminUpdateCourierZone(
  id: string,
  input: AdminUpdateCourierZoneInput
): Promise<AdminCourierZone> {
  return apiFetch(`/admin/courier-zones/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function adminListSystemPromos(
  citySlug?: string,
  serviceType?: SystemServiceType
): Promise<AdminSystemPromo[]> {
  const sp = new URLSearchParams();
  if (citySlug) sp.set("citySlug", citySlug);
  if (serviceType) sp.set("serviceType", serviceType);

  const qs = sp.toString();
  return apiFetch(`/admin/system/promos${qs ? `?${qs}` : ""}`);
}

export async function adminCreateSystemPromo(
  input: AdminCreateSystemPromoInput
): Promise<AdminSystemPromo> {
  return apiFetch(`/admin/system/promos`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function adminUpdateSystemPromo(
  id: string,
  input: AdminUpdateSystemPromoInput
): Promise<AdminSystemPromo> {
  return apiFetch(`/admin/system/promos/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function adminToggleSystemPromo(
  id: string,
  active: boolean
): Promise<AdminSystemPromo> {
  return apiFetch(`/admin/system/promos/${encodeURIComponent(id)}/toggle`, {
    method: "PATCH",
    body: JSON.stringify({ active }),
  });
}

export async function adminPendingStorePaymentInfoCount(): Promise<{ count: number }> {
  return apiFetch(`/admin/stores/payment-info/pending-count`);
}
