// API client for communicating with the backend
class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  }

  private async request<T = unknown>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  // Claims endpoints
  async getClaims(status?: string) {
    const queryParams = status ? `?status=${encodeURIComponent(status)}` : "";
    return this.request(`/api/claims${queryParams}`);
  }

  async createClaim(data: { name: string; status: string }) {
    return this.request("/api/claims", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getClaim(id: string) {
    return this.request(`/api/claims/${id}`);
  }

  async updateClaim(id: string, data: Partial<{ name: string; status: string; claim_score: number }>) {
    return this.request(`/api/claims/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteClaim(id: string) {
    return this.request(`/api/claims/${id}`, {
      method: "DELETE",
    });
  }

  // Documents endpoints
  async getDocuments(claimId: string) {
    return this.request(`/api/documents?claim_id=${claimId}`);
  }

  async createDocument(data: {
    claim_id: number;
    doc_type: string;
    file_url: string;
  }) {
    return this.request("/api/documents", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Images endpoints
  async getImages(claimId: string) {
    return this.request(`/api/images?claim_id=${claimId}`);
  }

  async createImage(data: {
    claim_id: number;
    file_url: string;
    part?: string;
    severity?: string;
  }) {
    return this.request("/api/images", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Videos endpoints
  async getVideos(claimId: string) {
    return this.request(`/api/videos?claim_id=${claimId}`);
  }

  async createVideo(data: {
    claim_id: number;
    file_url: string;
    model_status?: string;
  }) {
    return this.request("/api/videos", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // File upload
  async uploadFile(formData: FormData) {
    return this.request("/api/upload", {
      method: "POST",
      headers: {}, // Don't set Content-Type for FormData
      body: formData,
    });
  }

  // OCR endpoint
  async performOcr(data: { imageBase64: string }) {
    return this.request("/api/ocr", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async performOcrTest(data: { imageBase64: string }) {
    return this.request("/api/ocr/test", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // LLM query endpoint
  async queryLlm(data: { input: string }) {
    return this.request("/api/llm-query", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Get file URL
  getFileUrl(type: string, name: string): string {
    return `${this.baseUrl}/api/files/${type}/${name}`;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
