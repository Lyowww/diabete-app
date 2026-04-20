from __future__ import annotations

import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Final

DISCLAIMER: Final[str] = (
    "This predictor mirrors the supplied Python logistic regression trained on the "
    "Pima Indians Diabetes Dataset with a glucose/BMI copula adjustment. It is an "
    "educational screening aid, not a diagnosis."
)

FEATURE_KEYS: Final[tuple[str, ...]] = (
    "pregnancies",
    "glucose",
    "bloodPressure",
    "skinThickness",
    "insulin",
    "bmi",
    "diabetesPedigreeFunction",
    "age",
)

MODEL_DRIVER_KEYS: Final[tuple[str, ...]] = (
    "glucose",
    "bmi",
    "diabetesPedigreeFunction",
    "age",
    "pregnancies",
    "skinThickness",
)

IMPUTED_FIELDS: Final[tuple[str, ...]] = (
    "glucose",
    "bloodPressure",
    "skinThickness",
    "insulin",
    "bmi",
)

FIELD_ALIASES: Final[dict[str, tuple[str, ...]]] = {
    "pregnancies": ("pregnancies",),
    "glucose": ("glucose",),
    "bloodPressure": ("bloodPressure", "blood_pressure"),
    "skinThickness": ("skinThickness", "skin_thickness"),
    "insulin": ("insulin",),
    "bmi": ("bmi",),
    "diabetesPedigreeFunction": ("diabetesPedigreeFunction", "dpf", "diabetes_pedigree_function"),
    "age": ("age",),
}

FIELD_RULES: Final[dict[str, dict[str, Any]]] = {
    "pregnancies": {"min": 0, "max": 20, "integer": True},
    "glucose": {"min": 0, "max": 300, "integer": False},
    "bloodPressure": {"min": 0, "max": 250, "integer": False},
    "skinThickness": {"min": 0, "max": 100, "integer": False},
    "insulin": {"min": 0, "max": 1000, "integer": False},
    "bmi": {"min": 0, "max": 80, "integer": False},
    "diabetesPedigreeFunction": {"min": 0, "max": 3, "integer": False},
    "age": {"min": 18, "max": 120, "integer": True},
}

PARAMETERS = json.loads(
    (Path(__file__).resolve().parent / "lib" / "pima-model-parameters.json").read_text(encoding="utf-8")
)


class InputError(ValueError):
    """Raised when the input payload is missing or invalid."""


def clamp(value: float, minimum: float, maximum: float) -> float:
    return min(maximum, max(minimum, value))


def sigmoid(value: float) -> float:
    return 1.0 / (1.0 + math.exp(-value))


def get_risk_level(probability: float) -> str:
    if probability >= 0.55:
        return "high"
    if probability >= 0.25:
        return "moderate"
    return "low"


def get_impact(importance: float) -> str:
    if importance >= 0.8:
        return "strong"
    if importance >= 0.3:
        return "elevated"
    return "watch"


def format_label(labels: list[str]) -> str:
    if not labels:
        return ""
    if len(labels) == 1:
        return labels[0]
    if len(labels) == 2:
        return f"{labels[0]} and {labels[1]}"
    return f"{', '.join(labels[:-1])}, and {labels[-1]}"


def frank_copula_adjustment(u: float, v: float) -> float:
    theta = PARAMETERS["theta"]
    if theta == 0:
        return u * v

    numerator = (math.exp(-theta * u) - 1) * (math.exp(-theta * v) - 1)
    denominator = math.exp(-theta) - 1
    return -(1 / theta) * math.log(1 + numerator / denominator)


def to_number(value: Any, field: str) -> float:
    if isinstance(value, bool):
        raise InputError(f"{field} must be numeric.")

    try:
        number = float(value)
    except (TypeError, ValueError) as exc:
        raise InputError(f"{field} must be numeric.") from exc

    if not math.isfinite(number):
        raise InputError(f"{field} must be finite.")

    return number


def normalize_payload(payload: Any) -> dict[str, float]:
    if not isinstance(payload, dict):
        raise InputError("Prediction input must be a JSON object.")

    raw_input = payload.get("input", payload)
    if not isinstance(raw_input, dict):
        raise InputError("Prediction input must be an object of model fields.")

    normalized: dict[str, float] = {}

    for field in FEATURE_KEYS:
        alias_values = [raw_input.get(alias) for alias in FIELD_ALIASES[field] if alias in raw_input]
        if not alias_values:
            raise InputError(f"Missing required field: {field}.")

        number = to_number(alias_values[0], field)
        rule = FIELD_RULES[field]

        if rule["integer"]:
            if not number.is_integer():
                raise InputError(f"{field} must be a whole number.")
            number = int(number)

        if number < rule["min"] or number > rule["max"]:
            raise InputError(
                f"{field} must be between {rule['min']} and {rule['max']}."
            )

        normalized[field] = number

    return normalized


