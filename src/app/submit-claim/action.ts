// actions.ts

export async function triggerDocumentProcessing(claimId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ocr`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ claimId }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Error triggering document processing:", errorData)
      return { success: false, error: errorData.error }
    }

    return { success: true }
  } catch (error) {
    console.error("Error triggering document processing:", error)
    return { success: false, error: "Failed to trigger document processing" }
  }
}
