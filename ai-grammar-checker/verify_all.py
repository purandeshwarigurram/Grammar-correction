import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "http://127.0.0.1:5000"

def make_request(path, method="GET", data=None):
    url = f"{BASE_URL}{path}"
    headers = {"User-Agent": "GrammarTestClient/1.0"}
    if data is not None:
        headers["Content-Type"] = "application/json"
        encoded_data = json.dumps(data).encode("utf-8")
        req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    else:
        req = urllib.request.Request(url, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            status = response.status
            body = response.read().decode("utf-8")
            return status, body
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        return e.code, body
    except Exception as e:
        return 0, str(e)

def run_tests():
    print("==================================================")
    print("  AI GRAMMAR CHECKER - COMPREHENSIVE TEST SUITE")
    print("==================================================")
    passed = 0
    total = 0

    # Test 1: Homepage
    total += 1
    status, body = make_request("/")
    if status == 200 and "AI Grammar Checker" in body and "id=\"textInput\"" in body:
        print("[PASS] 1. Homepage loads correctly (HTTP 200, UI elements present)")
        passed += 1
    else:
        print(f"[FAIL] 1. Homepage failed: status {status}")

    # Test 2: CSS Stylesheet & Responsive Media Queries
    total += 1
    status, body = make_request("/static/css/style.css")
    if status == 200 and "@media (max-width: 768px)" in body and "--primary" in body:
        print("[PASS] 2. Stylesheet loads correctly with responsive rules (HTTP 200)")
        passed += 1
    else:
        print(f"[FAIL] 2. CSS failed: status {status}")

    # Test 3: JavaScript Engine
    total += 1
    status, body = make_request("/static/js/script.js")
    if status == 200 and "performGrammarCheck" in body and "applySingleCorrection" in body:
        print("[PASS] 3. Client JavaScript loads correctly with correction logic (HTTP 200)")
        passed += 1
    else:
        print(f"[FAIL] 3. JS failed: status {status}")

    # Test 4: Health Check API
    total += 1
    status, body = make_request("/api/health")
    if status == 200 and '"status": "healthy"' in body:
        print("[PASS] 4. Health Check API responds healthy (HTTP 200)")
        passed += 1
    else:
        print(f"[FAIL] 4. Health API failed: status {status}")

    # Test 5: Empty Input Validation Error Handling
    total += 1
    status, body = make_request("/api/check-grammar", method="POST", data={"text": "   "})
    if status == 400 and "empty" in body.lower():
        print("[PASS] 5. Error handling for empty input verified (HTTP 400)")
        passed += 1
    else:
        print(f"[FAIL] 5. Empty validation failed: status {status}")

    # Test 6: Benchmark Sentence 1: "I has a apple."
    total += 1
    status, body = make_request("/api/check-grammar", method="POST", data={"text": "I has a apple."})
    data = json.loads(body) if status == 200 else {}
    errors = data.get("errors", [])
    inc_words = [e["incorrect_text"] for e in errors]
    if status == 200 and "has" in inc_words and "a" in inc_words:
        print(f"[PASS] 6. Benchmark 1 'I has a apple.' -> Detected: {inc_words} (Score: {data['stats']['accuracy_score']}%)")
        passed += 1
    else:
        print(f"[FAIL] 6. Benchmark 1 failed: status {status}, data: {data}")

    # Test 7: Benchmark Sentence 2: "She go to college everyday."
    total += 1
    status, body = make_request("/api/check-grammar", method="POST", data={"text": "She go to college everyday."})
    data = json.loads(body) if status == 200 else {}
    errors = data.get("errors", [])
    inc_words = [e["incorrect_text"] for e in errors]
    if status == 200 and "go" in inc_words and "everyday" in inc_words:
        print(f"[PASS] 7. Benchmark 2 'She go to college everyday.' -> Detected: {inc_words} (Score: {data['stats']['accuracy_score']}%)")
        passed += 1
    else:
        print(f"[FAIL] 7. Benchmark 2 failed: status {status}, data: {data}")

    # Test 8: Benchmark Sentence 3: "They is playing cricket."
    total += 1
    status, body = make_request("/api/check-grammar", method="POST", data={"text": "They is playing cricket."})
    data = json.loads(body) if status == 200 else {}
    errors = data.get("errors", [])
    inc_words = [e["incorrect_text"] for e in errors]
    if status == 200 and "is" in inc_words:
        print(f"[PASS] 8. Benchmark 3 'They is playing cricket.' -> Detected: {inc_words} (Score: {data['stats']['accuracy_score']}%)")
        passed += 1
    else:
        print(f"[FAIL] 8. Benchmark 3 failed: status {status}, data: {data}")

    # Test 9: Benchmark Sentence 4: "I am a student." (Clean Text)
    total += 1
    status, body = make_request("/api/check-grammar", method="POST", data={"text": "I am a student."})
    data = json.loads(body) if status == 200 else {}
    if status == 200 and data.get("total_errors") == 0 and data.get("stats", {}).get("accuracy_score") == 100:
        print(f"[PASS] 9. Benchmark 4 'I am a student.' -> Clean text verified: 0 errors, Accuracy: 100%")
        passed += 1
    else:
        print(f"[FAIL] 9. Benchmark 4 failed: status {status}, data: {data}")

    # Test 10: Spelling Mistakes Detection
    total += 1
    status, body = make_request("/api/check-grammar", method="POST", data={"text": "This is a mispelled wurd in the documnt."})
    data = json.loads(body) if status == 200 else {}
    errors = data.get("errors", [])
    spell_count = data.get("stats", {}).get("spelling_errors", 0)
    inc_words = [e["incorrect_text"] for e in errors]
    if status == 200 and len(errors) >= 2:
        print(f"[PASS] 10. Spelling Detection -> Detected typos: {inc_words} (Spelling count: {spell_count})")
        passed += 1
    else:
        print(f"[FAIL] 10. Spelling failed: status {status}, data: {data}")

    # Test 11: Punctuation & Spacing Detection
    total += 1
    status, body = make_request("/api/check-grammar", method="POST", data={"text": "Hello  world , how are you today ?"})
    data = json.loads(body) if status == 200 else {}
    errors = data.get("errors", [])
    punct_count = data.get("stats", {}).get("punctuation_errors", 0)
    if status == 200 and len(errors) >= 1:
        print(f"[PASS] 11. Punctuation Detection -> Detected punctuation issues ({len(errors)} found)")
        passed += 1
    else:
        print(f"[FAIL] 11. Punctuation failed: status {status}, data: {data}")

    # Test 12: Offline Fallback Engine Test (Simulating API failure directly on app logic)
    total += 1
    from app import offline_fallback_check, calculate_writing_stats
    fb_res = offline_fallback_check("I has a apple and She go home everyday.")
    fb_words = [m["incorrect_text"] for m in fb_res]
    if "has" in fb_words and "a" in fb_words and "go" in fb_words and "everyday" in fb_words:
        print(f"[PASS] 12. Offline Fallback Engine verified -> {fb_words}")
        passed += 1
    else:
        print(f"[FAIL] 12. Fallback engine failed: {fb_res}")

    print("==================================================")
    print(f"  TEST SUMMARY: {passed} / {total} TESTS PASSED")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
