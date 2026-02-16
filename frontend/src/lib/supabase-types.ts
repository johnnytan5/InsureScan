// Type definitions based on your Supabase schema

export type Claim = {
  id: number
  name: string
  created_at: string
  status: "submitted" | "analyzed" | "approved" | "rejected"
  claim_score: number | null
  model_file_url: string | null
}

export type Document = {
  id: number
  claim_id: number
  doc_type: "police_report" | "car_grant" | "insurance_form"
  file_url: string
  extracted_text: string | null
  verified: boolean
}

export type Image = {
  id: number
  claim_id: number
  file_url: string
  damage_score: number | null
  part: string | null
  severity: "minor" | "moderate" | "severe" | null
}

export type Video = {
  id: number
  claim_id: number
  file_url: string
  model_status: "pending" | "done" | "error"
  model_file_url: string | null
}
