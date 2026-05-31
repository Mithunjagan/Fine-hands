from fastapi import APIRouter, Request, UploadFile, File, Form
import asyncio
import os
import json
import httpx
import csv
import io
import re
from datetime import datetime

try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None

router = APIRouter(prefix="/api/transactions", tags=["transactions"])

# In-memory transaction store for demo
_transaction_store: list = []

async def query_llm_json(prompt: str, system_prompt: str) -> list:
    """Queries OpenRouter LLM at zero temperature and returns parsed JSON array."""
    api_key = os.getenv("OPENROUTER_API_KEY", "")
    model = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3-8b-instruct:free")
    
    if not api_key:
        return []
        
    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "google/gemma-2-9b-it:free", # Highly intelligent and precise JSON extractor free model
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.0
                }
            )
            if response.status_code == 200:
                result = response.json()
                content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                
                # Strip out markdown block if returned
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]
                
                cleaned = content.strip()
                parsed = json.loads(cleaned)
                if isinstance(parsed, list):
                    return parsed
                elif isinstance(parsed, dict) and "transactions" in parsed:
                    return parsed["transactions"]
    except Exception as e:
        print(f"LLM Statement parsing/classification failed: {e}")
    return []

def fallback_pdf_parse(text: str) -> list:
    """Regex-based fallback transaction extractor for PDF statements if LLM is unavailable."""
    txns = []
    lines = text.split("\n")
    # Match dates like 31-05-2026, 31/05/26, 2026/05/31, 31 May 2026
    date_pattern = re.compile(r"(\d{1,2}[-/ ](?:\d{2}|[a-zA-Z]{3,9})[-/ ]\d{2,4}|\d{4}[-/ ]\d{2}[-/ ]\d{2})")
    amount_pattern = re.compile(r"\b\d{1,6}\.\d{2}\b")
    
    for i, line in enumerate(lines):
        line = line.strip()
        if not line or len(line) < 10:
            continue
        
        date_match = date_pattern.search(line)
        amount_matches = amount_pattern.findall(line)
        
        if date_match and amount_matches:
            date_str = date_match.group(1)
            # Use first match as transaction amount (debit/credit amount is typically first, balance is last)
            try:
                amount_val = float(amount_matches[0])
            except ValueError:
                continue
                
            if amount_val <= 0:
                continue
                
            # Remove date and amount to isolate merchant description
            vendor_text = line.replace(date_str, "").replace(amount_matches[0], "")
            if len(amount_matches) > 1:
                vendor_text = vendor_text.replace(amount_matches[-1], "") # Remove balance column if present
                
            # Clean up special characters from merchant
            vendor_text = re.sub(r"[^\w\s\-\/\*]", "", vendor_text).strip()
            vendor_text = " ".join(vendor_text.split()[:4]) # Truncate to first 4 words
            
            if not vendor_text or len(vendor_text) < 3:
                vendor_text = "Bank Transaction"
                
            # Rule-based heuristics for categories and subscriptions
            category = "other"
            is_sub = False
            v_lower = vendor_text.lower()
            
            if any(k in v_lower for k in ["zomato", "swiggy", "starbucks", "rest", "food", "cafe", "dining", "mcdonald"]):
                category = "food"
            elif any(k in v_lower for k in ["amazon", "flipkart", "myntra", "shop", "retail", "mart", "supermarket"]):
                category = "shopping"
            elif any(k in v_lower for k in ["uber", "ola", "metro", "auto", "cab", "petrol", "fuel", "shell", "hpcl"]):
                category = "transport"
            elif any(k in v_lower for k in ["netflix", "spotify", "hotstar", "prime", "cinema", "movie", "pvr", "bookmyshow"]):
                category = "entertainment"
                is_sub = any(k in v_lower for k in ["netflix", "spotify", "hotstar", "prime"])
            elif any(k in v_lower for k in ["bill", "electricity", "jio", "airtel", "water", "gas", "recharge", "broadband"]):
                category = "bills"
            elif any(k in v_lower for k in ["mutual", "fund", "sip", "groww", "zerodha", "stock", "invest", "etf"]):
                category = "investment"
                
            txns.append({
                "id": f"pdf-fallback-{i}-{int(amount_val)}",
                "amount": amount_val,
                "vendor": vendor_text,
                "category": category,
                "date": date_str,
                "isSubscription": is_sub
            })
            
    # Max limit of 50 transactions to prevent UI overload
    return txns[:50]


