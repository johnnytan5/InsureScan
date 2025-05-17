// // actions.ts

// export async function triggerDocumentProcessing(claimId: number): Promise<{ success: boolean; error?: string }> {
//   try {
//     const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ocr`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ claimId }),
//     })

//     if (!response.ok) {
//       const errorData = await response.json()
//       console.error("Error triggering document processing:", errorData)
//       return { success: false, error: errorData.error }
//     }

//     return { success: true }
//   } catch (error) {
//     console.error("Error triggering document processing:", error)
//     return { success: false, error: "Failed to trigger document processing" }
//   }
// }

// actions.ts

export async function triggerDocumentProcessing(
  claimId: number, 
  documentImages?: Record<string, string[]>
): Promise<{ success: boolean; error?: string }> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/ocr` 
      : '/api/ocr';
      
    console.log(`Submitting to OCR API at: ${apiUrl}`, 
                documentImages ? `with ${Object.keys(documentImages).length} document types` : 'without pre-converted images');
    
    // If we have pre-converted images, include them in the request
    const requestBody = documentImages 
      ? { claimId, documentImages }
      : { claimId };
    
    // Add timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 100 second timeout
    
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
  
      // Check if response is JSON by looking at content-type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Try to extract error message from text for better debugging
        const text = await response.text();
        console.error("Error: Non-JSON response received:", text.substring(0, 200) + "...");
        
        // If we're in development, provide more detailed error info
        return { 
          success: false, 
          error: `Server returned non-JSON response (${response.status}: ${response.statusText})` 
        };
      }
  
      const data = await response.json();
      
      if (!response.ok) {
        console.error("Error response from OCR API:", data);
        return { success: false, error: data.error || `Error ${response.status}: ${response.statusText}` };
      }
  
      return { success: true };
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error("Error triggering document processing:", error);
    
    // Handling specific error types for better feedback
    if (error instanceof Error && (error as any).name === 'AbortError') {
      return { success: false, error: "Request timed out" };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to trigger document processing" 
    };
  }
}