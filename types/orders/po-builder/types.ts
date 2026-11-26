// components/orders/po-builder/types.ts

export type CurrencyCode = "BDT" | "USD" | "EUR" | "GBP" | "SGD";

export interface CompanyProfile {
  id: string;
  name: string;
  address: string;
  phoneOrWebsite: string;
  regNo: string;
  currency: CurrencyCode;
  currencySymbol: string;
  letterheadInitial: string;
  showBankDetails: boolean;
  beneficiaryName: string;
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  swiftCode: string;
  accountType: string;
  termsAndConditions: string;
}

export interface PoLineItem {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
}

export interface DraftPurchaseOrder {
  id: string;
  poRef: string;
  date: string;
  companyId: string;
  companyName: string;
  vendor: string;
  vendorAddress: string;
  client: string;
  clientAddress: string;
  items: PoLineItem[];
  vatEnabled: boolean;
  vatRate: number;
  recipientContact: string;
  contactPhone: string;
  deliveryInstructions: string;
  paymentTerms: string;
  shippingMode: string;
  deliveryDate: string;
  paymentStatus: string;
  notes: string;
  grandTotal: number;
  currencySymbol: string;
  status: "Draft" | "Pending Approval";
}

export const CURRENCY_OPTIONS: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: "BDT", label: "Taka (৳)", symbol: "৳" },
  { code: "EUR", label: "Euro (€)", symbol: "€" },
  { code: "USD", label: "US Dollar ($)", symbol: "$" },
  { code: "GBP", label: "British Pound (£)", symbol: "£" },
  { code: "SGD", label: "Singapore Dollar (S$)", symbol: "S$" },
];

export const INITIAL_COMPANIES: CompanyProfile[] = [
  {
    id: "comp-ngen-bd",
    name: "NGEN IT LIMITED",
    address: "Dhaka, Bangladesh",
    phoneOrWebsite: "www.ngenit.com",
    regNo: "TIN: 176439821042",
    currency: "BDT",
    currencySymbol: "৳",
    letterheadInitial: "N",
    showBankDetails: true,
    beneficiaryName: "NGEN IT Limited",
    bankName: "Standard Chartered Bank, Gulshan Branch",
    accountNumber: "01-1234567-01",
    routingNumber: "245265321",
    swiftCode: "SCBLBDDX",
    accountType: "Current / Corporate",
    termsAndConditions: [
      "Goods/services must conform strictly to the specification and quantity stated above.",
      "Payment shall be released strictly per the Payment Terms selected, upon satisfactory delivery and inspection.",
      "Delivery delays beyond the agreed date must be communicated to NGEN IT Limited in writing in advance.",
      "All warranty and support obligations follow the vendor's standard published policy unless otherwise agreed.",
      "This Purchase Order is governed by the laws of the People's Republic of Bangladesh.",
    ].join("\n"),
  },
  {
    id: "comp-ngen-sg",
    name: "NGEN IT — Singapore entity (enter legal name)",
    address: "Singapore",
    phoneOrWebsite: "www.ngenit.com",
    regNo: "UEN: 202600001A",
    currency: "USD",
    currencySymbol: "$",
    letterheadInitial: "N",
    showBankDetails: true,
    beneficiaryName: "NGEN IT Singapore Pte. Ltd.",
    bankName: "DBS Bank Ltd, Singapore",
    accountNumber: "001-987654-0",
    routingNumber: "7171",
    swiftCode: "DBSSSGSG",
    accountType: "Corporate",
    termsAndConditions: [
      "Goods/services must conform strictly to the specification and quantity stated above.",
      "Payment shall be released strictly per the Payment Terms selected, upon satisfactory delivery and inspection.",
    ].join("\n"),
  },
  {
    id: "comp-ngen-pt",
    name: "NGEN IT — Portugal entity (enter legal name)",
    address: "Lisbon, Portugal",
    phoneOrWebsite: "www.ngenit.com",
    regNo: "NIPC: 518000000",
    currency: "EUR",
    currencySymbol: "€",
    letterheadInitial: "N",
    showBankDetails: true,
    beneficiaryName: "NGEN IT Portugal Lda.",
    bankName: "Millennium BCP, Lisbon",
    accountNumber: "PT50 0033 0000 12345678901 23",
    routingNumber: "0033",
    swiftCode: "BCOMPTPL",
    accountType: "Empresa",
    termsAndConditions: [
      "Goods/services must conform strictly to the specification and quantity stated above.",
      "Payment shall be released strictly per the Payment Terms selected, upon satisfactory delivery and inspection.",
    ].join("\n"),
  },
  {
    id: "comp-ngen-uk",
    name: "NGEN IT — UK entity (enter legal name)",
    address: "London, United Kingdom",
    phoneOrWebsite: "www.ngenit.com",
    regNo: "Company No: 15000000",
    currency: "GBP",
    currencySymbol: "£",
    letterheadInitial: "N",
    showBankDetails: true,
    beneficiaryName: "NGEN IT UK Ltd.",
    bankName: "Barclays Bank UK PLC, London",
    accountNumber: "12345678",
    routingNumber: "20-00-00",
    swiftCode: "BUKBGB2L",
    accountType: "Business Current",
    termsAndConditions: [
      "Goods/services must conform strictly to the specification and quantity stated above.",
      "Payment shall be released strictly per the Payment Terms selected, upon satisfactory delivery and inspection.",
    ].join("\n"),
  },
];