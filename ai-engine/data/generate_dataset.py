"""
Resolvia — Synthetic Dispute Dataset Generator
================================================
Generates 4,000 realistic labeled disputes across 8 categories.

Each dispute includes:
  - Claimant & respondent statements (varied templates)
  - Evidence metadata (type, count, boolean flags)
  - Optional monetary amount
  - Labeled outcome, confidence, and severity

Usage:
    python generate_dataset.py            # generates data in current dir
    python generate_dataset.py --out DIR  # generates data in specified dir
"""

import csv
import random
import os
import argparse
from datetime import datetime, timedelta

# ─── Reproducibility ─────────────────────────────────────────────────────────
random.seed(42)

# ─── Constants ────────────────────────────────────────────────────────────────
CATEGORIES = [
    "Community",
    "Academic",
    "Personal",
    "Freelance",
    "Consumer",
    "Property",
    "Digital",
    "Workplace",
]

EVIDENCE_TYPES_POOL = {
    "Community":  ["photo", "video", "society_rules", "complaint_letter", "witness_statement", "noise_measurement"],
    "Academic":   ["attendance_record", "screenshot", "witness_statement", "assignment_submission", "email", "syllabus"],
    "Personal":   ["chat_log", "photo", "witness_statement", "receipt", "video", "voice_recording"],
    "Freelance":  ["contract", "invoice", "deliverable_proof", "email", "chat_log", "milestone_report", "payment_receipt"],
    "Consumer":   ["receipt", "product_photo", "warranty_card", "chat_log", "email", "return_tracking"],
    "Property":   ["lease_agreement", "photo", "bank_statement", "inspection_report", "communication_proof", "receipt"],
    "Digital":    ["screenshot", "account_log", "terms_of_service", "email", "chat_log", "transaction_record"],
    "Workplace":  ["employment_contract", "email", "hr_record", "pay_slip", "chat_log", "witness_statement", "performance_review"],
}

# ─── Names & Locations for variety ────────────────────────────────────────────
NAMES = [
    "Aarav Sharma", "Vivaan Patel", "Aditya Singh", "Vihaan Kumar", "Arjun Verma",
    "Rian Renju", "Krishna Gupta", "Ishaan Joshi", "Yash Vijay Singh", "Ananya Mehta",
    "Diya Reddy", "Priya Nair", "Adonis Jeswin", "Riya Iyer", "Saanvi Rao",
    "Nimish Arekar", "Myra Mishra", "Sara Chauhan", "Romit Singh", "Aadhya Malhotra",
    "Kavya Kapoor", "Soni Chaudhary", "Isha Aggarwal", "Rahul Bhat", "Sandhya Chandel",
    "Amit Desai", "Disha Gupta", "Neha Pillai", "Anushree Verma", "Pooja Saxena",
    "Anjali Walekar", "Rohan Bansal", "Sneha Thakur", "Vikram Das", "Karan Joshi",
    "Meera Sharma", "Tanvi Patel", "Harsh Kumar", "Simran Singh", "Ayaan Verma",
]

MONTHS = ["January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"]


def random_name():
    return random.choice(NAMES)


def random_date_str():
    month = random.choice(MONTHS)
    day = random.randint(1, 28)
    return f"{month} {day}"


def random_amount(low, high):
    return round(random.uniform(low, high), 2)


# ─── Template Generators per Category ─────────────────────────────────────────

def gen_community():
    """Generate a Community/Society dispute."""
    scenarios = [
        {
            "claimant": (
                "My neighbour in {flat} has installed a large AC outdoor unit on the shared wall "
                "without society committee approval on {date}. The vibration and water dripping is "
                "damaging my wall and causing noise disturbance. I have {n_photos} photos and the "
                "society bylaws clearly state that common wall modifications require written approval "
                "from the maintenance committee. I have submitted a complaint to the secretary "
                "{name1} but no action has been taken for {weeks} weeks."
            ),
            "respondent": (
                "The AC unit was installed by a licensed technician following all safety norms. "
                "Several other residents including {name2} in {flat2} have similar installations. "
                "The noise level is within acceptable limits as per municipal guidelines. The "
                "society rules the claimant refers to were last updated {years} years ago and "
                "many units have been installed since without objection."
            ),
            "monetary": False,
            "outcome_weights": {"Claimant Justified": 0.55, "Respondent Justified": 0.20, "Compromise": 0.25},
        },
        {
            "claimant": (
                "The resident of {flat} has been parking their second vehicle in the visitor "
                "parking area every day since {date}, blocking access for actual visitors. I have "
                "CCTV footage from {n_photos} different dates and the parking allocation document "
                "clearly assigns one spot per flat. Other residents {name1} and {name2} have also "
                "complained about this."
            ),
            "respondent": (
                "I have been using the visitor spot only temporarily while my allocated parking "
                "spot is under repair due to water seepage from {date2}. The maintenance team has "
                "been informed and I expect the repair to complete within {weeks} days. I always "
                "move my car when an actual visitor needs the spot."
            ),
            "monetary": False,
            "outcome_weights": {"Claimant Justified": 0.40, "Respondent Justified": 0.25, "Compromise": 0.35},
        },
        {
            "claimant": (
                "Flat {flat} has been hosting loud parties every weekend past 11 PM since {date}, "
                "violating the society noise curfew rule. I have audio recordings from {n_photos} "
                "weekends and written complaints submitted to the society office. My elderly parents "
                "in {flat2} are also severely affected. The society secretary {name1} has issued "
                "a warning but it was ignored."
            ),
            "respondent": (
                "I hosted a gathering only {n_times} times in the past {weeks} weeks, not every "
                "weekend as claimed. The noise was within reasonable levels and we always stopped "
                "music by 10:30 PM. {name2} from the adjacent flat has confirmed we were not "
                "causing disturbance. The claimant has a personal grudge from a previous unrelated "
                "disagreement."
            ),
            "monetary": False,
            "outcome_weights": {"Claimant Justified": 0.50, "Respondent Justified": 0.20, "Compromise": 0.30},
        },
        {
            "claimant": (
                "The society maintenance team failed to fix the water leakage in my flat {flat} "
                "that was reported on {date}. Despite paying maintenance charges of Rs {amount} "
                "per month, the issue has persisted for {weeks} weeks causing damage to my "
                "furniture and walls. I have photos of the damage and all complaint receipts. "
                "{name1} from the committee acknowledged the issue but nothing was done."
            ),
            "respondent": (
                "The maintenance team inspected the flat on {date2} and determined the leakage "
                "is originating from the resident's own bathroom plumbing, not from common "
                "infrastructure. As per society rules, internal plumbing is the flat owner's "
                "responsibility. We provided a plumber referral and offered partial assistance. "
                "The damage to furniture is pre-existing as confirmed by {name2}."
            ),
            "monetary": True,
            "amount_range": (500, 15000),
            "outcome_weights": {"Claimant Justified": 0.35, "Respondent Justified": 0.35, "Compromise": 0.30},
        },
    ]
    return _build_from_scenario(random.choice(scenarios), "Community")


