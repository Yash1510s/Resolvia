import os
import sys

# Ensure paths
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "ai-engine"))
from analysis_pipeline import EvidenceAnalyzer

def test_stream():
    events = list(EvidenceAnalyzer.analyze_dispute_stream(
        case_id="case-test-01",
        case_number="RSLV-2026-TEST",
        claimant_statement="Delivered full smart contract implementation on Sept 14th with 100% tests.",
        respondent_statement="Identified high severity issues on Sept 16th and contract failed integration.",
        evidence_list=[
            {"id": "ev-01", "description": "Audit Report PDF", "fileName": "audit.pdf", "sha256Hash": "a" * 64}
        ],
        category="Smart Contracts",
        dispute_amount=5000.0,
    ))

    print(f"Total events yielded: {len(events)}")
    stages_seen = set()
    for e in events:
        stage = e.get("stage")
        if stage is not None:
            stages_seen.add(stage)
        print(f"Event: stage={stage}, status={e.get('status')}, name={e.get('name')}")

    assert 0 in stages_seen, "Stage 0 missing"
    assert 1 in stages_seen, "Stage 1 missing"
    assert 2 in stages_seen, "Stage 2 missing"
    assert 3 in stages_seen, "Stage 3 missing"

    final_event = events[-1]
    assert final_event.get("status") == "SUCCESS", "Final event status not SUCCESS"
    assert "report" in final_event, "Final event missing report"
    assert "reportSha256" in final_event["report"], "Report missing SHA256"
    print("\nALL AI STREAMING PIPELINE TESTS PASSED 100%!")

if __name__ == "__main__":
    test_stream()