def normalize_input(values: dict[str, float]) -> tuple[dict[str, float], list[str]]:
    normalized = dict(values)
    imputed_fields: list[str] = []

    for field in IMPUTED_FIELDS:
        if normalized[field] <= 0:
            normalized[field] = PARAMETERS["medians"][field]
            imputed_fields.append(field)

    return normalized, imputed_fields


def get_standardized_value(values: dict[str, float], field: str) -> float:
    return (values[field] - PARAMETERS["scalerMean"][field]) / PARAMETERS["scalerScale"][field]


def compute_probability(values: dict[str, float]) -> tuple[float, float]:
    logit = PARAMETERS["intercept"]

    for field in FEATURE_KEYS:
        logit += get_standardized_value(values, field) * PARAMETERS["coefficients"][field]

    base_probability = sigmoid(logit)
    synergy_adjustment = frank_copula_adjustment(
        clamp(values["glucose"] / 250.0, 0.0, 0.99),
        clamp(values["bmi"] / 60.0, 0.0, 0.99),
    )
    final_probability = clamp(base_probability + synergy_adjustment * 0.2, 0.01, 0.99)
    return base_probability, final_probability


def build_feature_detail(field: str, value: float) -> str:
    if field == "glucose":
        return (
            f"Glucose of {value:.0f} mg/dL sat above the model's average "
            "and was a major upward driver."
        )
    if field == "bmi":
        return (
            f"BMI of {value:.1f} was above the training-set center and increased "
            "the estimated odds."
        )
    if field == "diabetesPedigreeFunction":
        return (
            f"A diabetes pedigree function of {value:.2f} raised the score, "
            "reflecting a stronger family-history signal in the source dataset."
        )
    if field == "age":
        return f"Age {value:.0f} was above the model's average adult age and nudged risk higher."
    if field == "pregnancies":
        return (
            f"Pregnancy count of {value:.0f} was above the cohort average and "
            "added to the model score."
        )
    return f"Skin thickness of {value:.0f} mm slightly increased the score in this model."


def build_contributors(values: dict[str, float], synergy_adjustment: float) -> list[dict[str, str]]:
    candidates: list[dict[str, Any]] = []

    for field in MODEL_DRIVER_KEYS:
        contribution = get_standardized_value(values, field) * PARAMETERS["coefficients"][field]
        if contribution <= 0.08:
            continue

        label = {
            "glucose": "Current glucose level",
            "bmi": "Body mass index",
            "diabetesPedigreeFunction": "Diabetes pedigree function",
            "age": "Age",
            "pregnancies": "Pregnancy count",
            "skinThickness": "Skin thickness",
        }[field]

        candidates.append(
            {
                "label": label,
                "detail": build_feature_detail(field, values[field]),
                "importance": contribution,
            }
        )

    if synergy_adjustment >= 0.18:
        candidates.append(
            {
                "label": "Glucose and BMI interaction",
                "detail": (
                    "The copula adjustment boosted the result because glucose and BMI "
                    "were elevated together, which the original Python model treats as "
                    "a compounded risk signal."
                ),
                "importance": synergy_adjustment,
            }
        )

    candidates.sort(key=lambda candidate: candidate["importance"], reverse=True)

    if not candidates:
        return [
            {
                "label": "Measurements stayed near model averages",
                "detail": (
                    "Most inputs landed close to the embedded model's center values, "
                    "which kept the estimated risk lower."
                ),
                "impact": "watch",
            }
        ]

    return [
        {
            "label": candidate["label"],
            "detail": candidate["detail"],
            "impact": get_impact(candidate["importance"]),
        }
        for candidate in candidates[:5]
    ]