def gen_academic():
    """Generate an Academic dispute."""
    subjects = [
        "Digital Logic Design", "Data Structures", "Machine Learning",
        "Computer Networks", "Database Management", "Operating Systems",
        "Web Development", "Software Engineering", "Discrete Mathematics",
        "Artificial Intelligence", "Cloud Computing", "Cyber Security",
    ]
    scenarios = [
        {
            "claimant": (
                "I attended Professor {name1}'s {subject} class on {date}. I was present for "
                "the entire lecture and even participated in the discussion about {topic}. My "
                "classmate {name2} can verify my attendance. However, the attendance register "
                "shows me as absent. I have a screenshot of the seating arrangement and my notes "
                "from that day's lecture on {topic2}."
            ),
            "respondent": (
                "Attendance was taken using the biometric system at {time} as per department "
                "policy. The student's ID was not recorded on the biometric device until {time2}, "
                "which is {mins} minutes late. Our department policy allows a {grace}-minute "
                "grace period only. The attendance policy was clearly communicated in the course "
                "handout on Day 1."
            ),
            "monetary": False,
            "outcome_weights": {"Claimant Justified": 0.35, "Respondent Justified": 0.45, "Compromise": 0.20},
        },
        {
            "claimant": (
                "I submitted my {subject} project on {date} before the deadline of {deadline}. "
                "I have the submission confirmation email and the project was marked {original_marks}/{total} "
                "by Professor {name1}. However, another student {name2} submitted a very similar "
                "project after the deadline and received {higher_marks}/{total}. I believe the "
                "grading is unfair and inconsistent."
            ),
            "respondent": (
                "The grading rubric was published and followed consistently. The student's project "
                "had {issues} issues in the {component} section which were clearly marked in the "
                "feedback. {name2}'s project, while submitted {days} day(s) after with a {penalty}% "
                "late penalty applied, demonstrated superior {aspect} which earned additional marks. "
                "Each project was evaluated independently on merit."
            ),
            "monetary": False,
            "outcome_weights": {"Claimant Justified": 0.30, "Respondent Justified": 0.40, "Compromise": 0.30},
        },
        {
            "claimant": (
                "I was denied access to the {subject} lab on {date} by lab assistant {name1}, "
                "even though I am a registered student with valid lab enrollment. I needed to "
                "complete my practical assignment due on {deadline}. Other students including "
                "{name2} were allowed entry. I have the enrollment receipt and the lab schedule "
                "showing my designated slot."
            ),
            "respondent": (
                "The student's lab access was temporarily suspended because they had {n_pending} "
                "pending lab assignments and had not submitted the prerequisite safety module "
                "completion certificate as required since {date2}. All students were notified "
                "about this requirement via email on {date3}. {name2} had completed all "
                "prerequisites."
            ),
            "monetary": False,
            "outcome_weights": {"Claimant Justified": 0.25, "Respondent Justified": 0.50, "Compromise": 0.25},
        },
        {
            "claimant": (
                "My {subject} internal assessment marks were incorrectly entered as {wrong_marks}/{total} "
                "instead of {correct_marks}/{total}. I have my original answer sheet with the marks "
                "written by Professor {name1} and the class WhatsApp group screenshot where marks "
                "were announced. This error is affecting my SGPA calculation. I contacted {name2} "
                "from the exam cell on {date} but the correction has not been made."
            ),
            "respondent": (
                "The marks entry system shows {wrong_marks}/{total} as entered by the faculty on "
                "{date2}. The student did not raise a formal revaluation request within the "
                "{days}-day window as per university guidelines. The handwritten marks on the "
                "answer sheet cannot be verified as official without the faculty's confirmation, "
                "and Professor {name1} is currently on leave until {date3}."
            ),
            "monetary": False,
            "outcome_weights": {"Claimant Justified": 0.50, "Respondent Justified": 0.20, "Compromise": 0.30},
        },
    ]
    s = random.choice(scenarios)
    # Inject subject-specific placeholders
    subj = random.choice(subjects)
    s["_extra"] = {
        "subject": subj,
        "topic": f"chapter {random.randint(3,12)} concepts",
        "topic2": f"{subj} fundamentals",
        "time": f"{random.randint(8,10)}:{random.choice(['00','05','10'])} AM",
        "time2": f"{random.randint(9,10)}:{random.randint(15,50)} AM",
        "mins": str(random.randint(16, 35)),
        "grace": str(random.choice([10, 15, 20])),
        "original_marks": str(random.randint(55, 72)),
        "higher_marks": str(random.randint(75, 90)),
        "total": str(random.choice([100, 50, 30])),
        "deadline": random_date_str(),
        "issues": str(random.randint(2, 5)),
        "component": random.choice(["implementation", "documentation", "testing", "design"]),
        "days": str(random.randint(1, 3)),
        "penalty": str(random.choice([5, 10, 15])),
        "aspect": random.choice(["code quality", "algorithmic efficiency", "documentation", "UI design"]),
        "n_pending": str(random.randint(2, 4)),
        "wrong_marks": str(random.randint(30, 50)),
        "correct_marks": str(random.randint(65, 85)),
    }
    return _build_from_scenario(s, "Academic")


