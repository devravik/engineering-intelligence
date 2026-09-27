// Fixture: Unsafe type assertions and compiler directives
// @ts-ignore
export function calculateDiscount(order: any) {
  const customRules = (order as any).customDiscountConfig;
  return customRules ? customRules.percent : 0;
}
