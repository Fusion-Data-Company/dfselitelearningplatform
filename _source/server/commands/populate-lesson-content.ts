#!/usr/bin/env node
import { db } from '../db';
import { lessons, tracks, modules } from '../../shared/schema';
import { eq, sql } from 'drizzle-orm';

// Sample encyclopedia-grade content for DFS-215 topics
const TOPIC_CONTENT: Record<string, string> = {
  'law': `## Florida Insurance Law Fundamentals

Insurance law in Florida is governed by the Department of Financial Services (DFS) under Florida Statutes Title XXXVII. Licensed agents must understand their fiduciary duties, disclosure requirements, and ethical obligations.

### Key Regulatory Bodies
- **Florida Department of Financial Services (DFS)** - Primary regulatory authority
- **Office of Insurance Regulation (OIR)** - Rate and policy approval
- **Chief Financial Officer (CFO)** - Cabinet member overseeing DFS

### Agent Responsibilities
1. **Fiduciary Duty** - Act in the client's best interest at all times
2. **Disclosure Requirements** - Fully explain policy terms, exclusions, and limitations
3. **Suitability** - Recommend products appropriate for the client's needs
4. **Documentation** - Maintain accurate records of all transactions

### Common Violations
- Misrepresentation of policy benefits
- Twisting (inducing policy replacement for commissions)
- Rebating (offering inducements not in the policy)
- Unfair claims practices`,

  'ethics': `## Professional Ethics in Insurance

Florida requires 4 hours of Law & Ethics continuing education every renewal period. Ethical conduct protects consumers and maintains the integrity of the insurance profession.

### Core Ethical Principles
1. **Honesty** - Never misrepresent products or coverage
2. **Integrity** - Honor commitments and professional obligations
3. **Competence** - Maintain current knowledge of products and regulations
4. **Confidentiality** - Protect client information
5. **Fairness** - Treat all parties equitably

### Ethical Decision Framework
When facing an ethical dilemma, consider:
- Is it legal under Florida statutes?
- Does it comply with company policy?
- Would it harm the client?
- Would you be comfortable if it became public?

### Consequences of Ethical Violations
- License suspension or revocation
- Civil penalties and fines
- Criminal prosecution
- Civil liability and lawsuits`,

  'hmo': `## Health Maintenance Organizations (HMO)

An HMO is a managed care organization that provides health coverage through a network of doctors and hospitals that contract with the HMO or are employed by it.

### Key HMO Characteristics
- **Network Requirement** - Members must use in-network providers except for emergencies
- **Primary Care Physician (PCP)** - Required gatekeeper for specialist referrals
- **No Balance Billing** - In-network providers cannot bill beyond copays
- **Prepaid Care** - Fixed monthly premiums cover comprehensive services

### Types of HMOs
1. **Staff Model** - Physicians are HMO employees
2. **Group Model** - HMO contracts with physician groups
3. **IPA Model** - Independent Practice Association contracts
4. **Network Model** - Multiple medical groups under contract

### Consumer Protections
- Guaranteed access to emergency care
- Grievance and appeals procedures
- Required coverage of preventive services
- Annual out-of-pocket maximums`,

  'ppo': `## Preferred Provider Organization (PPO)

A PPO is a managed care arrangement that provides more flexibility than an HMO by allowing members to see out-of-network providers at higher cost.

### PPO Structure
- **Preferred Providers** - Contracted network with negotiated rates
- **No Referral Required** - Direct access to specialists
- **Out-of-Network Option** - Higher cost but available
- **Balance Billing** - May apply for out-of-network services

### Cost Sharing
| Service | In-Network | Out-of-Network |
|---------|------------|----------------|
| Deductible | Lower | Higher |
| Coinsurance | 80/20 typical | 60/40 typical |
| Copays | Fixed amount | Percentage |

### Advantages
- Greater provider choice
- No PCP requirement
- Nationwide coverage
- Direct specialist access`,

  'medicare': `## Medicare Overview

Medicare is the federal health insurance program for people 65 and older, certain younger people with disabilities, and people with End-Stage Renal Disease.

### Medicare Parts
**Part A - Hospital Insurance**
- Inpatient hospital stays
- Skilled nursing facility care
- Hospice care
- Home health care
- Initial deductible: Changes annually

**Part B - Medical Insurance**
- Doctor visits and outpatient care
- Preventive services
- Durable medical equipment
- Monthly premium required

**Part C - Medicare Advantage**
- Private insurance alternative to Original Medicare
- Combines Parts A and B
- Often includes Part D
- May have additional benefits

**Part D - Prescription Drug Coverage**
- Voluntary drug coverage
- Offered by private insurers
- Coverage gap ("donut hole")
- Annual enrollment period`,

  'medicaid': `## Medicaid - Medical Assistance Program

Medicaid is a joint federal-state program that provides healthcare coverage to low-income individuals and families. Unlike Medicare, it is means-tested.

### Eligibility Requirements
- Income below federal poverty guidelines
- U.S. citizen or qualified immigrant
- Florida resident
- Categorical eligibility (children, pregnant women, elderly, disabled)

### Covered Services
- Hospital services
- Physician services
- Laboratory and X-ray
- Nursing facility services
- Home health care
- Transportation to medical care

### Long-Term Care Coverage
Medicaid is the primary payer for long-term care in the U.S. Key considerations:
- 5-year look-back period for asset transfers
- Spousal impoverishment protections
- Estate recovery after death
- Different eligibility rules for LTC`,

  'disability': `## Disability Income Insurance

Disability income insurance replaces a portion of income when an insured cannot work due to illness or injury. It's one of the most important coverages for working professionals.

### Types of Disabilities
**Total Disability**
- Cannot perform the material duties of own occupation
- Some policies transition to "any occupation" after 24 months
- Benefit typically 60-70% of pre-disability income

**Partial/Residual Disability**
- Can work but with reduced capacity
- Proportional benefit based on income loss
- Encourages return to work

### Key Policy Features
1. **Elimination Period** - Waiting period before benefits begin (30-180 days typical)
2. **Benefit Period** - How long benefits are paid (2 years to age 65)
3. **Definition of Disability** - Own occupation vs. any occupation
4. **Renewability** - Non-cancellable or guaranteed renewable

### Social Security Disability
- 5-month elimination period
- Strict "any occupation" definition
- Requires inability to engage in substantial gainful activity`,

  'life': `## Life Insurance Fundamentals

Life insurance provides financial protection to beneficiaries upon the death of the insured. Understanding the different types helps match coverage to needs.

### Term Life Insurance
- Pure death benefit protection
- Fixed period coverage (10, 20, 30 years)
- Level or decreasing premiums
- No cash value accumulation
- Most affordable option

### Permanent Life Insurance

**Whole Life**
- Lifetime coverage
- Level premiums
- Guaranteed cash value growth
- Fixed death benefit
- Participating policies may pay dividends

**Universal Life**
- Flexible premiums
- Adjustable death benefit
- Interest-credited cash value
- Current vs. guaranteed rates

**Variable Life**
- Investment component
- Sub-accounts like mutual funds
- Market risk to cash value
- Requires securities license to sell`,

  'annuity': `## Annuities Overview

An annuity is a contract between an individual and an insurance company designed to provide retirement income. The insurer guarantees periodic payments.

### Types of Annuities

**Fixed Annuity**
- Guaranteed interest rate
- Principal protection
- Predictable income stream
- Insurance company bears investment risk

**Variable Annuity**
- Investment in sub-accounts
- Growth potential but market risk
- Separate account assets
- Requires securities license

**Indexed Annuity**
- Returns linked to market index
- Principal protection with upside potential
- Caps and participation rates
- Complex crediting methods

### Payout Options
1. **Life Only** - Payments for life, no beneficiary
2. **Life with Period Certain** - Minimum guaranteed period
3. **Joint and Survivor** - Payments continue to spouse
4. **Lump Sum** - Single payment option`,

  'ltc': `## Long-Term Care Insurance

Long-term care insurance helps pay for extended care services not covered by health insurance or Medicare, including nursing home, assisted living, and home care.

### Coverage Details
- **Daily/Monthly Benefit** - Fixed amount per day/month of care
- **Benefit Period** - 2-5 years or lifetime
- **Elimination Period** - Waiting period (30-90 days typical)
- **Inflation Protection** - Compound or simple growth options

### Benefit Triggers (ADLs)
Coverage typically requires inability to perform 2 of 6 Activities of Daily Living:
1. Bathing
2. Dressing
3. Eating
4. Toileting
5. Transferring
6. Continence

Or cognitive impairment requiring substantial supervision.

### Tax Treatment
- Qualified policies receive favorable tax treatment
- Benefits generally tax-free up to limits
- Premiums may be deductible
- Partnership policies offer asset protection`,

  'oasdi': `## Social Security (OASDI)

OASDI (Old-Age, Survivors, and Disability Insurance) is the federal social insurance program funded through FICA payroll taxes.

### Program Components

**Retirement Benefits**
- Full retirement age: 66-67 depending on birth year
- Early retirement at 62 with reduced benefits
- Delayed credits up to age 70
- Benefit based on highest 35 years of earnings

**Survivor Benefits**
- Widow/widower benefits
- Children's benefits
- Parent's benefits
- Lump sum death benefit

**Disability Benefits**
- Must be unable to engage in substantial gainful activity
- Expected to last 12+ months or result in death
- 5-month waiting period
- Medicare after 24 months of benefits

### Funding
- 6.2% employee + 6.2% employer = 12.4% total
- Wage base limit adjusted annually
- Self-employed pay full 12.4%
- Trust fund reserves`,

  'group': `## Group Insurance

Group insurance covers multiple people under a single master policy, typically offered through employers or associations.

### Characteristics
- **Master Contract** - Single policy covers all members
- **Certificates** - Individual members receive certificates, not policies
- **Experience Rating** - Premiums based on group's claims history
- **Guaranteed Issue** - No individual underwriting during enrollment

### Types of Group Coverage
1. **Group Life** - Term coverage, often 1-2x salary
2. **Group Health** - Medical, dental, vision
3. **Group Disability** - STD and LTD coverage
4. **Group Dental/Vision** - Ancillary benefits

### COBRA Continuation
- Applies to employers with 20+ employees
- Up to 18 months continuation (36 for certain events)
- Employee pays full premium plus 2% admin fee
- Qualifying events: termination, reduced hours, divorce, death`,

  'figa': `## Florida Insurance Guaranty Association (FIGA)

FIGA protects Florida policyholders when their insurance company becomes insolvent (unable to pay claims).

### Coverage Limits
- **Property Claims** - Up to $500,000
- **Liability Claims** - Generally unlimited
- **Life Insurance** - Covered by separate guaranty association
- **Deductible** - $100 applies to covered claims

### What FIGA Does NOT Cover
- Surplus lines insurance
- Title insurance
- Warranty contracts
- Self-insured plans
- Workers' compensation (separate fund)

### Funding
- Post-assessment basis
- Insurers assessed after insolvency
- Assessments passed to policyholders
- Emergency assessments allowed

### Consumer Protections
- Policy continues during claims resolution
- Return premium handled
- Priority claim status
- Free policy transfer assistance`,

  'default': `## Professional Insurance Concepts

This lesson covers essential concepts for Florida insurance professionals. Understanding these fundamentals is critical for providing excellent service to clients and maintaining compliance with state regulations.

### Learning Objectives
By the end of this lesson, you will be able to:
- Identify key regulatory requirements
- Apply professional standards to client interactions
- Recognize potential compliance issues
- Implement best practices for documentation

### Key Concepts
Insurance professionals must maintain current knowledge of products, regulations, and ethical standards. The Florida Department of Financial Services provides oversight and ensures consumer protection.

### Professional Standards
1. Always act in the client's best interest
2. Provide complete and accurate disclosures
3. Maintain appropriate licenses and certifications
4. Document all client interactions thoroughly
5. Stay current with continuing education requirements

### Compliance Considerations
- Review all materials before presentation to clients
- Ensure suitability of recommendations
- Follow company guidelines and state regulations
- Report any suspected violations`
};