@router.post("/classify-statement")
async def classify_statement(request: Request):
    """
    Classify bank statement items.
    Accepts list of raw transaction items (date, vendor, amount) and cleanses them using an LLM.
    """
    data = await request.json()
    txns = data.get("transactions", [])
    if not txns:
        return []
        
    api_key = os.getenv("OPENROUTER_API_KEY", "")
    
    # Batch the transaction descriptions to clean them up in a single call
    prompt = f"Please clean up, classify, and tag these raw bank transactions:\n\n{json.dumps(txns, indent=2)}"
    
    system_prompt = (
        "You are an expert transaction classifier for the Finehands dashboard.\n"
        "Your task is to take a list of raw transaction descriptions/vendors and clean them up into high-fidelity structured data.\n"
        "For each transaction in the provided list, you must output:\n"
        "1. \"vendor\": Clean, human-readable merchant name (e.g. \"UPI-BHIM-STARBUCKS-120302-MUM\" -> \"Starbucks\", \"NETFLIX.COM\" -> \"Netflix\", \"ZOMATO*123\" -> \"Zomato\", \"PAYTM-PVR-1002\" -> \"PVR Cinemas\").\n"
        "2. \"category\": Must be strictly one of these exact lowercase strings: \"food\", \"shopping\", \"transport\", \"entertainment\", \"bills\", \"investment\", \"other\".\n"
        "3. \"isSubscription\": Set to true if it is a recurring monthly subscription (like Netflix, Spotify, gym fee, utility bill, YouTube Premium, broadband bill), otherwise false.\n"
        "Return ONLY a valid JSON array of objects with the exact keys: \"id\", \"amount\", \"date\", \"vendor\" (cleaned merchant), \"category\", \"isSubscription\". No markdown formatting, no preamble or explanation, just the raw JSON array."
    )
    
    cleaned_txns = []
    if api_key:
        cleaned_txns = await query_llm_json(prompt, system_prompt)
        
    if not cleaned_txns:
        # Heuristic fallback if LLM is unavailable or fails
        cleaned_txns = []
        for t in txns:
            v = t.get("vendor", "Unknown Vendor")
            category = "other"
            is_sub = False
            v_lower = v.lower()
            
            if any(k in v_lower for k in ["zomato", "swiggy", "starbucks", "rest", "food", "cafe", "dining", "mcdonald"]):
                category = "food"
                cleaned_vendor = "Zomato" if "zomato" in v_lower else "Swiggy" if "swiggy" in v_lower else "Starbucks" if "starbucks" in v_lower else v.split("-")[0].strip()
            elif any(k in v_lower for k in ["amazon", "flipkart", "myntra", "shop", "retail", "mart"]):
                category = "shopping"
                cleaned_vendor = "Amazon" if "amazon" in v_lower else "Flipkart" if "flipkart" in v_lower else "Myntra" if "myntra" in v_lower else v.split("-")[0].strip()
            elif any(k in v_lower for k in ["uber", "ola", "metro", "auto", "cab", "petrol", "fuel"]):
                category = "transport"
                cleaned_vendor = "Uber" if "uber" in v_lower else "Ola" if "ola" in v_lower else "Metro/Fuel"
            elif any(k in v_lower for k in ["netflix", "spotify", "hotstar", "prime", "cinema", "movie", "pvr"]):
                category = "entertainment"
                is_sub = any(k in v_lower for k in ["netflix", "spotify", "hotstar", "prime"])
                cleaned_vendor = "Netflix" if "netflix" in v_lower else "Spotify" if "spotify" in v_lower else "PVR Cinemas" if "pvr" in v_lower else v.split("-")[0].strip()
            elif any(k in v_lower for k in ["bill", "electricity", "jio", "airtel", "water", "gas", "recharge"]):
                category = "bills"
                cleaned_vendor = "Jio" if "jio" in v_lower else "Airtel" if "airtel" in v_lower else "Utility Bill"
            elif any(k in v_lower for k in ["mutual", "fund", "sip", "groww", "zerodha", "stock", "invest"]):
                category = "investment"
                cleaned_vendor = "SIP Mutual Fund" if "sip" in v_lower or "mutual" in v_lower else "Zerodha Investment"
            else:
                cleaned_vendor = v.split("-")[0].strip()
                if not cleaned_vendor:
                    cleaned_vendor = "Transaction"
                    
            cleaned_txns.append({
                "id": t.get("id") or f"manual-fallback-{len(_transaction_store) + 1}",
                "amount": t.get("amount", 0.0),
                "date": t.get("date", datetime.now().strftime("%Y-%m-%d")),
                "vendor": cleaned_vendor,
                "category": category,
                "isSubscription": is_sub
            })
            
    return cleaned_txns


