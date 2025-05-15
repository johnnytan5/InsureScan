"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import { supabaseClient } from "@/lib/supabaseClient"
import type { Claim, Document, Image, Video } from "@/lib/supabase-types"
import { formatDate, getStatusColor, getSeverityColor } from "@/lib/utils"
import {
  ArrowLeft,
  FileText,
  ImageIcon,
  VideoIcon,
  CheckCircle,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  BarChart,
  FileCheck,
  Lightbulb,
  Layers,
} from "lucide-react"

export default function ClaimAnalyzePage() {
  const params = useParams()
  const router = useRouter()
  const claimId = params.id as string

  const [claim, setClaim] = useState<Claim | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [images, setImages] = useState<Image[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateMessage, setUpdateMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [activeSection, setActiveSection] = useState("summary")
  const [analysisInProgress, setAnalysisInProgress] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)

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

  const updateClaimStatus = async (status: "approved" | "rejected" | "analyzed") => {
    if (!claim) return

    setIsUpdating(true)
    setUpdateMessage(null)

    try {
      const { error } = await supabaseClient.from("claims").update({ status }).eq("id", claim.id)

      if (error) throw error

      // Update local state
      setClaim({
        ...claim,
        status,
      })

      setUpdateMessage({
        type: "success",
        text: status === "analyzed" ? "Claim has been marked as analyzed." : `Claim has been ${status} successfully.`,
      })

      // Redirect after approval/rejection
      if (status === "approved" || status === "rejected") {
        setTimeout(() => {
          router.push(`/claims/${claimId}`)
        }, 2000)
      }
    } catch (error) {
      console.error("Error updating claim status:", error)
      setUpdateMessage({
        type: "error",
        text: `Failed to update claim status. Please try again.`,
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const runAnalysis = async () => {
    if (!claim) return

    setAnalysisInProgress(true)

    try {
      // Simulate analysis process
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Update claim score (simulated)
      const claimScore = Math.round(Math.random() * 100) / 10

      const { error } = await supabaseClient
        .from("claims")
        .update({
          claim_score: claimScore,
          status: "analyzed",
        })
        .eq("id", claim.id)

      if (error) throw error

      // Update local state
      setClaim({
        ...claim,
        claim_score: claimScore,
        status: "analyzed",
      })

      // Simulate updating image damage scores
      const updatedImages = [...images]
      for (let i = 0; i < updatedImages.length; i++) {
        const damageScore = Math.round(Math.random() * 100) / 10

        await supabaseClient.from("images").update({ damage_score: damageScore }).eq("id", updatedImages[i].id)

        updatedImages[i].damage_score = damageScore
      }

      setImages(updatedImages)
      setAnalysisComplete(true)
    } catch (error) {
      console.error("Error running analysis:", error)
    } finally {
      setAnalysisInProgress(false)
    }
  }

  const canApproveOrReject = () => {
    return claim && (claim.status === "submitted" || claim.status === "analyzed")
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
          <Link href={`/claims/${claimId}`}>
            <button className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Claim
            </button>
          </Link>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                Analyzing Claim: {claim.name}
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(claim.status)}`}
                >
                  {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                </span>
              </h1>
              <p className="text-gray-500">Submitted on {formatDate(claim.created_at)}</p>
            </div>
            <div className="flex gap-2">
              {claim.status !== "analyzed" && !analysisInProgress && !analysisComplete && (
                <button onClick={runAnalysis} className="btn btn-primary flex items-center">
                  <BarChart className="mr-2 h-4 w-4" />
                  Run Analysis
                </button>
              )}

              {analysisInProgress && (
                <button className="btn btn-primary flex items-center opacity-75 cursor-not-allowed">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Analyzing...
                </button>
              )}

              {(claim.status === "analyzed" || analysisComplete) && (
                <div className="flex items-center text-green-600 bg-green-50 px-3 py-1.5 rounded-md border border-green-200">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Analysis Complete
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status update message */}
        {updateMessage && (
          <div
            className={`mb-6 p-4 rounded-md ${updateMessage.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}
          >
            {updateMessage.type === "success" ? (
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                {updateMessage.text}
              </div>
            ) : (
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                {updateMessage.text}
              </div>
            )}
          </div>
        )}

        {/* Analysis Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="md:col-span-1">
            <div className="bg-gray-50 rounded-lg p-4 sticky top-4">
              <h3 className="font-bold text-lg mb-4">Analysis Tools</h3>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveSection("summary")}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center ${
                    activeSection === "summary" ? "bg-black text-white" : "hover:bg-gray-100"
                  }`}
                >
                  <BarChart className="h-4 w-4 mr-2" />
                  Summary
                </button>
                <button
                  onClick={() => setActiveSection("documents")}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center ${
                    activeSection === "documents" ? "bg-black text-white" : "hover:bg-gray-100"
                  }`}
                >
                  <FileCheck className="h-4 w-4 mr-2" />
                  Document Verification
                </button>
                <button
                  onClick={() => setActiveSection("damage")}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center ${
                    activeSection === "damage" ? "bg-black text-white" : "hover:bg-gray-100"
                  }`}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Damage Assessment
                </button>
                <button
                  onClick={() => setActiveSection("models")}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center ${
                    activeSection === "models" ? "bg-black text-white" : "hover:bg-gray-100"
                  }`}
                >
                  <Layers className="h-4 w-4 mr-2" />
                  3D Models
                </button>
                <button
                  onClick={() => setActiveSection("recommendation")}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center ${
                    activeSection === "recommendation" ? "bg-black text-white" : "hover:bg-gray-100"
                  }`}
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Recommendation
                </button>
              </nav>

              {/* Decision Buttons */}
              {canApproveOrReject() && (
                <div className="mt-8 space-y-2">
                  <h3 className="font-bold text-md mb-2">Make Decision</h3>
                  <button
                    onClick={() => updateClaimStatus("approved")}
                    disabled={isUpdating}
                    className="w-full btn flex items-center justify-center bg-green-600 hover:bg-green-700 text-white"
                  >
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    Approve Claim
                  </button>
                  <button
                    onClick={() => updateClaimStatus("rejected")}
                    disabled={isUpdating}
                    className="w-full btn flex items-center justify-center bg-red-600 hover:bg-red-700 text-white"
                  >
                    <ThumbsDown className="mr-2 h-4 w-4" />
                    Reject Claim
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-3">
            {/* Summary Section */}
            {activeSection === "summary" && (
              <div className="space-y-6">
                <div className="card p-6">
                  <h2 className="text-xl font-bold mb-4">Claim Analysis Summary</h2>

                  {claim.status !== "analyzed" && !analysisComplete ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">
                        This claim has not been analyzed yet. Run the analysis to get insights.
                      </p>
                      {!analysisInProgress && (
                        <button onClick={runAnalysis} className="btn btn-primary">
                          Run Analysis Now
                        </button>
                      )}
                      {analysisInProgress && (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black mr-3"></div>
                          <span>Analysis in progress...</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-gray-50 p-4 rounded-md">
                          <p className="text-sm text-gray-500">Overall Claim Score</p>
                          <p className="text-3xl font-bold">{claim.claim_score?.toFixed(1) || "N/A"}</p>
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className={`h-2.5 rounded-full ${
                                  (claim.claim_score || 0) > 7
                                    ? "bg-green-500"
                                    : (claim.claim_score || 0) > 4
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                }`}
                                style={{ width: `${(claim.claim_score || 0) * 10}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-md">
                          <p className="text-sm text-gray-500">Document Verification</p>
                          <p className="text-3xl font-bold">
                            {documents.filter((d) => d.verified).length}/{documents.length}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {documents.filter((d) => d.verified).length === documents.length
                              ? "All documents verified"
                              : "Some documents need verification"}
                          </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-md">
                          <p className="text-sm text-gray-500">Damage Assessment</p>
                          <p className="text-3xl font-bold">
                            {images.filter((i) => i.damage_score !== null).length}/{images.length}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {images.filter((i) => i.damage_score !== null).length === images.length
                              ? "All images assessed"
                              : "Some images need assessment"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-bold">Analysis Results</h3>
                        <p className="text-gray-700">
                          Based on our automated analysis, this claim has received a score of{" "}
                          <strong>{claim.claim_score?.toFixed(1) || "N/A"}</strong> out of 10.
                        </p>

                        <div className="bg-gray-50 p-4 rounded-md">
                          <h4 className="font-bold mb-2">Key Findings</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            <li>
                              {documents.filter((d) => d.verified).length} out of {documents.length} documents have been
                              verified
                            </li>
                            <li>{images.filter((i) => i.severity === "severe").length} images show severe damage</li>
                            <li>
                              {images.filter((i) => i.severity === "moderate").length} images show moderate damage
                            </li>
                            <li>{images.filter((i) => i.severity === "minor").length} images show minor damage</li>
                            <li>
                              {videos.filter((v) => v.model_status === "done").length} out of {videos.length} videos
                              have been processed
                            </li>
                          </ul>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                          <h4 className="font-bold text-blue-800 mb-2 flex items-center">
                            <Lightbulb className="h-4 w-4 mr-2" />
                            Recommendation
                          </h4>
                          <p className="text-blue-800">
                            {(claim.claim_score || 0) > 7
                              ? "This claim appears to be valid with sufficient documentation and evidence. Recommend approval."
                              : (claim.claim_score || 0) > 4
                                ? "This claim has some inconsistencies but appears generally valid. Further review recommended."
                                : "This claim has significant issues with documentation or evidence. Recommend rejection or requesting additional information."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Documents Section */}
            {activeSection === "documents" && (
              <div className="card p-6">
                <h2 className="text-xl font-bold mb-4">Document Verification</h2>

                {documents.length === 0 ? (
                  <p className="text-gray-500 text-center py-6">No documents attached to this claim.</p>
                ) : (
                  <div className="space-y-4">
                    {documents.map((doc) => (
                      <div key={doc.id} className="border rounded-md p-4">
                        <div className="flex items-start gap-4">
                          <FileText className="h-10 w-10 text-blue-500 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <h3 className="font-bold">
                                {doc.doc_type
                                  .split("_")
                                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                  .join(" ")}
                              </h3>
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                  doc.verified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {doc.verified ? "Verified" : "Pending Verification"}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 truncate">{doc.file_url.split("/").pop()}</p>

                            {doc.extracted_text && (
                              <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                                <p className="font-medium mb-1">Extracted Text:</p>
                                <p className="text-gray-700">{doc.extracted_text}</p>
                              </div>
                            )}

                            <div className="mt-4 flex justify-between">
                              <a
                                href={doc.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm flex items-center"
                              >
                                View Document
                              </a>

                              {!doc.verified && (
                                <button
                                  className="btn btn-outline text-sm"
                                  onClick={async () => {
                                    try {
                                      await supabaseClient.from("documents").update({ verified: true }).eq("id", doc.id)

                                      // Update local state
                                      setDocuments(
                                        documents.map((d) => (d.id === doc.id ? { ...d, verified: true } : d)),
                                      )
                                    } catch (error) {
                                      console.error("Error verifying document:", error)
                                    }
                                  }}
                                >
                                  Mark as Verified
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Damage Assessment Section */}
            {activeSection === "damage" && (
              <div className="card p-6">
                <h2 className="text-xl font-bold mb-4">Damage Assessment</h2>

                {images.length === 0 ? (
                  <p className="text-gray-500 text-center py-6">No images attached to this claim.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {images.map((img) => (
                      <div key={img.id} className="border rounded-md overflow-hidden">
                        <img
                          src={img.file_url || "/placeholder.svg"}
                          alt={`Damage to ${img.part || "vehicle"}`}
                          className="w-full h-48 object-cover"
                        />
                        <div className="p-4">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold">{img.part || "Vehicle damage"}</h3>
                            {img.severity && (
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getSeverityColor(img.severity)}`}
                              >
                                {img.severity.charAt(0).toUpperCase() + img.severity.slice(1)}
                              </span>
                            )}
                          </div>

                          <div className="mt-2">
                            <p className="text-sm text-gray-500 mb-1">Damage Score:</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div
                                    className={`h-2.5 rounded-full ${
                                      (img.damage_score || 0) > 7
                                        ? "bg-red-500"
                                        : (img.damage_score || 0) > 4
                                          ? "bg-yellow-500"
                                          : "bg-green-500"
                                    }`}
                                    style={{ width: `${(img.damage_score || 0) * 10}%` }}
                                  ></div>
                                </div>
                              </div>
                              <span className="font-bold">{img.damage_score?.toFixed(1) || "N/A"}</span>
                            </div>
                          </div>

                          {!img.damage_score && !analysisInProgress && !analysisComplete && (
                            <div className="mt-3">
                              <button onClick={runAnalysis} className="btn btn-outline text-sm w-full">
                                Analyze Damage
                              </button>
                            </div>
                          )}

                          {analysisInProgress && !img.damage_score && (
                            <div className="mt-3 flex justify-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3D Models Section */}
            {activeSection === "models" && (
              <div className="card p-6">
                <h2 className="text-xl font-bold mb-4">3D Models</h2>

                {videos.length === 0 ? (
                  <p className="text-gray-500 text-center py-6">No videos attached to this claim.</p>
                ) : (
                  <div className="space-y-6">
                    {videos.map((video) => (
                      <div key={video.id} className="border rounded-md overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2">
                          <div className="aspect-video bg-gray-100">
                            <video controls className="w-full h-full" poster="/placeholder.svg?height=200&width=400">
                              <source src={video.file_url} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                          </div>
                          <div className="p-4">
                            <div className="flex justify-between items-center mb-3">
                              <h3 className="font-bold">Video Evidence</h3>
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
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

                            {video.model_status === "done" && video.model_file_url && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                                <p className="font-medium mb-2">3D Model Available</p>
                                <a
                                  href={video.model_file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-primary text-sm"
                                >
                                  View 3D Model
                                </a>
                              </div>
                            )}

                            {video.model_status === "pending" && (
                              <div className="mt-3 p-3 bg-yellow-50 rounded-md">
                                <p className="text-yellow-800">
                                  3D model generation is pending. This process may take some time.
                                </p>
                              </div>
                            )}

                            {video.model_status === "error" && (
                              <div className="mt-3 p-3 bg-red-50 rounded-md">
                                <p className="text-red-800">
                                  There was an error generating the 3D model from this video.
                                </p>
                                <button className="btn btn-outline text-sm mt-2">Retry Model Generation</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recommendation Section */}
            {activeSection === "recommendation" && (
              <div className="card p-6">
                <h2 className="text-xl font-bold mb-4">Claim Recommendation</h2>

                {claim.status !== "analyzed" && !analysisComplete ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Run the analysis to get a recommendation for this claim.</p>
                    {!analysisInProgress && (
                      <button onClick={runAnalysis} className="btn btn-primary">
                        Run Analysis Now
                      </button>
                    )}
                    {analysisInProgress && (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black mr-3"></div>
                        <span>Analysis in progress...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-4 rounded-full ${
                          (claim.claim_score || 0) > 7
                            ? "bg-green-100"
                            : (claim.claim_score || 0) > 4
                              ? "bg-yellow-100"
                              : "bg-red-100"
                        }`}
                      >
                        {(claim.claim_score || 0) > 7 ? (
                          <ThumbsUp className="h-8 w-8 text-green-600" />
                        ) : (claim.claim_score || 0) > 4 ? (
                          <AlertCircle className="h-8 w-8 text-yellow-600" />
                        ) : (
                          <ThumbsDown className="h-8 w-8 text-red-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">
                          {(claim.claim_score || 0) > 7
                            ? "Recommended for Approval"
                            : (claim.claim_score || 0) > 4
                              ? "Further Review Recommended"
                              : "Recommended for Rejection"}
                        </h3>
                        <p className="text-gray-500">
                          Claim Score: <span className="font-bold">{claim.claim_score?.toFixed(1) || "N/A"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="font-bold mb-2">Analysis Summary</h3>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <div className="bg-blue-100 p-1 rounded-full mt-0.5">
                            <FileCheck className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">Document Verification</p>
                            <p className="text-sm text-gray-600">
                              {documents.filter((d) => d.verified).length} out of {documents.length} documents verified
                              {documents.length > 0 && documents.filter((d) => d.verified).length === documents.length
                                ? " - All documents appear to be authentic."
                                : " - Some documents require verification."}
                            </p>
                          </div>
                        </li>

                        <li className="flex items-start gap-2">
                          <div className="bg-purple-100 p-1 rounded-full mt-0.5">
                            <ImageIcon className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium">Damage Assessment</p>
                            <p className="text-sm text-gray-600">
                              {images.filter((i) => i.damage_score !== null).length} out of {images.length} images
                              assessed
                              {images.length > 0 &&
                                ` - Average damage score: ${(
                                  images.reduce((sum, img) => sum + (img.damage_score || 0), 0) /
                                    Math.max(images.filter((i) => i.damage_score !== null).length, 1)
                                ).toFixed(1)}`}
                            </p>
                          </div>
                        </li>

                        <li className="flex items-start gap-2">
                          <div className="bg-amber-100 p-1 rounded-full mt-0.5">
                            <VideoIcon className="h-4 w-4 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-medium">Video Evidence</p>
                            <p className="text-sm text-gray-600">
                              {videos.filter((v) => v.model_status === "done").length} out of {videos.length} videos
                              processed
                              {videos.length > 0 && videos.filter((v) => v.model_status === "done").length > 0
                                ? " - 3D models available for review."
                                : " - No 3D models available yet."}
                            </p>
                          </div>
                        </li>
                      </ul>
                    </div>

                    <div
                      className={`p-4 rounded-md border ${
                        (claim.claim_score || 0) > 7
                          ? "bg-green-50 border-green-200 text-green-800"
                          : (claim.claim_score || 0) > 4
                            ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                            : "bg-red-50 border-red-200 text-red-800"
                      }`}
                    >
                      <h3 className="font-bold mb-2">Recommendation Details</h3>
                      <p>
                        {(claim.claim_score || 0) > 7
                          ? "This claim appears to be valid with sufficient documentation and evidence. The damage is consistent with the claim description, and all documents have been verified. We recommend approving this claim."
                          : (claim.claim_score || 0) > 4
                            ? "This claim has some inconsistencies but appears generally valid. Some documents require verification, and the damage assessment shows mixed results. We recommend further review before making a final decision."
                            : "This claim has significant issues with documentation or evidence. The damage assessment does not align with the claim description, or important documents are missing or unverified. We recommend rejecting this claim or requesting additional information from the claimant."}
                      </p>
                    </div>

                    {canApproveOrReject() && (
                      <div className="flex gap-3 justify-center pt-4">
                        <button
                          onClick={() => updateClaimStatus("approved")}
                          disabled={isUpdating}
                          className="btn flex items-center bg-green-600 hover:bg-green-700 text-white"
                        >
                          <ThumbsUp className="mr-2 h-4 w-4" />
                          Approve Claim
                        </button>
                        <button
                          onClick={() => updateClaimStatus("rejected")}
                          disabled={isUpdating}
                          className="btn flex items-center bg-red-600 hover:bg-red-700 text-white"
                        >
                          <ThumbsDown className="mr-2 h-4 w-4" />
                          Reject Claim
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
