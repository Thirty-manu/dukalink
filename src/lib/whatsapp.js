export function buildWhatsAppLink(phoneNumber, productName, price) {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
  const message = `Hi, I'm interested in ${productName} at KES ${price}. Is it still available?`;
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
