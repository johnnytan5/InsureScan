"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import { supabaseClient } from "@/lib/supabaseClient"
import type { Claim, Document, Image, Video } from "@/lib/supabase-types"
import { formatDate, getStatusColor, getSeverityColor } from "@/lib/utils"
import { ArrowLeft, FileText, VideoIcon, Download, CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react"

export default function ClaimDetailPage() {
  const params = useParams()
  const router = useRouter()
  const claimId = params.id as string

  const [claim, setClaim] = useState<Claim | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [images, setImages] = useState<Image[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    async function fetchClaimData() {
      try {
        // Fetch claim details
        const { data: claimData, error: claimError } = await supabaseClient
          .from("claims")
          .select("*")
          .eq("id", claimId)
          .single()

        if (claimError) throw claimError
        setClaim(claimData)

        // Fetch documents
        const { data: documentsData, error: documentsError } = await supabaseClient
          .from("documents")
          .select("*")
          .eq("claim_id", claimId)

        if (documentsError) throw documentsError
        setDocuments(documentsData || [])

        // Fetch images
        const { data: imagesData, error: imagesError } = await supabaseClient
          .from("images")
          .select("*")
          .eq("claim_id", claimId)

        if (imagesError) throw imagesError
        setImages(imagesData || [])

        // Fetch videos
        const { data: videosData, error: videosError } = await supabaseClient
          .from("videos")
          .select("*")
          .eq("claim_id", claimId)

        if (videosError) throw videosError
        setVideos(videosData || [])
      } catch (error) {
        console.error("Error fetching claim data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (claimId) {
      fetchClaimData()
    }
  }, [claimId])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case "rejected":
        return <XCircle className="h-6 w-6 text-red-500" />
      case "analyzed":
        return <AlertCircle className="h-6 w-6 text-yellow-500" />
      case "submitted":
      default:
        return <Clock className="h-6 w-6 text-blue-500" />
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar activePage="claims" />
        <div className="flex-1 container mx-auto px-4 py-6 md:px-6 md:py-12 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading claim details...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!claim) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar activePage="claims" />
        <div className="flex-1 container mx-auto px-4 py-6 md:px-6 md:py-12">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Claim Not Found</h2>
            <p className="text-gray-500 mb-6">
              The claim you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Link href="/claims">
              <button className="btn btn-primary">Back to Claims</button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar activePage="claims" />

      <div className="flex-1 container mx-auto px-4 py-6 md:px-6 md:py-12">
        {/* Header with back button */}
        <div className="mb-6">
          <Link href="/claims">
            <button className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Claims
            </button>
          </Link>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                Claim: {claim.name}
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(claim.status)}`}
                >
                  {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                </span>
              </h1>
              <p className="text-gray-500">Submitted on {formatDate(claim.created_at)}</p>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-outline flex items-center">
                <Download className="mr-2 h-4 w-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b mb-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-2 px-1 -mb-px font-medium text-sm ${
                activeTab === "overview" ? "border-b-2 border-black text-black" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("documents")}
              className={`py-2 px-1 -mb-px font-medium text-sm ${
                activeTab === "documents" ? "border-b-2 border-black text-black" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Documents ({documents.length})
            </button>
            <button
              onClick={() => setActiveTab("images")}
              className={`py-2 px-1 -mb-px font-medium text-sm ${
                activeTab === "images" ? "border-b-2 border-black text-black" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Images ({images.length})
            </button>
            <button
              onClick={() => setActiveTab("videos")}
              className={`py-2 px-1 -mb-px font-medium text-sm ${
                activeTab === "videos" ? "border-b-2 border-black text-black" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Videos ({videos.length})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Claim Status Card */}
            <div className="card p-4 md:col-span-2">
              <h2 className="text-lg font-bold mb-4">Claim Status</h2>
              <div className="flex items-center gap-4 mb-6">
                {getStatusIcon(claim.status)}
                <div>
                  <p className="font-medium">
                    Status:{" "}
                    <span className="font-bold">{claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    {claim.status === "submitted" && "Your claim has been submitted and is awaiting review."}
                    {claim.status === "analyzed" && "Your claim has been analyzed and is under final review."}
                    {claim.status === "approved" && "Your claim has been approved."}
                    {claim.status === "rejected" && "Your claim has been rejected."}
                  </p>
                </div>
              </div>

              <h3 className="text-md font-bold mb-2">Claim Timeline</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="rounded-full w-6 h-6 bg-blue-500 text-white flex items-center justify-center text-xs">
                      1
                    </div>
                    <div className="w-0.5 h-full bg-gray-200 mt-1"></div>
                  </div>
                  <div>
                    <p className="font-medium">Claim Submitted</p>
                    <p className="text-sm text-gray-500">{formatDate(claim.created_at)}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`rounded-full w-6 h-6 flex items-center justify-center text-xs ${
                        claim.status === "submitted" ? "bg-gray-200 text-gray-500" : "bg-yellow-500 text-white"
                      }`}
                    >
                      2
                    </div>
                    <div className="w-0.5 h-full bg-gray-200 mt-1"></div>
                  </div>
                  <div>
                    <p className={`font-medium ${claim.status === "submitted" ? "text-gray-400" : ""}`}>Analysis</p>
                    <p className="text-sm text-gray-500">{claim.status === "submitted" ? "Pending" : "Completed"}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`rounded-full w-6 h-6 flex items-center justify-center text-xs ${
                        claim.status === "submitted" || claim.status === "analyzed"
                          ? "bg-gray-200 text-gray-500"
                          : claim.status === "approved"
                            ? "bg-green-500 text-white"
                            : "bg-red-500 text-white"
                      }`}
                    >
                      3
                    </div>
                  </div>
                  <div>
                    <p
                      className={`font-medium ${claim.status === "submitted" || claim.status === "analyzed" ? "text-gray-400" : ""}`}
                    >
                      Decision
                    </p>
                    <p className="text-sm text-gray-500">
                      {claim.status === "submitted" || claim.status === "analyzed"
                        ? "Pending"
                        : claim.status === "approved"
                          ? "Approved"
                          : "Rejected"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Claim Summary Card */}
            <div className="card p-4">
              <h2 className="text-lg font-bold mb-4">Claim Summary</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Claim ID</p>
                  <p className="font-medium">CLM-{claim.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Submitted On</p>
                  <p className="font-medium">{formatDate(claim.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium">{claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}</p>
                </div>
                {claim.claim_score && (
                  <div>
                    <p className="text-sm text-gray-500">Claim Score</p>
                    <p className="font-medium">{claim.claim_score.toFixed(2)}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Documents</p>
                  <p className="font-medium">{documents.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Images</p>
                  <p className="font-medium">{images.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Videos</p>
                  <p className="font-medium">{videos.length}</p>
                </div>
              </div>
            </div>

            {/* Media Preview */}
            <div className="card p-4 md:col-span-3">
              <h2 className="text-lg font-bold mb-4">Media Preview</h2>

              {documents.length === 0 && images.length === 0 && videos.length === 0 ? (
                <p className="text-gray-500 text-center py-6">No media files attached to this claim.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Documents Preview */}
                  {documents.slice(0, 2).map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border rounded-md p-4 flex items-center gap-3 hover:bg-gray-50"
                    >
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="font-medium">
                          {doc.doc_type
                            .split("_")
                            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(" ")}
                        </p>
                        <p className="text-sm text-gray-500">View Document</p>
                      </div>
                    </a>
                  ))}

                  {/* Images Preview */}
                  {images.slice(0, 4).map((img) => (
                    <div key={img.id} className="border rounded-md overflow-hidden">
                      <img
                        src={img.file_url || "/placeholder.svg"}
                        alt={`Damage to ${img.part || "vehicle"}`}
                        className="w-full h-40 object-cover"
                      />
                      <div className="p-2">
                        <div className="flex justify-between items-center">
                          <p className="font-medium text-sm">{img.part || "Vehicle damage"}</p>
                          {img.severity && (
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${getSeverityColor(img.severity)}`}
                            >
                              {img.severity.charAt(0).toUpperCase() + img.severity.slice(1)}
                            </span>
                          )}
                        </div>
                        {img.damage_score && (
                          <p className="text-xs text-gray-500">Damage Score: {img.damage_score.toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Videos Preview */}
                  {videos.slice(0, 2).map((video) => (
                    <div key={video.id} className="border rounded-md p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <VideoIcon className="h-8 w-8 text-purple-500" />
                        <div>
                          <p className="font-medium">Video Evidence</p>
                          <p className="text-sm text-gray-500">
                            Model Status: {video.model_status.charAt(0).toUpperCase() + video.model_status.slice(1)}
                          </p>
                        </div>
                      </div>
                      <a
                        href={video.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 text-sm hover:underline"
                      >
                        View Video
                      </a>
                    </div>
                  ))}

                  {/* Show more button if needed */}
                  {documents.length + images.length + videos.length > 6 && (
                    <div className="border rounded-md p-4 flex items-center justify-center">
                      <button onClick={() => setActiveTab("documents")} className="text-blue-500 hover:underline">
                        View All Media Files
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="card p-4">
            <h2 className="text-lg font-bold mb-4">Documents</h2>

            {documents.length === 0 ? (
              <p className="text-gray-500 text-center py-6">No documents attached to this claim.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border rounded-md p-4 flex items-center gap-3 hover:bg-gray-50"
                  >
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div className="flex-1">
                      <p className="font-medium">
                        {doc.doc_type
                          .split("_")
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(" ")}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{doc.file_url.split("/").pop()}</p>
                      <div className="flex items-center mt-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                            doc.verified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {doc.verified ? "Verified" : "Pending Verification"}
                        </span>
                      </div>
                    </div>
                    <Download className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "images" && (
          <div className="card p-4">
            <h2 className="text-lg font-bold mb-4">Images</h2>

            {images.length === 0 ? (
              <p className="text-gray-500 text-center py-6">No images attached to this claim.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((img) => (
                  <div key={img.id} className="border rounded-md overflow-hidden">
                    <img
                      src={img.file_url || "/placeholder.svg"}
                      alt={`Damage to ${img.part || "vehicle"}`}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-3">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium">{img.part || "Vehicle damage"}</p>
                        {img.severity && (
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${getSeverityColor(img.severity)}`}
                          >
                            {img.severity.charAt(0).toUpperCase() + img.severity.slice(1)}
                          </span>
                        )}
                      </div>
                      {img.damage_score && (
                        <p className="text-sm text-gray-500">Damage Score: {img.damage_score.toFixed(2)}</p>
                      )}
                      <div className="mt-2 flex justify-between">
                        <a
                          href={img.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 text-sm hover:underline"
                        >
                          View Full Size
                        </a>
                        <a
                          href={img.file_url}
                          download
                          className="text-blue-500 text-sm hover:underline flex items-center"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "videos" && (
          <div className="card p-4">
            <h2 className="text-lg font-bold mb-4">Videos</h2>

            {videos.length === 0 ? (
              <p className="text-gray-500 text-center py-6">No videos attached to this claim.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {videos.map((video) => (
                  <div key={video.id} className="border rounded-md overflow-hidden">
                    <div className="aspect-video bg-gray-100 flex items-center justify-center">
                      <video controls className="w-full h-full" poster="/placeholder.svg?height=200&width=400">
                        <source src={video.file_url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    <div className="p-3">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium">Video Evidence</p>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                            video.model_status === "done"
                              ? "bg-green-100 text-green-800"
                              : video.model_status === "error"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          Model: {video.model_status.charAt(0).toUpperCase() + video.model_status.slice(1)}
                        </span>
                      </div>

                      {video.model_file_url && (
                        <div className="mt-2 p-2 bg-gray-50 rounded-md">
                          <p className="text-sm font-medium mb-1">3D Model Available</p>
                          <a
                            href={video.model_file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 text-sm hover:underline"
                          >
                            View 3D Model
                          </a>
                        </div>
                      )}

                      <div className="mt-2 flex justify-end">
                        <a
                          href={video.file_url}
                          download
                          className="text-blue-500 text-sm hover:underline flex items-center"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
