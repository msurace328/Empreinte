import { RiskSignal, Application, Member, AccessAnomaly, RevenueOpportunity } from '../types';

class IntelligenceService {
    async assessIdentity(application: Application): Promise<RiskSignal[]> {
        if (application.id === 'app-001') {
            return [
                {
                    id: 'sig-001',
                    name: 'Device Fingerprint',
                    value: 'Match Detected',
                    confidence: 0.98,
                    impact: 'Negative',
                    reasoning: 'Hardware ID matches a rejected application (app-fraud-x) from 48h ago.',
                    provenance: 'ThreatIntel Core',
                },
                {
                    id: 'sig-002',
                    name: 'Network Topology',
                    value: 'VOIP/Proxy',
                    confidence: 0.95,
                    impact: 'Negative',
                    reasoning: 'Applicant is using a known VOIP provider and a residential proxy.',
                    provenance: 'NetworkSentinel',
                }
            ];
        }
        if (application.id === 'app-003') {
            return [
                {
                    id: 'sig-003',
                    name: 'Identity Provenance',
                    value: 'Duplicate Document',
                    confidence: 1.0,
                    impact: 'Negative',
                    reasoning: 'The passport submitted was previously used by Member m-001 (Kevin Balfe). This is a high-confidence identity theft signal.',
                    provenance: 'Persona/Veriff Integration',
                }
            ];
        }
        return [
            {
                id: 'sig-ok-1',
                name: 'Email Reputation',
                value: 'High Trust',
                confidence: 0.99,
                impact: 'Positive',
                reasoning: 'Email domain has high age and positive history.',
                provenance: 'Internal Ledger',
            }
        ];
    }

    async assessImageAuthenticity(photoUrl: string): Promise<RiskSignal[]> {
        if (photoUrl.includes('photo-1539571696357-5a69c17a67c6')) { // Marcus Kaine
            return [
                {
                    id: 'img-001',
                    name: 'Synthetic Face Score',
                    value: '0.94',
                    confidence: 0.94,
                    impact: 'Negative',
                    reasoning: 'High likelihood of StyleGAN3 generation. Unusual noise patterns in ear/background boundary.',
                    provenance: 'DeepfakeScan ML',
                },
                {
                    id: 'img-002',
                    name: 'Reverse Image Match',
                    value: '0 Matches',
                    confidence: 0.90,
                    impact: 'Neutral',
                    reasoning: 'No matches found on public web, consistent with synthetic generation.',
                    provenance: 'Google Vision API',
                }
            ];
        }
        return [
            {
                id: 'img-ok-1',
                name: 'Image Authentic',
                value: '0.02',
                confidence: 0.99,
                impact: 'Positive',
                reasoning: 'Metadata and pixel distribution consistent with standard mobile capture.',
                provenance: 'DeepfakeScan ML',
            }
        ];
    }

    async scoreRisk(candidate: Member | Application): Promise<{ score: number; signals: RiskSignal[] }> {
        const signals: RiskSignal[] = [];
        let score = 10; // Base score

        if (candidate.email.includes('temp-mail') || candidate.email.includes('scam')) {
            signals.push({
                id: 'r-001',
                name: 'Email Risk',
                value: 'Disposable',
                confidence: 1.0,
                impact: 'Negative',
                reasoning: 'Using a burner email provider.',
                provenance: 'AuthArmor',
            });
            score += 40;
        }

        if ('riskScore' in candidate) {
            score = candidate.riskScore;
        } else if ('trustScore' in candidate) {
            score = 100 - candidate.trustScore;
        }

        return { score, signals };
    }

    async detectAccessAnomalies(member: Member): Promise<AccessAnomaly[]> {
        if (member.id === 'm-003') {
            return [
                {
                    id: 'an-001',
                    memberId: 'm-003',
                    type: 'ConcurrentUse',
                    timestamp: new Date().toISOString(),
                    severity: 'High',
                    description: 'Login from NYC (Home) and London (Suite B) within 15 minutes.',
                    isResolved: false,
                }
            ];
        }
        return [];
    }

    async analyzeGraph(members: Member[]): Promise<RiskSignal[]> {
        // Detecting the referral ring story
        return [
            {
                id: 'g-001',
                name: 'Circular Vouching',
                value: 'Cluster Detected',
                confidence: 0.88,
                impact: 'Negative',
                reasoning: 'Detected a ring of 5 accounts vouching for each other in a closed loop. Historical pattern of "manufactured trust".',
                provenance: 'GraphIntelligence',
            }
        ];
    }

    async detectRevenueGaps(): Promise<RevenueOpportunity[]> {
        return [
            {
                id: 'opp-001',
                title: 'The Tuesday Gap',
                gap: 'Empty Suites on Tuesdays',
                evidence: 'Historical data shows 12% occupancy on Tuesdays vs 88% on weekends.',
                projectedUpside: 45000,
                assumptions: 'Based on filling 5 additional suites per week at $1,200 avg.',
                action: 'Launch Midweek Guest Credit campaign for Associate members.',
                status: 'Open',
            },
            {
                id: 'opp-002',
                title: 'Upgrade Opportunity',
                gap: 'High-frequency Associate members',
                evidence: '12 Associate members booked >5 times last quarter.',
                projectedUpside: 72000,
                assumptions: 'Converting 50% of the cohort to Suite tier ($1k increase/mo).',
                action: 'Direct outreach for Tier Upgrade with loyalty bonus.',
                status: 'Open',
            }
        ];
    }
}

export const intelligenceService = new IntelligenceService();
