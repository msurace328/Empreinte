const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // 1. Applications
  console.log('Testing Applications...');
  await page.goto('http://localhost:3002/admin/applications');
  await page.waitForLoadState('networkidle');
  await page.click('button:has(.lucide-more-horizontal)', { force: true });
  await page.click('text=Approve', { force: true });
  await page.click('text=Execute');
  await page.waitForTimeout(500);

  // 2. Members
  console.log('Testing Members Add...');
  await page.goto('http://localhost:3002/admin/members');
  await page.waitForLoadState('networkidle');
  await page.click('text=Add Member');
  await page.fill('input[placeholder="e.g. John Doe"]', 'Test Script');
  await page.fill('input[placeholder="john@example.com"]', 'test@test.com');
  await page.click('text=Confirm Onboarding');
  await page.waitForTimeout(500);

  // 3. Member Restrict/Reinstate
  console.log('Testing Member Restrict/Reinstate...');
  await page.goto('http://localhost:3002/admin/members/m-001'); // go directly to Julian
  await page.waitForLoadState('networkidle');
  await page.click('text=Restrict Account');
  await page.fill('input[placeholder="e.g. Credential sharing detected"]', 'Violation');
  await page.click('text=Confirm Restriction');
  await page.waitForTimeout(500);
  await page.click('text=Reinstate Account');
  await page.waitForTimeout(500);

  // 4. Revenue Opportunities
  console.log('Testing Revenue...');
  await page.goto('http://localhost:3002/admin/revenue');
  await page.waitForLoadState('networkidle');
  await page.click('text=DISMISS', { force: true });
  await page.waitForTimeout(500);

  // 5. Check Audit
  console.log('Verifying Audit Log...');
  await page.goto('http://localhost:3002/admin/audit');
  await page.waitForLoadState('networkidle');
  const auditText = await page.innerText('body');
  
  if (auditText.includes('Approved_APPLICATION') && auditText.includes('ADD_MEMBER') && auditText.includes('Restricted')) {
      console.log('SUCCESS: All actions appeared in the audit log!');
  } else {
      console.error('FAILED: Missing entries in audit log.');
  }

  await browser.close();
})();
