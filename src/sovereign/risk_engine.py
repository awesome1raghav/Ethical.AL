import re
import math
from collections import Counter

def calculate_shannon_entropy(text: str) -> float:
    """Calculates the thermodynamic/information entropy of a string to detect gibberish."""
    if not text:
        return 0.0
    entropy = 0.0
    length = len(text)
    frequencies = Counter(text)
    for count in frequencies.values():
        p = count / length
        entropy -= p * math.log2(p)
    return entropy

def evaluate_risk_level(prompt_text: str) -> dict:
    """
    Highly detailed backend risk evaluation engine.
    Analyzes syntax, intent flags, overrides, and text entropy.
    """
    clean_text = prompt_text.strip()
    text_lower = clean_text.lower()
    word_count = len(clean_text.split())
    
    # Fallback for empty strings
    if word_count == 0:
        return {"level": "Low", "reason": "Empty prompt, no operational risk."}

    # ---- LAYER 1: STRICT POLICY / PROMPT INJECTION CHECK (HIGH RISK) ----
    high_risk_patterns = [
        r"ignore\s+(?:all\s+)?previous", 
        r"system\s+override", 
        r"act\s+as\s+[\w\s]+admin",
        r"bypass\s+guardrails",
        r"reverse\s+engineer",
        r"exploit", r"sql\s*injection", r"malware", r"phishing"
    ]
    
    for pattern in high_risk_patterns:
        if re.search(pattern, text_lower):
            return {
                "level": "High",
                "reason": "Security flag tripped: Detected unsafe system interaction pattern or malicious payload intent."
            }

    # ---- LAYER 2: ENTROPY & GIBBERISH ANALYSIS (MEDIUM RISK) ----
    entropy = calculate_shannon_entropy(clean_text)
    
    # If text is short, has no spaces, and high structural randomness (like zdhdh5ye)
    if word_count == 1 and len(clean_text) > 5:
        has_vowels = any(v in text_lower for v in ['a', 'e', 'i', 'o', 'u', 'y'])
        
        if entropy > 2.8 or not has_vowels:
            return {
                "level": "Medium",
                "reason": f"Input anomaly: Unstructured single-token data string detected (Entropy: {entropy:.2f}). Evaluated as potential system fuzzing or spam."
            }

    # ---- LAYER 3: CONTEXTUAL RISK BOUNDS (LOW RISK) ----
    safe_operational_anchors = ['analyze', 'research', 'build', 'create', 'generate', 'explain', 'audit']
    has_safe_anchor = any(anchor in text_lower for anchor in safe_operational_anchors)
    
    if has_safe_anchor and word_count >= 3:
        return {
            "level": "Low",
            "reason": "Prompt conforms to structured operational standard with clean natural language directives."
        }
        
    return {
        "level": "Low",
        "reason": "Standard validation passed. Intent cleared for general processing execution."
    }
