import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4 py-6 px-4 md:px-6">
        <p className="text-sm text-gray-500">© 2025 InsureScan. All rights reserved.</p>
        <div className="flex gap-4">
          <Link href="/help" className="text-sm text-gray-500 hover:underline">
            Help Center
          </Link>
          <Link href="/contact" className="text-sm text-gray-500 hover:underline">
            Contact Support
          </Link>
        </div>
      </div>
    </footer>
  )
}
