import { storage } from "../storage";
import type { InsertQuestionBank, InsertQuestion } from "@shared/schema";

export class QuestionBankService {
  async initializeDefaultBanks(): Promise<void> {
    try {
      // Check if question banks already exist
      const existingBanks = await storage.getQuestionBanks();
      if (existingBanks.length > 0) {
        console.log('Question banks already initialized');
        return;
      }

      // Create DFS-215 Master Quiz Bank
      const masterBank = await storage.createQuestionBank({
        title: "DFS-215 Pre-Licensing Master Quiz",
        description: "Comprehensive 50-question exam covering all DFS-215 curriculum topics",
        topics: ["Law & Ethics", "Health Insurance", "Disability Income", "Social Insurance", "Life Insurance", "Annuities", "FIGA/DFS"],
        blueprint: {
          topicCounts: {
            "Law & Ethics": 8,
            "Health Insurance": 12,
            "Disability Income": 6,
            "Social Insurance": 8,
            "Life Insurance": 10,
            "Annuities": 4,
            "FIGA/DFS": 2
          },
          difficultyDistribution: {
            easy: 15,
            medium: 25,
            hard: 10
          }
        },
        timeLimitSec: 5400, // 90 minutes
        attemptPolicy: "unlimited",
        shuffleQuestions: true
      });

      // Create Law & Ethics CE Unit Bank
      const ceBank = await storage.createQuestionBank({
        title: "Law & Ethics - 4-Hour CE Unit",
        description: "Required continuing education unit covering professional responsibility and ethics",
        topics: ["Professional Responsibility", "Fiduciary Duties", "Misappropriation", "CE Compliance"],
        blueprint: {
          topicCounts: {
            "Professional Responsibility": 8,
            "Fiduciary Duties": 6,
            "Misappropriation": 4,
            "CE Compliance": 2
          },
          difficultyDistribution: {
            easy: 6,
            medium: 10,
            hard: 4
          }
        },
        timeLimitSec: 3600, // 60 minutes
        attemptPolicy: "unlimited",
        shuffleQuestions: true
      });

      console.log(`Created question bank: ${masterBank.title}`);
      console.log(`Created question bank: ${ceBank.title}`);

      // Create sample questions for each bank
      await this.createSampleQuestions(masterBank.id);
      await this.createSampleQuestions(ceBank.id);

      console.log('Question banks initialization completed');
    } catch (error) {
      console.error('Error initializing question banks:', error);
      throw error;
    }
  }