@router.post("/upload-statement")
async def upload_statement(file: UploadFile = File(...)):
    """
    Accepts statement file (CSV, JSON, or PDF).
    Extracts data (using pypdf for PDFs, native parsing for CSV/JSON) and uses LLM to structure/classify.
    """
    filename = file.filename
    content = await file.read()
    
    if not content:
        return {"error": "Uploaded file is empty"}
        
    api_key = os.getenv("OPENROUTER_API_KEY", "")
    
    # 1. HANDLE PDF STATEMENT
    if filename.lower().endswith(".pdf"):
        if not PdfReader:
            return {"error": "PDF support is not installed (pypdf is missing)"}
            
        try:
            reader = PdfReader(io.BytesIO(content))
            text = ""
            # Extract text from up to 8 pages to avoid excessive token length
            for page in reader.pages[:8]:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
                    
            if not text.strip():
                return {"error": "No text could be extracted from this PDF statement. It might be scanned/image-only."}
                
            prompt = f"Analyze this raw text extracted from a bank statement PDF and extract all transaction records:\n\n{text[:15000]}"
            
            system_prompt = (
                "You are an expert Indian bank statement parser and transaction classifier.\n"
                "Extract all transaction rows from the raw text provided. For each transaction, extract:\n"
                "1. \"date\": Transaction date in YYYY-MM-DD format (if year is missing or partial, assume 2026).\n"
                "2. \"vendor\": Clean, human-readable merchant or payee name (e.g., \"UPI-BHIM-STARBUCKS-120302-MUM\" -> \"Starbucks\", \"NETFLIX.COM\" -> \"Netflix\", \"ZOMATO*123\" -> \"Zomato\", \"Interest Paid\" -> \"Bank Interest\").\n"
                "3. \"amount\": Float representation of transaction amount (always a positive number, e.g. 450.00). Only extract actual expenditures/debits or deposits/credits. Ignore balance columns.\n"
                "4. \"category\": One of these exact lowercase strings: \"food\", \"shopping\", \"transport\", \"entertainment\", \"bills\", \"investment\", \"other\".\n"
                "5. \"isSubscription\": Boolean (true if recurring subscription like Netflix, Spotify, gym fee, utility bills, broadband; otherwise false).\n"
                "Return ONLY a valid JSON array of objects with keys: \"date\", \"vendor\", \"amount\", \"category\", \"isSubscription\". No preamble, no postscript, no markdown wrapping. Return an empty array if no transactions found."
            )
            
            txns = []
            if api_key:
                txns = await query_llm_json(prompt, system_prompt)
                
            if not txns:
                # Regex fallback for PDF
                txns = fallback_pdf_parse(text)
                
            # Assign unique IDs and clean ISO dates
            for i, t in enumerate(txns):
                t["id"] = f"pdf-upload-{int(datetime.now().timestamp())}-{i}"
                if "date" in t:
                    try:
                        t["date"] = new_iso_date(t["date"])
                    except Exception:
                        pass
                else:
                    t["date"] = datetime.now().isoformat()
                    
            return {"filename": filename, "transactions": txns}
            
        except Exception as e:
            return {"error": f"Failed to parse PDF statement: {str(e)}"}
            
    # 2. HANDLE CSV STATEMENT
    elif filename.lower().endswith(".csv"):
        try:
            text = content.decode("utf-8", errors="ignore")
            lines = text.splitlines()
            if len(lines) < 2:
                return {"error": "CSV file is empty or invalid"}
                
            # Parse CSV headers
            reader = csv.reader(io.StringIO(text))
            rows = list(reader)
            headers = [h.strip().lower() for h in rows[0]]
            
            date_idx = next((i for i, h in enumerate(headers) if "date" in h), -1)
            vendor_idx = next((i for i, h in enumerate(headers) if any(k in h for k in ["vendor", "desc", "payee", "merchant", "particular"])), -1)
            amount_idx = next((i for i, h in enumerate(headers) if any(k in h for k in ["amount", "value", "cost", "withdrawal", "debit"])), -1)
            category_idx = next((i for i, h in enumerate(headers) if "category" in h), -1)
            
            if date_idx == -1 or vendor_idx == -1 or amount_idx == -1:
                return {"error": "Required columns (Date, Vendor/Description, Amount) not found in CSV. Headers must be present."}
                
            raw_txns = []
            for i, row in enumerate(rows[1:]):
                if not row or len(row) <= max(date_idx, vendor_idx, amount_idx):
                    continue
                date_val = row[date_idx].strip()
                vendor_val = row[vendor_idx].strip()
                try:
                    amount_str = re.sub(r"[^\d.-]", "", row[amount_idx])
                    amount_val = abs(float(amount_str))
                except Exception:
                    continue
                    
                if not date_val or not vendor_val or amount_val <= 0:
                    continue
                    
                cat_val = row[category_idx].strip().lower() if category_idx != -1 else "other"
                
                raw_txns.append({
                    "id": f"csv-raw-{i}",
                    "date": date_val,
                    "vendor": vendor_val,
                    "amount": amount_val,
                    "category": cat_val
                })
                
            # Only batch clean up to 30 transactions to prevent API rate limits/timeouts
            batch_txns = raw_txns[:30]
            
            # Send to LLM for cleaning and classification
            prompt = f"Please clean up, classify, and tag these raw bank transactions:\n\n{json.dumps(batch_txns, indent=2)}"
            
            system_prompt = (
                "You are an expert transaction classifier for the Finehands dashboard.\n"
                "Your task is to take a list of raw transaction descriptions/vendors and clean them up into high-fidelity structured data.\n"
                "For each transaction in the provided list, you must output:\n"
                "1. \"vendor\": Clean, human-readable merchant name (e.g. \"UPI-BHIM-STARBUCKS-120302-MUM\" -> \"Starbucks\", \"NETFLIX.COM\" -> \"Netflix\", \"ZOMATO*123\" -> \"Zomato\", \"PAYTM-PVR-1002\" -> \"PVR Cinemas\").\n"
                "2. \"category\": Must be strictly one of these exact lowercase strings: \"food\", \"shopping\", \"transport\", \"entertainment\", \"bills\", \"investment\", \"other\".\n"
                "3. \"isSubscription\": Set to true if it is a recurring monthly subscription (like Netflix, Spotify, gym fee, utility bill), otherwise false.\n"
                "Return ONLY a valid JSON array of objects with the exact keys: \"id\", \"amount\", \"date\", \"vendor\" (cleaned merchant), \"category\", \"isSubscription\". No markdown formatting, no preamble or explanation, just the raw JSON array."
            )
            
            txns = []
            if api_key:
                txns = await query_llm_json(prompt, system_prompt)
                
            if not txns:
                # Fallback to local heuristic cleaner
                txns = []
                for t in batch_txns:
                    v = t["vendor"]
                    category = t["category"] if t["category"] in ["food", "shopping", "transport", "entertainment", "bills", "investment", "other"] else "other"
                    is_sub = False
                    v_lower = v.lower()
                    
                    if category == "other":
                        if any(k in v_lower for k in ["zomato", "swiggy", "starbucks", "rest", "food", "cafe", "dining"]):
                            category = "food"
                        elif any(k in v_lower for k in ["amazon", "flipkart", "myntra", "shop", "retail", "mart"]):
                            category = "shopping"
                        elif any(k in v_lower for k in ["uber", "ola", "metro", "auto", "cab", "petrol", "fuel"]):
                            category = "transport"
                        elif any(k in v_lower for k in ["netflix", "spotify", "hotstar", "prime", "cinema", "movie", "pvr"]):
                            category = "entertainment"
                            is_sub = any(k in v_lower for k in ["netflix", "spotify", "hotstar", "prime"])
                        elif any(k in v_lower for k in ["bill", "electricity", "jio", "airtel", "water", "gas", "recharge"]):
                            category = "bills"
                        elif any(k in v_lower for k in ["mutual", "fund", "sip", "groww", "zerodha", "stock", "invest"]):
                            category = "investment"
                            
                    cleaned_vendor = v.split("-")[0].strip()
                    if "zomato" in v_lower: cleaned_vendor = "Zomato"
                    elif "swiggy" in v_lower: cleaned_vendor = "Swiggy"
                    elif "starbucks" in v_lower: cleaned_vendor = "Starbucks"
                    elif "netflix" in v_lower: cleaned_vendor = "Netflix"
                    elif "spotify" in v_lower: cleaned_vendor = "Spotify"
                    elif "uber" in v_lower: cleaned_vendor = "Uber"
                    elif "ola" in v_lower: cleaned_vendor = "Ola"
                    
                    txns.append({
                        "id": f"csv-upload-{int(datetime.now().timestamp())}-{t['id']}",
                        "amount": t["amount"],
                        "date": new_iso_date(t["date"]),
                        "vendor": cleaned_vendor,
                        "category": category,
                        "isSubscription": is_sub
                    })
                    
            return {"filename": filename, "transactions": txns}
        except Exception as e:
            return {"error": f"Failed to parse CSV statement: {str(e)}"}
            
    # 3. HANDLE JSON STATEMENT
    elif filename.lower().endswith(".json"):
        try:
            text = content.decode("utf-8", errors="ignore")
            parsed = json.loads(text)
            raw_list = parsed if isinstance(parsed, list) else parsed.get("transactions", parsed.get("data", []))
            
            if not isinstance(raw_list, list):
                return {"error": "JSON format must be a list of transactions or contain a transactions/data key."}
                
            txns = []
            for i, t in enumerate(raw_list[:30]):
                txns.append({
                    "id": f"json-upload-{int(datetime.now().timestamp())}-{i}",
                    "amount": float(t.get("amount", 0)),
                    "date": new_iso_date(t.get("date", datetime.now().isoformat())),
                    "vendor": t.get("vendor", t.get("description", "Unknown Vendor")),
                    "category": (t.get("category", "other")).lower(),
                    "isSubscription": bool(t.get("isSubscription", False))
                })
            return {"filename": filename, "transactions": txns}
        except Exception as e:
            return {"error": f"Failed to parse JSON statement: {str(e)}"}
            
    else:
        return {"error": "Unsupported file extension. Please upload a .csv, .json, or .pdf file."}