def gen_personal():
    """Generate a Personal dispute."""
    scenarios = [
        {
            "claimant": (
                "I lent my {item} to {name1} on {date} with the agreement that it would be "
                "returned within {weeks} weeks. It has now been {actual_weeks} weeks and despite "
                "multiple reminders via WhatsApp (I have chat screenshots), the item has not been "
                "returned. The {item} was in perfect condition when I gave it and is worth "
                "approximately Rs {amount}."
            ),
            "respondent": (
                "I borrowed the {item} with the understanding that there was no fixed return date. "
                "I have been planning to return it and have told {name2} so on {date2}. The item "
                "has a minor issue that occurred during normal use — the {defect} — and I offered "
                "to get it repaired before returning. I am not refusing to return it."
            ),
            "monetary": True,
            "amount_range": (500, 25000),
            "outcome_weights": {"Claimant Justified": 0.55, "Respondent Justified": 0.15, "Compromise": 0.30},
        },
        {
            "claimant": (
                "{name1} accidentally damaged my {item} during {event} on {date}. The {item} "
                "was worth Rs {amount} and is now unusable. I have photos of the damage and "
                "{name2} witnessed the incident. {name1} initially agreed to pay for the repair "
                "or replacement but has now stopped responding to my messages."
            ),
            "respondent": (
                "The damage to the {item} was accidental and occurred during a group activity where "
                "everyone was participating. I offered to contribute Rs {partial_amount} toward "
                "repair which I believe is fair since the {item} was already {condition} before the "
                "incident. The claimed value of Rs {amount} is significantly inflated — a similar "
                "used {item} costs Rs {actual_value} at most."
            ),
            "monetary": True,
            "amount_range": (1000, 30000),
            "outcome_weights": {"Claimant Justified": 0.40, "Respondent Justified": 0.20, "Compromise": 0.40},
        },
        {
            "claimant": (
                "{name1} promised to help me with {task} on {date} and I made arrangements "
                "accordingly — I cancelled my other plans and prepared everything needed. On the "
                "day, {name1} did not show up and did not inform me in advance. Because of this, "
                "I missed {consequence}. I have our WhatsApp conversation confirming the commitment."
            ),
            "respondent": (
                "I had an emergency on {date} and could not fulfil the commitment. I informed "
                "{name2} to pass the message. I apologized the next day and offered to help on "
                "an alternative date. The claimant's claim about {consequence} is exaggerated — "
                "there were other options available that they chose not to pursue."
            ),
            "monetary": False,
            "outcome_weights": {"Claimant Justified": 0.35, "Respondent Justified": 0.30, "Compromise": 0.35},
        },
    ]
    s = random.choice(scenarios)
    items = ["laptop", "camera", "bicycle", "gaming console", "textbook set",
             "hard drive", "tablet", "speaker", "watch", "drone"]
    events = ["a college fest", "a house party", "a trip", "a sports match", "a group study session"]
    tasks = ["shifting my furniture", "dropping me to the airport", "completing a group assignment",
             "setting up for an event", "recording a presentation"]
    consequences = ["an important appointment", "a job interview prep session",
                    "a family function", "a submission deadline", "a doctor's appointment"]
    defects = ["screen scratch", "dent on the side", "loose hinge", "missing accessory", "battery issue"]
    conditions = ["slightly worn", "a year old", "showing signs of use", "not brand new", "used regularly"]

    s["_extra"] = {
        "item": random.choice(items),
        "event": random.choice(events),
        "task": random.choice(tasks),
        "consequence": random.choice(consequences),
        "defect": random.choice(defects),
        "condition": random.choice(conditions),
        "weeks": str(random.randint(1, 4)),
        "actual_weeks": str(random.randint(5, 12)),
        "partial_amount": str(random.randint(500, 5000)),
        "actual_value": str(random.randint(2000, 15000)),
    }
    return _build_from_scenario(s, "Personal")


