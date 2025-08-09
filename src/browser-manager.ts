import { Browser, BrowserContext, Page, chromium } from 'playwright';
import { BrowserConfig } from './types';

export class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private config: BrowserConfig;

  constructor(config: BrowserConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.browser) {
      return;
    }

    this.browser = await chromium.launch({
      headless: this.config.headless,
    });

    this.context = await this.browser.newContext({
      viewport: this.config.viewport,
    });

    this.page = await this.context.newPage();
    
    // Set timeout
    this.page.setDefaultTimeout(this.config.timeout);
  }

  async getPage(): Promise<Page> {
    if (!this.page) {
      await this.initialize();
    }
    return this.page!;
  }

  async navigateTo(url: string): Promise<void> {
    const page = await this.getPage();
    await page.goto(url, { waitUntil: 'networkidle' });
  }

  async waitForSelector(selector: string, timeout?: number): Promise<void> {
    const page = await this.getPage();
    await page.waitForSelector(selector, { timeout: timeout || this.config.timeout });
  }

  async type(selector: string, text: string): Promise<void> {
    const page = await this.getPage();
    await page.type(selector, text);
  }

  async click(selector: string): Promise<void> {
    const page = await this.getPage();
    await page.click(selector);
  }

  async waitForNavigation(): Promise<void> {
    const page = await this.getPage();
    await page.waitForLoadState('networkidle');
  }

  async screenshot(path?: string): Promise<Buffer> {
    const page = await this.getPage();
    return await page.screenshot({ 
      path,
      fullPage: true,
      type: 'png'
    });
  }

  async getCurrentUrl(): Promise<string> {
    const page = await this.getPage();
    return page.url();
  }

  async getPageTitle(): Promise<string> {
    const page = await this.getPage();
    return await page.title();
  }

  async evaluateScript<T>(script: string | (() => T)): Promise<T> {
    const page = await this.getPage();
    return await page.evaluate(script as (() => T));
  }

  async waitForElement(selector: string, timeout?: number): Promise<boolean> {
    try {
      const page = await this.getPage();
      await page.waitForSelector(selector, { 
        timeout: timeout || 5000,
        state: 'visible'
      });
      return true;
    } catch {
      return false;
    }
  }

  async isElementVisible(selector: string): Promise<boolean> {
    try {
      const page = await this.getPage();
      const element = await page.$(selector);
      return element ? await element.isVisible() : false;
    } catch {
      return false;
    }
  }

  async getText(selector: string): Promise<string | null> {
    try {
      const page = await this.getPage();
      const element = await page.$(selector);
      return element ? await element.textContent() : null;
    } catch {
      return null;
    }
  }

  async fillForm(selector: string, value: string): Promise<void> {
    const page = await this.getPage();
    await page.fill(selector, value);
  }

  async selectOption(selector: string, value: string): Promise<void> {
    const page = await this.getPage();
    await page.selectOption(selector, value);
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
    }
  }

  async reload(): Promise<void> {
    const page = await this.getPage();
    await page.reload({ waitUntil: 'networkidle' });
  }
}