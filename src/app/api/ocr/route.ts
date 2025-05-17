import { NextResponse } from "next/server"
import pool from '@/lib/aspara-db' // Replace supabaseClient with pool
import OpenAI from "openai"
import path from "path"
import sharp from "sharp"
import { promises as fs } from "fs"
import os from "os"

export const maxDuration = 60

// OpenAI client initialization
const openai = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY!,
  baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
})

async function pdfPageToImageBase64(pdfBuffer: Buffer, pageNumber: number): Promise<string> {
  try {
    // Import PDFDocument only when needed
    const { PDFDocument } = await import('pdf-lib');
    
    // Create a temporary directory for processing
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `pdf-page-${pageNumber}-`))
    
    try {
      console.log(`Converting page ${pageNumber} to image...`)
      
      // Use pdf-lib to extract the specific page
      const pdfDoc = await PDFDocument.load(pdfBuffer)
      const subDocument = await PDFDocument.create()
      const [copiedPage] = await subDocument.copyPages(pdfDoc, [pageNumber - 1])
      subDocument.addPage(copiedPage)
      const singlePagePdfBytes = await subDocument.save()
      
      // Create a placeholder image using sharp
      const placeholderBuffer = await sharp({
        create: {
          width: 800,
          height: 1200,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
      })
      .composite([{
        input: Buffer.from(`<PDF Page ${pageNumber} - Text extraction in progress>`),
        gravity: 'center'
      }])
      .png()
      .toBuffer()
      
      return `data:image/png;base64,${placeholderBuffer.toString('base64')}`
    } finally {
      // Clean up
      await fs.rm(tmpDir, { recursive: true, force: true })
        .catch(e => console.warn(`Failed to clean up temp dir ${tmpDir}:`, e))
    }
  } catch (error) {
    console.error(`Error converting PDF page ${pageNumber} to image:`, error)
    throw error
  }
}

// OCR function - directly use the PDF text for now
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
              text: "Extract text from images efficiently",
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
              text: "Extract all text content and return them in a clean format please. Do not give further explanations.",
            },
          ],
        },
      ],
    })

    return response.choices[0].message.content || ""
  } catch (error) {
    console.error("OCR error:", error)
    return "OCR processing failed - using fallback text extraction instead"
  }
}