def gen_freelance():
    """Generate a Freelance/Contract dispute."""
    deliverables = [
        "React web application", "mobile app UI design", "WordPress e-commerce site",
        "Python automation scripts", "logo and brand identity", "SEO optimization package",
        "social media marketing campaign", "video editing project", "database migration",
        "API integration service", "Flutter mobile app", "cloud infrastructure setup",
    ]
    scenarios = [
        {
            "claimant": (
                "I completed the {deliverable} for {name1} as per the agreed scope on {date}. "
                "The deliverable was submitted with {coverage}% of requirements fulfilled and I "
                "have the signed contract, {n_revisions} revision emails, and the final approval "
                "message from {name1} on {date2}. However, the agreed payment of Rs {amount} "
                "has not been made despite {weeks} weeks of follow-up. I have {n_invoices} unpaid "
                "invoices and all communication records."
            ),
            "respondent": (
                "The delivered {deliverable} had significant quality issues including {issues}. "
                "I requested corrections on {date3} which were only partially addressed. The "
                "final product does not match the mockups and specifications agreed upon. I offered "
                "to pay Rs {partial} for the work completed satisfactorily but the freelancer "
                "insists on full payment despite the deficiencies."
            ),
            "monetary": True,
            "amount_range": (5000, 200000),
            "outcome_weights": {"Claimant Justified": 0.45, "Respondent Justified": 0.25, "Compromise": 0.30},
        },
        {
            "claimant": (
                "{name1} hired me for a {deliverable} project on {date} with a deadline of "
                "{deadline}. I delivered the first milestone on time and received positive feedback. "
                "However, after delivering milestone 2, the client changed the scope entirely "
                "adding {n_new} new requirements not in the original contract. When I quoted "
                "additional Rs {extra_amount} for the scope change, the client refused and "
                "terminated the project without paying the remaining Rs {amount} for completed work."
            ),
            "respondent": (
                "The scope changes were minor clarifications that were implied in the original "
                "brief. A competent professional should have anticipated these requirements. The "
                "quality of milestone 2 was below expectations — {issues}. I paid Rs {paid} for "
                "milestone 1 which was fair. The freelancer is demanding payment for incomplete "
                "and substandard work."
            ),
            "monetary": True,
            "amount_range": (10000, 150000),
            "outcome_weights": {"Claimant Justified": 0.50, "Respondent Justified": 0.20, "Compromise": 0.30},
        },
        {
            "claimant": (
                "I was hired by {name1} for ongoing {deliverable} work at Rs {amount}/month. "
                "After {months} months of satisfactory work confirmed by performance reviews, "
                "my contract was terminated on {date} without the {notice_period}-day notice "
                "period mentioned in our agreement. I am owed Rs {owed} for the notice period "
                "and {days} days of unpaid work."
            ),
            "respondent": (
                "The freelancer's recent work quality declined significantly — {issues}. Multiple "
                "deadlines were missed and client feedback was negative. The contract's termination "
                "clause allows immediate termination for cause under section {section}. Payment for "
                "completed days has been processed; the notice period does not apply in performance-"
                "based termination cases."
            ),
            "monetary": True,
            "amount_range": (15000, 100000),
            "outcome_weights": {"Claimant Justified": 0.35, "Respondent Justified": 0.35, "Compromise": 0.30},
        },
    ]
    s = random.choice(scenarios)
    issues_pool = [
        "broken responsive layout on mobile", "slow page load times exceeding 8 seconds",
        "missing form validation", "SQL injection vulnerabilities", "incorrect colour scheme",
        "missing 3 pages from the agreed sitemap", "non-functional payment gateway",
        "plagiarized design elements", "missing API documentation", "untested edge cases",
    ]
    s["_extra"] = {
        "deliverable": random.choice(deliverables),
        "coverage": str(random.randint(85, 99)),
        "n_revisions": str(random.randint(2, 6)),
        "n_invoices": str(random.randint(1, 3)),
        "issues": random.choice(issues_pool),
        "partial": str(random.randint(5000, 50000)),
        "deadline": random_date_str(),
        "n_new": str(random.randint(3, 8)),
        "extra_amount": str(random.randint(5000, 40000)),
        "paid": str(random.randint(5000, 30000)),
        "months": str(random.randint(3, 12)),
        "notice_period": str(random.choice([15, 30, 45])),
        "owed": str(random.randint(10000, 60000)),
        "days": str(random.randint(3, 15)),
        "section": str(random.choice(["4.2", "5.1", "3.b", "7.3", "6.a"])),
    }
    return _build_from_scenario(s, "Freelance")


def gen_consumer():
    """Generate a Consumer/Buyer-Seller dispute."""
    products = [
        "wireless earbuds", "smartphone", "laptop", "running shoes", "office chair",
        "washing machine", "air purifier", "smartwatch", "backpack", "gaming keyboard",
        "mixer grinder", "refrigerator", "LED TV", "water purifier", "microwave oven",
    ]
    platforms = ["Amazon", "Flipkart", "Myntra", "an online store", "a local shop",
                 "Meesho", "Snapdeal", "a D2C brand website"]
    scenarios = [
        {
            "claimant": (
                "I purchased a {product} from {platform} on {date} for Rs {amount}. The product "
                "arrived with {defect} and does not match the description. I raised a return "
                "request on {date2} with order ID #{order_id} and {n_photos} photos of the defect. "
                "The seller rejected the return claiming {rejection_reason}. The product is within "
                "the {warranty}-day return window."
            ),
            "respondent": (
                "The product was shipped in perfect condition with quality checks documented. The "
                "reported {defect} appears to be caused by mishandling after delivery. Our return "
                "policy clearly states that {policy}. The customer's photos show signs of usage "
                "beyond initial inspection. We offered a {discount}% discount on next purchase as "
                "goodwill gesture."
            ),
            "monetary": True,
            "amount_range": (500, 80000),
            "outcome_weights": {"Claimant Justified": 0.50, "Respondent Justified": 0.20, "Compromise": 0.30},
        },
        {
            "claimant": (
                "I ordered a {product} (model: {model}) on {date} but received a different, "
                "inferior model. The listing showed {feature} but the received product lacks it. "
                "I have screenshots of the original listing, the delivery package, and unboxing "
                "video. The seller is refusing a full refund of Rs {amount} and offering only "
                "an exchange with a {days}-day wait time."
            ),
            "respondent": (
                "Due to a temporary inventory issue, a comparable model was shipped as a substitute. "
                "The customer was notified via email on {date2} about the substitution with an option "
                "to cancel. The substitute model has equivalent specifications and is valued at "
                "Rs {sub_value} — actually higher than the original order. We are offering an "
                "immediate exchange or store credit."
            ),
            "monetary": True,
            "amount_range": (1000, 50000),
            "outcome_weights": {"Claimant Justified": 0.55, "Respondent Justified": 0.15, "Compromise": 0.30},
        },
    ]
    s = random.choice(scenarios)
    defects = ["a cracked screen", "missing components", "wrong colour", "visible scratches",
               "non-functional buttons", "a dent on the body", "defective charging port"]
    rejection_reasons = ["physical damage is not covered", "return window expired",
                         "product was used", "packaging was opened"]
    policies = ["physical damage is customer responsibility after delivery",
                "returns require original packaging", "used products cannot be returned"]
    features = ["120Hz AMOLED display", "noise cancellation", "premium build material",
                "fast charging support", "wireless connectivity", "1-year extended warranty"]
    s["_extra"] = {
        "product": random.choice(products),
        "platform": random.choice(platforms),
        "order_id": f"{random.randint(100,999)}-{random.randint(1000000,9999999)}",
        "defect": random.choice(defects),
        "rejection_reason": random.choice(rejection_reasons),
        "warranty": str(random.choice([7, 10, 15, 30])),
        "policy": random.choice(policies),
        "discount": str(random.choice([10, 15, 20])),
        "model": f"v{random.randint(2,9)}.{random.randint(0,5)}",
        "feature": random.choice(features),
        "days": str(random.randint(7, 21)),
        "sub_value": str(random.randint(2000, 60000)),
    }
    return _build_from_scenario(s, "Consumer")