  private async createSampleQuestions(bankId: string): Promise<void> {
    const sampleQuestions: InsertQuestion[] = [
      // Law & Ethics Questions
      {
        bankId,
        type: "mcq",
        stem: "Which of the following is a fiduciary duty that agents owe to their clients?",
        options: [
          "Loyalty and care",
          "Commission maximization", 
          "Product sales quotas",
          "Company profits first"
        ],
        answerKey: "Loyalty and care",
        explanation: "Agents have a fiduciary duty to act in their clients' best interests with loyalty and care, putting client needs above their own.",
        loTags: ["Professional Responsibility", "Fiduciary Duties"],
        chunkRefs: ["fiduciary-duties-1"],
        difficulty: "E"
      },
      {
        bankId,
        type: "mcq",
        stem: "What is the penalty for misappropriation of client funds in Florida?",
        options: [
          "Warning letter only",
          "Small fine under $1000",
          "Criminal charges and license revocation",
          "Continuing education requirement"
        ],
        answerKey: "Criminal charges and license revocation",
        explanation: "Misappropriation of client funds is a serious offense that can result in criminal charges and permanent license revocation.",
        loTags: ["Misappropriation", "Legal Penalties"],
        chunkRefs: ["misappropriation-penalties-1"],
        difficulty: "M"
      },
      {
        bankId,
        type: "tf",
        stem: "Agents must maintain separate trust accounts for client premium funds.",
        options: ["True", "False"],
        answerKey: "True",
        explanation: "Florida law requires agents to maintain separate trust accounts for client premiums to prevent commingling with personal funds.",
        loTags: ["Premium Handling", "Trust Accounts"],
        chunkRefs: ["trust-accounts-1"],
        difficulty: "E"
      },

      // Health Insurance Questions
      {
        bankId,
        type: "mcq",
        stem: "In an HMO, what happens when a member seeks care outside the network without a referral?",
        options: [
          "Full coverage applies",
          "50% coverage applies",
          "No coverage except emergencies",
          "Deductible doubles"
        ],
        answerKey: "No coverage except emergencies",
        explanation: "HMOs typically provide no coverage for out-of-network care except in emergency situations or with proper referrals.",
        loTags: ["HMO", "Network Restrictions"],
        chunkRefs: ["hmo-network-1"],
        difficulty: "M"
      },
      {
        bankId,
        type: "mcq",
        stem: "Which managed care model allows members to see specialists without referrals but charges more for out-of-network care?",
        options: [
          "HMO",
          "EPO", 
          "PPO",
          "POS"
        ],
        answerKey: "PPO",
        explanation: "PPOs allow direct access to specialists and out-of-network care but at higher cost-sharing levels.",
        loTags: ["PPO", "Managed Care Models"],
        chunkRefs: ["ppo-features-1"],
        difficulty: "E"
      },
      {
        bankId,
        type: "mcq",
        stem: "Balance billing is prohibited in which of the following situations?",
        options: [
          "All HMO services",
          "Emergency services only",
          "Out-of-network care",
          "Elective procedures"
        ],
        answerKey: "All HMO services",
        explanation: "HMO members cannot be balance billed for covered services as providers accept the HMO payment as payment in full.",
        loTags: ["Balance Billing", "HMO"],
        chunkRefs: ["balance-billing-1"],
        difficulty: "H"
      },

      // Social Insurance Questions  
      {
        bankId,
        type: "mcq",
        stem: "What is the standard Medicare Part A deductible period?",
        options: [
          "Per calendar year",
          "Per benefit period", 
          "Per hospital admission",
          "Per 90-day period"
        ],
        answerKey: "Per benefit period",
        explanation: "Medicare Part A deductibles apply per benefit period, which begins with hospitalization and ends 60 days after discharge.",
        loTags: ["Medicare Part A", "Benefit Periods"],
        chunkRefs: ["medicare-a-deductible-1"],
        difficulty: "M"
      },
      {
        bankId,
        type: "tf",
        stem: "Medicare Part D covers prescription drugs for all Medicare beneficiaries automatically.",
        options: ["True", "False"],
        answerKey: "False",
        explanation: "Medicare Part D is voluntary prescription drug coverage that beneficiaries must elect and typically pay premiums for.",
        loTags: ["Medicare Part D", "Prescription Coverage"],
        chunkRefs: ["medicare-d-1"],
        difficulty: "E"
      },

      // Disability Income Questions
      {
        bankId,
        type: "mcq",
        stem: "What is the typical maximum benefit period for short-term disability insurance?",
        options: [
          "30 days",
          "6 months",
          "2 years", 
          "5 years"
        ],
        answerKey: "2 years",
        explanation: "Short-term disability policies typically provide benefits for periods ranging from a few months up to 2 years maximum.",
        loTags: ["Short-term Disability", "Benefit Periods"],
        chunkRefs: ["std-benefits-1"],
        difficulty: "M"
      },
      {
        bankId,
        type: "mcq",
        stem: "The elimination period in disability insurance is:",
        options: [
          "The waiting period before benefits begin",
          "The period benefits are eliminated",
          "The maximum benefit period",
          "The policy exclusion period"
        ],
        answerKey: "The waiting period before benefits begin",
        explanation: "The elimination period is the waiting period from disability onset until benefit payments begin, similar to a deductible.",
        loTags: ["Elimination Period", "Disability Insurance"],
        chunkRefs: ["elimination-period-1"],
        difficulty: "E"
      },

      // Life Insurance Questions
      {
        bankId,
        type: "mcq",
        stem: "Which life insurance policy type builds cash value?",
        options: [
          "Term life only",
          "Whole life only",
          "Universal life only", 
          "Both whole life and universal life"
        ],
        answerKey: "Both whole life and universal life",
        explanation: "Both whole life and universal life are permanent policies that build cash value, unlike term life insurance.",
        loTags: ["Cash Value", "Permanent Life Insurance"],
        chunkRefs: ["cash-value-life-1"],
        difficulty: "E"
      },
      {
        bankId,
        type: "mcq",
        stem: "Under Florida's replacement regulations, what must an agent provide when replacing existing life insurance?",
        options: [
          "Sales illustration only",
          "Premium comparison only",
          "Replacement notice and comparison",
          "Medical exam results"
        ],
        answerKey: "Replacement notice and comparison",
        explanation: "Florida requires specific replacement notices and benefit/cost comparisons to protect consumers during policy replacements.",
        loTags: ["Replacement Regulations", "Consumer Protection"],
        chunkRefs: ["replacement-regs-1"],
        difficulty: "M"
      },

      // Annuities Questions
      {
        bankId,
        type: "mcq",
        stem: "Variable annuities require which additional license beyond insurance?",
        options: [
          "Real estate license",
          "Securities license",
          "Banking license",
          "No additional license"
        ],
        answerKey: "Securities license",
        explanation: "Variable annuities are considered securities and require both insurance and securities licenses to sell.",
        loTags: ["Variable Annuities", "Securities License"],
        chunkRefs: ["variable-annuity-license-1"],
        difficulty: "M"
      },
      {
        bankId,
        type: "tf",
        stem: "Fixed annuities guarantee a minimum interest rate.",
        options: ["True", "False"],
        answerKey: "True",
        explanation: "Fixed annuities provide guaranteed minimum interest rates, protecting the principal and providing predictable growth.",
        loTags: ["Fixed Annuities", "Guaranteed Returns"],
        chunkRefs: ["fixed-annuity-guarantees-1"],
        difficulty: "E"
      },

      // FIGA/DFS Questions
      {
        bankId,
        type: "mcq",
        stem: "The Florida Insurance Guaranty Association (FIGA) covers claims up to what amount when an insurer becomes insolvent?",
        options: [
          "$100,000",
          "$300,000",
          "$500,000",
          "Unlimited"
        ],
        answerKey: "$300,000",
        explanation: "FIGA provides coverage up to $300,000 per claim when a member insurance company becomes insolvent.",
        loTags: ["FIGA", "Coverage Limits"],
        chunkRefs: ["figa-limits-1"],
        difficulty: "M"
      },
      {
        bankId,
        type: "mcq",
        stem: "Who regulates insurance companies in Florida?",
        options: [
          "Federal Insurance Commission",
          "Florida Department of Financial Services", 
          "Florida Insurance Bureau",
          "State Treasury Department"
        ],
        answerKey: "Florida Department of Financial Services",
        explanation: "The Florida Department of Financial Services (DFS) is the primary regulator of insurance companies and agents in Florida.",
        loTags: ["DFS", "Regulation"],
        chunkRefs: ["dfs-regulation-1"],
        difficulty: "E"
      }
    ];

    // Create questions in batches
    for (const question of sampleQuestions) {
      try {
        await storage.createQuestion(question);
      } catch (error) {
        console.error(`Error creating question: ${question.stem.substring(0, 50)}...`, error);
      }
    }

    console.log(`Created ${sampleQuestions.length} sample questions for bank ${bankId}`);
  }
}

export const questionBankService = new QuestionBankService();