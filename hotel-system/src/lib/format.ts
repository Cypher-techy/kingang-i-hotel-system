export const formatCurrency = (amount: number) => `KSh ${new Intl.NumberFormat("en-KE").format(amount)}`;

export const formatDateTime = (value: string | Date) => new Intl.DateTimeFormat("en-KE", {
  dateStyle: "medium",
  timeStyle: "short",
}).format(new Date(value));

export const formatShortDate = (value: string | Date) => new Intl.DateTimeFormat("en-KE", {
  day: "2-digit",
  month: "short",
}).format(new Date(value));
