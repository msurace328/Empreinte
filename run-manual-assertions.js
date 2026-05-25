const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const logs = [];
  
  page.on('console', msg => logs.push(msg.text()));

  try {
      console.log('--- Testing Applications Page ---');
      await page.goto('http://localhost:3002/admin/applications');
      await page.waitForTimeout(500);
      let initialCount = await page.locator('table tbody tr').count();
      console.log('Initial Pending Queue Size:', initialCount);
      
      // Approve Button
      await page.locator('button').filter({ hasText: 'More' }).first().click(); // MoreHorizontal
      await page.click('text=Approve');
      await page.click('text=Execute');
      await page.waitForTimeout(500);
      let afterApprove = await page.locator('table tbody tr').count();
      console.log('Queue Size after Approve:', afterApprove);
      
      // Reject Button
      await page.locator('button').filter({ hasText: 'More' }).first().click(); 
      await page.click('text=Reject');
      await page.fill('input[placeholder="Rejection Reason"]', 'Too risky');
      await page.click('text=Reject');
      await page.waitForTimeout(500);
      let afterReject = await page.locator('table tbody tr').count();
      console.log('Queue Size after Reject:', afterReject);

      console.log('\n--- Testing Members Dossier (Restrict/Reinstate) ---');
      await page.goto('http://localhost:3002/admin/members');
      await page.waitForTimeout(500);
      await page.click('text=View Profile'); // Click the first member
      await page.click('text=Restrict Account');
      await page.fill('input[placeholder="Reason"]', 'Policy Violation');
      await page.click('text=Confirm Restriction');
      await page.waitForTimeout(500);
      
      if (await page.isVisible('text=Reinstate Account')) {
          console.log('SUCCESS: UI correctly reverted to Reinstate Mode');
      } else {
          console.log('FAILED: Restrict button did not change state');
      }

      await page.click('text=Reinstate Account');
      await page.waitForTimeout(500);
      if (await page.isVisible('text=Restrict Account')) {
          console.log('SUCCESS: UI correctly reinstated to Active Mode');
      }
      
      console.log('\n--- Testing Revenue Intelligence ---');
      await page.goto('http://localhost:3002/admin/revenue');
      await page.waitForTimeout(500);
      let initialOpen = await page.locator('text=DISMISS').count();
      console.log('Initial Open Opportunities:', initialOpen);
      
      await page.click('text=DISMISS', { force: true });
      await page.waitForTimeout(500);
      let afterDismiss = await page.locator('text=DISMISS').count();
      console.log('Open Opportunities after Dismiss:', afterDismiss);

      await page.click('text=APPROVE', { force: true });
      await page.waitForTimeout(500);
      let finalOpen = await page.locator('text=DISMISS').count();
      console.log('Open Opportunities after Approve:', finalOpen);

      console.log('\n--- Verifying Audit Trail ---');
      await page.goto('http://localhost:3002/admin/audit');
      await page.waitForTimeout(500);
      const auditText = await page.innerText('body');
      
      const expectedLogs = ['APPROVE_APPLICATION', 'REJECT_APPLICATION', 'RESTRICT_MEMBER', 'REINSTATE_MEMBER', 'DISMISS_OPPORTUNITY', 'APPROVE_OPPORTUNITY'];
      for (const logItem of expectedLogs) {
          if (auditText.includes(logItem)) {
              console.log('FOUND:', logItem);
          } else {
              console.log('MISSING:', logItem);
          }
      }

  } catch(e) {
      console.error('Test script crashed:', e);
  } finally {
      await browser.close();
  }
})();