// Extract text directly using pdf-parse as a fallback
async function processPdfDocument(fileUrl: string): Promise<string> {
  try {
    // Import pdf-parse only when needed
    const pdf = (await import('pdf-parse')).default;
    
    console.log(`Fetching PDF from ${fileUrl}`)
    const response = await fetch(fileUrl)
    if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.statusText}`)

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    console.log(`Downloaded PDF, size: ${buffer.length} bytes`)

    // Use pdf-parse to extract text directly - simpler approach
    const pdfData = await pdf(buffer)
    console.log(`Extracted ${pdfData.text.length} characters of text directly from PDF`)
    
    // If text is too short, try OCR on one page as fallback
    if (pdfData.text.length < 100 && pdfData.numpages > 0) {
      try {
        console.log("Text extraction yielded little text, trying OCR on first page...")
        const imageBase64 = await pdfPageToImageBase64(buffer, 1)
        const ocrText = await performOCR(imageBase64)
        if (ocrText && ocrText.length > pdfData.text.length) {
          return ocrText
        }
      } catch (err) {
        console.error("OCR fallback failed:", err)
      }
    }
    
    return pdfData.text || "No text could be extracted from the document"
  } catch (error) {
    console.error("PDF processing error:", error)
    return "Failed to process PDF document"
  }
}

// Process claim function
async function processClaim(claimId: number) {
  // Add timeout protection
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Processing timed out")), 55000) // 55s to allow for cleanup
  })

  const processingPromise = (async () => {
    // Changed from Supabase to AsparaDB query
    const documentsResult = await pool.query(
      'SELECT * FROM documents WHERE claim_id = $1',
      [claimId]
    );
    const documents = documentsResult.rows;

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

        console.log(`Text extraction result for ${docType}:\n${extractedText.substring(0, 500)}...`) // limit to first 500 chars

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

    // Changed from Supabase to AsparaDB update
    try {
      await pool.query(
        'UPDATE claims SET text_police = $1, text_grant = $2, text_policy = $3, processed_at = $4 WHERE id = $5',
        [
          textPolice || null,
          textGrant || null,
          textPolicy || null,
          new Date().toISOString(),
          claimId
        ]
      );
    } catch (updateError) {
      throw new Error(`Failed to update claim with OCR results: ${updateError instanceof Error ? updateError.message : String(updateError)}`)
    }

    console.log(`Successfully updated claim ${claimId} with OCR results.`)
    return true
  })()

  // Race between processing and timeout
  return Promise.race([processingPromise, timeoutPromise])
}

async function processClaimWithImages(claimId: number, documentImages: Record<string, string[]>) {
  // Increase timeout for larger documents - adjust based on your environment limits
  const MAX_PROCESSING_TIME = 180000; // 3 minutes
  const BATCH_SIZE = 5; // Process 5 images at a time
  
  // Add timeout protection
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Processing timed out")), MAX_PROCESSING_TIME)
  });

  const processingPromise = (async () => {
    console.log(`Processing claim ${claimId} with pre-converted images`);
    
    // Initialize result texts
    let textPolice = "";
    let textGrant = "";
    let textPolicy = "";
    
    // Process each document type
    for (const [docType, images] of Object.entries(documentImages)) {
      if (!images || images.length === 0) continue;
      
      console.log(`Processing ${images.length} ${docType} images`);
      const texts: string[] = [];
      let processedCount = 0;
      
      // Process images in batches
      for (let i = 0; i < images.length; i += BATCH_SIZE) {
        const batch = images.slice(i, i + BATCH_SIZE);
        console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(images.length/BATCH_SIZE)} for ${docType}`);
        
        // Process batch in parallel
        const batchResults = await Promise.allSettled(
          batch.map(async (imageBase64, index) => {
            try {
              const pageText = await performOCR(imageBase64);
              return { success: true, text: pageText, index: i + index };
            } catch (err) {
              console.error(`Error processing image ${i + index} for ${docType}:`, err);
              return { success: false, index: i + index, error: err };
            }
          })
        );
        
        // Add successful results to texts array
        batchResults.forEach(result => {
          if (result.status === 'fulfilled' && result.value.success) {
            texts[result.value.index] = result.value.text || '';
            processedCount++;
          }
        });
        
        // Update progress
        console.log(`Processed ${processedCount}/${images.length} images for ${docType}`);
        
        // Save partial results periodically, every 2 batches
        if ((i/BATCH_SIZE) % 2 === 1 || i + BATCH_SIZE >= images.length) {
          try {
            const partialText = texts.filter(Boolean).join("\n\n");
            
            // Create query and parameters based on document type
            let queryText = 'UPDATE claims SET processed_at = $1';
            const queryParams: any[] = [new Date().toISOString()];
            
            if (docType === 'police_report') {
              queryText += ', text_police = $2';
              queryParams.push(partialText || null);
            } else if (docType === 'car_grant') {
              queryText += ', text_grant = $2';
              queryParams.push(partialText || null);
            } else if (docType === 'insurance_form') {
              queryText += ', text_policy = $2';
              queryParams.push(partialText || null);
            }
            
            queryText += ' WHERE id = $' + (queryParams.length + 1);
            queryParams.push(claimId);
            
            // Changed from Supabase to AsparaDB update
            await pool.query(queryText, queryParams);
            console.log(`Saved partial results for ${docType} (${processedCount}/${images.length} images processed)`);
          } catch (err) {
            console.warn(`Warning: Error saving partial results:`, err);
          }
        }
      }
      
      // Compile final text for this document type
      const finalText = texts.filter(Boolean).join("\n\n");
      
      // Assign to appropriate variable
      if (docType === 'police_report') textPolice = finalText;
      else if (docType === 'car_grant') textGrant = finalText;
      else if (docType === 'insurance_form') textPolicy = finalText;
    }

    // Final update to the claim in the database - changed from Supabase to AsparaDB
    try {
      await pool.query(
        'UPDATE claims SET text_police = $1, text_grant = $2, text_policy = $3, processed_at = $4 WHERE id = $5',
        [
          textPolice || null,
          textGrant || null,
          textPolicy || null,
          new Date().toISOString(),
          claimId
        ]
      );
    } catch (updateError) {
      throw new Error(`Failed to update claim with OCR results: ${updateError instanceof Error ? updateError.message : String(updateError)}`);
    }

    console.log(`Successfully updated claim ${claimId} with OCR results from pre-converted images.`);
    return true;
  })();

  // Race between processing and timeout
  return Promise.race([processingPromise, timeoutPromise]);
}

// POST function
export async function POST(req: Request) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (err) {
      console.error("Failed to parse request JSON:", err);
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }
    
    // Check if we have pre-converted document images
    if (body.claimId && body.documentImages) {
      console.log(`Processing claim ${body.claimId} with pre-converted images`);
      try {
        await processClaimWithImages(body.claimId, body.documentImages);
        
        return NextResponse.json({
          success: true,
          message: "Document processing completed with pre-converted images",
        });
      } catch (imageError) {
        console.error("Error processing images:", imageError);
        return NextResponse.json({
          error: typeof imageError === "object" && imageError !== null && "message" in imageError
            ? (imageError as { message?: string }).message || "Failed to process images"
            : "Failed to process images",
          status: "error",
        }, { status: 500 });
      }
    }
    
    // Original flow if no pre-converted images
    const { claimId } = body;
    if (!claimId) {
      return NextResponse.json({ error: "Claim ID is required" }, { status: 400 });
    }

    await processClaim(claimId);

    return NextResponse.json({
      success: true,
      message: "Document processing completed",
    });
  } catch (error: any) {
    console.error("Route error:", error);

    // Check if we're hitting the timeout
    if (error.message === "Processing timed out") {
      return NextResponse.json(
        {
          error: "Processing timed out, please try again with fewer documents",
          status: "timeout",
        },
        { status: 504 },
      );
    }

    return NextResponse.json(
      {
        error: error.message || "Server error",
        status: "error",
      },
      { status: 500 },
    );
  }
}