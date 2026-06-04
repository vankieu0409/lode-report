export function formatMoney(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.round(value)) + "đ";
}

export function formatNumber2(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.slice(-2).padStart(2, "0");
}
