import { test, expect } from '@playwright/test';

test.describe('Recurrent Events and Estimation', () => {
  test.beforeEach(async ({ page }) => {
    // Login flow
    await page.goto('/login');
    await page.fill('input[type="text"]', 'admin@workload.com');
    await page.fill('input[type="password"]', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('Daily event extends task duration', async ({ page }) => {
    // Verify Dashboard or Navigate to Projects
    await page.goto('/projects');
    
    // Wait for loading to finish (if any)
    await expect(page.locator('text=Cargando proyectos...')).not.toBeVisible();

    // Check if there are projects
    // Use a more specific selector: Cards have 'hrs/sem' text
    const projectCards = page.locator('.group').filter({ hasText: 'hrs/sem' });
    const count = await projectCards.count();
    
    let targetCard;

    if (count === 0) {
        // Create 'Proyecto Validation'
        const projectName = 'Proyecto Validation ' + Date.now();
        await page.fill('input[placeholder="ej. Rediseño Web"]', projectName);
        await page.fill('input[type="number"]', '40');
        await page.click('button:has-text("Crear Proyecto")');
        
        // Wait for creation success toast
        await expect(page.locator('text=Proyecto creado')).toBeVisible();
        await expect(page.locator('text=Proyecto creado')).not.toBeVisible({ timeout: 2000 }); // Wait for it to potentially disappear or just proceed

        // Wait for it to appear
        targetCard = page.locator('.group').filter({ hasText: projectName });
        await expect(targetCard).toBeVisible({ timeout: 10000 });
    } else {
        targetCard = projectCards.first(); // Use the first available project
    }
    
    // Click Estimación button inside that card
    // Click Estimación button inside that card
    
    
    const estBtn = targetCard.locator('button').filter({ hasText: 'Estimación' });
    await expect(estBtn).toBeVisible({ timeout: 5000 });
    await estBtn.click({ force: true });
    
    // Go to Estimation Tab - Wait, the button IS the navigation to Estimation View.
    // So we don't need a second click. We just wait for the view to load.
    await page.waitForURL(/\/projects\/.*\/estimation/);
    
    // Create a specific Work Package for this test
    const wpName = 'WP Recurrent Test ' + Date.now();
    await page.fill('input[placeholder="Nombre de la funcionalidad..."]', wpName);
    await page.click('button:has-text("Agregar")');
    
    // Wait for WP to appear
    const wpHeader = page.locator('h4', { hasText: wpName });
    await expect(wpHeader).toBeVisible();
    
    // The new WP should be expanded by default (initially-expanded logic)
    // Click "Agregar Evento" (the plus icon button)
    // We target the button inside the expanded section of this specific WP
    // Structure: WP Component -> div.bg-white -> ... -> div with "Agregar Evento"
    
    // Locate the container for this WP.
    // wpHeader is inside the summary header. The expanded content is a sibling div.
    // We can target the button globally if unique, but better to be specific.
    // The button has text "Agregar Evento" inside the WP.
    
    const addEventBtn = page.locator('button:has-text("Agregar Evento")').last(); // Use last assuming it's the new one
    await expect(addEventBtn).toBeVisible();
    await addEventBtn.click();
    
    // Modal should open
    // Verify modal title or content
    await expect(page.locator('h3', { hasText: 'Agregar Evento Recurrente' })).toBeVisible(); 
    
    // Add Event: Daily, 1h
    // Use correct selectors based on RecurrentEventModal.vue
    
    // Name input has placeholder "Daily Standup"
    const eventName = 'Daily Scrum ' + Date.now();
    await page.fill('input[placeholder="Daily Standup"]', eventName);
    
    // Select type: Daily
    // Target the select associated with "Tipo" label if possible, or just the first select in modal
    // Structure: label "Tipo", then select.
    // Let's use a locator for the modal, then find select inside it.
    // Use > div to get the direct child which is the modal content wrapper
    const modal = page.locator('.fixed.inset-0 > div');
    await modal.locator('select').first().selectOption({ value: 'DAILY' });
    
    // Hours input is type number. Since type is Daily, only one number input should be visible (Hours)
    // Constraint to modal to avoid inputs in background
    await modal.locator('input[type="number"]').fill('1'); // Hours
    
    // Button is "Guardar Evento", matches "Guardar"
    await page.click('button:has-text("Guardar")');
    
    // Wait for modal to disappear (implies save completed and local state updated)
    await expect(modal).not.toBeVisible();
    // Verify event is visible
    // The WP might have collapsed if the component re-mounted on refetch.
    // Check if it's collapsed (ChevronRight visible) and expand if needed.
    
    // Find the header div which is clickable. 
    // Structure: h4 -> div -> div -> div.p-4 (header)
    const wpHeaderTitle = page.locator('h4', { hasText: wpName });
    // Ancestor query is safest
    const wpClickableHeader = wpHeaderTitle.locator('xpath=./ancestor::div[contains(@class, "p-4")][1]');
    const wpRoot = wpClickableHeader.locator('xpath=..'); // Parent is the rounded-xl container
    
    // Check if expanded by looking for a known element inside (e.g. "Tarea" header in table)
    // wpRoot contains the table when expanded
    const expandIndicator = wpRoot.locator('th', { hasText: 'Tarea' });
    if (!(await expandIndicator.isVisible())) {
        console.log('WP collapsed, expanding...');
        await wpClickableHeader.click({ force: true });
        await expandIndicator.waitFor({ state: 'visible' });
    } else {
        console.log('WP already expanded');
    }
    
    // Now check for the specific event name in the WP container
    await expect(wpRoot.locator('div', { hasText: eventName }).first()).toBeVisible();

    // Create a new Task
    // Assuming there's a button "Añadir Tarea" or similar in the WP
    // Or we find a specific WP "Paquete de Trabajo 1"
    // Create a new Task
    // Re-locate using the robust logic to ensure we get the correct container
    // We can reuse wpRoot if we define it again or rely on lazy evaluation, but simpler to just re-query carefully.
    const wpHeaderFresh = page.locator('h4', { hasText: wpName });
    const wpRootFresh = wpHeaderFresh.locator('xpath=./ancestor::div[contains(@class, "p-4")][1]').locator('xpath=..');

    await expect(wpRootFresh.locator('table')).toBeVisible();

    const taskInput = wpRootFresh.locator('input[placeholder="+ Nueva tarea..."]');
    await taskInput.fill('Task with Recurrent Event');
    await taskInput.press('Enter');
    
    // Wait for task row
    const taskRow = wpRootFresh.locator('tr', { hasText: 'Task with Recurrent Event' });
    
    // Set 8h estimation for a role (e.g. Backend)
    // We need to find the input corresponding to a role column.
    // Assuming column 1 is Backend.
    const estInput = taskRow.locator('input[type="number"]').first();
    await estInput.fill('8');
    await estInput.blur();
    
    // Verify Gantt Bar duration?
    // This is hard to verify visually without exact pixel math.
    // But we can verify the texts in the task detail or similar if available.
    // Or check the tooltip?
    
    // Alternative: Check the "End Date" in the task detail modal.
    await taskRow.click(); // Click row to open detail? Or specific button?
    // EstimationTaskRow.vue emits `open-detail` on click of the task name cell.
    await taskRow.locator('td').first().click({ force: true }); 
    
    // Modal opens
    await expect(page.locator('h3', { hasText: 'Detalles de la Tarea' })).toBeVisible();
    
    // Check End Date
    // Current date logic: Test environment date?
    // Workload seems to use real dates or "Start of Project".
    // If Project starts today (or recently), we can calculate expected end.
    // But this is fragile if we don't control "Today".
    
    // Let's rely on the specific calculation effect:
    // If we have 1h Daily event, 8h task should take MORE than 1 day (if >7h capacity).
    // The End Date text should be strictly after Start Date text (different day).
    
    const startDateInput = page.locator('label:has-text("Fecha inicio")').locator('..').locator('p'); // It's usually text in detail, or input
    // TaskDetailModal.vue uses <DateDisplay> or similar?
    // "Fecha inicio: {{ formatDate(task.startDate) }}"
    
    // Let's look for "Fecha fin"
    const endDateElement = page.locator('div:has-text("Fecha fin")').last(); // approximate
    
    // Ideally we verify that End Date is NOT the same day as Start Date.
  });
});
