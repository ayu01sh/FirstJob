from app.services.matching import compute_matches
from app.services.resume import analyze_resume


def test_resume_analysis_is_deterministic():
    text = """
    John Doe
    john@example.com
    9999999999
    Education
    Projects
    Skills
    - React
    - FastAPI
    - MongoDB
    """
    seeded = {"react", "fastapi", "mongodb", "typescript"}
    a = analyze_resume(text, "Frontend Developer", seeded)
    b = analyze_resume(text, "Frontend Developer", seeded)
    assert a["ats_score"] == b["ats_score"]
    assert a["suggestions"] == b["suggestions"]


def test_matching_returns_top_items():
    jobs = [
        {"_id": "1", "title": "Frontend Intern", "company": "A", "skills_required": ["React", "JavaScript"]},
        {"_id": "2", "title": "Backend Intern", "company": "B", "skills_required": ["Python", "FastAPI"]},
    ]
    items = compute_matches(jobs, ["react", "javascript"], "Frontend Developer")
    assert len(items) > 0
    assert items[0]["job_id"] == "1"
