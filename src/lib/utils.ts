import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "submitted":
      return "bg-blue-100 text-blue-800"
    case "analyzed":
      return "bg-yellow-100 text-yellow-800"
    case "approved":
      return "bg-green-100 text-green-800"
    case "rejected":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export function getSeverityColor(severity: string | null): string {
  switch (severity) {
    case "minor":
      return "bg-yellow-100 text-yellow-800"
    case "moderate":
      return "bg-orange-100 text-orange-800"
    case "severe":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export function getFileTypeFromUrl(url: string): string {
  const extension = url.split(".").pop()?.toLowerCase() || ""

  if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) {
    return "image"
  } else if (["mp4", "webm", "mov", "avi"].includes(extension)) {
    return "video"
  } else if (["pdf", "doc", "docx", "txt"].includes(extension)) {
    return "document"
  } else {
    return "unknown"
  }
}