def gen_property():
    """Generate a Property/Rental dispute."""
    scenarios = [
        {
            "claimant": (
                "I vacated the rented flat at {address} on {date} after completing the "
                "{months}-month lease. The security deposit of Rs {amount} has not been returned "
                "by the landlord {name1} despite {weeks} weeks. The flat was handed over in "
                "clean condition with all fixtures intact. I have the move-in and move-out photos, "
                "the original lease agreement, and the deposit receipt."
            ),
            "respondent": (
                "The tenant left the property with {damages}. The repair cost is estimated at "
                "Rs {repair_cost} as per the contractor's quote. Additionally, there are "
                "Rs {utility_dues} in unpaid utility bills from {month}. After deducting these "
                "amounts, the refundable deposit is Rs {refundable}. I have photos of the "
                "damages and the contractor's estimate."
            ),
            "monetary": True,
            "amount_range": (10000, 200000),
            "outcome_weights": {"Claimant Justified": 0.35, "Respondent Justified": 0.30, "Compromise": 0.35},
        },
        {
            "claimant": (
                "My landlord {name1} is demanding that I vacate the property at {address} within "
                "{days} days without proper notice. The lease agreement specifies a {notice_period}-day "
                "notice period. I have been a responsible tenant paying Rs {amount}/month rent on time "
                "for {months} months. I have all payment receipts and the lease document. The landlord "
                "wants to sell the property and is pressuring me to leave early."
            ),
            "respondent": (
                "The tenant was informed {actual_days} days ago about the need to vacate. The "
                "property requires urgent structural repairs that cannot be done with occupants. "
                "I offered Rs {compensation} as relocation assistance and an additional {extra_days} "
                "days beyond the notice. The tenant has been causing {issue} which was reported by "
                "neighbours on {date}."
            ),
            "monetary": True,
            "amount_range": (5000, 50000),
            "outcome_weights": {"Claimant Justified": 0.45, "Respondent Justified": 0.25, "Compromise": 0.30},
        },
    ]
    s = random.choice(scenarios)
    addresses = ["A-204, Green Valley Apartments", "Flat 12B, Sunrise Residency",
                 "House 45, Sector 22", "B-301, Lakeside Tower", "3rd Floor, MG Road Complex"]
    damages_pool = ["wall paint damage and nail holes", "broken bathroom fixtures",
                    "kitchen platform stains and cabinet damage", "cracked floor tiles",
                    "damaged window frames and torn curtains"]
    issues_pool = ["noise complaints", "unauthorized subletting", "pet-related damage",
                   "modification without permission", "frequent late-night gatherings"]
    s["_extra"] = {
        "address": random.choice(addresses),
        "months": str(random.randint(6, 36)),
        "repair_cost": str(random.randint(5000, 40000)),
        "utility_dues": str(random.randint(1000, 8000)),
        "refundable": str(random.randint(2000, 30000)),
        "month": random.choice(MONTHS),
        "days": str(random.randint(5, 15)),
        "notice_period": str(random.choice([30, 60, 90])),
        "actual_days": str(random.randint(10, 25)),
        "compensation": str(random.randint(5000, 30000)),
        "extra_days": str(random.randint(7, 20)),
        "damages": random.choice(damages_pool),
        "issue": random.choice(issues_pool),
    }
    return _build_from_scenario(s, "Property")


def gen_digital():
    """Generate a Digital/Platform dispute."""
    platforms = ["Instagram", "YouTube", "Twitter/X", "Discord", "Steam",
                 "a gaming platform", "an online marketplace", "a SaaS tool"]
    scenarios = [
        {
            "claimant": (
                "My account on {platform} (username: {username}) was permanently banned on {date} "
                "without any warning or explanation. I had {followers} followers and {years} years "
                "of content. I did not violate any community guidelines — my last post was about "
                "{topic}. I have screenshots of my content and the ban notification. I appealed "
                "on {date2} but received an automated rejection."
            ),
            "respondent": (
                "The account was flagged by our automated moderation system for {violation} on "
                "{date3}. This is a clear violation of Section {section} of our Terms of Service. "
                "The account had received {n_warnings} prior warnings on {dates}. Our moderation "
                "team reviewed the appeal and confirmed the violation. The ban is consistent with "
                "our enforcement policy."
            ),
            "monetary": False,
            "outcome_weights": {"Claimant Justified": 0.30, "Respondent Justified": 0.40, "Compromise": 0.30},
        },
        {
            "claimant": (
                "I purchased a digital subscription on {platform} for Rs {amount}/year on {date}. "
                "The service was discontinued without notice on {date2} — {months} months before "
                "my subscription expires. I was not offered a refund or alternative. I have the "
                "payment receipt and the original service description which promises {feature}. "
                "{n_users} other users have reported the same issue."
            ),
            "respondent": (
                "The service transition was announced via email on {date3}, {days} days before "
                "the change. All active subscribers were offered migration to our new {new_service} "
                "plan at no additional cost, which includes enhanced features. The original terms "
                "state that services may be modified with {notice_days}-day notice. A pro-rata "
                "refund option was available until {deadline}."
            ),
            "monetary": True,
            "amount_range": (500, 15000),
            "outcome_weights": {"Claimant Justified": 0.40, "Respondent Justified": 0.25, "Compromise": 0.35},
        },
    ]
    s = random.choice(scenarios)
    violations = ["spam behaviour", "hate speech", "copyright infringement",
                  "suspicious activity", "multiple account usage", "bot-like behaviour"]
    topics = ["travel photography", "cooking recipes", "tech reviews", "fitness tips",
              "educational content", "gaming highlights"]
    s["_extra"] = {
        "platform": random.choice(platforms),
        "username": f"user_{random.randint(1000,9999)}",
        "followers": str(random.randint(500, 50000)),
        "years": str(random.randint(1, 6)),
        "topic": random.choice(topics),
        "violation": random.choice(violations),
        "section": f"{random.randint(3,9)}.{random.randint(1,5)}",
        "n_warnings": str(random.randint(0, 3)),
        "dates": f"{random_date_str()} and {random_date_str()}",
        "months": str(random.randint(3, 9)),
        "feature": random.choice(["unlimited cloud storage", "ad-free experience",
                                  "premium analytics", "priority support"]),
        "n_users": str(random.randint(50, 500)),
        "new_service": random.choice(["Premium Plus", "Pro Tier", "Enterprise Lite"]),
        "days": str(random.randint(7, 30)),
        "notice_days": str(random.choice([15, 30, 60])),
        "deadline": random_date_str(),
    }
    return _build_from_scenario(s, "Digital")


