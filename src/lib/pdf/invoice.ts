import PDFDocument from "pdfkit";
import { format } from "date-fns";
import { parseLocalDate } from "@/lib/utils";

interface InvoiceOrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  pricing_type: string;
  actual_weight?: number | null;
  estimated_weight?: number | null;
}

interface InvoiceOrder {
  order_number: number;
  customer_first_name?: string | null;
  customer_last_name?: string | null;
  customer_email: string;
  customer_phone?: string | null;
  fulfillment_type: string;
  scheduled_date?: string | null;
  shipping_address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
  } | null;
  subtotal: number;
  shipping_fee: number;
  membership_fee?: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  created_at: string;
  order_items?: InvoiceOrderItem[];
  fulfillment_locations?: {
    name: string;
    address_line1?: string;
    city?: string;
    state?: string;
  } | null;
}

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

const getFulfillmentLabel = (type: string): string => {
  const labels: Record<string, string> = {
    pickup: "Pickup",
    delivery: "Delivery",
    shipping: "Shipping",
  };
  return labels[type] || type;
};

/**
 * Generate a customer invoice PDF as a Buffer
 * @param order - Order data
 * @returns Promise<Buffer> - PDF file as buffer
 */
export async function generateInvoicePDF(order: InvoiceOrder): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 50 });
    const buffers: Buffer[] = [];

    // Collect PDF data into buffers
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    // --- Header ---
    doc.fontSize(24).font("Helvetica-Bold").text("INVOICE", 50, 50);
    doc.fontSize(10).font("Helvetica").text(`Order #${order.order_number}`, 50, 80);
    doc.text(`Date: ${format(new Date(order.created_at), "MMMM d, yyyy")}`, 50, 95);

    // Farm info (top right)
    doc.fontSize(10).font("Helvetica-Bold").text("Amos Miller Farm", 400, 50, { align: "right" });
    doc.fontSize(9).font("Helvetica").text("648 Mill Creek School Rd", 400, 65, { align: "right" });
    doc.text("Bird in Hand, PA 17505", 400, 78, { align: "right" });
    doc.text("amosmillerfarm.com", 400, 91, { align: "right" });

    // Horizontal line
    doc.moveTo(50, 120).lineTo(562, 120).stroke();

    // --- Customer & Fulfillment Info (two columns) ---
    let yPos = 140;

    // Customer Info (left column)
    doc.fontSize(11).font("Helvetica-Bold").text("BILL TO:", 50, yPos);
    yPos += 15;
    const customerName =
      order.customer_first_name && order.customer_last_name
        ? `${order.customer_first_name} ${order.customer_last_name}`
        : order.customer_email;
    doc.fontSize(10).font("Helvetica").text(customerName, 50, yPos);
    yPos += 15;
    doc.text(order.customer_email, 50, yPos);
    if (order.customer_phone) {
      yPos += 15;
      doc.text(order.customer_phone, 50, yPos);
    }

    // Fulfillment Info (right column)
    let rightYPos = 140;
    doc.fontSize(11).font("Helvetica-Bold").text(getFulfillmentLabel(order.fulfillment_type).toUpperCase() + ":", 320, rightYPos);
    rightYPos += 15;

    if (order.scheduled_date) {
      doc.fontSize(10).font("Helvetica").text(
        format(parseLocalDate(order.scheduled_date), "EEEE, MMMM d, yyyy"),
        320,
        rightYPos
      );
      rightYPos += 15;
    }

    if (order.fulfillment_type === "pickup" && order.fulfillment_locations) {
      doc.text(order.fulfillment_locations.name, 320, rightYPos);
      rightYPos += 15;
      if (order.fulfillment_locations.address_line1) {
        doc.text(order.fulfillment_locations.address_line1, 320, rightYPos);
        rightYPos += 15;
      }
      if (order.fulfillment_locations.city && order.fulfillment_locations.state) {
        doc.text(`${order.fulfillment_locations.city}, ${order.fulfillment_locations.state}`, 320, rightYPos);
        rightYPos += 15;
      }
    }

    if (order.shipping_address && order.fulfillment_type !== "pickup") {
      doc.text(order.shipping_address.line1, 320, rightYPos);
      rightYPos += 15;
      if (order.shipping_address.line2) {
        doc.text(order.shipping_address.line2, 320, rightYPos);
        rightYPos += 15;
      }
      doc.text(
        `${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.postalCode}`,
        320,
        rightYPos
      );
      rightYPos += 15;
    }

    // Move to items section
    yPos = Math.max(yPos, rightYPos) + 30;

    // Horizontal line
    doc.moveTo(50, yPos).lineTo(562, yPos).stroke();
    yPos += 15;

    // --- Order Items Table ---
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("ITEM", 50, yPos);
    doc.text("QTY", 320, yPos);
    doc.text("UNIT PRICE", 390, yPos);
    doc.text("AMOUNT", 480, yPos, { align: "right", width: 82 });
    yPos += 15;

    // Items separator
    doc.moveTo(50, yPos).lineTo(562, yPos).stroke();
    yPos += 10;

    // Items
    doc.font("Helvetica");
    const items = order.order_items || [];
    for (const item of items) {
      const weight = item.actual_weight || item.estimated_weight;
      const itemTotal =
        item.pricing_type === "weight"
          ? item.unit_price * (weight || 1) * item.quantity
          : item.unit_price * item.quantity;

      // Check if we need a new page
      if (yPos > 700) {
        doc.addPage();
        yPos = 50;
      }

      doc.fontSize(10).text(item.product_name, 50, yPos, { width: 250 });
      const qtyText = item.pricing_type === "weight" && weight ? `${item.quantity} × ${weight} lbs` : `${item.quantity}`;
      doc.text(qtyText, 320, yPos);
      doc.text(formatCurrency(item.unit_price), 390, yPos);
      doc.text(formatCurrency(itemTotal), 480, yPos, { align: "right", width: 82 });
      yPos += 20;
    }

    // Items end line
    doc.moveTo(50, yPos).lineTo(562, yPos).stroke();
    yPos += 15;

    // --- Totals (right-aligned) ---
    const totalsX = 400;

    doc.fontSize(10).font("Helvetica");
    doc.text("Subtotal:", totalsX, yPos);
    doc.text(formatCurrency(order.subtotal), 480, yPos, { align: "right", width: 82 });
    yPos += 18;

    if (order.shipping_fee > 0) {
      const shippingLabel = order.fulfillment_type === "shipping" ? "Shipping:" : "Delivery Fee:";
      doc.text(shippingLabel, totalsX, yPos);
      doc.text(formatCurrency(order.shipping_fee), 480, yPos, { align: "right", width: 82 });
      yPos += 18;
    }

    if (order.membership_fee && order.membership_fee > 0) {
      doc.text("Membership Fee:", totalsX, yPos);
      doc.text(formatCurrency(order.membership_fee), 480, yPos, { align: "right", width: 82 });
      yPos += 18;
    }

    if (order.tax_amount > 0) {
      doc.text("Tax:", totalsX, yPos);
      doc.text(formatCurrency(order.tax_amount), 480, yPos, { align: "right", width: 82 });
      yPos += 18;
    }

    if (order.discount_amount > 0) {
      doc.fillColor("#166534").text("Discount:", totalsX, yPos);
      doc.text(`-${formatCurrency(order.discount_amount)}`, 480, yPos, { align: "right", width: 82 });
      doc.fillColor("#000000");
      yPos += 18;
    }

    // Total line
    doc.moveTo(totalsX, yPos).lineTo(562, yPos).stroke();
    yPos += 10;

    doc.fontSize(12).font("Helvetica-Bold");
    doc.text("TOTAL:", totalsX, yPos);
    doc.text(formatCurrency(order.total), 480, yPos, { align: "right", width: 82 });

    // --- Footer ---
    yPos += 40;
    doc.fontSize(9).font("Helvetica").fillColor("#666666");
    doc.text("Thank you for your business!", 50, yPos, { align: "center", width: 512 });
    yPos += 15;
    doc.text("Questions? Contact us at amosmillerfarm.com", 50, yPos, { align: "center", width: 512 });

    // Finalize PDF
    doc.end();
  });
}
