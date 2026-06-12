import re

def calculate_clarity_score(prompt_text: str) -> dict:
    """
    Evaluates the clarity of an input prompt on a scale from 0% to 100%
    by checking density, action anchors, parameters, and noise.
    """
    clean_text = prompt_text.strip()
    text_lower = clean_text.lower()
    words = clean_text.split()
    word_count = len(words)
    
    if word_count == 0:
        return {"score": "0%", "rating": "Unstructured Noise", "breakdown": "Empty input"}

    # Initialize scoring variables
    score = 0
    breakdown = {}

    # ---- 1. LEXICAL WEIGHT (Max 40 points) ----
    length_points = min(word_count * 4, 40)
    score += length_points
    breakdown["lexical_weight"] = length_points

    # ---- 2. ACTION ANCHORS (Max 30 points) ----
    action_verbs = [
        'analyze', 'research', 'compile', 'synthesize', 'audit', 'evaluate',
        'build', 'generate', 'create', 'extract', 'summarize', 'optimize'
    ]
    found_verbs = [verb for verb in action_verbs if verb in text_lower]
    
    verb_points = min(len(found_verbs) * 15, 30)
    score += verb_points
    breakdown["action_anchors"] = verb_points

    # ---- 3. PARAMETER DENSITY (Max 30 points) ----
    has_timeframe = bool(re.search(r'(?:q[1-4]|\d{4}|month|year|week|trend|daily|logs)', text_lower))
    has_target = bool(re.search(r'(?:market|competit|security|financial|data|strategy|ai)', text_lower))
    
    param_points = 0
    if has_timeframe: param_points += 15
    if has_target: param_points += 15
    score += param_points
    breakdown["parameter_density"] = param_points

    # ---- 4. SYNTACTIC NOISE PENALTY (Negative Modifiers) ----
    if word_count == 1 and len(clean_text) > 4:
        has_vowels = any(v in text_lower for v in ['a', 'e', 'i', 'o', 'u', 'y'])
        if not has_vowels or clean_text.isalnum():
            score = max(score - 85, 5)
            breakdown["noise_penalty"] = -85

    # Clamp final score safely between 0 and 100
    final_score = max(min(round(score), 100), 0)

    # Determine qualitative evaluation tag
    if final_score >= 85:
        rating = "Excellent"
    elif final_score >= 60:
        rating = "Good / Actionable"
    elif final_score >= 30:
        rating = "Vague / Needs Detail"
    else:
        rating = "Unstructured Noise"

    return {
        "score": f"{final_score}%",
        "rating": rating,
        "breakdown": breakdown
    }
