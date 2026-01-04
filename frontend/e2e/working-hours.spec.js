import { test, expect } from '@playwright/test';

test.describe('Flexible Working Hours', () => {
  test.beforeEach(async ({ page }) => {
    // Login flow
    await page.goto('/login');
    await page.fill('input[type="text"]', 'admin@workload.com');
    await page.fill('input[type="password"]', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('Organization Schedule Configuration', async ({ page }) => {
    // Navigate to Settings
    await page.click('a[href="/settings"]'); // Assuming there is a link, or goto directly
    
    // Verify visibility of "Jornada Laboral"
    await expect(page.locator('text=Jornada Laboral')).toBeVisible();

    // Interact with Sunday checkbox (disable it if active, enable if inactive - specifically set to inactive)
    // We assume the structure from the component: 
    // Table row for Sunday -> Checkbox
    // Tricky to select by text in table, let's try strict locators
    
    const sundayRow = page.locator('tr').filter({ hasText: 'Domingo' });
    const sundayCheckbox = sundayRow.locator('input[type="checkbox"]');
    
    // Ensure it is unchecked (not working day)
    if (await sundayCheckbox.isChecked()) {
        await sundayCheckbox.uncheck();
    }
    
    // Change Monday start time to 10:00
    const mondayRow = page.locator('tr').filter({ hasText: 'Lunes' });
    const startInput = mondayRow.locator('input[type="time"]').first();
    await startInput.fill('10:00');

    // Click Save (Find button in the same section)
    // The component has a "Guardar Cambios" button.
    // We need to target the specific button for this form if there are multiple on settings page.
    // Assuming it's inside the WorkScheduleManager component which might be wrapped.
    await page.click('button:has-text("Guardar Horario Global")');

    // Verify success notification or persistence
    // For now, reload and check
    await page.reload();
    await expect(startInput).toHaveValue('10:00');
  });

  test('Collaborator Schedule Override', async ({ page }) => {
    // Navigate to Collaborators
    await page.click('a[href="/collaborators"]');
    
    // Open 'System Admin' collaborator (or the first one)
    // We need to click the Edit button (pencil icon), not the card itself (which opens profile)
    // Finding the card for System Admin
    const card = page.locator('div.bg-white').filter({ hasText: 'System Admin' }).first();
    
    // Clicking the edit button inside the card.
    // The edit button contains the Edit2 icon. We can select it by being the last button or having blue text.
    // In CollaboratorCard.vue: <button ... class="... text-blue-600 ..."> <Edit2 /> </button>
    // Let's use the class selector combined with button
    await card.locator('button.text-blue-600').click();
    
    // Click "Jornada" tab
    await page.click('button:has-text("Jornada")');
    
    // Wait for the tab content to load
    await expect(page.locator('h3', { hasText: 'Personalizar Horario Laboral' })).toBeVisible();

    // Enable "Personalizar Horario"
    // The text is in an h3 sibling, not inside the label.
    // We find the common container or just the input on the page since it's unique in this tab.
    
    // Find the section container that has the text
    const section = page.locator('.space-y-6', { hasText: 'Personalizar Horario Laboral' });
    const overrideInput = section.locator('.flex.items-center.justify-between input[type="checkbox"]');
    
    // Check if already checked
    const isChecked = await overrideInput.evaluate(el => el.checked);
    if (!isChecked) {
        // Click the label wrapping the input (or the input if clickable)
        // Since input is sr-only, we click the parent label
        await overrideInput.locator('..').click();
    }
    // Modify Tuesday to be non-working
    const tuesdayRow = page.locator('tr').filter({ hasText: 'Martes' });
    const tuesdayCheckbox = tuesdayRow.locator('input[type="checkbox"]');
    // Verify table is visible and stable
    await expect(tuesdayCheckbox).toBeVisible();
    await tuesdayCheckbox.uncheck({ force: true });
    
    // Save Collaborator
    await page.click('button:has-text("Guardar")');
    
    // Modal stays open on edit, so we need to close it or verify directly.
    // Modal stays open on edit, so we need to close it or verify directly.
    // Escape might not be wired, click the X button.
    // The close button has an X icon (lucide-x usually renders as svg with class lucide-x)
    const closeBtn = page.locator('button:has(svg.lucide-x)');
    // There might be multiple X buttons on page (Profile modal etc)? No, only one modal open.
    // Filter to be safe: visible one.
    await closeBtn.first().click();
    
    // Wait for modal to disappear
    await expect(page.locator('h3', { hasText: 'Personalizar Horario Laboral' })).not.toBeVisible();

    // Re-open and verify
    // We need to click the Edit button again
    // Reusing the card locator logic
    await page.locator('div.bg-white').filter({ hasText: 'System Admin' }).first().locator('button.text-blue-600').click();
    await page.click('button:has-text("Jornada")');
    await expect(page.locator('h3', { hasText: 'Personalizar Horario Laboral' })).toBeVisible();
    
    // Check if toggle persisted as Checked
    // Re-locate input
    const section2 = page.locator('.space-y-6', { hasText: 'Personalizar Horario Laboral' });
    // Target the toggle specifically in the header div (flex justify-between)
    const overrideInput2 = section2.locator('.flex.items-center.justify-between input[type="checkbox"]');
    await expect(overrideInput2).toBeChecked();

    // Now check Tuesday
    await expect(tuesdayCheckbox).not.toBeChecked();
  });
});
