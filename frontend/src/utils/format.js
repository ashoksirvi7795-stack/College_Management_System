/**
 * Utility functions for Indian localized formatting
 */

/**
 * Format any number or numeric string as Indian Rupees (INR)
 * Example: 150000 -> "₹1,50,000.00"
 */
export function formatINR(amount) {
  const num = parseFloat(amount || 0);
  if (isNaN(num)) return '₹0.00';
  return '₹' + num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Format date in Indian English format (DD/MM/YYYY or DD Month YYYY)
 */
export function formatDateIN(dateStr, includeTime = false) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const options = {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }

  return date.toLocaleDateString('en-IN', options);
}
