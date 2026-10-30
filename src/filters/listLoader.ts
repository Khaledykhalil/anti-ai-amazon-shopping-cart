import boycottsData from '../../public/lists/boycotts.json';
import crueltyFreeData from '../../public/lists/cruelty_free.json';
import type { ProductNode } from '../engine/types';

export interface BrandMatchResult {
  matched: boolean;
  filterId: 'bds_boycott' | 'animal_testing';
  matchedBrand: string;
  parentCompany: string;
  reason: string;
  subCategory?: 'bds_priority' | 'grassroots_boycott' | 'direct_testing' | 'parent_company_tests';
  sourceUrl: string;
}

interface CompiledBrandRule {
  brandDisplay: string;
  normalizedBrand: string;
  wordBoundaryRegex: RegExp;
  isShortToken: boolean;
  parentCompany: string;
  reason: string;
  sourceUrl: string;
  subCategory: BrandMatchResult['subCategory'];
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class BrandLookupEngine {
  private boycottExactMap = new Map<string, CompiledBrandRule>();
  private boycottBoundaryRules: CompiledBrandRule[] = [];

  private crueltyExactMap = new Map<string, CompiledBrandRule>();
  private crueltyBoundaryRules: CompiledBrandRule[] = [];

  constructor() {
    this.compileBoycotts();
    this.compileCrueltyFree();
  }

  private compileBoycotts() {
    for (const entity of boycottsData.entities) {
      const shortSet = new Set((entity.shortTokens || []).map((t) => t.toLowerCase()));

      for (const brand of entity.brands) {
        const normalized = brand.trim().toLowerCase();
        const isShort = shortSet.has(normalized) || normalized.length <= 3;

        // Short tokens (like "HP", "CAT", "LU") require strict word boundaries and case
        const rule: CompiledBrandRule = {
          brandDisplay: brand,
          normalizedBrand: normalized,
          wordBoundaryRegex: new RegExp(
            `(?:^|[^a-zA-Z0-9])${escapeRegex(brand)}(?:$|[^a-zA-Z0-9])`,
            isShort ? '' : 'i' // Case-sensitive for short acronyms in titles
          ),
          isShortToken: isShort,
          parentCompany: entity.parentCompany,
          reason: entity.reason,
          sourceUrl: entity.sourceUrl,
          subCategory: entity.tier as BrandMatchResult['subCategory'],
        };

        // Prioritize bds_priority over grassroots_boycott if listed in multiple entities
        const existing = this.boycottExactMap.get(normalized);
        if (!existing || entity.tier === 'bds_priority') {
          this.boycottExactMap.set(normalized, rule);
        }
        this.boycottBoundaryRules.push(rule);
      }
    }
  }

  private compileCrueltyFree() {
    for (const group of crueltyFreeData.conglomerates) {
      const shortSet = new Set((group.shortTokens || []).map((t) => t.toLowerCase()));

      const registerBrand = (brand: string, subCategory: 'direct_testing' | 'parent_company_tests') => {
        const normalized = brand.trim().toLowerCase();
        const isShort = shortSet.has(normalized) || normalized.length <= 3;

        const rule: CompiledBrandRule = {
          brandDisplay: brand,
          normalizedBrand: normalized,
          wordBoundaryRegex: new RegExp(
            `(?:^|[^a-zA-Z0-9])${escapeRegex(brand)}(?:$|[^a-zA-Z0-9])`,
            isShort ? '' : 'i'
          ),
          isShortToken: isShort,
          parentCompany: group.parentCompany,
          reason:
            subCategory === 'parent_company_tests'
              ? `${brand} is certified cruelty-free, but is owned by ${group.parentCompany}, which permits animal testing.`
              : group.reason,
          sourceUrl: group.sourceUrl,
          subCategory,
        };

        this.crueltyExactMap.set(normalized, rule);
        this.crueltyBoundaryRules.push(rule);
      };

      for (const brand of group.directTestingBrands) {
        registerBrand(brand, 'direct_testing');
      }
      for (const subBrand of group.acquiredCrueltyFreeSubsidiaries) {
        registerBrand(subBrand, 'parent_company_tests');
      }
    }
  }

  public matchBoycott(node: ProductNode): BrandMatchResult | null {
    return this.evaluateNode(node, 'bds_boycott', this.boycottExactMap, this.boycottBoundaryRules);
  }

  public matchCrueltyFree(
    node: ProductNode,
    includeSubsidiaries = true
  ): BrandMatchResult | null {
    const match = this.evaluateNode(
      node,
      'animal_testing',
      this.crueltyExactMap,
      this.crueltyBoundaryRules
    );
    if (!match) return null;
    if (!includeSubsidiaries && match.subCategory === 'parent_company_tests') {
      return null;
    }
    return match;
  }

  private evaluateNode(
    node: ProductNode,
    filterId: 'bds_boycott' | 'animal_testing',
    exactMap: Map<string, CompiledBrandRule>,
    boundaryRules: CompiledBrandRule[]
  ): BrandMatchResult | null {
    // 1. Direct brand metadata check (O(1))
    if (node.brand) {
      const normBrand = node.brand.trim().toLowerCase();
      const exact = exactMap.get(normBrand);
      if (exact) {
        if (!exact.isShortToken || node.brand.trim() === exact.brandDisplay) {
          return {
            matched: true,
            filterId,
            matchedBrand: exact.brandDisplay,
            parentCompany: exact.parentCompany,
            reason: exact.reason,
            subCategory: exact.subCategory,
            sourceUrl: exact.sourceUrl,
          };
        }
      }
    }

    // 2. Title word boundary scan
    const title = node.title || '';
    if (!title) return null;

    for (const rule of boundaryRules) {
      if (rule.wordBoundaryRegex.test(title)) {
        return {
          matched: true,
          filterId,
          matchedBrand: rule.brandDisplay,
          parentCompany: rule.parentCompany,
          reason: rule.reason,
          subCategory: rule.subCategory,
          sourceUrl: rule.sourceUrl,
        };
      }
    }

    return null;
  }
}

export const brandLookupEngine = new BrandLookupEngine();
