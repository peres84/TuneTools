# **Corrected Serverless Cost Per Song (60s, 2 sessions)**

## **GPU Pricing:**

| GPU               | VRAM | Cost/hr (Flex) |
| ----------------- | ---- | -------------- |
| **L4/A5000/3090** | 24GB | **$0.69**      |
| **RTX 4090**      | 24GB | **$1.10**      |
| **RTX 5090**      | 32GB | **$1.58**      |

---

## **Cost Per Song Comparison:**

### **L4/A5000/3090 - $0.69/hr** ⭐ BEST VALUE

| Configuration      | Time      | Cost/Song |
| ------------------ | --------- | --------- |
| Standard           | 18 min    | $0.21     |
| **INT8 + Batch 6** | **9 min** | **$0.10** |
| INT4 + Batch 6     | 6 min     | $0.07     |

### **RTX 4090 - $1.10/hr** (Faster)

| Configuration      | Time      | Cost/Song |
| ------------------ | --------- | --------- |
| Standard           | 15 min    | $0.28     |
| **INT8 + Batch 6** | **7 min** | **$0.13** |
| INT4 + Batch 6     | 5 min     | $0.09     |

### **RTX 5090 - $1.58/hr** (Fastest)

| Configuration      | Time      | Cost/Song |
| ------------------ | --------- | --------- |
| Standard           | 12 min    | $0.32     |
| **INT8 + Batch 6** | **6 min** | **$0.16** |
| INT4 + Batch 6     | 4 min     | $0.11     |

---

## **Recommended Setup (INT8 + Batch 6):**

```bash
--load_in_8bit
--stage2_batch_size 6
--run_n_segments 2
```

---

## **Storage Cost:**

Models (~18GB) = **$1.26/month** (Network Volume)

- Under 1TB: $0.07/GB/month
- 18GB × $0.07 = $1.26/month

---

## **Total Monthly Cost (12 songs/month):**

| GPU               | Compute | Storage | Total/Month | $/Song (All-in) |
| ----------------- | ------- | ------- | ----------- | --------------- |
| **L4/A5000/3090** | $1.20   | $1.26   | **$2.46**   | **$0.21** ⭐    |
| RTX 4090          | $1.56   | $1.26   | $2.82       | $0.24           |
| RTX 5090          | $1.92   | $1.26   | $3.18       | $0.27           |

---

## **Annual Cost (156 songs/year):**

| GPU               | Compute | Storage | Total/Year    |
| ----------------- | ------- | ------- | ------------- |
| **L4/A5000/3090** | $15.60  | $15.12  | **$30.72** ⭐ |
| RTX 4090          | $20.28  | $15.12  | $35.40        |
| RTX 5090          | $24.96  | $15.12  | $40.08        |

---

## **Final Recommendation:**

**L4/A5000/3090 with INT8 + Batch 6**

- **Cost per song:** $0.10 compute + $0.11 storage = **$0.21 all-in**
- **Time:** 9 minutes
- **Quality:** 95%
- **Annual:** $30.72 for 156 songs

**Worth upgrading to RTX 4090?** Only if 2 min faster (7 min vs 9 min) is worth +$5/year

---

**Bottom line: L4/A5000/3090 = $0.21 per song all-in** 🎯