function getContentForLesson(title: string, description?: string): string {
  const lowerTitle = (title + ' ' + (description || '')).toLowerCase();
  
  // Match content to lesson topic
  if (lowerTitle.includes('law') || lowerTitle.includes('regulation') || lowerTitle.includes('dfs') || lowerTitle.includes('cfo')) {
    return TOPIC_CONTENT['law'];
  }
  if (lowerTitle.includes('ethic') || lowerTitle.includes('fiduciar') || lowerTitle.includes('responsibility')) {
    return TOPIC_CONTENT['ethics'];
  }
  if (lowerTitle.includes('hmo') || lowerTitle.includes('health maintenance') || lowerTitle.includes('managed care')) {
    return TOPIC_CONTENT['hmo'];
  }
  if (lowerTitle.includes('ppo') || lowerTitle.includes('preferred provider')) {
    return TOPIC_CONTENT['ppo'];
  }
  if (lowerTitle.includes('medicare') || lowerTitle.includes('part-a') || lowerTitle.includes('part-b') || lowerTitle.includes('medigap')) {
    return TOPIC_CONTENT['medicare'];
  }
  if (lowerTitle.includes('medicaid') || lowerTitle.includes('medical assistance')) {
    return TOPIC_CONTENT['medicaid'];
  }
  if (lowerTitle.includes('disability') || lowerTitle.includes('elimination period')) {
    return TOPIC_CONTENT['disability'];
  }
  if (lowerTitle.includes('life insurance') || lowerTitle.includes('whole life') || lowerTitle.includes('term life') || lowerTitle.includes('universal life')) {
    return TOPIC_CONTENT['life'];
  }
  if (lowerTitle.includes('annuit') || lowerTitle.includes('variable') || lowerTitle.includes('fixed')) {
    return TOPIC_CONTENT['annuity'];
  }
  if (lowerTitle.includes('long-term care') || lowerTitle.includes('ltc') || lowerTitle.includes('nursing') || lowerTitle.includes('custodial')) {
    return TOPIC_CONTENT['ltc'];
  }
  if (lowerTitle.includes('oasdi') || lowerTitle.includes('social security') || lowerTitle.includes('social insurance')) {
    return TOPIC_CONTENT['oasdi'];
  }
  if (lowerTitle.includes('group') || lowerTitle.includes('cobra') || lowerTitle.includes('conversion')) {
    return TOPIC_CONTENT['group'];
  }
  if (lowerTitle.includes('figa') || lowerTitle.includes('guaranty') || lowerTitle.includes('insolvency')) {
    return TOPIC_CONTENT['figa'];
  }
  
  return TOPIC_CONTENT['default'];
}

