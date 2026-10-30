import { detectAllProducts } from './detector';
import { evaluateProduct } from '../filters/registry';
import { applyFilterAction, removeFilterAction } from './overlay';
import { FilterCategoryId, ProductNode, TabStats, UserPreferences } from './types';
import { getPreferences, getTabStats, setTabStats, subscribePreferences } from '../utils/storage';

export class BlurifyEngine {
  private preferences: UserPreferences | null = null;
  private mutationObserver: MutationObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private processedElements = new WeakSet<HTMLElement>();
  private activeProducts = new Map<HTMLElement, ProductNode>();
  private stats: TabStats = {
    url: typeof window !== 'undefined' ? window.location.hostname : '',
    totalProductsScanned: 0,
    totalFiltered: 0,
    byCategory: {
      bds_boycott: 0,
      ai_slop: 0,
      dropship_junk: 0,
      sponsored_ads: 0,
      house_brands: 0,
      fast_fashion: 0,
      labor_violations: 0,
      animal_testing: 0,
      ultra_processed: 0,
      low_trust_nsfw: 0
    }
  };

  public async start(): Promise<void> {
    this.preferences = await getPreferences();
    this.stats = await getTabStats();
    this.stats.url = window.location.hostname;

    // Listen for storage changes in real-time (<50ms zero reload)
    subscribePreferences((newPrefs) => {
      this.preferences = newPrefs;
      this.reapplyAll();
    });

    this.setupIntersectionObserver();
    this.setupMutationObserver();

    // Initial immediate scan
    this.scan();
  }

  private setupIntersectionObserver(): void {
    if (typeof IntersectionObserver === 'undefined') return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(async (entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const product = this.activeProducts.get(el);
            if (product && this.preferences) {
              await this.evaluateAndRender(product);
              // Stop observing once evaluated
              this.intersectionObserver?.unobserve(el);
            }
          }
        });
      },
      {
        rootMargin: '300px 0px', // Evaluate cards approaching viewport
        threshold: 0.01
      }
    );
  }

  private setupMutationObserver(): void {
    if (typeof MutationObserver === 'undefined') return;

    this.mutationObserver = new MutationObserver(() => {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.scan();
      }, 150); // 150ms debounce
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  public scan(): void {
    if (!this.preferences || !this.preferences.masterEnabled) {
      this.cleanupAll();
      return;
    }

    const detected = detectAllProducts();
    if (detected.length === 0) return;

    detected.forEach((prod) => {
      if (this.processedElements.has(prod.element)) return;

      this.processedElements.add(prod.element);
      this.activeProducts.set(prod.element, prod);
      this.stats.totalProductsScanned++;

      // If IntersectionObserver is active, queue for viewport entry
      if (this.intersectionObserver) {
        this.intersectionObserver.observe(prod.element);
      } else {
        // Fallback for immediate evaluation
        this.evaluateAndRender(prod);
      }
    });

    this.saveStats();
  }

  private async evaluateAndRender(product: ProductNode): Promise<void> {
    if (!this.preferences || !this.preferences.masterEnabled) return;

    const result = await evaluateProduct(product, this.preferences);
    if (result.isFiltered && result.primaryEvaluation) {
      applyFilterAction(product, result.primaryEvaluation, this.preferences, () => {
        this.reapplyAll();
      });

      this.stats.totalFiltered++;
      const cat = result.primaryEvaluation.categoryId;
      this.stats.byCategory[cat] = (this.stats.byCategory[cat] || 0) + 1;
      this.saveStats();
    }
  }

  public reapplyAll(): void {
    this.stats.totalFiltered = 0;
    Object.keys(this.stats.byCategory).forEach((k) => {
      this.stats.byCategory[k as FilterCategoryId] = 0;
    });

    this.activeProducts.forEach((product) => {
      removeFilterAction(product);
      if (this.preferences?.masterEnabled) {
        this.evaluateAndRender(product);
      }
    });

    this.saveStats();
  }

  private cleanupAll(): void {
    this.activeProducts.forEach((product) => {
      removeFilterAction(product);
    });
  }

  private saveStats(): void {
    setTabStats(this.stats).catch(() => {});
  }

  public stop(): void {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.cleanupAll();
  }
}
