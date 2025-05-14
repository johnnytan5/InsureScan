"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Download, Filter, Plus } from "lucide-react"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import { supabaseClient } from "@/lib/supabaseClient"
import type { Claim } from "@/lib/supabase-types"
import { formatDate, getStatusColor } from "@/lib/utils"

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchClaims() {
      try {
        const { data, error } = await supabaseClient
          .from("claims")
          .select("*")
          .order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        setClaims(data || [])
      } catch (error) {
        console.error("Error fetching claims:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchClaims()
  }, [])

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
            <Link href="/submit-claim">
              <button className="btn btn-primary flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                New Claim
              </button>
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-4">
            <div className="text-sm font-medium mb-2">Total Claims</div>
            <div className="text-2xl font-bold">{claims.length}</div>
            <p className="text-xs text-gray-500">All submitted claims</p>
          </div>
          <div className="card p-4">
            <div className="text-sm font-medium mb-2">Approved</div>
            <div className="text-2xl font-bold">{claims.filter((claim) => claim.status === "approved").length}</div>
            <p className="text-xs text-green-500">
              {claims.length > 0
                ? `${Math.round((claims.filter((claim) => claim.status === "approved").length / claims.length) * 100)}% approval rate`
                : "No claims yet"}
            </p>
          </div>
          <div className="card p-4">
            <div className="text-sm font-medium mb-2">Pending</div>
            <div className="text-2xl font-bold">
              {claims.filter((claim) => claim.status === "submitted" || claim.status === "analyzed").length}
            </div>
            <p className="text-xs text-gray-500">Awaiting review</p>
          </div>
          <div className="card p-4">
            <div className="text-sm font-medium mb-2">Rejected</div>
            <div className="text-2xl font-bold">{claims.filter((claim) => claim.status === "rejected").length}</div>
            <p className="text-xs text-red-500">
              {claims.length > 0
                ? `${Math.round((claims.filter((claim) => claim.status === "rejected").length / claims.length) * 100)}% rejection rate`
                : "No claims yet"}
            </p>
          </div>
        </div>

        {/* Claims Table */}
        <div className="card">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold">Recent Claims</h2>
            <p className="text-sm text-gray-500">A list of recent claims submitted to the system</p>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="text-center py-8">Loading claims...</div>
            ) : claims.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No claims have been submitted yet.</p>
                <Link href="/submit-claim">
                  <button className="btn btn-primary">Submit Your First Claim</button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium text-gray-500">Claim ID</th>
                      <th className="text-left p-2 font-medium text-gray-500">Name</th>
                      <th className="text-left p-2 font-medium text-gray-500">Date</th>
                      <th className="text-left p-2 font-medium text-gray-500">Status</th>
                      <th className="text-left p-2 font-medium text-gray-500">Score</th>
                      <th className="text-right p-2 font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claims.map((claim) => (
                      <tr key={claim.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">CLM-{claim.id}</td>
                        <td className="p-2">{claim.name}</td>
                        <td className="p-2">{formatDate(claim.created_at)}</td>
                        <td className="p-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(claim.status)}`}
                          >
                            {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                          </span>
                        </td>
                        <td className="p-2">{claim.claim_score ? claim.claim_score.toFixed(2) : "N/A"}</td>
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
            )}
          </div>
          {claims.length > 0 && (
            <div className="p-4 border-t flex justify-between">
              <button className="btn btn-outline">Previous</button>
              <button className="btn btn-outline">Next</button>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
