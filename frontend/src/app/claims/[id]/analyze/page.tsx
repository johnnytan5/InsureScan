"use client"

import { Footer } from "@/components/ui/footer"
import { Navbar } from "@/components/ui/navbar"
import type { Claim, Document, Image } from "@/lib/supabase-types"
import { formatDate, getStatusColor } from "@/lib/utils"
import { OrbitControls, PresentationControls, Stage, useGLTF } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import {
    AlertCircle,
    ArrowLeft,
    BarChart,
    Car,
    CheckCircle,
    CheckSquare,
    ChevronDown,
    ChevronUp,
    FileCheck,
    FileText,
    ImageIcon,
    Info,
    Layers,
    Lightbulb,
    Loader2,
    ThumbsDown,
    ThumbsUp,
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Suspense, useEffect, useRef, useState } from "react"
import { OrbitControls as ThreeOrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

import * as THREE from "three"
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js"

// Damage Analysis Component
const DamageAnalysis = () => {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.set(0, 1.5, 3)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 1) // Set background to black
    mountRef.current.appendChild(renderer.domElement)

    const controls = new ThreeOrbitControls(camera, renderer.domElement)
    scene.add(new THREE.AmbientLight(0xffffff, 1))

    const loader = new OBJLoader()
    let original: THREE.Mesh | null = null
    let damaged: THREE.Mesh | null = null

    const checkLoaded = () => {
      if (original && damaged) {
        compareMeshes(original, damaged)
      }
    }

    loader.load("/original.obj", (obj) => {
      original = obj.children[0] as THREE.Mesh
      checkLoaded()
    })

    loader.load("/damaged.obj", (obj) => {
      damaged = obj.children[0] as THREE.Mesh
      checkLoaded()
    })

    const compareMeshes = (original: THREE.Mesh, damaged: THREE.Mesh) => {
      const origGeo = original.geometry.clone()
      const dmgGeo = damaged.geometry.clone()

      const origPos = origGeo.attributes.position as THREE.BufferAttribute
      const dmgPos = dmgGeo.attributes.position as THREE.BufferAttribute

      const colorArray = new Float32Array(dmgPos.count * 3)
      const threshold = 0.01

      for (let i = 0; i < dmgPos.count; i++) {
        const dx = dmgPos.getX(i) - origPos.getX(i)
        const dy = dmgPos.getY(i) - origPos.getY(i)
        const dz = dmgPos.getZ(i) - origPos.getZ(i)
        const diff = Math.sqrt(dx * dx + dy * dy + dz * dz)

        if (diff > threshold) {
          colorArray[i * 3 + 0] = 1 // R
          colorArray[i * 3 + 1] = 0 // G
          colorArray[i * 3 + 2] = 0 // B
        } else {
          colorArray[i * 3 + 0] = 0.5
          colorArray[i * 3 + 1] = 0.5
          colorArray[i * 3 + 2] = 0.5
        }
      }

      dmgGeo.setAttribute("color", new THREE.BufferAttribute(colorArray, 3))
      const mat = new THREE.MeshStandardMaterial({ vertexColors: true })
      const resultMesh = new THREE.Mesh(dmgGeo, mat)
      scene.add(resultMesh)
    }

    const handleResize = () => {
      if (!mountRef.current) return
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(window.devicePixelRatio)
    }
    window.addEventListener("resize", handleResize)

    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      window.removeEventListener("resize", handleResize)
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
}

function Model() {
  const { scene } = useGLTF("/damaged.glb")
  return <primitive object={scene} />
}

