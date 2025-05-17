"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import { X, FileText, ImageIcon, Video } from "lucide-react"
import { supabaseClient } from "@/lib/supabaseClient"
import { v4 as uuidv4 } from "uuid"
import { triggerDocumentProcessing } from "./action" // adjust path as needed

export default function SubmitClaimPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [claimName, setClaimName] = useState("")
  const [documents, setDocuments] = useState<{ file: File; type: string }[]>([])
  const [images, setImages] = useState<{ file: File; part: string; severity: string }[]>([])
  const [videos, setVideos] = useState<File[]>([])

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        file,
        type: "police_report", // Default type, can be changed by user later
      }))
      setDocuments([...documents, ...newFiles])
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        file,
        part: "",
        severity: "minor", // Default severity, can be changed by user later
      }))
      setImages([...images, ...newFiles])
    }
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setVideos([...videos, ...newFiles])
    }
  }

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index))
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const removeVideo = (index: number) => {
    setVideos(videos.filter((_, i) => i !== index))
  }

  const updateDocumentType = (index: number, type: string) => {
    const updatedDocuments = [...documents]
    updatedDocuments[index].type = type
    setDocuments(updatedDocuments)
  }

  const updateImagePart = (index: number, part: string) => {
    const updatedImages = [...images]
    updatedImages[index].part = part
    setImages(updatedImages)
  }

  const updateImageSeverity = (index: number, severity: string) => {
    const updatedImages = [...images]
    updatedImages[index].severity = severity
    setImages(updatedImages)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!claimName.trim()) {
      alert("Please enter a claim name")
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Create the claim record
      const { data: claimData, error: claimError } = await supabaseClient
        .from("claims")
        .insert([
          {
            name: claimName,
            status: "submitted",
          },
        ])
        .select()

      if (claimError || !claimData || claimData.length === 0) {
        throw new Error(claimError?.message || "Failed to create claim")
      }

      const claimId = claimData[0].id

      // 2. Upload documents
      for (const doc of documents) {
        const fileName = `${uuidv4()}-${doc.file.name}`
        const { error: uploadError } = await supabaseClient.storage.from("documents").upload(fileName, doc.file)

        if (uploadError) {
          console.error("Error uploading document:", uploadError)
          continue
        }

        const { data: urlData } = supabaseClient.storage.from("documents").getPublicUrl(fileName)

        await supabaseClient.from("documents").insert([
          {
            claim_id: claimId,
            doc_type: doc.type,
            file_url: urlData.publicUrl,
          },
        ])
      }

      // 3. Upload images
      for (const img of images) {
        const fileName = `${uuidv4()}-${img.file.name}`
        const { error: uploadError } = await supabaseClient.storage.from("images").upload(fileName, img.file)

        if (uploadError) {
          console.error("Error uploading image:", uploadError)
          continue
        }

        const { data: urlData } = supabaseClient.storage.from("images").getPublicUrl(fileName)

        await supabaseClient.from("images").insert([
          {
            claim_id: claimId,
            file_url: urlData.publicUrl,
            part: img.part || null,
            severity: img.severity as "minor" | "moderate" | "severe",
          },
        ])
      }

      // 4. Upload videos
      for (const video of videos) {
        const fileName = `${uuidv4()}-${video.name}`
        const { error: uploadError } = await supabaseClient.storage.from("videos").upload(fileName, video)

        if (uploadError) {
          console.error("Error uploading video:", uploadError)
          continue
        }

        const { data: urlData } = supabaseClient.storage.from("videos").getPublicUrl(fileName)

        await supabaseClient.from("videos").insert([
          {
            claim_id: claimId,
            file_url: urlData.publicUrl,
            model_status: "pending",
          },
        ])
      }

      // Trigger background document processing
      const result = await triggerDocumentProcessing(claimId)

      if (!result.success) {
        console.warn("Document processing failed:", result.error)
      }


      // Redirect to the claim detail page
      router.push(`/claims/${claimId}`)
    } catch (error) {
      console.error("Error submitting claim:", error)
      alert("Failed to submit claim. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar activePage="submit-claim" />

      {/* Submit Claim Form */}
      <div className="flex-1 container mx-auto px-4 py-6 md:px-6 md:py-12">
        <div className="flex flex-col items-start mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Submit a New Claim</h1>
          <p className="text-gray-500">Fill out the form below to submit a new insurance claim</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="card">
              <div className="p-4 border-b">
                <h2 className="text-xl font-bold">Claim Information</h2>
                <p className="text-sm text-gray-500">Provide details about your insurance claim</p>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="claim-name" className="text-sm font-medium">
                    Claim Name
                  </label>
                  <input
                    id="claim-name"
                    value={claimName}
                    onChange={(e) => setClaimName(e.target.value)}
                    placeholder="Enter a name for this claim"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="claim-name" className="text-sm font-medium">
                    Car Model
                  </label>
                  <input
                    id="claim-name"
                    value={claimName}
                    onChange={(e) => setClaimName(e.target.value)}
                    placeholder="Enter a name for this claim"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="claim-name" className="text-sm font-medium">
                    Policy Holder
                  </label>
                  <input
                    id="claim-name"
                    value={claimName}
                    onChange={(e) => setClaimName(e.target.value)}
                    placeholder="Enter a name for this claim"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                {/* Documents Section */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Documents</label>
                  <div className="border-2 border-dashed rounded-md p-4">
                    <div className="flex flex-col items-center justify-center gap-2 mb-4">
                      <FileText className="h-8 w-8 text-gray-400" />
                      <p className="text-sm text-gray-500">Upload police reports, car grants, or insurance forms</p>
                      <input
                        id="document-upload"
                        type="file"
                        className="hidden"
                        multiple
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={handleDocumentUpload}
                      />
                      <button
                        type="button"
                        className="btn btn-outline text-sm"
                        onClick={() => document.getElementById("document-upload")?.click()}
                      >
                        Browse Documents
                      </button>
                    </div>

                    {documents.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <h3 className="text-sm font-medium">Uploaded Documents</h3>
                        <ul className="space-y-2">
                          {documents.map((doc, index) => (
                            <li key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <span className="text-sm truncate max-w-[150px]">{doc.file.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <select
                                  value={doc.type}
                                  onChange={(e) => updateDocumentType(index, e.target.value)}
                                  className="text-xs p-1 border border-gray-300 rounded"
                                >
                                  <option value="police_report">Police Report</option>
                                  <option value="car_grant">Car Grant</option>
                                  <option value="insurance_form">Insurance Form</option>
                                </select>
                                <button
                                  type="button"
                                  onClick={() => removeDocument(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="p-4 border-b">
                <h2 className="text-xl font-bold">Media Evidence</h2>
                <p className="text-sm text-gray-500">Upload images and videos of the damage</p>
              </div>
              <div className="p-4 space-y-4">
                {/* Images Section */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Damage Images</label>
                  <div className="border-2 border-dashed rounded-md p-4">
                    <div className="flex flex-col items-center justify-center gap-2 mb-4">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                      <p className="text-sm text-gray-500">Upload photos of the damage</p>
                      <input
                        id="image-upload"
                        type="file"
                        className="hidden"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                      <button
                        type="button"
                        className="btn btn-outline text-sm"
                        onClick={() => document.getElementById("image-upload")?.click()}
                      >
                        Browse Images
                      </button>
                    </div>

                    {images.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <h3 className="text-sm font-medium">Uploaded Images</h3>
                        <ul className="space-y-2">
                          {images.map((img, index) => (
                            <li key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                              <div className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4 text-gray-500" />
                                <span className="text-sm truncate max-w-[150px]">{img.file.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="Car part"
                                  value={img.part}
                                  onChange={(e) => updateImagePart(index, e.target.value)}
                                  className="text-xs p-1 border border-gray-300 rounded w-20"
                                />
                                <select
                                  value={img.severity}
                                  onChange={(e) => updateImageSeverity(index, e.target.value)}
                                  className="text-xs p-1 border border-gray-300 rounded"
                                >
                                  <option value="minor">Minor</option>
                                  <option value="moderate">Moderate</option>
                                  <option value="severe">Severe</option>
                                </select>
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Videos Section */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Video Evidence</label>
                  <div className="border-2 border-dashed rounded-md p-4">
                    <div className="flex flex-col items-center justify-center gap-2 mb-4">
                      <Video className="h-8 w-8 text-gray-400" />
                      <p className="text-sm text-gray-500">Upload videos of the damage or incident</p>
                      <input
                        id="video-upload"
                        type="file"
                        className="hidden"
                        multiple
                        accept="video/*"
                        onChange={handleVideoUpload}
                      />
                      <button
                        type="button"
                        className="btn btn-outline text-sm"
                        onClick={() => document.getElementById("video-upload")?.click()}
                      >
                        Browse Videos
                      </button>
                    </div>

                    {videos.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <h3 className="text-sm font-medium">Uploaded Videos</h3>
                        <ul className="space-y-2">
                          {videos.map((video, index) => (
                            <li key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                              <div className="flex items-center gap-2">
                                <Video className="h-4 w-4 text-gray-500" />
                                <span className="text-sm truncate max-w-[200px]">{video.name}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeVideo(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-4 border-t flex justify-end">
                <button type="button" className="btn btn-outline mr-2" onClick={() => router.push("/claims")}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Claim"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  )
}