async function main() {
  console.log('');
  console.log('════════════════════════════════════════════════════════════════════');
  console.log('  LESSON CONTENT POPULATION TOOL');
  console.log('  Adds encyclopedia-grade content to existing lessons');
  console.log('════════════════════════════════════════════════════════════════════');
  console.log('');

  try {
    // Get all lessons with empty content
    const allLessons = await db.select().from(lessons);
    const emptyLessons = allLessons.filter(l => !l.content || l.content.length < 50);
    
    console.log(`Found ${allLessons.length} total lessons`);
    console.log(`Found ${emptyLessons.length} lessons needing content`);
    console.log('');

    let updated = 0;
    for (const lesson of emptyLessons) {
      const content = getContentForLesson(lesson.title, lesson.description || '');
      
      await db.update(lessons)
        .set({ content })
        .where(eq(lessons.id, lesson.id));
      
      updated++;
      if (updated % 50 === 0) {
        console.log(`Updated ${updated}/${emptyLessons.length} lessons...`);
      }
    }

    console.log('');
    console.log(`✅ Updated ${updated} lessons with content`);
    
    // Verify
    const verifyLessons = await db.select().from(lessons).limit(5);
    console.log('\nSample lesson content lengths:');
    verifyLessons.forEach(l => {
      console.log(`  - ${l.title.substring(0, 40)}... : ${l.content?.length || 0} chars`);
    });

    console.log('');
    console.log('Content population complete!');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();