def build_summary(
    probability: float,
    contributors: list[dict[str, str]],
    imputed_fields: list[str],
) -> str:
    labels = [candidate["label"].lower() for candidate in contributors[:3]]
    driver_text = (
        f"The strongest model drivers were {format_label(labels)}."
        if labels
        else "No single measurement stood out strongly against the model averages."
    )
    imputation_text = ""

    if imputed_fields:
        pretty_labels = [
            "blood pressure" if field == "bloodPressure" else "skin thickness" if field == "skinThickness" else field
            for field in imputed_fields
        ]
        imputation_text = (
            f" Zero values for {format_label(pretty_labels)} were treated as missing "
            "and replaced with the training-set medians, matching the original preprocessing."
        )

    risk_level = get_risk_level(probability)
    if risk_level == "high":
        return (
            f"This model estimates a higher current diabetes-screening risk profile. "
            f"{driver_text}{imputation_text} Arrange confirmatory clinical testing soon."
        )
    if risk_level == "moderate":
        return (
            f"This model estimates a moderate diabetes-screening risk profile. "
            f"{driver_text}{imputation_text} A clinician-guided follow-up plan would be reasonable."
        )
    return (
        f"This model estimates a lower current diabetes-screening risk profile. "
        f"{driver_text}{imputation_text} Keep routine screening in place as your measurements or symptoms change."
    )


def build_actions(values: dict[str, float], risk_level: str, imputed_fields: list[str]) -> list[str]:
    actions: list[str] = []

    def add_action(text: str) -> None:
        if text not in actions:
            actions.append(text)

    if risk_level == "high":
        add_action("Arrange clinician follow-up soon and ask whether fasting glucose or HbA1c testing is appropriate.")
        add_action("Review your weight, blood pressure, and medication picture with a clinician or dietitian.")
    elif risk_level == "moderate":
        add_action("Discuss a repeat diabetes screening plan with your clinician in the near term.")
        add_action("Tighten weekly activity, nutrition, and sleep habits while you confirm the result.")
    else:
        add_action("Keep routine preventive screening in place, especially if your measurements trend upward.")
        add_action("Protect your current profile with regular activity, weight management, and blood pressure checks.")

    if values["glucose"] >= 126:
        add_action(
            "Because glucose was elevated, confirm the result with formal lab testing rather than relying on a screening estimate alone."
        )
    elif values["glucose"] >= 100:
        add_action(
            "A borderline glucose value is worth rechecking with fasting glucose or HbA1c if you have not done that recently."
        )

    if values["bmi"] >= 30:
        add_action("A modest reduction in weight or waist size can materially improve insulin sensitivity over time.")

    if values["bloodPressure"] >= 90:
        add_action("Monitor blood pressure closely because cardiometabolic risks often compound one another.")

    if imputed_fields:
        add_action("Replace any zero placeholders with measured values next time to improve estimate quality.")

    return actions[:4]


def build_prediction(payload: dict[str, Any]) -> dict[str, Any]:
    raw_values = normalize_payload(payload)
    values, imputed_fields = normalize_input(raw_values)
    base_probability, probability = compute_probability(values)
    synergy_adjustment = frank_copula_adjustment(
        clamp(values["glucose"] / 250.0, 0.0, 0.99),
        clamp(values["bmi"] / 60.0, 0.0, 0.99),
    )
    contributors = build_contributors(values, synergy_adjustment)
    risk_level = get_risk_level(probability)
    confidence = clamp(
        PARAMETERS["trainAccuracy"] - (0.05 if imputed_fields else 0.0),
        0.55,
        0.82,
    )

    return {
        "probability": probability,
        "riskLevel": risk_level,
        "score": round(probability * 100),
        "maxScore": 100,
        "confidence": confidence,
        "summary": build_summary(probability, contributors, imputed_fields),
        "contributors": contributors,
        "recommendedActions": build_actions(values, risk_level, imputed_fields),
        "provider": "Standalone Pima logistic model",
        "providerMode": "embedded",
        "disclaimer": DISCLAIMER,
        "evaluatedAt": datetime.now(timezone.utc).isoformat(),
        "baseProbability": base_probability,
        "synergyAdjustment": synergy_adjustment,
    }


def load_request_payload() -> dict[str, Any]:
    if len(sys.argv) > 1:
        try:
            payload = json.loads(sys.argv[1])
        except json.JSONDecodeError as exc:
            raise InputError(f"Invalid JSON argument: {exc}") from exc

        if isinstance(payload, dict):
            return payload
        raise InputError("Prediction input must be a JSON object.")

    if not sys.stdin.isatty():
        raw = sys.stdin.read().strip()
        if raw:
            try:
                payload = json.loads(raw)
            except json.JSONDecodeError as exc:
                raise InputError(f"Invalid JSON on stdin: {exc}") from exc

            if isinstance(payload, dict):
                return payload
            raise InputError("Prediction input must be a JSON object.")

    raise InputError("Provide prediction JSON on stdin or as the first CLI argument.")


def main() -> int:
    try:
        payload = load_request_payload()
        result = build_prediction(payload)
    except InputError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    json.dump(result, sys.stdout)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
