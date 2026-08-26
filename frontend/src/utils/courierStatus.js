// LCS status -> UI theme mapping helpers

function norm(s) {
  return String(s || "").toLowerCase().trim();
}

// Returns Tailwind classes for a pill/badge
export function getLcsBadgeTheme(status) {
  const s = norm(status);
  // Codes we might detect inside status text
  // Green
  if (s.includes("delivered") || s.includes("dv")) return "bg-green-100 text-green-800 border-green-200";
  // Red (cancelled)
  if (s.includes("cancel") || s.includes("cn") || s.includes("48 hours auto canceled") || s.includes("cc"))
    return "bg-red-100 text-red-800 border-red-200";
  // Orange (return family)
  if (
    s.includes("returned to shipper") || s.includes("being return") || s.includes("ready for return") ||
    s.includes("rv") || s.includes("rw") || s.includes("dr") || s.includes("dw") || s.includes("ds") || s.includes("rs") ||
    s.includes("ro") || s.includes("rn")
  ) return "bg-orange-100 text-orange-800 border-orange-200";
  // Blue (in transit / processing milestones)
  if (
    s.includes("dispatched") || s.includes("shipment picked") || s.includes("assign to courier") ||
    s.includes("arrived at station") || s.includes("drop off at express center") ||
    s.includes("dp") || s.includes("sp") || s.includes("ac") || s.includes("ar") || s.includes("dc") ||
    s.includes("out for") || s.includes("in transit") || s.includes("shipped")
  ) return "bg-blue-100 text-blue-800 border-blue-200";
  // Purple (missroute)
  if (s.includes("missroute") || s.includes("ld")) return "bg-purple-100 text-purple-800 border-purple-200";
  // Gray (pending / booked / pickup states / unknown)
  if (
    s.includes("pending") || s.includes("consignment booked") || s.includes("pickup request sent") || s.includes("pickup request not send") ||
    s.includes("pn") || s.includes("rc") || s.includes("ss") || s.includes("sn") || s === "unknown" || s === "—"
  ) return "bg-gray-100 text-gray-800 border-gray-200";
  // Default
  return "bg-gray-100 text-gray-800 border-gray-200";
}

// Returns Tailwind classes for a small dot color
export function getLcsDotColor(status) {
  const s = norm(status);
  if (s.includes("delivered") || s.includes("dv")) return "bg-green-500";
  if (s.includes("cancel") || s.includes("cn") || s.includes("48 hours auto canceled") || s.includes("cc")) return "bg-red-500";
  if (
    s.includes("returned to shipper") || s.includes("being return") || s.includes("ready for return") ||
    s.includes("rv") || s.includes("rw") || s.includes("dr") || s.includes("dw") || s.includes("ds") || s.includes("rs") ||
    s.includes("ro") || s.includes("rn")
  ) return "bg-orange-500";
  if (
    s.includes("dispatched") || s.includes("shipment picked") || s.includes("assign to courier") ||
    s.includes("arrived at station") || s.includes("drop off at express center") ||
    s.includes("dp") || s.includes("sp") || s.includes("ac") || s.includes("ar") || s.includes("dc") ||
    s.includes("out for") || s.includes("in transit") || s.includes("shipped")
  ) return "bg-blue-500";
  if (s.includes("missroute") || s.includes("ld")) return "bg-purple-500";
  return "bg-gray-400";
}