def gen_workplace():
    """Generate a Workplace dispute."""
    roles = ["Software Developer", "Marketing Executive", "Graphic Designer",
             "Data Analyst", "Content Writer", "HR Coordinator", "Sales Associate",
             "Operations Manager", "QA Engineer", "Product Manager"]
    scenarios = [
        {
            "claimant": (
                "I was terminated from my position as {role} at {company} on {date} without "
                "the {notice_period}-day notice period specified in my employment contract. My "
                "last {months} performance reviews were rated '{rating}'. I am owed Rs {amount} "
                "for the notice period and {days} days of unused leave. I have my offer letter, "
                "performance reviews, and the termination email."
            ),
            "respondent": (
                "The employee's role was eliminated as part of a company-wide restructuring "
                "affecting {n_employees} positions. A severance package of Rs {severance} "
                "({n_months} months' salary) was offered as per company policy. The restructuring "
                "was communicated to all department heads on {date2}. The performance rating is "
                "not relevant to a restructuring-based separation."
            ),
            "monetary": True,
            "amount_range": (20000, 300000),
            "outcome_weights": {"Claimant Justified": 0.40, "Respondent Justified": 0.30, "Compromise": 0.30},
        },
        {
            "claimant": (
                "My manager {name1} has been taking credit for my work on the {project} project "
                "since {date}. I designed and implemented the {component} which {achievement}. "
                "In the team presentation to {audience} on {date2}, my contribution was presented "
                "as {name1}'s work. I have git commits, email threads, and {name2} as a witness "
                "who worked with me on the project."
            ),
            "respondent": (
                "The {project} project was a collaborative team effort where I provided direction, "
                "architecture decisions, and code reviews. The employee contributed to {component} "
                "under my guidance as is standard in a team structure. The presentation credited "
                "the entire team. Individual contributions are acknowledged in the project "
                "documentation and performance reviews."
            ),
            "monetary": False,
            "outcome_weights": {"Claimant Justified": 0.45, "Respondent Justified": 0.25, "Compromise": 0.30},
        },
        {
            "claimant": (
                "I have not received my salary of Rs {amount} for {months} month(s) — {month_names}. "
                "I am working as a {role} at {company} and my salary is due on the {pay_day}th of "
                "every month. I have raised this with HR ({name1}) on {date} and {date2} but only "
                "received promises. I have my appointment letter, bank statements showing no "
                "credit, and email follow-ups."
            ),
            "respondent": (
                "The company experienced a temporary cash flow issue due to {reason}. We have "
                "communicated the situation to all affected employees. A payment plan has been "
                "proposed: Rs {installment} will be paid immediately and the remainder over "
                "{n_installments} installments. {n_other} other employees have accepted this "
                "arrangement. We are committed to clearing all dues by {deadline}."
            ),
            "monetary": True,
            "amount_range": (15000, 200000),
            "outcome_weights": {"Claimant Justified": 0.60, "Respondent Justified": 0.10, "Compromise": 0.30},
        },
    ]
    s = random.choice(scenarios)
    companies = ["TechNova Solutions", "BrightPath Innovations", "CoreStack Systems",
                 "Pixel Craft Studios", "DataVerse Analytics", "CloudSync Technologies"]
    projects = ["inventory management system", "customer dashboard", "analytics pipeline",
                "mobile app redesign", "payment integration", "automated testing framework"]
    achievements = ["reduced processing time by 40%", "increased user engagement by 25%",
                    "automated 3 manual workflows", "fixed 12 critical bugs",
                    "designed the entire UI flow", "built the core API layer"]
    audiences = ["the CTO", "senior leadership", "the client team", "the board", "investors"]
    reasons = ["a delayed client payment", "market conditions", "a failed funding round",
               "seasonal revenue dip", "project cancellation by a major client"]

    s["_extra"] = {
        "role": random.choice(roles),
        "company": random.choice(companies),
        "notice_period": str(random.choice([15, 30, 60, 90])),
        "months": str(random.randint(1, 3)),
        "rating": random.choice(["Exceeds Expectations", "Meets Expectations", "Outstanding"]),
        "days": str(random.randint(5, 25)),
        "n_employees": str(random.randint(5, 30)),
        "severance": str(random.randint(30000, 200000)),
        "n_months": str(random.randint(1, 3)),
        "project": random.choice(projects),
        "component": random.choice(["backend architecture", "frontend UI", "database schema",
                                     "API endpoints", "testing suite", "deployment pipeline"]),
        "achievement": random.choice(achievements),
        "audience": random.choice(audiences),
        "pay_day": str(random.choice([1, 5, 7, 10, 15])),
        "month_names": f"{random.choice(MONTHS)} and {random.choice(MONTHS)}",
        "reason": random.choice(reasons),
        "installment": str(random.randint(10000, 50000)),
        "n_installments": str(random.randint(2, 4)),
        "n_other": str(random.randint(5, 20)),
        "deadline": random_date_str(),
    }
    return _build_from_scenario(s, "Workplace")