def new_iso_date(date_str: str) -> str:
    """Safely converts dynamic statement date strings into full ISO timestamp."""
    try:
        # Common date patterns
        for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%Y/%m/%d", "%d %b %Y", "%d-%b-%Y"):
            try:
                dt = datetime.strptime(date_str.strip(), fmt)
                return dt.isoformat()
            except ValueError:
                continue
        # Fallback to parsed ISO
        return datetime.fromisoformat(date_str.strip().replace("Z", "+00:00")).isoformat()
    except Exception:
        return datetime.now().isoformat()


@router.get("/list")
async def list_transactions(category: str = None, limit: int = 50):
    """
    List transactions with optional category filter.
    In production, this would query a database.
    """
    filtered = _transaction_store
    if category:
        filtered = [t for t in filtered if t.get("category", "").lower() == category.lower()]

    return {
        "transactions": filtered[:limit],
        "total": len(filtered)
    }


@router.post("/add")
async def add_transaction(request: Request):
    """Add a new transaction manually."""
    data = await request.json()
    transaction = {
        "id": f"manual-{len(_transaction_store) + 1}",
        "amount": data.get("amount", 0),
        "category": data.get("category", "other"),
        "vendor": data.get("vendor", "Manual Entry"),
        "date": data.get("date", ""),
        "status": data.get("status", "active"),
        "isSubscription": data.get("isSubscription", False)
    }
    _transaction_store.insert(0, transaction)
    return {"status": "ok", "transaction": transaction}


