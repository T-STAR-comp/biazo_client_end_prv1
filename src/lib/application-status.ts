export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  pending: "Waiting for us to review",
  in_review: "We're finding your flight",
  awaiting_payment: "Your price is ready — pay now",
  paid: "Payment received",
  purchasing: "Buying your tickets",
  completed: "Tickets sent",
  cancelled: "Cancelled",
};

export function applicationStatusLabel(status: string, proofPending?: boolean) {
  if (proofPending) return "Checking your bank payment";
  return APPLICATION_STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}