# ─── Core Builder ─────────────────────────────────────────────────────────────

GENERATORS = {
    "Community": gen_community,
    "Academic": gen_academic,
    "Personal": gen_personal,
    "Freelance": gen_freelance,
    "Consumer": gen_consumer,
    "Property": gen_property,
    "Digital": gen_digital,
    "Workplace": gen_workplace,
}


def _build_from_scenario(scenario, category):
    """Fill a scenario template with random values and produce a labeled row."""
    name1 = random_name()
    name2 = random_name()
    date1 = random_date_str()
    date2 = random_date_str()
    date3 = random_date_str()
    flat1 = f"{random.choice('ABCDE')}-{random.randint(101,505)}"
    flat2 = f"{random.choice('ABCDE')}-{random.randint(101,505)}"
    weeks = random.randint(2, 12)
    n_photos = random.randint(2, 8)

    # Determine monetary aspects
    is_monetary = scenario.get("monetary", False)
    if is_monetary:
        low, high = scenario.get("amount_range", (1000, 50000))
        amount = random_amount(low, high)
    else:
        amount = 0.0

    # Substitution dictionary
    subs = {
        "name1": name1, "name2": name2,
        "date": date1, "date2": date2, "date3": date3,
        "flat": flat1, "flat2": flat2,
        "weeks": str(weeks), "n_photos": str(n_photos),
        "amount": str(int(amount)) if amount else "0",
        "years": str(random.randint(2, 8)),
        "n_times": str(random.randint(2, 4)),
    }
    # Merge category-specific extras
    if "_extra" in scenario:
        subs.update(scenario["_extra"])

    # Fill templates
    claimant_text = scenario["claimant"].format(**subs)
    respondent_text = scenario["respondent"].format(**subs)

    # Evidence generation
    ev_pool = EVIDENCE_TYPES_POOL.get(category, ["document", "screenshot"])
    evidence_count = random.randint(1, min(5, len(ev_pool)))
    evidence_types = random.sample(ev_pool, evidence_count)

    # Boolean evidence flags
    has_written_agreement = any(t in evidence_types for t in
        ["contract", "lease_agreement", "employment_contract", "society_rules", "terms_of_service", "syllabus"])
    has_communication_proof = any(t in evidence_types for t in
        ["email", "chat_log", "complaint_letter", "voice_recording"])
    has_visual_proof = any(t in evidence_types for t in
        ["photo", "video", "screenshot", "product_photo"])
    has_witness = any(t in evidence_types for t in
        ["witness_statement"])
    has_official_record = any(t in evidence_types for t in
        ["attendance_record", "bank_statement", "receipt", "pay_slip", "hr_record",
         "payment_receipt", "return_tracking", "account_log", "performance_review"])
    has_timeline_proof = any(t in evidence_types for t in
        ["transaction_record", "biometric_log_screenshot", "noise_measurement",
         "inspection_report", "milestone_report", "delivery_proof"])

    # Determine outcome based on scenario priors and empirical evidence strength
    outcome_weights = scenario["outcome_weights"]
    c_weight = outcome_weights.get("Claimant Justified", 0.40)
    r_weight = outcome_weights.get("Respondent Justified", 0.30)
    cmp_weight = outcome_weights.get("Compromise", 0.30)

    # High-Fidelity Arbitration Preponderance of Evidence Engine
    # 1. Claimant evidentiary strength (formal proof, contracts, official documents)
    claimant_score = (
        (3.0 if has_written_agreement else 0.0) +
        (3.2 if has_official_record else 0.0) +
        (1.5 if has_timeline_proof else 0.0) +
        (1.2 if has_visual_proof else 0.0) +
        (0.8 if has_witness else 0.0)
    )

    # 2. Respondent rebuttal strength (unsubstantiated claims, counter-records, lack of contract)
    respondent_score = (
        (3.5 if not has_written_agreement and not has_official_record else 0.0) +
        (2.0 if evidence_count <= 1 else 0.0) +
        (1.5 if not has_visual_proof and not has_timeline_proof else 0.0)
    )

    # 3. Compromise indicator (informal communication, partial proof, verbal agreements, mutual responsibility)
    compromise_score = (
        (3.5 if has_communication_proof and (not has_written_agreement or not has_official_record) else 0.0) +
        (2.0 if has_witness and not has_official_record else 0.0) +
        (1.8 if evidence_count == 2 and not has_official_record else 0.0)
    )

    # Prior baseline weights from scenario
    c_base = scenario["outcome_weights"].get("Claimant Justified", 0.40) * 4.0
    r_base = scenario["outcome_weights"].get("Respondent Justified", 0.30) * 4.0
    cmp_base = scenario["outcome_weights"].get("Compromise", 0.30) * 4.0

    c_total = c_base + claimant_score
    r_total = r_base + respondent_score
    cmp_total = cmp_base + compromise_score

    # Decisive legal determination with 5% human jury variance
    if random.random() < 0.05:
        outcome = random.choice(["Claimant Justified", "Respondent Justified", "Compromise"])
    else:
        # Require decisive margin for complete claimant win vs compromise
        if has_written_agreement and has_official_record:
            outcome = "Claimant Justified"
        elif c_total > r_total + 1.2 and c_total > cmp_total + 0.8:
            outcome = "Claimant Justified"
        elif r_total > c_total + 0.5 and r_total > cmp_total + 0.5:
            outcome = "Respondent Justified"
        else:
            outcome = "Compromise"

    # Confidence: correlated with evidence strength
    evidence_strength = sum([
        has_written_agreement * 15,
        has_communication_proof * 10,
        has_visual_proof * 12,
        has_witness * 8,
        has_official_record * 12,
        has_timeline_proof * 10,
        evidence_count * 5,
    ])
    base_confidence = random.randint(55, 70)
    confidence = min(95, base_confidence + evidence_strength // 4 + random.randint(-5, 10))

    # Severity: based on amount and category
    if is_monetary and amount > 100000:
        severity = random.choices(["CRITICAL", "HIGH", "MODERATE"], weights=[0.5, 0.35, 0.15], k=1)[0]
    elif is_monetary and amount > 20000:
        severity = random.choices(["HIGH", "MODERATE", "LOW"], weights=[0.4, 0.45, 0.15], k=1)[0]
    elif is_monetary:
        severity = random.choices(["MODERATE", "LOW", "HIGH"], weights=[0.5, 0.35, 0.15], k=1)[0]
    else:
        severity = random.choices(["MODERATE", "LOW", "HIGH"], weights=[0.45, 0.40, 0.15], k=1)[0]

    return {
        "dispute_id": f"RSLV-2026-{random.randint(1, 9999):04d}",
        "category": category,
        "claimant_statement": claimant_text,
        "respondent_statement": respondent_text,
        "evidence_count": evidence_count,
        "evidence_types": "|".join(evidence_types),  # pipe-separated for CSV
        "is_monetary": is_monetary,
        "dispute_amount": amount,
        "has_written_agreement": has_written_agreement,
        "has_communication_proof": has_communication_proof,
        "has_visual_proof": has_visual_proof,
        "has_witness": has_witness,
        "has_official_record": has_official_record,
        "has_timeline_proof": has_timeline_proof,
        "outcome": outcome,
        "confidence": confidence,
        "severity": severity,
    }


# ─── Main Generator ──────────────────────────────────────────────────────────

def generate_dataset(n_total=4000, train_ratio=0.8, output_dir=None):
    """Generate the full synthetic dispute dataset."""
    if output_dir is None:
        output_dir = os.path.dirname(os.path.abspath(__file__))

    os.makedirs(output_dir, exist_ok=True)

    n_per_category = n_total // len(CATEGORIES)
    remainder = n_total - (n_per_category * len(CATEGORIES))

    print(f"[Dataset Generator] Generating {n_total} disputes across {len(CATEGORIES)} categories...")
    print(f"  -> {n_per_category} per category (+{remainder} extra distributed randomly)")

    all_rows = []

    for cat in CATEGORIES:
        gen_func = GENERATORS[cat]
        count = n_per_category + (1 if CATEGORIES.index(cat) < remainder else 0)
        for _ in range(count):
            row = gen_func()
            all_rows.append(row)
        print(f"  [OK] {cat}: {count} disputes generated")

    # Shuffle
    random.shuffle(all_rows)

    # Split train/test
    split_idx = int(len(all_rows) * train_ratio)
    train_rows = all_rows[:split_idx]
    test_rows = all_rows[split_idx:]

    # CSV headers
    headers = [
        "dispute_id", "category",
        "claimant_statement", "respondent_statement",
        "evidence_count", "evidence_types",
        "is_monetary", "dispute_amount",
        "has_written_agreement", "has_communication_proof",
        "has_visual_proof", "has_witness",
        "has_official_record", "has_timeline_proof",
        "outcome", "confidence", "severity",
    ]

    # Write train CSV
    train_path = os.path.join(output_dir, "disputes_train.csv")
    with open(train_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(train_rows)

    # Write test CSV
    test_path = os.path.join(output_dir, "disputes_test.csv")
    with open(test_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(test_rows)

    # Print summary
    print(f"\n{'='*60}")
    print(f"  DATASET GENERATION COMPLETE")
    print(f"{'='*60}")
    print(f"  Total disputes:  {len(all_rows)}")
    print(f"  Training set:    {len(train_rows)} -> {train_path}")
    print(f"  Test set:        {len(test_rows)} -> {test_path}")
    print()

    # Distribution stats
    from collections import Counter
    cat_counts = Counter(r["category"] for r in all_rows)
    outcome_counts = Counter(r["outcome"] for r in all_rows)
    severity_counts = Counter(r["severity"] for r in all_rows)
    monetary_counts = Counter(r["is_monetary"] for r in all_rows)

    print("  Category Distribution:")
    for cat, count in sorted(cat_counts.items()):
        print(f"    {cat:20s}: {count:4d} ({count/len(all_rows)*100:.1f}%)")

    print("\n  Outcome Distribution:")
    for outcome, count in sorted(outcome_counts.items()):
        print(f"    {outcome:25s}: {count:4d} ({count/len(all_rows)*100:.1f}%)")

    print("\n  Severity Distribution:")
    for sev, count in sorted(severity_counts.items()):
        print(f"    {sev:10s}: {count:4d} ({count/len(all_rows)*100:.1f}%)")

    print(f"\n  Monetary Disputes: {monetary_counts[True]} ({monetary_counts[True]/len(all_rows)*100:.1f}%)")
    print(f"  Non-Monetary:      {monetary_counts[False]} ({monetary_counts[False]/len(all_rows)*100:.1f}%)")

    return train_path, test_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate synthetic dispute dataset for Resolvia ML training")
    parser.add_argument("--out", type=str, default=None, help="Output directory for CSV files")
    parser.add_argument("--count", type=int, default=4000, help="Total number of disputes to generate")
    parser.add_argument("--split", type=float, default=0.8, help="Train/test split ratio")
    args = parser.parse_args()

    generate_dataset(n_total=args.count, train_ratio=args.split, output_dir=args.out)
