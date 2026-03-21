from io import BytesIO

from PyPDF2 import PdfReader


def extract_text_from_file(filename: str, content: bytes) -> str:
    lower = filename.lower()
    if lower.endswith(".txt"):
        return content.decode("utf-8", errors="ignore")
    if lower.endswith(".pdf"):
        reader = PdfReader(BytesIO(content))
        parts = [(page.extract_text() or "") for page in reader.pages]
        return "\n".join(parts)
    raise ValueError("Only PDF and TXT files are supported")
