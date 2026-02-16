# API Testing Guide

This guide provides examples for testing the InsureScan API endpoints.

## Prerequisites

Ensure all services are running:

- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Python ML Services: http://localhost:8000

## Health Checks

### Backend Health Check

```powershell
Invoke-WebRequest -Uri http://localhost:3001/health | ConvertFrom-Json
```

Expected response:

```json
{
  "status": "OK",
  "timestamp": "2026-02-16T06:56:28.761063"
}
```

### Python Services Health Check

```powershell
Invoke-WebRequest -Uri http://localhost:8000/health | ConvertFrom-Json
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2026-02-16T06:56:28.761063",
  "python_version": "3.11.9 ..."
}
```

### ML Services Health Check (via Backend)

```powershell
Invoke-WebRequest -Uri http://localhost:3001/api/ml/health | ConvertFrom-Json
```

## Claims API

### Get All Claims

```powershell
Invoke-WebRequest -Uri http://localhost:3001/api/claims | ConvertFrom-Json
```

### Create a New Claim

```powershell
$body = @{
    claimNumber = "CLM-2024-001"
    policyNumber = "POL-12345"
    claimantName = "John Doe"
    incidentDate = "2024-02-15"
    claimAmount = 5000
    status = "pending"
    description = "Vehicle damage from collision"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:3001/api/claims `
    -Method POST `
    -ContentType "application/json" `
    -Body $body | ConvertFrom-Json
