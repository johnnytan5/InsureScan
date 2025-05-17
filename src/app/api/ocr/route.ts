import { NextResponse } from "next/server"
import { supabaseClient } from "@/lib/supabaseClient"
import { fromBuffer } from "pdf2pic"
import OpenAI from "openai"
import path from "path"
import sharp from "sharp"
import { promises as fs } from "fs"
import { execFile } from "child_process"
import { promisify } from "util"
import os from "os"

const execFileAsync = promisify(execFile)

export const maxDuration = 60

// Fix OpenAI client initialization
const openai = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY!,
  baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
})

// Add this function at the beginning of your file
async function checkDependencies() {
  try {
    await execFileAsync("pdftoppm", ["-v"])
    await execFileAsync("pdfinfo", ["-v"])
    console.log("PDF processing dependencies are available")
    return true
  } catch (error) {
    console.error("PDF processing dependencies are missing:", error)
    return false
  }
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  switch (ext) {
    case ".png":
      return "image/png"
    case ".jpg":
    case ".jpeg":
      return "image/jpeg"
    case ".webp":
      return "image/webp"
    case ".bmp":
      return "image/bmp"
    default:
      return "application/octet-stream"
  }
}

async function imageBufferToBase64(buffer: Buffer, mimeType: string): Promise<string> {
  const base64 = buffer.toString("base64")
  return `data:${mimeType};base64,${base64}`
}

async function pdfPageToImageBase64(pdfBuffer: Buffer, pageNumber: number): Promise<string> {
  try {
    // Use pdf2pic with proper error handling
    const convert = fromBuffer(pdfBuffer, {
      density: 150,
      format: "png",
      width: 1200,
      height: 1600,
    })

    const result = await convert(pageNumber, false)

    if (!result || !result.content) {
      throw new Error(`Failed to convert page ${pageNumber} to image`)
    }

    // Optimize the image with sharp to reduce size
    const optimizedBuffer = await sharp(result.content)
      .resize(1200, null, { fit: "inside" })
      .png({ quality: 80 })
      .toBuffer()

    return await imageBufferToBase64(optimizedBuffer, "image/png")
  } catch (error) {
    console.error(`Error converting PDF page ${pageNumber} to image:`, error)
    throw error
  }
}

async function performOCR(base64ImageUrl: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "qwen-vl-max",
      messages: [
        {
          role: "system",
          content: [
            {
              type: "text",
              text: "You are a helpful assistant.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: base64ImageUrl },
            },
            {
              type: "text",
              text: "Extract all text and return them in a clean format please. Extract driver information",
            },
          ],
        },
      ],
    })

    return response.choices[0].message.content || ""
  } catch (error) {
    console.error("OCR error:", error)
    throw new Error(`OCR processing failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

async function processPdfDocument(fileUrl: string): Promise<string> {
  try {
    const response = await fetch(fileUrl)
    if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.statusText}`)

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Create a temporary directory for the PDF
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "pdf-info-"))
    const inputPdfPath = path.join(tmpDir, "input.pdf")

    try {
      // Write the PDF to a temporary file
      await fs.writeFile(inputPdfPath, buffer)

      // Get the number of pages using pdfinfo
      const { stdout } = await execFileAsync("pdfinfo", [inputPdfPath])
      const pagesMatch = stdout.match(/Pages:\s+(\d+)/)
      const numPages = pagesMatch ? Number.parseInt(pagesMatch[1], 10) : 1

      console.log(`Processing PDF with ${numPages} page(s)`)

      const pageTexts = []

      // Process each page, but limit to a reasonable number to avoid timeouts
      const pagesToProcess = Math.min(numPages, 5) // Process at most 5 pages

      for (let i = 0; i < pagesToProcess; i++) {
        try {
          const imageBase64 = await pdfPageToImageBase64(buffer, i + 1)
          const extractedText = await performOCR(imageBase64)
          if (extractedText) {
            pageTexts.push(extractedText)
          }
        } catch (error) {
          console.error(`Error processing page ${i + 1}:`, error)
        }
      }

      return pageTexts.filter(Boolean).join("\n\n").trim()
    } finally {
      // Clean up the temporary directory
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
    }
  } catch (error) {
    console.error("PDF processing error:", error)
    throw new Error(`PDF processing failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

async function processClaim(claimId: number) {
  // Add timeout protection
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Processing timed out")), 55000) // 55s to allow for cleanup
  })

  const processingPromise = (async () => {
    const { data: documents, error: documentsError } = await supabaseClient
      .from("documents")
      .select("*")
      .eq("claim_id", claimId)

    if (documentsError) {
      throw new Error(`Error fetching documents: ${documentsError.message}`)
    }

    if (!documents?.length) {
      throw new Error(`No documents found for claim ID: ${claimId}`)
    }

    console.log(`Fetched ${documents.length} documents for claim ID: ${claimId}`)

    let textPolice = ""
    let textGrant = ""
    let textPolicy = ""

    // Process documents sequentially to avoid memory issues
    for (const doc of documents) {
      const { doc_type: docType, file_url: fileUrl } = doc
      console.log(`Processing document type: ${docType}, file URL: ${fileUrl}`)

      if (!fileUrl || !fileUrl.toLowerCase().endsWith(".pdf")) {
        console.log(`Skipping non-PDF or invalid file: ${fileUrl}`)
        continue
      }

      try {
        const extractedText = await processPdfDocument(fileUrl)

        if (!extractedText) {
          console.warn(`No text extracted from ${docType} at ${fileUrl}`)
          continue
        }

        console.log(`OCR result for ${docType}:\n${extractedText.substring(0, 500)}...`) // limit to first 500 chars

        if (docType === "police_report") {
          textPolice = extractedText
        } else if (docType === "car_grant") {
          textGrant = extractedText
        } else if (docType === "insurance_form") {
          textPolicy = extractedText
        } else {
          console.warn(`Unknown doc type: ${docType}, skipping storage`)
        }
      } catch (error) {
        console.error(`Error processing document ${docType}:`, error)
        // Continue with other documents even if one fails
      }
    }

    const { error: updateError } = await supabaseClient
      .from("claims")
      .update({
        text_police: textPolice || null,
        text_grant: textGrant || null,
        text_policy: textPolicy || null,
        processed_at: new Date().toISOString(),
      })
      .eq("id", claimId)

    if (updateError) {
      throw new Error(`Failed to update claim with OCR results: ${updateError.message}`)
    }

    console.log(`Successfully updated claim ${claimId} with OCR results.`)
    return true
  })()

  // Race between processing and timeout
  return Promise.race([processingPromise, timeoutPromise])
}

export async function POST(req: Request) {
  try {
    const dependenciesAvailable = await checkDependencies()
    if (!dependenciesAvailable) {
      return NextResponse.json(
        { error: "PDF processing dependencies are not available on the server" },
        { status: 500 },
      )
    }

    const { claimId } = await req.json()

    if (!claimId) {
      return NextResponse.json({ error: "Claim ID is required" }, { status: 400 })
    }

    await processClaim(claimId)

    return NextResponse.json({
      success: true,
      message: "Document processing completed",
    })
  } catch (error: any) {
    console.error("Route error:", error)

    // Check if we're hitting the timeout
    if (error.message === "Processing timed out") {
      return NextResponse.json(
        {
          error: "Processing timed out, please try again with fewer documents",
          status: "timeout",
        },
        { status: 504 },
      )
    }

    return NextResponse.json(
      {
        error: error.message || "Server error",
        status: "error",
      },
      { status: 500 },
    )
  }
}