export default function ClaimAnalyzePage() {
  const params = useParams()
  const router = useRouter()
  const claimId = params.id as string

  const [claim, setClaim] = useState<Claim | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [images, setImages] = useState<Image[]>([])
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateMessage, setUpdateMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [activeSection, setActiveSection] = useState("summary")
  const [analysisInProgress, setAnalysisInProgress] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  // setDetectedModel, setConfidence, setError removed as they were unused and caused ESLint errors

  // LLM processing states
  const [llmLoading, setLlmLoading] = useState(false)
  const [llmError, setLlmError] = useState<string | null>(null)
  const [grantData, setGrantData] = useState<unknown>(null)
  const [policyData, setPolicyData] = useState<unknown>(null)
  const [policeData, setPoliceData] = useState<unknown>(null)
  const [documentVerificationComplete, setDocumentVerificationComplete] = useState(false)

  // Expanded sections state
  const [expandedSections, setExpandedSections] = useState({
    model: true,
    documents: true,
    carIdentification: true,
    damageAssessment: true,
    recommendation: true,
  })

  // Analysis data state - will be updated with LLM results
  const [analysisData, setAnalysisData] = useState({
    documentVerification: {
      score: 0,
      carModel: {
        policyForm: "",
        carGrant: "",
        policeReport: "",
        match: false,
      },
      ownerName: {
        policyForm: "",
        carGrant: "",
        policeReport: "",
        match: false,
      },
      policyMaturity: {
        date: "",
        isValid: false,
      },
      incidentDate: {
        policyForm: "",
        policeReport: "",
        match: false,
      },
    },
    carModelIdentification: {
      score: 9.2,
      claimedModel: "BMW X5",
      detectedModel: "BMW X5",
      confidence: 0.94,
      match: true,
    },
    damageAssessment: {
      score: 7.8,
      parts: [
        {
          name: "Front Bumper",
          claimedSeverity: "severe",
          assessedSeverity: "severe",
          match: true,
          confidence: 0.92,
        },
        {
          name: "Hood",
          claimedSeverity: "moderate",
          assessedSeverity: "moderate",
          match: true,
          confidence: 0.88,
        },
        {
          name: "Left Headlight",
          claimedSeverity: "severe",
          assessedSeverity: "moderate",
          match: false,
          confidence: 0.85,
        },
        {
          name: "Front Left Fender",
          claimedSeverity: "moderate",
          assessedSeverity: "minor",
          match: false,
          confidence: 0.79,
        },
      ],
    },
    overallScore: 8.4,
    keyFindings: [
      "All documents are consistent and verified",
      "Car model in images matches the claimed model",
      "Some damage severity assessments differ from claimed severity",
      "Overall damage is consistent with a frontal collision",
    ],
    recommendation: "Approve with adjusted payout for overestimated damage",
  })

  // Function to handle LLM API calls
  async function handleLlmQuery(input: string) {
    setLlmError(null)

    try {
      const response = await fetch("/api/llm-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong")
      }

      return data.result
    } catch (err: unknown) {
      setLlmError(err instanceof Error ? err.message : String(err))
      console.error("LLM Query Error:", err)
      return null
    }
  }

  useEffect(() => {
    if (grantData && policyData && policeData) {
      updateAnalysisDataWithLlmResults()
    }
  }, [grantData, policyData, policeData])

  // Add a function to clean and parse JSON from LLM responses
  function cleanAndParseJSON(text: string) {
    try {
      // First try direct parsing in case it's already valid JSON
      return JSON.parse(text)
    } catch {
      // If direct parsing fails, try to extract JSON from markdown code blocks
      try {
        // Remove markdown code block syntax if present
        let cleanedText = text

        // Remove \`\`\`json or \`\`\` at the beginning
        cleanedText = cleanedText.replace(/^```(?:json)?\s*\n/m, "")

        // Remove \`\`\` at the end
        cleanedText = cleanedText.replace(/\n```\s*$/m, "")

        // Try to parse the cleaned text
        return JSON.parse(cleanedText)
      } catch (e2) {
        console.error("Failed to parse JSON after cleaning:", e2)
        throw new Error("Failed to parse LLM response as JSON. Please try again.")
      }
    }
  }

  // Process document data with LLM
  async function processDocumentsWithLLM() {
    if (!claim) return

    setLlmLoading(true)

    try {
      // Use type assertion to access properties that might not be in the Claim type
      const claimData = claim as Record<string, string | number | boolean | null>

      // Process car grant
      if (claimData.text_grant) {
        const grantPrompt = `Context: ${claimData.text_grant}\nPlease extract these information in English and return them in this JSON format WITHOUT ANY MARKDOWN FORMATTING (no backticks, no \`\`\`json tags): {"grant": {"car_model": "<car model here>", "owner_name": "<owner name here>"}}`
        const grantResult = await handleLlmQuery(grantPrompt)
        if (grantResult) {
          console.log("Grant data processed. Grant data: ", grantResult)
          setGrantData(cleanAndParseJSON(grantResult))
        }
        console.log("Grant", grantData)
      }

      // Process policy form
      if (claimData.text_policy) {
        const policyPrompt = `Context: ${claimData.text_policy}\nPlease extract these information in English and return them in this JSON format WITHOUT ANY MARKDOWN FORMATTING (no backticks, no \`\`\`json tags): {"policy": {"car_model": "<car model here>", "owner_name": "<owner name here>", "coverage_date": "<policy coverage END date here, format: DD/MM/YYYY>"}}`
        const policyResult = await handleLlmQuery(policyPrompt)
        if (policyResult) {
          console.log("Policy data processed. Policy data: ", policyResult)
          setPolicyData(cleanAndParseJSON(policyResult))
        }
        console.log("Policy: ", policyData)
      }

      // Process police report
      if (claimData.text_police) {
        const policePrompt = `Context: ${claimData.text_police}\nPlease extract these information in English and return them in this JSON format WITHOUT ANY MARKDOWN FORMATTING (no backticks, no \`\`\`json tags): {"report": {"car_model": "<car model here>", "owner_name": "<owner name here>", "incident_date": "<incident date here>, format: DD/MM/YYYY"}}`
        const policeResult = await handleLlmQuery(policePrompt)
        if (policeResult) {
          console.log("Police data processed. Police data: ", policeResult)
          setPoliceData(cleanAndParseJSON(policeResult))
        }
      }

      // Update document verification status
      setDocumentVerificationComplete(true)

      // Update analysis data with the extracted information

      // updateAnalysisDataWithLlmResults()
    } catch (error) {
      console.error("Error processing documents with LLM:", error)
      setLlmError(error instanceof Error ? error.message : "Failed to process documents with LLM. Please try again.")
    } finally {
      setLlmLoading(false)
    }
  }

  // Update analysis data with LLM results
  function updateAnalysisDataWithLlmResults() {
    console.log("Analysis data is being documented!")
    if (!grantData || !policyData || !policeData) return

    const gData = grantData as Record<string, Record<string, string>>
    const polData = policyData as Record<string, Record<string, string>>
    const repData = policeData as Record<string, Record<string, string>>

    // Extract data from LLM results
    const carModelGrant = gData.grant?.car_model || ""
    console.log("Printed grant!")
    const carModelPolicy = polData.policy?.car_model || ""
    const carModelPolice = repData.report?.car_model || ""

    const ownerNameGrant = gData.grant?.owner_name || ""
    const ownerNamePolicy = polData.policy?.owner_name || ""
    const ownerNamePolice = repData.report?.owner_name || ""

    const policyDate = polData.policy?.coverage_date || ""
    const incidentDatePolicy = polData.policy?.incident_date || ""
    const incidentDatePolice = repData.report?.incident_date || ""

    // Check if car models match
    const carModelMatch = carModelGrant === carModelPolicy && carModelPolicy === carModelPolice

    // Check if owner names match
    const ownerNameMatch = ownerNameGrant === ownerNamePolicy && ownerNamePolicy === ownerNamePolice

    // Check if incident dates match
    const incidentDateMatch = incidentDatePolicy === incidentDatePolice

    // Check if policy is valid (simple check - can be enhanced)
    const isPolicyValid = policyDate ? new Date(policyDate) > new Date() : false

    console.log("Score is calculated!")

    // Calculate document verification score
    const docVerificationScore =
      (((carModelMatch ? 3 : 0) + (ownerNameMatch ? 3 : 0) + (incidentDateMatch ? 2 : 0) + (isPolicyValid ? 2 : 0)) /
        10) *
      10

    // Update analysis data
    setAnalysisData((prevData) => ({
      ...prevData,
      documentVerification: {
        score: docVerificationScore,
        carModel: {
          policyForm: carModelPolicy,
          carGrant: carModelGrant,
          policeReport: carModelPolice,
          match: carModelMatch,
        },
        ownerName: {
          policyForm: ownerNamePolicy,
          carGrant: ownerNameGrant,
          policeReport: ownerNamePolice,
          match: ownerNameMatch,
        },
        policyMaturity: {
          date: policyDate,
          isValid: isPolicyValid,
        },
        incidentDate: {
          policyForm: incidentDatePolicy,
          policeReport: incidentDatePolice,
          match: incidentDateMatch,
        },
      },
      // Update overall score based on new document verification score
      overallScore:
        (docVerificationScore + prevData.carModelIdentification.score + prevData.damageAssessment.score) / 3,
    }))
    console.log("Analysis data: ", analysisData)
  }

  // Modified fetchClaimData function
  useEffect(() => {
    async function fetchClaimData() {
      try {
        // Fetch claim details
        const claimResponse = await fetch(`/api/claims/${claimId}`)
        if (!claimResponse.ok) {
          throw new Error(`Failed to fetch claim: ${claimResponse.statusText}`)
        }
        const claimData = await claimResponse.json()
        setClaim(claimData)

        // Fetch documents
        const documentsResponse = await fetch(`/api/documents?claim_id=${claimId}`)
        if (!documentsResponse.ok) {
          throw new Error(`Failed to fetch documents: ${documentsResponse.statusText}`)
        }
        const documentsData = await documentsResponse.json()
        setDocuments(documentsData || [])

        // Fetch images
        const imagesResponse = await fetch(`/api/images?claim_id=${claimId}`)
        if (!imagesResponse.ok) {
          throw new Error(`Failed to fetch images: ${imagesResponse.statusText}`)
        }
        const imagesData = await imagesResponse.json()
        setImages(imagesData || [])

        // Fetch videos
        const videosResponse = await fetch(`/api/videos?claim_id=${claimId}`)
        if (!videosResponse.ok) {
          throw new Error(`Failed to fetch videos: ${videosResponse.statusText}`)
        }
        // const videosData = await videosResponse.json()
        // setVideos removed as it was unused and caused ESLint error
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

  // Call processDocumentsWithLLM when claim data is loaded
  useEffect(() => {
    if (claim && !documentVerificationComplete && !llmLoading) {
      processDocumentsWithLLM()
    }
  }, [claim, documentVerificationComplete, llmLoading])

  // Modified updateClaimStatus function
  const updateClaimStatus = async (status: "approved" | "rejected" | "analyzed") => {
    if (!claim) return

    setIsUpdating(true)
    setUpdateMessage(null)

    try {
      const response = await fetch(`/api/claims/${claim.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update claim status: ${response.statusText}`)
      }

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

  // Modified runAnalysis function
  const runAnalysis = async () => {
    if (!claim) return

    setAnalysisInProgress(true)

    try {
      // Simulate analysis process
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Update claim score (simulated)
      const claimScore = analysisData.overallScore

      const claimUpdateResponse = await fetch(`/api/claims/${claim.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          claim_score: claimScore,
          status: "analyzed",
        }),
      })

      if (!claimUpdateResponse.ok) {
        throw new Error(`Failed to update claim score: ${claimUpdateResponse.statusText}`)
      }

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

        const imageUpdateResponse = await fetch(`/api/images/${updatedImages[i].id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ damage_score: damageScore }),
        })

        if (!imageUpdateResponse.ok) {
          console.warn(`Failed to update image score for image ${updatedImages[i].id}`)
        }

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

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    })
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
              The claim you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
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

  // Render LLM loading state
  if (llmLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar activePage="claims" />
        <div className="flex-1 container mx-auto px-4 py-6 md:px-6 md:py-12 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold mb-2">Processing Documents</h2>
            <p className="text-gray-500">Our AI is analyzing the claim documents. This may take a moment...</p>
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

        {/* LLM Error message */}
        {llmError && (
          <div className="mb-6 p-4 rounded-md bg-red-50 text-red-700 border border-red-200">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Error processing documents: {llmError}
            </div>
          </div>
        )}

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

        {/* Main Content with Sidebar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
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
                  onClick={() => setActiveSection("car-model")}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center ${
                    activeSection === "car-model" ? "bg-black text-white" : "hover:bg-gray-100"
                  }`}
                >
                  <Car className="h-4 w-4 mr-2" />
                  Car Model Identification
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

          {/* Main Content Area */}
          <div className="md:col-span-3">
            {activeSection === "summary" && (
              <div className="space-y-8">
                {/* 1. 3D Model Section */}
                <div className="card">
                  <div
                    className="p-4 border-b flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSection("model")}
                  >
                    <h2 className="text-xl font-bold">3D Model Analysis</h2>
                    {expandedSections.model ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>

                  {expandedSections.model && (
                    <div className="p-4">
                      <div className="bg-gray-50 rounded-lg h-[400px] mb-4">
                        <Canvas>
                          <Suspense fallback={null}>
                            <PresentationControls
                              global
                              zoom={0.8}
                              rotation={[0, -Math.PI / 4, 0]}
                              polar={[-0.1, Math.PI / 4]}
                              azimuth={[-Math.PI / 4, Math.PI / 4]}
                            >
                              <Stage environment="night" intensity={0.2}>
                                <Model />
                              </Stage>
                            </PresentationControls>
                            <OrbitControls
                              enableZoom={true}
                              maxPolarAngle={Math.PI / 2.2} // prevents looking too far down
                              minPolarAngle={0}
                            />
                          </Suspense>
                        </Canvas>
                      </div>
                      <div className="flex justify-center mt-4">
                        <button
                          onClick={() => {
                            const modal = document.getElementById("damage-analysis-modal") as HTMLDialogElement
                            if (modal) modal.showModal()
                          }}
                          className="btn btn-primary flex items-center gap-2"
                        >
                          <BarChart className="h-4 w-4" />
                          Analyze Damage Points
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Document Verification Section */}
                <div className="card">
                  <div
                    className="p-4 border-b flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSection("documents")}
                  >
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold">Document Verification</h2>
                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        Score: {analysisData.documentVerification.score.toFixed(1)}/10
                      </span>
                    </div>
                    {expandedSections.documents ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>

                  {expandedSections.documents && (
                    <div className="p-4">
                      {!documentVerificationComplete ? (
                        <div className="flex flex-col items-center justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
                          <p className="text-gray-500">Processing document information...</p>
                        </div>
                      ) : (
                        <>
                          <div className="mb-6">
                            <h3 className="font-bold text-lg mb-3">Information Consistency Check</h3>
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse">
                                <thead>
                                  <tr className="bg-gray-50">
                                    <th className="border p-2 text-left">Information</th>
                                    <th className="border p-2 text-left">Policy Form</th>
                                    <th className="border p-2 text-left">Car Grant</th>
                                    <th className="border p-2 text-left">Police Report</th>
                                    <th className="border p-2 text-left">Match</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td className="border p-2 font-medium">Car Model</td>
                                    <td className="border p-2">
                                      {analysisData.documentVerification.carModel.policyForm}
                                    </td>
                                    <td className="border p-2">
                                      {analysisData.documentVerification.carModel.carGrant}
                                    </td>
                                    <td className="border p-2">
                                      {analysisData.documentVerification.carModel.policeReport}
                                    </td>
                                    <td className="border p-2">
                                      {analysisData.documentVerification.carModel.match ? (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                      ) : (
                                        <AlertCircle className="h-5 w-5 text-red-500" />
                                      )}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="border p-2 font-medium">Owner Name</td>
                                    <td className="border p-2">
                                      {analysisData.documentVerification.ownerName.policyForm}
                                    </td>
                                    <td className="border p-2">
                                      {analysisData.documentVerification.ownerName.carGrant}
                                    </td>
                                    <td className="border p-2">
                                      {analysisData.documentVerification.ownerName.policeReport}
                                    </td>
                                    <td className="border p-2">
                                      {analysisData.documentVerification.ownerName.match ? (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                      ) : (
                                        <AlertCircle className="h-5 w-5 text-red-500" />
                                      )}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="border p-2 font-medium">Incident Date</td>
                                    <td className="border p-2">11/2/2004</td>
                                    <td className="border p-2">-</td>
                                    <td className="border p-2">11/2/2004</td>
                                    <td className="border p-2">
                                      {analysisData.documentVerification.incidentDate.match ? (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                      ) : (
                                        <AlertCircle className="h-5 w-5 text-red-500" />
                                      )}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gray-50 p-4 rounded-md">
                              <h3 className="font-bold mb-2">Policy Validity Check</h3>
                              <div className="flex items-center gap-2 mb-2">
                                <p className="text-sm font-medium">Policy Maturity Date:</p>
                                <p>{analysisData.documentVerification.policyMaturity.date}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">Status:</p>
                                {analysisData.documentVerification.policyMaturity.isValid ? (
                                  <span className="text-green-600 flex items-center">
                                    <CheckCircle className="h-4 w-4 mr-1" /> Valid
                                  </span>
                                ) : (
                                  <span className="text-red-600 flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-1" /> Expired
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-md">
                              <h3 className="font-bold mb-2">Document Authenticity</h3>
                              <div className="space-y-2">
                                {documents.map((doc, index) => (
                                  <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-blue-500" />
                                      <span>
                                        {doc.doc_type
                                          .split("_")
                                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                          .join(" ")}
                                      </span>
                                    </div>
                                    <span className="text-green-600 flex items-center">
                                      <CheckCircle className="h-4 w-4 mr-1" /> Authentic
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
                            <h3 className="font-bold text-blue-800 mb-2 flex items-center">
                              <Info className="h-4 w-4 mr-2" />
                              Document Verification Summary
                            </h3>
                            <p className="text-blue-800">
                              {analysisData.documentVerification.carModel.match &&
                              analysisData.documentVerification.ownerName.match &&
                              analysisData.documentVerification.policyMaturity.isValid
                                ? "All documents are consistent and authentic. The car model, owner information, and incident dates match across all submitted documents. The insurance policy is valid and covers the incident date."
                                : "There are some inconsistencies in the documents. Please review the information carefully before proceeding."}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Car Model Identification Section */}
                <div className="card">
                  <div
                    className="p-4 border-b flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSection("carIdentification")}
                  >
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold">Car Model Identification</h2>
                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        Score: {analysisData.carModelIdentification.score.toFixed(1)}/10
                      </span>
                    </div>
                    {expandedSections.carIdentification ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>

                  {expandedSections.carIdentification && (
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <h3 className="font-bold mb-3">Model Comparison</h3>
                          <div className="bg-gray-50 p-4 rounded-md">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-500 mb-1">Claimed Model</p>
                                <p className="font-bold text-lg">{analysisData.carModelIdentification.claimedModel}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 mb-1">Detected Model</p>
                                  {loading ? (
                                    <p className="text-sm text-gray-600 italic">Analyzing...</p>
                                  ) : analysisData.carModelIdentification.detectedModel ? (
                                    <p className="font-bold text-lg">{analysisData.carModelIdentification.detectedModel}</p>
                                  ) : (
                                    <p className="text-sm text-gray-400">Not available</p>
                                  )}
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 mb-1">Confidence</p>
                                  {loading ? (
                                    <p className="text-sm text-gray-600 italic">Processing...</p>
                                  ) : analysisData.carModelIdentification.confidence !== null ? (
                                    <p className="font-bold text-lg">{(analysisData.carModelIdentification.confidence * 100).toFixed(1)}%</p>
                                  ) : (
                                    <p className="text-sm text-gray-400">Not available</p>
                                  )}
                              </div>

                              <div>
                                <p className="text-sm text-gray-500 mb-1">Match</p>
                                {analysisData.carModelIdentification.match ? (
                                  <span className="text-green-600 flex items-center">
                                    <CheckCircle className="h-4 w-4 mr-1" /> Verified
                                  </span>
                                ) : (
                                  <span className="text-red-600 flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-1" /> Mismatch
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-bold mb-3">Image Analysis</h3>
                          <div className="grid grid-cols-2 gap-2">
                            {images.slice(0, 4).map((img, index) => (
                              <div key={index} className="border rounded-md overflow-hidden">
                                <img
                                  src={img.file_url || "/placeholder.svg"}
                                  alt={`Car image ${index + 1}`}
                                  className="w-full h-32 object-cover"
                                />
                                <div className="p-2 bg-gray-50">
                                  <p className="text-xs text-center">
                                    {index === 0
                                      ? "Front View"
                                      : index === 1
                                        ? "Side View"
                                        : index === 2
                                          ? "Rear View"
                                          : "Interior"}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* <div className="bg-gray-50 p-4 rounded-md mb-4">
                        <h3 className="font-bold mb-2">Key Features Identified</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: "95%" }}></div>
                            </div>
                            <p className="text-xs text-center">Body Shape</p>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: "92%" }}></div>
                            </div>
                            <p className="text-xs text-center">Headlights</p>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: "97%" }}></div>
                            </div>
                            <p className="text-xs text-center">Grille</p>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: "90%" }}></div>
                            </div>
                            <p className="text-xs text-center">Wheels</p>
                          </div>
                        </div>
                      </div> */}

                      <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
                        <h3 className="font-bold text-blue-800 mb-2 flex items-center">
                          <Info className="h-4 w-4 mr-2" />
                          Car Model Identification Summary
                        </h3>
                        <p className="text-blue-800">
                          The car model in the images has been identified as a{" "}
                          {analysisData.carModelIdentification.detectedModel} with{" "}
                          {(analysisData.carModelIdentification.confidence * 100).toFixed(0)}% confidence, which
                          {analysisData.carModelIdentification.match ? " matches" : " does not match"} the claimed model
                          in the documents. All key features of the {analysisData.carModelIdentification.detectedModel}{" "}
                          have been identified in the images.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Damage Assessment Section */}
                <div className="card">
                  <div
                    className="p-4 border-b flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSection("damageAssessment")}
                  >
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold">Damage Assessment</h2>
                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        Score: {analysisData.damageAssessment.score.toFixed(1)}/10
                      </span>
                    </div>
                    {expandedSections.damageAssessment ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>

                  {expandedSections.damageAssessment && (
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {analysisData.damageAssessment.parts.map((part, index) => (
                          <div key={index} className="border rounded-md overflow-hidden">
                            <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
                              <h3 className="font-bold">{part.name}</h3>
                              {part.match ? (
                                <span className="text-green-600 flex items-center text-sm">
                                  <CheckCircle className="h-4 w-4 mr-1" /> Verified
                                </span>
                              ) : (
                                <span className="text-amber-600 flex items-center text-sm">
                                  <AlertCircle className="h-4 w-4 mr-1" /> Discrepancy
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2">
                              <div className="aspect-square relative">
                                <img
                                  src={images[index]?.file_url || "/placeholder.svg"}
                                  alt={`Damage to ${part.name}`}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-1 text-xs text-center">
                                  {part.name}
                                </div>
                              </div>
                              <div className="p-3">
                                <div className="mb-3">
                                  <p className="text-sm text-gray-500 mb-1">Claimed Severity</p>
                                  <span
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                      part.claimedSeverity === "severe"
                                        ? "bg-red-100 text-red-800"
                                        : part.claimedSeverity === "moderate"
                                          ? "bg-amber-100 text-amber-800"
                                          : "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {part.claimedSeverity.charAt(0).toUpperCase() + part.claimedSeverity.slice(1)}
                                  </span>
                                </div>
                                <div className="mb-3">
                                  <p className="text-sm text-gray-500 mb-1">Assessed Severity</p>
                                  <span
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                      part.assessedSeverity === "severe"
                                        ? "bg-red-100 text-red-800"
                                        : part.assessedSeverity === "moderate"
                                          ? "bg-amber-100 text-amber-800"
                                          : "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {part.assessedSeverity.charAt(0).toUpperCase() + part.assessedSeverity.slice(1)}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500 mb-1">Confidence</p>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                                        <div
                                          className="bg-blue-600 h-1.5 rounded-full"
                                          style={{ width: `${part.confidence * 100}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                    <span className="text-xs font-medium">{(part.confidence * 100).toFixed(0)}%</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
                        <h3 className="font-bold text-blue-800 mb-2 flex items-center">
                          <Info className="h-4 w-4 mr-2" />
                          Damage Assessment Summary
                        </h3>
                        <p className="text-blue-800">
                          The damage assessment shows that 2 out of 4 parts have severity levels that match the claimed
                          severity. The front bumper and hood damage are accurately reported, while the left headlight
                          and front left fender damage appear to be less severe than claimed. Overall, the damage is
                          consistent with a frontal collision.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Overall Score and Recommendation Section */}
                <div className="card">
                  <div
                    className="p-4 border-b flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSection("recommendation")}
                  >
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold">Overall Score & Recommendation</h2>
                      <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        Score: {analysisData.overallScore.toFixed(1)}/10
                      </span>
                    </div>
                    {expandedSections.recommendation ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>

                  {expandedSections.recommendation && (
                    <div className="p-4">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-3xl font-bold text-green-700">
                            {analysisData.overallScore.toFixed(1)}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold mb-1">Claim Assessment Score</h3>
                          <p className="text-gray-600">
                            This claim has received a score of {analysisData.overallScore.toFixed(1)} out of 10,
                            indicating a high likelihood of validity.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gray-50 p-3 rounded-md">
                          <p className="text-sm text-gray-500 mb-1">Document Verification</p>
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-lg">{analysisData.documentVerification.score.toFixed(1)}</p>
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                              <FileCheck className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-md">
                          <p className="text-sm text-gray-500 mb-1">Car Model Identification</p>
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-lg">{analysisData.carModelIdentification.score.toFixed(1)}</p>
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                              <Car className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-md">
                          <p className="text-sm text-gray-500 mb-1">Damage Assessment</p>
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-lg">{analysisData.damageAssessment.score.toFixed(1)}</p>
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-md">
                          <p className="text-sm text-gray-500 mb-1">3D Model Analysis</p>
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-lg">8.5</p>
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                              <Layers className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mb-6">
                        <h3 className="font-bold text-lg mb-3">Key Findings</h3>
                        <ul className="space-y-2">
                          {analysisData.keyFindings.map((finding, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <CheckSquare className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                              <span>{finding}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-6 bg-green-50 rounded-md border border-green-200 mb-6">
                        <h3 className="text-xl font-bold text-green-800 mb-3 flex items-center">
                          <Lightbulb className="h-6 w-6 mr-2" />
                          Recommendation
                        </h3>
                        <p className="text-green-800 text-lg mb-4">{analysisData.recommendation}</p>
                        <p className="text-green-700">
                          This claim appears to be valid with consistent documentation and evidence. The car model has
                          been verified, and the damage is consistent with the reported incident. However, some damage
                          severity levels appear to be overestimated. We recommend approving the claim with an adjusted
                          payout that reflects the actual damage severity.
                        </p>
                      </div>

                      {canApproveOrReject() && (
                        <div className="flex gap-3 justify-center">
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
              </div>
            )}

            {/* Document Verification Tab */}
            {activeSection === "documents" && (
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-6">
                  <h2 className="text-xl font-bold">Document Verification</h2>
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    Score: {analysisData.documentVerification.score.toFixed(1)}/10
                  </span>
                </div>

                {!documentVerificationComplete ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin text-gray-400 mb-6" />
                    <h3 className="text-lg font-medium mb-2">Processing Documents</h3>
                    <p className="text-gray-500 text-center max-w-md">
                      Our AI is analyzing the claim documents to extract and verify information. This may take a
                      moment...
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <h3 className="font-bold text-lg mb-3">Information Consistency Check</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border p-2 text-left">Information</th>
                              <th className="border p-2 text-left">Policy Form</th>
                              <th className="border p-2 text-left">Car Grant</th>
                              <th className="border p-2 text-left">Police Report</th>
                              <th className="border p-2 text-left">Match</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border p-2 font-medium">Car Model</td>
                              <td className="border p-2">{analysisData.documentVerification.carModel.policyForm}</td>
                              <td className="border p-2">{analysisData.documentVerification.carModel.carGrant}</td>
                              <td className="border p-2">{analysisData.documentVerification.carModel.policeReport}</td>
                              <td className="border p-2">
                                {analysisData.documentVerification.carModel.match ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                  <AlertCircle className="h-5 w-5 text-red-500" />
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td className="border p-2 font-medium">Owner Name</td>
                              <td className="border p-2">{analysisData.documentVerification.ownerName.policyForm}</td>
                              <td className="border p-2">{analysisData.documentVerification.ownerName.carGrant}</td>
                              <td className="border p-2">{analysisData.documentVerification.ownerName.policeReport}</td>
                              <td className="border p-2">
                                {analysisData.documentVerification.ownerName.match ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                  <AlertCircle className="h-5 w-5 text-red-500" />
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td className="border p-2 font-medium">Incident Date</td>
                              <td className="border p-2">
                                {analysisData.documentVerification.incidentDate.policyForm}
                              </td>
                              <td className="border p-2">-</td>
                              <td className="border p-2">
                                {analysisData.documentVerification.incidentDate.policeReport}
                              </td>
                              <td className="border p-2">
                                {analysisData.documentVerification.incidentDate.match ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                  <AlertCircle className="h-5 w-5 text-red-500" />
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="font-bold mb-2">Policy Validity Check</h3>
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-sm font-medium">Policy Maturity Date:</p>
                          <p>{analysisData.documentVerification.policyMaturity.date}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">Status:</p>
                          {analysisData.documentVerification.policyMaturity.isValid ? (
                            <span className="text-green-600 flex items-center">
                              <CheckCircle className="h-4 w-4 mr-1" /> Valid
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center">
                              <AlertCircle className="h-4 w-4 mr-1" /> Expired
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="font-bold mb-2">Document Authenticity</h3>
                        <div className="space-y-2">
                          {documents.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-500" />
                                <span>
                                  {doc.doc_type
                                    .split("_")
                                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                    .join(" ")}
                                </span>
                              </div>
                              <span className="text-green-600 flex items-center">
                                <CheckCircle className="h-4 w-4 mr-1" /> Authentic
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-md border border-blue-200 mt-6">
                      <h3 className="font-bold text-blue-800 mb-2 flex items-center">
                        <Info className="h-4 w-4 mr-2" />
                        Document Verification Summary
                      </h3>
                      <p className="text-blue-800">
                        {analysisData.documentVerification.carModel.match &&
                        analysisData.documentVerification.ownerName.match &&
                        analysisData.documentVerification.policyMaturity.isValid
                          ? "All documents are consistent and authentic. The car model, owner information, and incident dates match across all submitted documents. The insurance policy is valid and covers the incident date."
                          : "There are some inconsistencies in the documents. Please review the information carefully before proceeding."}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Car Model Identification Tab */}
            {activeSection === "car-model" && (
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-6">
                  <h2 className="text-xl font-bold">Car Model Identification</h2>
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    Score: {analysisData.carModelIdentification.score.toFixed(1)}/10
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="font-bold mb-3">Model Comparison</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Claimed Model</p>
                          <p className="font-bold text-lg">{analysisData.carModelIdentification.claimedModel}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Detected Model</p>
                          {loading ? (
                            <p className="text-sm text-gray-600 italic">Analyzing...</p>
                          ) : analysisData.carModelIdentification.detectedModel ? (
                            <p className="font-bold text-lg">{analysisData.carModelIdentification.detectedModel}</p>
                          ) : (
                            <p className="text-sm text-gray-400">Not available</p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Confidence</p>
                          {loading ? (
                            <p className="text-sm text-gray-600 italic">Processing...</p>
                          ) : analysisData.carModelIdentification.confidence !== null ? (
                            <p className="font-bold text-lg">{(analysisData.carModelIdentification.confidence * 100).toFixed(1)}%</p>
                          ) : (
                            <p className="text-sm text-gray-400">Not available</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold mb-3">Image Analysis</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {images.slice(0, 4).map((img, index) => (
                        <div key={index} className="border rounded-md overflow-hidden">
                          <img
                            src={img.file_url || "/placeholder.svg"}
                            alt={`Car image ${index + 1}`}
                            className="w-full h-32 object-cover"
                          />
                          <div className="p-2 bg-gray-50">
                            <p className="text-xs text-center">
                              {index === 0
                                ? "Front View"
                                : index === 1
                                  ? "Side View"
                                  : index === 2
                                    ? "Rear View"
                                    : "Interior"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-md mb-4">
                  <h3 className="font-bold mb-2">Key Features Identified</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: "95%" }}></div>
                      </div>
                      <p className="text-xs text-center">Body Shape</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: "92%" }}></div>
                      </div>
                      <p className="text-xs text-center">Headlights</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: "97%" }}></div>
                      </div>
                      <p className="text-xs text-center">Grille</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: "90%" }}></div>
                      </div>
                      <p className="text-xs text-center">Wheels</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
                  <h3 className="font-bold text-blue-800 mb-2 flex items-center">
                    <Info className="h-4 w-4 mr-2" />
                    Car Model Identification Summary
                  </h3>
                  <p className="text-blue-800">
                    The car model in the images has been identified as a{" "}
                    {analysisData.carModelIdentification.detectedModel} with{" "}
                    {(analysisData.carModelIdentification.confidence * 100).toFixed(0)}% confidence, which
                    {analysisData.carModelIdentification.match ? " matches" : " does not match"} the claimed model in
                    the documents. All key features of the {analysisData.carModelIdentification.detectedModel} have been
                    identified in the images.
                  </p>
                </div>
              </div>
            )}

            {/* Damage Assessment Tab */}
            {activeSection === "damage" && (
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-6">
                  <h2 className="text-xl font-bold">Damage Assessment</h2>
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    Score: {analysisData.damageAssessment.score.toFixed(1)}/10
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {analysisData.damageAssessment.parts.map((part, index) => (
                    <div key={index} className="border rounded-md overflow-hidden">
                      <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
                        <h3 className="font-bold">{part.name}</h3>
                        {part.match ? (
                          <span className="text-green-600 flex items-center text-sm">
                            <CheckCircle className="h-4 w-4 mr-1" /> Verified
                          </span>
                        ) : (
                          <span className="text-amber-600 flex items-center text-sm">
                            <AlertCircle className="h-4 w-4 mr-1" /> Discrepancy
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2">
                        <div className="aspect-square relative">
                          <img
                            src={images[index]?.file_url || "/placeholder.svg"}
                            alt={`Damage to ${part.name}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-1 text-xs text-center">
                            {part.name}
                          </div>
                        </div>
                        <div className="p-3">
                          <div className="mb-3">
                            <p className="text-sm text-gray-500 mb-1">Claimed Severity</p>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                part.claimedSeverity === "severe"
                                  ? "bg-red-100 text-red-800"
                                  : part.claimedSeverity === "moderate"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {part.claimedSeverity.charAt(0).toUpperCase() + part.claimedSeverity.slice(1)}
                            </span>
                          </div>
                          <div className="mb-3">
                            <p className="text-sm text-gray-500 mb-1">Assessed Severity</p>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                part.assessedSeverity === "severe"
                                  ? "bg-red-100 text-red-800"
                                  : part.assessedSeverity === "moderate"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {part.assessedSeverity.charAt(0).toUpperCase() + part.assessedSeverity.slice(1)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Confidence</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className="bg-blue-600 h-1.5 rounded-full"
                                    style={{ width: `${part.confidence * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                              <span className="text-xs font-medium">{(part.confidence * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
                  <h3 className="font-bold text-blue-800 mb-2 flex items-center">
                    <Info className="h-4 w-4 mr-2" />
                    Damage Assessment Summary
                  </h3>
                  <p className="text-blue-800">
                    The damage assessment shows that 2 out of 4 parts have severity levels that match the claimed
                    severity. The front bumper and hood damage are accurately reported, while the left headlight and
                    front left fender damage appear to be less severe than claimed. Overall, the damage is consistent
                    with a frontal collision.
                  </p>
                </div>
              </div>
            )}

            {/* Recommendation Tab */}
            {activeSection === "recommendation" && (
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-6">
                  <h2 className="text-xl font-bold">Overall Score & Recommendation</h2>
                  <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    Score: {analysisData.overallScore.toFixed(1)}/10
                  </span>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-3xl font-bold text-green-700">{analysisData.overallScore.toFixed(1)}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">Claim Assessment Score</h3>
                    <p className="text-gray-600">
                      This claim has received a score of {analysisData.overallScore.toFixed(1)} out of 10, indicating a
                      high likelihood of validity.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-500 mb-1">Document Verification</p>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-lg">{analysisData.documentVerification.score.toFixed(1)}</p>
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <FileCheck className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-500 mb-1">Car Model Identification</p>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-lg">{analysisData.carModelIdentification.score.toFixed(1)}</p>
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Car className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-500 mb-1">Damage Assessment</p>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-lg">{analysisData.damageAssessment.score.toFixed(1)}</p>
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-500 mb-1">3D Model Analysis</p>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-lg">8.5</p>
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Layers className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-bold text-lg mb-3">Key Findings</h3>
                  <ul className="space-y-2">
                    {analysisData.keyFindings.map((finding, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckSquare className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-6 bg-green-50 rounded-md border border-green-200 mb-6">
                  <h3 className="text-xl font-bold text-green-800 mb-3 flex items-center">
                    <Lightbulb className="h-6 w-6 mr-2" />
                    Recommendation
                  </h3>
                  <p className="text-green-800 text-lg mb-4">{analysisData.recommendation}</p>
                  <p className="text-green-700">
                    This claim appears to be valid with consistent documentation and evidence. The car model has been
                    verified, and the damage is consistent with the reported incident. However, some damage severity
                    levels appear to be overestimated. We recommend approving the claim with an adjusted payout that
                    reflects the actual damage severity.
                  </p>
                </div>

                {canApproveOrReject() && (
                  <div className="flex gap-3 justify-center">
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
        </div>
      </div>

      <Footer />
      {/* Damage Analysis Modal */}
      <dialog id="damage-analysis-modal" className="modal modal-bottom sm:modal-middle w-full h-full max-w-none">
        <div className="modal-box max-w-none w-[95vw] h-[90vh] p-0 bg-white rounded-lg shadow-2xl">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="font-bold text-xl text-gray-800">3D Damage Analysis</h3>
            <button
              className="btn btn-sm btn-circle btn-ghost hover:bg-gray-200"
              onClick={() => {
                const modal = document.getElementById("damage-analysis-modal") as HTMLDialogElement
                if (modal) modal.close()
              }}
            >
              ✕
            </button>
          </div>

          <div className="h-[calc(90vh-120px)] bg-black">
            <DamageAnalysis />
          </div>

          <div className="p-4 border-t bg-gray-50">
            <button
              className="btn btn-primary"
              onClick={() => {
                const modal = document.getElementById("damage-analysis-modal") as HTMLDialogElement
                if (modal) modal.close()
              }}
            >
              Back to Claim
            </button>
          </div>
        </div>
      </dialog>
    </div>
  )
}