```

### Get Claim by ID

```powershell
Invoke-WebRequest -Uri http://localhost:3001/api/claims/1 | ConvertFrom-Json
```

### Update a Claim

```powershell
$body = @{
    status = "approved"
    claimAmount = 4500
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:3001/api/claims/1 `
    -Method PUT `
    -ContentType "application/json" `
    -Body $body | ConvertFrom-Json
```

### Delete a Claim

```powershell
Invoke-WebRequest -Uri http://localhost:3001/api/claims/1 `
    -Method DELETE | ConvertFrom-Json
```

## File Upload API

### Upload an Image

```powershell
$imagePath = "C:\path\to\image.jpg"
$uri = "http://localhost:3001/api/upload"

# Create multipart form data
$boundary = [System.Guid]::NewGuid().ToString()
$LF = "`r`n"

$bodyLines = (
    "--$boundary",
    "Content-Disposition: form-data; name=`"file`"; filename=`"image.jpg`"",
    "Content-Type: image/jpeg$LF",
    [System.IO.File]::ReadAllText($imagePath),
    "--$boundary--$LF"
) -join $LF

Invoke-WebRequest -Uri $uri `
    -Method POST `
    -ContentType "multipart/form-data; boundary=$boundary" `
    -Body $bodyLines
```

Or use WebRequest with InFile (easier):

```powershell
# Note: You'll need to use curl or a proper HTTP client for file uploads
# PowerShell's Invoke-WebRequest doesn't handle multipart file uploads well

# Using curl (if installed)
curl -X POST http://localhost:3001/api/upload `
    -F "file=@C:\path\to\image.jpg"
```

## ML/AI Endpoints

### OCR Processing

```powershell
# Upload an image for OCR
curl -X POST http://localhost:3001/api/ocr `
    -F "file=@C:\path\to\document.jpg"
```

Expected response:

```json
{
  "text": "Extracted text from image...",
  "confidence": 0.95
}
```

### Damage Detection

```powershell
curl -X POST http://localhost:3001/api/ml/detect-damage `
    -F "file=@C:\path\to\damaged-car.jpg"
```

Expected response:

```json
{
  "damage_detected": true,
  "confidence": 0.92,
  "damage_locations": [
    {
      "type": "dent",
      "location": "front_bumper",
      "bbox": [100, 200, 300, 400],
      "confidence": 0.89
    }
  ],
  "processing_time_ms": 156
}
```

### Assess Damage Severity

```powershell
curl -X POST http://localhost:3001/api/ml/assess-severity `
    -F "file=@C:\path\to\damaged-car.jpg" `
    -F "damage_type=collision"
```

Expected response:

```json
{
  "severity": "moderate",
  "severity_score": 6.5,
  "estimated_repair_cost": 2500,
  "damage_areas": ["front_bumper", "hood", "headlight"],
  "processing_time_ms": 234
}
```

### Enhance Image

```powershell
curl -X POST http://localhost:3001/api/ml/enhance-image `
    -F "file=@C:\path\to\low-quality.jpg" `
    -F "enhancement_type=sharpen"
```

Response: Enhanced image as binary data

### Video Analysis

```powershell
curl -X POST http://localhost:3001/api/ml/analyze-video `
    -F "file=@C:\path\to\incident-video.mp4"
```

Expected response:

```json
{
  "total_frames": 300,
  "analyzed_frames": 30,
  "damage_detected": true,
  "key_frames": [45, 89, 156],
  "summary": "Vehicle collision captured in frames 45-89",
  "processing_time_ms": 5678
}
```

### Fraud Detection Analysis

```powershell
$body = @{
    claim_id = "CLM-2024-001"
    claimant_name = "John Doe"
    incident_date = "2024-02-15"
    claim_amount = 5000
    description = "Vehicle damage from collision"
    images = @("image1.jpg", "image2.jpg")
    previous_claims = 2
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:3001/api/ml/analyze-fraud `
    -Method POST `
    -ContentType "application/json" `
    -Body $body | ConvertFrom-Json
```

Expected response:

```json
{
  "fraud_risk": "low",
  "fraud_score": 0.15,
  "risk_factors": [],
  "recommendations": "Standard processing recommended",
  "processing_time_ms": 89
}
```

## LLM Query API

### Query with Qwen Model

```powershell
$body = @{
    prompt = "Analyze this insurance claim for completeness"
    context = "Claim details: Vehicle damage, no injuries reported..."
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:3001/api/llm-query `
    -Method POST `
    -ContentType "application/json" `
    -Body $body | ConvertFrom-Json
```

## Python Services Direct API (Advanced)

These are the Python FastAPI endpoints that the backend forwards to. You can also call them directly:

### Direct Damage Detection

```powershell
curl -X POST http://localhost:8000/api/damage/detect `
    -F "file=@C:\path\to\image.jpg"
```

### Direct Image Enhancement

```powershell
curl -X POST http://localhost:8000/api/images/enhance `
    -F "file=@C:\path\to\image.jpg" `
    -F "enhancement_type=contrast"
```

### Compare Two Images

```powershell
curl -X POST http://localhost:8000/api/images/compare `
    -F "file1=@C:\path\to\image1.jpg" `
    -F "file2=@C:\path\to\image2.jpg"
```

Expected response:

```json
{
  "similarity_score": 0.85,
  "differences_detected": true,
  "difference_areas": [
    {
      "location": [100, 200, 300, 400],
      "significance": "high"
    }
  ]
}
```

## Interactive API Documentation

For interactive testing, visit:

- **Python Services Swagger UI**: http://localhost:8000/docs
- **Python Services ReDoc**: http://localhost:8000/redoc

These provide interactive forms to test all Python API endpoints directly in your browser.

## Testing with Postman

Import the following endpoints into Postman:

1. Create a new Collection: "InsureScan API"
2. Add environment variables:
   - `backend_url`: http://localhost:3001
   - `python_url`: http://localhost:8000
3. Import the endpoints listed above

## Common Testing Scenarios

### End-to-End Claim Submission

```powershell
# 1. Upload damage images
curl -X POST http://localhost:3001/api/upload -F "file=@damage1.jpg"
curl -X POST http://localhost:3001/api/upload -F "file=@damage2.jpg"

# 2. Detect damage
curl -X POST http://localhost:3001/api/ml/detect-damage -F "file=@damage1.jpg"

# 3. Assess severity
curl -X POST http://localhost:3001/api/ml/assess-severity `
    -F "file=@damage1.jpg" `
    -F "damage_type=collision"

# 4. Create claim with detected information
$body = @{
    claimNumber = "CLM-2024-001"
    policyNumber = "POL-12345"
    claimantName = "John Doe"
    incidentDate = "2024-02-15"
    claimAmount = 2500  # Based on severity assessment
    status = "pending"
    description = "Moderate collision damage detected"
    images = @("damage1.jpg", "damage2.jpg")
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:3001/api/claims `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

# 5. Check for fraud
Invoke-WebRequest -Uri http://localhost:3001/api/ml/analyze-fraud `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

## Troubleshooting

### 404 Not Found

- Check that all services are running
- Verify the correct port numbers
- Check route paths match the documentation

### 500 Internal Server Error

- Check backend logs for error details
- Verify database connection
- Ensure Python services are running
- Check environment variables are set correctly

### Timeout Errors

- ML endpoints may take longer to process
- Video analysis can take several seconds
- Increase timeout settings if needed

### File Upload Errors

- Verify file sizes are within limits (default: 10MB)
- Check file formats are supported
- Ensure proper multipart/form-data encoding
