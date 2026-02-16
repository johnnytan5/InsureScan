import Link from "next/link"
import { Shield } from "lucide-react"

interface NavbarProps {
  activePage?: "home" | "submit-claim" | "claims" | "dashboard"
}

export function Navbar({ activePage = "home" }: NavbarProps) {
  return (
    <header className="bg-black text-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          <span className="text-xl font-bold">InsureScan</span>
        </Link>
        <nav className="flex gap-6">
          <Link
            href="/submit-claim"
            className={`text-sm font-medium hover:text-gray-300 ${
              activePage === "submit-claim" ? "border-b border-white pb-1" : ""
            }`}
          >
            Submit Claim
          </Link>
          <Link
            href="/claims"
            className={`text-sm font-medium hover:text-gray-300 ${
              activePage === "claims" ? "border-b border-white pb-1" : ""
            }`}
          >
            Claims
          </Link>
          <Link
            href="/dashboard"
            className={`text-sm font-medium hover:text-gray-300 ${
              activePage === "dashboard" ? "border-b border-white pb-1" : ""
            }`}
          >
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  )
}
