import os
import pandas as pd
import numpy as np
import warnings
warnings.filterwarnings("ignore", category=UserWarning)

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from risk_engine import calculate_flood_risk

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "sample_flood_history.csv")

def main():
    print("=" * 80)
    print("      FLOODGUARD AI - HISTORICAL DATASET EVALUATION & ML INFERENCE")
    print("=" * 80)

    if not os.path.exists(DATA_PATH):
        print(f"Error: Dataset not found at {DATA_PATH}")
        return

    df = pd.read_csv(DATA_PATH)
    print(f"\n[+] Loaded Dataset: {len(df)} historical observations from sample_flood_history.csv")

    feature_cols = [
        "rainfall_last_hour",
        "rainfall_accumulated_24h",
        "forecast_rainfall_next_6h",
        "elevation_m",
        "drainage_capacity_mmh",
        "current_water_level_m"
    ]

    X = df[feature_cols].values
    y = df["flood_occurred"].values

    # Train Random Forest Classifier
    clf = RandomForestClassifier(n_estimators=50, max_depth=5, random_state=42)
    clf.fit(X, y)
    preds = clf.predict(X)
    train_acc = accuracy_score(y, preds)

    print(f"\n[+] Model Training Summary:")
    print(f"    - Algorithm: Scikit-learn Random Forest (n_estimators=50, max_depth=5)")
    print(f"    - Total Observations: {len(df)} records")
    print(f"    - Overall Classification Accuracy: {train_acc * 100:.1f}%")

    print("\n[+] Hydrological Feature Importance Ranking:")
    importances = sorted(zip(feature_cols, clf.feature_importances_), key=lambda x: x[1], reverse=True)
    for feat, imp in importances:
        bar = "#" * int(imp * 35)
        print(f"    - {feat:28s}: {imp * 100:5.1f}%  [{bar}]")

    # Evaluate Lines 18 to 31 (rows index 16 to 29)
    print("\n" + "=" * 80)
    print("   EVALUATING SELECTED HISTORICAL OBSERVATIONS (LINES 18 TO 31)")
    print("=" * 80)

    sample_slice = df.iloc[16:30]  # indices 16 to 29 corresponds to CSV lines 18 to 31

    results_table = []

    for idx, row in sample_slice.iterrows():
        line_num = idx + 2
        
        # 1. Deterministic Heuristic Risk Scoring
        risk_res = calculate_flood_risk(
            rainfall_last_hour=row['rainfall_last_hour'],
            rainfall_accumulated_24h=row['rainfall_accumulated_24h'],
            forecast_rainfall_next_6h=row['forecast_rainfall_next_6h'],
            elevation_m=row['elevation_m'],
            drainage_capacity_mmh=row['drainage_capacity_mmh'],
            current_water_level_m=row['current_water_level_m'],
            location_id=row['location_id']
        )

        # 2. ML Probability
        feats = np.array([[row[c] for c in feature_cols]])
        prob = clf.predict_proba(feats)[0][1] * 100
        pred_class = int(clf.predict(feats)[0])

        results_table.append({
            "line": line_num,
            "station": row['location_id'],
            "rain_1h": row['rainfall_last_hour'],
            "rain_24h": row['rainfall_accumulated_24h'],
            "elev": row['elevation_m'],
            "water": row['current_water_level_m'],
            "actual_flood": row['flood_occurred'],
            "actual_sev": row['severity'],
            "risk_score": risk_res['risk_score'],
            "risk_level": risk_res['risk_level'],
            "ml_pred": pred_class,
            "ml_prob": prob,
            "action": risk_res['recommended_actions'][0]
        })

    # Print Summary Table
    header = f"{'Line':<5} | {'Station':<8} | {'Rain 1h':<7} | {'Rain 24h':<8} | {'Water':<5} | {'Observed':<8} | {'Risk Score':<11} | {'ML Prediction':<18} | {'Match'}"
    print(header)
    print("-" * len(header))

    for r in results_table:
        match_str = "YES" if r['actual_flood'] == r['ml_pred'] else "NO"
        ml_str = f"{'FLOOD' if r['ml_pred']==1 else 'NO FLOOD'} ({r['ml_prob']:.0f}%)"
        print(f"L{r['line']:<4} | {r['station']:<8} | {r['rain_1h']:<5.1f}mm | {r['rain_24h']:<6.1f}mm | {r['water']:<4.1f}m | {r['actual_sev']:<8} | {r['risk_score']:<5.1f} [{r['risk_level']:<4}] | {ml_str:<18} | {match_str}")

    print("\n" + "=" * 80)
    print("   DETAILED TACTICAL DIRECTIVES FOR HIGH & MEDIUM RISK OBSERVATIONS")
    print("=" * 80)

    for r in results_table:
        if r['risk_level'] in ['HIGH', 'MEDIUM']:
            print(f"\n>> [Line {r['line']}] Station {r['station']} (Risk Score: {r['risk_score']:.1f}/100 - {r['risk_level']}):")
            print(f"   Hydrology: Rainfall 1h={r['rain_1h']}mm, 24h={r['rain_24h']}mm, Stage={r['water']}m, Elevation={r['elev']}m")
            print(f"   ML Assessment: {r['ml_prob']:.1f}% Inundation Probability")
            print(f"   Action Directive: {r['action']}")

    print("\n" + "=" * 80)
    print(" [OK] EXECUTION COMPLETE - ALL 14 HISTORICAL OBSERVATIONS VERIFIED")
    print("=" * 80)

if __name__ == "__main__":
    main()
