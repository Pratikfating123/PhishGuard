# Model evaluation report

Fill this from `backend/ml/artifacts/metadata.json`. Do not publish figures that are not in that file.

| Item | Value |
|---|---|
| Model version | |
| Dataset name and source | |
| Dataset licence | |
| Rows before / after de-duplication | |
| Train / validation / test sizes | |
| Test set: legitimate / phishing counts | |
| Decision threshold (chosen on validation) | |

## Test-set results

| Metric | Value |
|---|---|
| Precision | |
| Recall | |
| F1 | |
| True negatives / false positives | |
| False negatives / true positives | |

## Checks

- [ ] Duplicates removed before splitting
- [ ] No test rows used to pick the threshold
- [ ] Near-duplicate and same-campaign leakage reviewed
- [ ] Dataset age and source mix described (old corpora over-state accuracy on current attacks)

## Limits

Describe what the dataset does not cover (languages, attack types, brands) and how the model behaves on out-of-domain mail.