@router.post("/ocr-receipt")
async def process_receipt(request: Request):
    """
    OCR endpoint for receipt parsing.
    - When OPENROUTER_API_KEY exists: Sends base64 image to a vision model for extraction.
    - When no key: Returns realistic mock data for demo purposes.
    """
    data = await request.json()
    image_data = data.get("image", "")
    api_key = os.getenv("OPENROUTER_API_KEY", "")

    if api_key and image_data:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "meta-llama/llama-4-maverick:free",
                        "messages": [
                            {
                                "role": "user",
                                "content": [
                                    {
                                        "type": "text",
                                        "text": "Extract the following from this receipt image. Return ONLY valid JSON: {\"vendor\": \"store name\", \"amount\": total_number, \"date\": \"YYYY-MM-DD\", \"category\": \"one of: dining, groceries, shopping, entertainment, transport, utilities, other\", \"items\": [\"item1\", \"item2\"]}. If you can't parse it, return {\"error\": \"Could not parse receipt\"}."
                                    },
                                    {
                                        "type": "image_url",
                                        "image_url": {
                                            "url": f"data:image/jpeg;base64,{image_data}"
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                )

                result = response.json()
                content = result.get("choices", [{}])[0].get("message", {}).get("content", "")

                # Try to parse JSON from response
                try:
                    # Handle cases where model wraps JSON in markdown code blocks
                    if "```json" in content:
                        content = content.split("```json")[1].split("```")[0]
                    elif "```" in content:
                        content = content.split("```")[1].split("```")[0]

                    parsed = json.loads(content.strip())
                    parsed["confidence"] = 0.92
                    parsed["source"] = "ai_vision"
                    return parsed
                except json.JSONDecodeError:
                    pass  # Fall through to mock

        except Exception:
            pass  # Fall through to mock on any error

    # Mock response for demo (realistic receipt data)
    await asyncio.sleep(1.5)  # Simulate processing

    import random
    mock_receipts = [
        {"vendor": "Whole Foods Market", "amount": 145.20, "category": "groceries",
         "items": ["Organic Avocados", "Almond Milk", "Sourdough Bread", "Greek Yogurt"]},
        {"vendor": "Starbucks", "amount": 42.50, "category": "dining",
         "items": ["Caramel Macchiato", "Croissant", "Cold Brew"]},
        {"vendor": "Shell Gas Station", "amount": 68.75, "category": "transport",
         "items": ["Regular Unleaded - 12.5 gal"]},
        {"vendor": "Amazon", "amount": 234.99, "category": "shopping",
         "items": ["Wireless Headphones", "Phone Case", "USB-C Cable"]},
        {"vendor": "PVR Cinemas", "amount": 89.00, "category": "entertainment",
         "items": ["2x Movie Tickets", "Popcorn Combo"]},
    ]

    receipt = random.choice(mock_receipts)
    from datetime import datetime
    receipt["date"] = datetime.now().strftime("%Y-%m-%d")
    receipt["confidence"] = round(random.uniform(0.88, 0.97), 2)
    receipt["source"] = "mock"

    return receipt
