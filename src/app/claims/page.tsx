import Link from "next/link"
import { Download, Filter } from "lucide-react"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"

export default function ClaimsPage() {
  // Sample claims data
  const claims = [
    {
      id: "CLM-1234",
      customer: "John Smith",
      date: "2025-05-10",
      amount: "$2,450.00",
      status: "Approved",
    },
    {
      id: "CLM-1235",
      customer: "Sarah Johnson",
      date: "2025-05-09",
      amount: "$1,200.00",
      status: "Pending",
    },
    {
      id: "CLM-1236",
      customer: "Michael Brown",
      date: "2025-05-08",
      amount: "$3,800.00",
      status: "Under Review",
    },
    {
      id: "CLM-1237",
      customer: "Emily Davis",
      date: "2025-05-07",
      amount: "$950.00",
      status: "Approved",
    },
    {
      id: "CLM-1238",
      customer: "Robert Wilson",
      date: "2025-05-06",
      amount: "$5,200.00",
      status: "Rejected",
    },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar activePage="claims" />

      {/* Claims Dashboard */}
      <div className="flex-1 container mx-auto px-4 py-6 md:px-6 md:py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Claims Dashboard</h1>
            <p className="text-gray-500">View and manage all submitted insurance claims</p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-outline flex items-center">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </button>
            <button className="btn btn-outline flex items-center">
              <Download className="mr-2 h-4 w-4" />
              Export
            </button>
            <button className="btn btn-primary">New Claim</button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-4">
            <div className="text-sm font-medium mb-2">Total Claims</div>
            <div className="text-2xl font-bold">128</div>
            <p className="text-xs text-gray-500">+12% from last month</p>
          </div>
          <div className="card p-4">
            <div className="text-sm font-medium mb-2">Approved</div>
            <div className="text-2xl font-bold">86</div>
            <p className="text-xs text-green-500">67% approval rate</p>
          </div>
          <div className="card p-4">
            <div className="text-sm font-medium mb-2">Pending</div>
            <div className="text-2xl font-bold">32</div>
            <p className="text-xs text-gray-500">Average 2.4 days to process</p>
          </div>
          <div className="card p-4">
            <div className="text-sm font-medium mb-2">Rejected</div>
            <div className="text-2xl font-bold">10</div>
            <p className="text-xs text-red-500">7.8% rejection rate</p>
          </div>
        </div>

        {/* Claims Table */}
        <div className="card">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold">Recent Claims</h2>
            <p className="text-sm text-gray-500">A list of recent claims submitted to the system</p>
          </div>
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium text-gray-500">Claim ID</th>
                    <th className="text-left p-2 font-medium text-gray-500">Customer</th>
                    <th className="text-left p-2 font-medium text-gray-500">Date</th>
                    <th className="text-left p-2 font-medium text-gray-500">Amount</th>
                    <th className="text-left p-2 font-medium text-gray-500">Status</th>
                    <th className="text-right p-2 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((claim) => (
                    <tr key={claim.id} className="border-b">
                      <td className="p-2 font-medium">{claim.id}</td>
                      <td className="p-2">{claim.customer}</td>
                      <td className="p-2">{claim.date}</td>
                      <td className="p-2">{claim.amount}</td>
                      <td className="p-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            claim.status === "Approved"
                              ? "bg-green-100 text-green-800"
                              : claim.status === "Rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {claim.status}
                        </span>
                      </td>
                      <td className="p-2 text-right">
                        <Link href={`/claims/${claim.id}`}>
                          <button className="btn btn-outline">View</button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="p-4 border-t flex justify-between">
            <button className="btn btn-outline">Previous</button>
            <button className="btn btn-outline">Next</button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
