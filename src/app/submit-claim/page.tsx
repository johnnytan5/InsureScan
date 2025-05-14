"use client"
import { Upload } from "lucide-react"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"

export default function SubmitClaimPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar activePage="submit-claim" />

      {/* Submit Claim Form */}
      <div className="flex-1 container mx-auto px-4 py-6 md:px-6 md:py-12">
        <div className="flex flex-col items-start mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Submit a New Claim</h1>
          <p className="text-gray-500">Fill out the form below to submit a new insurance claim</p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="card">
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold">Claim Information</h2>
              <p className="text-sm text-gray-500">Provide details about your insurance claim</p>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label htmlFor="policy-number" className="text-sm font-medium">
                  Policy Number
                </label>
                <input
                  id="policy-number"
                  placeholder="Enter your policy number"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="incident-date" className="text-sm font-medium">
                  Incident Date
                </label>
                <input id="incident-date" type="date" className="w-full p-2 border border-gray-300 rounded-md" />
              </div>
              <div className="space-y-2">
                <label htmlFor="claim-type" className="text-sm font-medium">
                  Claim Type
                </label>
                <select id="claim-type" className="w-full p-2 border border-gray-300 rounded-md">
                  <option value="">Select claim type</option>
                  <option value="auto">Auto Insurance</option>
                  <option value="home">Home Insurance</option>
                  <option value="health">Health Insurance</option>
                  <option value="life">Life Insurance</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="claim-amount" className="text-sm font-medium">
                  Claim Amount ($)
                </label>
                <input
                  id="claim-amount"
                  type="number"
                  placeholder="0.00"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold">Incident Details</h2>
              <p className="text-sm text-gray-500">Describe what happened and provide supporting documents</p>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description of Incident
                </label>
                <textarea
                  id="description"
                  placeholder="Please provide a detailed description of the incident..."
                  className="w-full p-2 border border-gray-300 rounded-md min-h-[120px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Supporting Documents</label>
                <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center gap-2">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-500">Drag and drop files here or click to browse</p>
                  <input id="file-upload" type="file" className="hidden" multiple />
                  <button
                    className="btn btn-outline text-sm"
                    onClick={() => document.getElementById("file-upload")?.click()}
                  >
                    Browse Files
                  </button>
                  <p className="text-xs text-gray-400 mt-2">
                    Upload photos, receipts, reports, or any relevant documents (PDF, JPG, PNG)
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end">
              <button className="btn btn-outline mr-2">Cancel</button>
              <button className="btn btn-primary">Submit Claim</button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
