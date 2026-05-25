const fs = require('fs');
const content = fs.readFileSync('src/lib/services/data-service.ts', 'utf8');

// We simply want to convert the class DataService into a module
// remove "class DataService {" and convert properties to "export const"
let lines = content.split('\n');
let newLines = [];
let capture = false;

// Quick regex to rename properties to exported constants
let modified = content
    .replace('class DataService {', '')
    .replace(/private members: Member\[\] =/g, 'export const initialMembers: Member[] =')
    .replace(/private applications: Application\[\] =/g, 'export const initialApplications: Application[] =')
    .replace(/private anomalies: AccessAnomaly\[\] =/g, 'export const initialAnomalies: AccessAnomaly[] =')
    .replace(/private opportunities: RevenueOpportunity\[\] =/g, 'export const initialOpportunities: RevenueOpportunity[] =')
    .replace(/private auditLog: AuditEntry\[\] =/g, 'export const initialAuditLog: AuditEntry[] =')
    .replace(/private bookings: Booking\[\] =/g, 'export const initialBookings: Booking[] =')
    .replace(/private suites =/g, 'export const initialSuites =');

// remove methods and the trailing class bracket
modified = modified.replace(/async getMembers(.*)[\s\S]*/, '');

fs.writeFileSync('src/lib/services/seed-data.ts', modified);
console.log('Created seed-data.ts');
