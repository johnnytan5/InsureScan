"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import { X, FileText, ImageIcon, Video } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { triggerDocumentProcessing } from "./action" // adjust path as needed
import { pdfToImg } from "pdftoimg-js/browser" // Add this import

export default function SubmitClaimPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [claimName, setClaimName] = useState("")
  const [documents, setDocuments] = useState<{ file: File; type: string }[]>([])
  const [images, setImages] = useState<{ file: File; part: string; severity: string }[]>([])
  const [videos, setVideos] = useState<File[]>([])
  // Add state for converted images
  const [convertedDocImages, setConvertedDocImages] = useState<Record<string, string[]>>({})
  const [isConverting, setIsConverting] = useState(false)

  // Add this function for PDF conversion
  const convertPdfToImages = async (file: File): Promise<string[]> => {
    try {
      const fileUrl = URL.createObjectURL(file)

      // This is for optimization testing (uncomment if not)
      const options = {
        scale: 1.5,     // Reduce from default 2.0 for faster processing
        maxWidth: 1000, // Limit width to reduce file size
        maxHeight: 1400, // Limit height to reduce file size
        pageLimit: 20, // Only process first 20 pages by default
        quality: 0.8,   // Slightly reduce quality for better performance
      }
      const convertedImages = await pdfToImg(fileUrl, options)
      URL.revokeObjectURL(fileUrl)
      return convertedImages
    } catch (error) {
      console.error("Error converting PDF:", error)
      return [] // Return empty array on error
    }
  }

  // Replace existing document upload function
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsConverting(true)
      
      try {
        const newFiles = []
        
        // Process each file
        for (const file of Array.from(e.target.files)) {
          // Only convert PDFs
          if (file.type === "application/pdf") {
            console.log(`Converting PDF: ${file.name} (${Math.round(file.size / 1024)} KB)`)
            
            // Convert the PDF to images
            const images = await convertPdfToImages(file)
            
            if (images.length > 0) {
              console.log(`Converted ${file.name} to ${images.length} images`)
              
              // Store the converted images with default type
              setConvertedDocImages(prev => ({
                ...prev,
                [`${file.name}-police_report`]: images
              }))
            }
          }
          
          // Add the file to documents state regardless of conversion success
          newFiles.push({
            file,
            type: "police_report", // Default type, can be changed by user later
          })
        }
        
        setDocuments([...documents, ...newFiles])
      } catch (err) {
        console.error('Error processing documents:', err)
      } finally {
        setIsConverting(false)
      }
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
    const docToRemove = documents[index]
    // Also remove any converted images
    setConvertedDocImages(prev => {
      const newImages = {...prev}
      const key = `${docToRemove.file.name}-${docToRemove.type}`
      if (newImages[key]) {
        delete newImages[key]
      }
      return newImages
    })
    setDocuments(documents.filter((_, i) => i !== index))
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const removeVideo = (index: number) => {
    setVideos(videos.filter((_, i) => i !== index))
  }

  // Update document type function to handle converted images
  const updateDocumentType = (index: number, type: string) => {
    const updatedDocuments = [...documents]
    const oldDoc = updatedDocuments[index]
    const oldType = oldDoc.type
    
    // Update the document type
    updatedDocuments[index].type = type
    setDocuments(updatedDocuments)
    
    // Update the converted images type if they exist
    const key = `${oldDoc.file.name}-${oldType}`
    if (convertedDocImages[key]) {
      setConvertedDocImages(prev => {
        const newImages = {...prev}
        // Create new key with updated type
        newImages[`${oldDoc.file.name}-${type}`] = newImages[key]
        // Delete old key
        delete newImages[key]
        return newImages
      })
    }
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

  // Updated submit function to use AsparaDB API endpoints
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!claimName.trim()) {
      alert("Please enter a claim name")
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Create the claim record using AsparaDB API
      const claimResponse = await fetch('/api/claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: claimName,
          status: "submitted",
        }),
      });

      if (!claimResponse.ok) {
        throw new Error("Failed to create claim");
      }

      const claimData = await claimResponse.json();
      const claimId = claimData.id;

      // 2. Upload documents
      for (const doc of documents) {
        const fileName = `${uuidv4()}-${doc.file.name}`;
        const formData = new FormData();
        formData.append('file', doc.file);
        formData.append('fileName', fileName);

        // Upload file to storage API
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          console.error("Error uploading document");
          continue;
        }

        const uploadData = await uploadResponse.json();

        // Create document record in database
        await fetch('/api/documents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            claim_id: claimId,
            doc_type: doc.type,
            file_url: uploadData.fileUrl,
          }),
        });
      }

      // 3. Upload images
      for (const img of images) {
        const fileName = `${uuidv4()}-${img.file.name}`;
        const formData = new FormData();
        formData.append('file', img.file);
        formData.append('fileName', fileName);
        formData.append('type', 'images');

        // Upload file to storage API
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          console.error("Error uploading image");
          continue;
        }

        const uploadData = await uploadResponse.json();

        // Create image record in database
        await fetch('/api/images', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            claim_id: claimId,
            file_url: uploadData.fileUrl,
            part: img.part || null,
            severity: img.severity,
          }),
        });
      }

      // 4. Upload videos
      for (const video of videos) {
        const fileName = `${uuidv4()}-${video.name}`;
        const formData = new FormData();
        formData.append('file', video);
        formData.append('fileName', fileName);
        formData.append('type', 'videos');

        // Upload file to storage API
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          console.error("Error uploading video");
          continue;
        }

        const uploadData = await uploadResponse.json();

        // Create video record in database
        await fetch('/api/videos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            claim_id: claimId,
            file_url: uploadData.fileUrl,
            model_status: "pending",
          }),
        });
      }

      // 5. Process documents with converted images
      // Organize converted images by document type
      const documentImages: Record<string, string[]> = {}
      
      // Group converted images by document type
      Object.entries(convertedDocImages).forEach(([key, images]) => {
        // Extract document type from the key (format: "filename-doctype")
        const docType = key.split('-').pop()
        
        if (docType) {
          // Initialize array if it doesn't exist
          if (!documentImages[docType]) {
            documentImages[docType] = []
          }
          
          // Add all images for this document type
          documentImages[docType].push(...images)
        }
      })
      
      // Only include document types that exist in our data model
      const filteredDocImages: Record<string, string[]> = {}
      if (documentImages.police_report?.length) filteredDocImages.police_report = documentImages.police_report
      if (documentImages.car_grant?.length) filteredDocImages.car_grant = documentImages.car_grant
      if (documentImages.insurance_form?.length) filteredDocImages.insurance_form = documentImages.insurance_form
      
      // Trigger processing with converted images if available
      const hasConvertedImages = Object.keys(filteredDocImages).length > 0
      
      const result = hasConvertedImages
        ? await triggerDocumentProcessing(claimId, filteredDocImages)
        : await triggerDocumentProcessing(claimId)

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

  // The rest of the component remains unchanged
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
                        disabled={isConverting}
                      >
                        {isConverting ? "Processing..." : "Browse Documents"}
                      </button>
                    </div>

                    {/* Add conversion status message */}
                    {isConverting && (
                      <div className="mt-2 text-sm text-blue-600 animate-pulse">
                        Converting PDF documents to images for better text extraction...
                      </div>
                    )}

                    {documents.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <h3 className="text-sm font-medium">Uploaded Documents</h3>
                        <ul className="space-y-2">
                          {documents.map((doc, index) => (
                            <li key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <span className="text-sm truncate max-w-[150px]">{doc.file.name}</span>
                                {/* Show converted page count */}
                                {convertedDocImages[`${doc.file.name}-${doc.type}`] && (
                                  <span className="text-xs text-green-600">
                                    ({convertedDocImages[`${doc.file.name}-${doc.type}`].length} pages)
                                  </span>
                                )}
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

            {/* Media Evidence Card */}
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
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={isSubmitting || isConverting}
                >
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