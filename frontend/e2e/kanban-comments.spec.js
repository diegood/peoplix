
import { test, expect } from '@playwright/test';

test.describe('Kanban Comments & Reactions', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByPlaceholder('tu@email.com').fill('admin@workload.com');
        await page.getByPlaceholder('Enter password').fill('admin');
        await page.getByRole('button', { name: 'Iniciar sesión' }).click();
        await page.waitForURL('/');
    });

    test.skip('Should add comment, react, and quote', async ({ page }) => {
        // Navigate to Global Kanban Board (All Tasks)
        await page.goto('/kanban?onlyMy=false');
        
        // Wait for board to load
        // Check for columns
        await expect(page.locator('text=Por hacer')).toBeVisible();

        // Find a card (any card)
        const card = page.locator('.kanban-card').first();
        // Ensure card is loaded
        await card.waitFor();
        const cardTitle = await card.innerText();
        console.log(`Testing with card: ${cardTitle}`);
        await card.click();

        // Modal should open
        const modal = page.locator('.fixed.inset-0').first();
        await expect(modal).toBeVisible();

        // --- Test Comment ---
        // Find comment editor (last ProseMirror usually, after description)
        const commentEditor = modal.locator('.ProseMirror').last();
        await commentEditor.click();
        
        const commentText = `E2E Test Comment ${Date.now()}`;
        await commentEditor.fill(commentText);
        
        // Click Send
        await modal.locator('button[title="Enviar (Ctrl+Enter)"]').click();
        
        // Verify comment appears
        const commentLocator = page.locator('div', { hasText: commentText }).last();
        await expect(commentLocator).toBeVisible();

        // --- Test Reaction ---
        // Hover to reveal actions
        await commentLocator.hover();
        
        const smileBtn = commentLocator.locator('button[title="Reaccionar"]');
        await smileBtn.click();
        
        // Click emoji 🚀
        const emojiBtn = commentLocator.locator('button:has-text("🚀")');
        await emojiBtn.click();
        
        // Verify reaction chip appears
        const reactionChip = commentLocator.locator('button:has-text("🚀")').last();
        await expect(reactionChip).toBeVisible();
        await expect(reactionChip).toContainText('1');

        // --- Test Quote ---
        // Hover again
        await commentLocator.hover();
        const quoteBtn = commentLocator.locator('button[title="Citar"]');
        await quoteBtn.click();
        
        // Verify editor content (should contain blockquote)
        const editorContent = await commentEditor.innerHTML();
        expect(editorContent).toContain('<blockquote>');
        expect(editorContent).toContain(commentText);
    });
});
