/**
 * WhatsApp deep links.
 *
 * The storefront has no cart and no checkout: every enquiry hands the visitor to
 * WhatsApp with a message the owner can act on directly, which is why the SKU or
 * the full quote brief is always included.
 *
 * @module utils/whatsapp
 */
import { publicEnv } from '@/lib/env';
import type { ProductListItem } from '@/types/models';
import type { EnquiryFormValues } from '@/validation/enquiry.schema';
import type { QuoteFormValues } from '@/validation/quote.schema';
import type { RetailerApplicationValues } from '@/validation/retailer.schema';

/** Country code assumed when a configured number omits one. */
const DEFAULT_COUNTRY_CODE = '91';

/**
 * Normalises a phone number into the digits-only form `wa.me` requires.
 *
 * A bare 10-digit Indian mobile is prefixed with the country code, because
 * `wa.me` silently fails without one.
 *
 * @param raw - The configured or entered number, in any format.
 * @returns Digits only, including the country code.
 *
 * @example
 * ```ts
 * toWhatsAppNumber('63039 63315');   // '916303963315'
 * toWhatsAppNumber('+91 63039 63315'); // '916303963315'
 * ```
 */
export function toWhatsAppNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits.length === 10 ? `${DEFAULT_COUNTRY_CODE}${digits}` : digits;
}

/**
 * Builds a `wa.me` link with a pre-filled message.
 *
 * @param message - The message body to pre-fill.
 * @returns The complete WhatsApp URL.
 */
export function buildWhatsAppLink(message: string): string {
  return `https://wa.me/${toWhatsAppNumber(publicEnv.whatsappNumber)}?text=${encodeURIComponent(message)}`;
}

/**
 * Builds a product enquiry link from the visitor's chosen variant.
 *
 * The message leads with the SKU so the owner can find the item immediately,
 * states the exact size, colour and quantity wanted, and includes the product
 * URL so they can see precisely what was viewed.
 *
 * @param product - The product being enquired about.
 * @param selection - The variant and quantity the visitor selected.
 * @returns The WhatsApp URL.
 *
 * @example
 * ```ts
 * buildProductEnquiryLink(product, { size: 'L', color: 'Navy', quantity: 50 });
 * ```
 */
export function buildProductEnquiryLink(
  product: ProductListItem,
  selection: EnquiryFormValues,
): string {
  const lines = [
    `Hi! I'd like to enquire about this product:`,
    ``,
    `*${product.name}*`,
    `SKU: ${product.sku}`,
    product.brand ? `Brand: ${product.brand.name}` : null,
    `Category: ${product.category.name}`,
    ``,
    `*Size:* ${selection.size}`,
    `*Colour:* ${selection.color}`,
    `*Quantity:* ${selection.quantity} pieces`,
    `Listed price: ₹${product.pricing.finalPrice}`,
    selection.notes ? `` : null,
    selection.notes ? `Notes: ${selection.notes}` : null,
    ``,
    `${publicEnv.siteUrl}/products/${product.slug}`,
    ``,
    `Please share wholesale rates and availability.`,
  ].filter((line): line is string => line !== null);

  return buildWhatsAppLink(lines.join('\n'));
}

/**
 * Builds a custom-printing quote request from a completed brief.
 *
 * Every field the owner needs in order to quote is collected in the form first,
 * so the message that arrives is actionable rather than an empty "hi".
 *
 * @param values - The validated quote form values.
 * @returns The WhatsApp URL.
 */
export function buildQuoteRequestLink(values: QuoteFormValues): string {
  const lines = [
    `*Custom Printing — Quote Request*`,
    ``,
    `Service: ${values.service}`,
    `Name: ${values.customerName}`,
    values.organisation ? `Organisation: ${values.organisation}` : null,
    `Phone: ${values.phone}`,
    `City: ${values.city}`,
    ``,
    `Quantity: ${values.quantity} pieces`,
    `Sizes: ${values.sizes.join(', ')}`,
    values.colorPreference ? `Preferred colours: ${values.colorPreference}` : null,
    values.requiredBy ? `Required by: ${formatBriefDate(values.requiredBy)}` : null,
    ``,
    `Design / printing details:`,
    values.designNotes,
    values.notes ? `` : null,
    values.notes ? `Additional notes: ${values.notes}` : null,
    ``,
    `Please share your rates.`,
  ].filter((line): line is string => line !== null);

  return buildWhatsAppLink(lines.join('\n'));
}

/**
 * Builds a general enquiry link for the header and contact section.
 *
 * @returns The WhatsApp URL.
 */
export function buildGeneralEnquiryLink(): string {
  return buildWhatsAppLink(
    `Hi! I found you online and would like to know more about your wholesale garments.`,
  );
}

/**
 * Builds the message announcing a new wholesale account request.
 *
 * @param values - The submitted application.
 * @returns The WhatsApp URL.
 *
 * @remarks
 * Sent after the application has already been stored, so this is a notification
 * rather than the record itself — if the visitor never sends it, or the message
 * is lost, the row is still in the admin queue. It leads with the shop and city
 * because that is what the owner recognises a caller by.
 */
export function buildRetailerApplicationLink(values: RetailerApplicationValues): string {
  const lines = [
    `Hi! I'd like to buy wholesale from Manisha Readymades.`,
    ``,
    `Shop: ${values.shopName}`,
    `Owner: ${values.ownerName}`,
    `Phone: ${values.phone}`,
  ];

  if (values.whatsapp) lines.push(`WhatsApp: ${values.whatsapp}`);
  lines.push(`Location: ${values.city}, ${values.state}`);
  if (values.gst) lines.push(`GST: ${values.gst}`);
  if (values.interests.length > 0) {
    lines.push(`Interested in: ${values.interests.join(', ')}`);
  }

  return buildWhatsAppLink(lines.join('\n'));
}

/**
 * Formats a date for inclusion in a WhatsApp message.
 *
 * @param date - The date to format.
 * @returns A short, unambiguous date string.
 */
function formatBriefDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
