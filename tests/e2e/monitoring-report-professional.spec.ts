import { expect, test } from '@playwright/test';

test.describe('relatório profissional de monitoramento', () => {
  test('renderiza estrutura executiva, talhões e rastreabilidade', async ({
    page,
  }) => {
    await page.goto('/monitoramento/preview');

    await expect(
      page.getByRole('heading', {
        name: 'Relatório Técnico de Monitoramento',
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Resumo executivo' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Situação dos talhões' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Plano de ação prioritário' }),
    ).toBeVisible();
    await expect(page.getByRole('article', { name: 'Talhão 02' })).toBeVisible();
    await expect(page.getByText('Código do erro:')).toHaveCount(0);
    await expect(
      page.getByText(/Relatório elaborado a partir dos dados registrados/),
    ).toBeVisible();

    const hasDocumentOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasDocumentOverflow).toBe(false);
  });

  test('mantém leitura compacta no celular', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/monitoramento/preview');

    await expect(
      page.getByRole('heading', {
        name: 'Relatório Técnico de Monitoramento',
      }),
    ).toBeVisible();
    await expect(page.getByText('Área monitorada')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Exportar PDF' }),
    ).toBeVisible();

    const hasDocumentOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasDocumentOverflow).toBe(false);
  });

  test('impressão oculta ações e abre dados detalhados', async ({ page }) => {
    await page.goto('/monitoramento/preview');
    await page.emulateMedia({ media: 'print' });

    await expect(page.locator('.mr-toolbar')).toBeHidden();
    const detailsContent = page.locator('.mr-details__content').first();
    await expect(detailsContent).toBeVisible();
    await expect(page.locator('.monitoring-report-professional')).toHaveCSS(
      'background-color',
      'rgb(255, 255, 255)',
    );
  });

  test('exportação Excel continua disponível', async ({ page }) => {
    await page.goto('/monitoramento/preview');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar Excel' }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(
      /^FortSmart_Monitoramento_.*\.xlsx$/,
    );
  });
});
